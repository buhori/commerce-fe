import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as query from "@tanstack/react-query";

function setup(fetch) {
  const modules = new Map();
  function load(name) {
    if (modules.has(name)) return modules.get(name);
    const exports = {};
    modules.set(name, exports);
    vm.runInNewContext(ts.transpileModule(
      readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), "utf8"),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
    ).outputText, { exports, fetch, require: (path) => path === "@tanstack/react-query" ? query : load(path.replace("./", "")) });
    return exports;
  }
  return { ...load("cart-queries"), client: load("query-client").createQueryClient() };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};
function observe(client, options) {
  const observer = new query.QueryObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  return { observer, unsubscribe };
}

test("count is deduplicated and reused across remounts, focus and reconnect", async () => {
  let calls = 0;
  const waiting = deferred();
  const { client, cartCountOptions, cartKeys } = setup(() => { calls++; return waiting.promise; });
  client.mount();
  const first = observe(client, cartCountOptions);
  const second = observe(client, cartCountOptions);
  assert.equal(calls, 1);
  waiting.resolve(Response.json({ count: 3 }));
  await tick();
  first.unsubscribe(); second.unsubscribe();
  const nextPage = observe(client, cartCountOptions);
  query.focusManager.setFocused(false); query.focusManager.setFocused(true);
  query.onlineManager.setOnline(false); query.onlineManager.setOnline(true);
  await tick();
  assert.equal(calls, 1);
  assert.equal(client.getQueryData(cartKeys.count).count, 3);
  nextPage.unsubscribe(); client.unmount(); client.clear();
});

test("successful mutation cancels stale count results and fetches once with the new cookie", async () => {
  let counts = 0, cookieIssued = false;
  const old = deferred();
  const api = setup(async (url, init) => {
    assert.equal(init.credentials, "same-origin");
    if (url.endsWith("/count")) {
      if (++counts === 1) return old.promise;
      assert.equal(cookieIssued, true);
      return Response.json({ count: 2 });
    }
    assert.deepEqual(JSON.parse(init.body), { action: "add", variant: 7 });
    cookieIssued = true;
    return Response.json({ message: "success" }, { status: 201 });
  });
  const count = observe(api.client, api.cartCountOptions);
  const mutation = new query.MutationObserver(api.client, {
    mutationFn: api.modifyCart,
    onSuccess: () => api.refreshCart(api.client),
  });
  await mutation.mutate({ productId: 6, action: "add", variantId: 7 });
  assert.equal(counts, 2);
  assert.equal(api.client.getQueryData(api.cartKeys.count).count, 2);
  old.resolve(Response.json({ count: 0 }));
  await tick();
  assert.equal(api.client.getQueryData(api.cartKeys.count).count, 2);
  count.unsubscribe(); api.client.clear();
});

test("cart and checkout share items; inactive items only reload after invalidation", async () => {
  let calls = 0, amount = 1;
  const api = setup(async () => {
    calls++;
    return Response.json([{ id: 1, product_id: 6, amount, product: { id: 6, name: "Product", price: 20, variants: [] } }]);
  });
  const cart = observe(api.client, api.cartItemsOptions);
  await tick(); cart.unsubscribe();
  const checkout = observe(api.client, api.cartItemsOptions);
  await tick();
  assert.equal(calls, 1);
  checkout.unsubscribe();
  amount = 2;
  await api.refreshCart(api.client);
  assert.equal(calls, 1);
  const back = observe(api.client, api.cartItemsOptions);
  await tick();
  assert.equal(calls, 2);
  assert.equal(back.observer.getCurrentResult().data[0].amount, 2);
  back.unsubscribe(); api.client.clear();
});

test("failed count does not refetch on navigation and manual refresh recovers", async () => {
  let calls = 0, failing = true;
  const api = setup(async () => {
    calls++;
    return failing ? new Response(null, { status: 503 }) : Response.json({ count: 1 });
  });
  const first = observe(api.client, api.cartCountOptions);
  await tick(); first.unsubscribe();
  const nextPage = observe(api.client, api.cartCountOptions);
  await tick();
  assert.equal(calls, 1);
  assert.equal(nextPage.observer.getCurrentResult().isError, true);
  failing = false;
  assert.equal(await api.refreshCart(api.client), true);
  assert.equal(calls, 2);
  nextPage.unsubscribe(); api.client.clear();
});

test("rejected mutations are not retried and do not refetch count", async () => {
  let counts = 0, modifications = 0;
  const api = setup(async (url) => {
    if (url.endsWith("/count")) { counts++; return Response.json({ count: 1 }); }
    modifications++;
    return Response.json({ message: "Stok habis" }, { status: 422 });
  });
  const count = observe(api.client, api.cartCountOptions);
  await tick();
  const mutation = new query.MutationObserver(api.client, {
    mutationFn: api.modifyCart,
    onSuccess: () => api.refreshCart(api.client),
  });
  await assert.rejects(mutation.mutate({ productId: 6, action: "add" }), /Stok habis/);
  assert.equal(counts, 1); assert.equal(modifications, 1);
  count.unsubscribe(); api.client.clear();
});

test("checkout invalidation clears the sold cart and reports count refresh failures separately", async () => {
  let sold = false, countFailing = false;
  const api = setup(async (url) => {
    if (url.endsWith("/count")) return countFailing ? new Response(null, { status: 503 }) : Response.json({ count: sold ? 0 : 1 });
    return Response.json(sold ? [] : [{ id: 1, product_id: 6, amount: 1, product: { id: 6, name: "Product", price: 20 } }]);
  });
  const count = observe(api.client, api.cartCountOptions);
  const items = observe(api.client, api.cartItemsOptions);
  await tick();
  sold = true;
  assert.equal(await api.refreshCart(api.client), true);
  assert.equal(api.client.getQueryData(api.cartKeys.count).count, 0);
  assert.equal(api.client.getQueryData(api.cartKeys.items).length, 0);
  countFailing = true;
  assert.equal(await api.refreshCart(api.client), false);
  assert.equal(items.observer.getCurrentResult().isSuccess, true);
  count.unsubscribe(); items.unsubscribe(); api.client.clear();
});

test("add sends the chosen quantity, and single adds keep the original body", async () => {
  const bodies = [];
  const api = setup(async (url, init) => {
    bodies.push(JSON.parse(init.body));
    return Response.json({ message: "success" }, { status: 201 });
  });
  await api.modifyCart({ productId: 6, action: "add", variantId: 7, quantity: 3 });
  await api.modifyCart({ productId: 6, action: "add", quantity: 1 });
  await api.modifyCart({ productId: 6, action: "reduce", quantity: 3 });
  assert.deepEqual(bodies, [{ action: "add", variant: 7, quantity: 3 }, { action: "add" }, { action: "reduce" }]);
});
