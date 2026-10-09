import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(file, fetch) {
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(new URL(file, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    fetch,
    URL,
    Headers,
    Response,
    AbortSignal,
    process: {
      env: { STORE_API_URL: "http://backend.test/api", STORE_ID: "404" },
    },
    require: () => ({
      getProduct: async (id) => ({ id, name: "Test product", price: 100 }),
    }),
    window: {
      get sessionStorage() {
        throw new Error("Legacy storage must not be accessed");
      },
    },
  });
  return exports;
}
const json = (data) => Response.json(data);
const empty = () => new Response(null, { status: 204 });
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

function request(cookie, incoming = {}, action) {
  return {
    method: action ? "POST" : "GET",
    text: async () => JSON.stringify({ action }),
    headers: new Headers(incoming),
    cookies: {
      get: (name) =>
        name === "guest_token" && cookie ? { value: cookie } : undefined,
    },
    nextUrl: new URL(
      "http://store.test/api/cart/count?cart_token=legacy&token=legacy",
    ),
  };
}

test("items and first add use cookies and do not wait for count or sessionStorage", async () => {
  const count = deferred(),
    requests = [];
  const api = load("../lib/cart-client.ts", (url, init) => {
    requests.push({ url, init });
    return url.endsWith("/count") ? count.promise : Promise.resolve(empty());
  });
  const pendingCount = api.getCartCount();
  await api.cartFetch("/api/cart/items");
  await api.cartFetch("/api/cart/6/modify", {
    method: "POST",
    body: JSON.stringify({ action: "add" }),
  });
  assert.equal(requests.length, 3);
  for (const item of requests) {
    assert.equal(item.init.credentials, "same-origin");
    assert.equal(item.init.cache, "no-store");
    assert.equal(new URL(item.url, "http://store.test").search, "");
  }
  count.resolve(json({ count: 0 }));
  await pendingCount;
});

test("count failure does not prevent add and count can be retried", async () => {
  let failed = true;
  const api = load("../lib/cart-client.ts", async (url) =>
    url.endsWith("/count")
      ? failed
        ? new Response(null, { status: 503 })
        : json({ count: 1 })
      : empty(),
  );
  await assert.rejects(api.getCartCount());
  assert.equal(
    (
      await api.cartFetch("/api/cart/6/modify", {
        method: "POST",
        body: '{"action":"add"}',
      })
    ).status,
    204,
  );
  failed = false;
  assert.equal((await api.getCartCount()).count, 1);
});

test("proxy sends guest cookie as X-Guest-Token on count, items and every action", async () => {
  const calls = [];
  const { apiProxy } = load("../lib/api-proxy.ts", async (url, init) => {
    calls.push({ url, init });
    return init.method === "POST"
      ? empty()
      : url.pathname.endsWith("/items")
        ? json([])
        : json({ count: 3 });
  });
  await apiProxy(
    request("guest-value", {
      Cookie: "guest_token=guest-value",
      "X-Guest-Token": "untrusted-header",
    }),
    "/cart/count",
  );
  await apiProxy(request("guest-value"), "/cart/items");
  for (const action of ["add", "reduce", "remove"])
    await apiProxy(request("guest-value", {}, action), "/cart/6/modify");
  for (const { url, init } of calls) {
    assert.equal(init.headers.get("X-Guest-Token"), "guest-value");
    assert.equal(init.headers.get("X-Store-Id"), "404");
    assert.equal(url.search, "");
  }
  assert.deepEqual(
    calls
      .filter((c) => c.init.method === "POST")
      .map((c) => JSON.parse(c.init.body)),
    [{ action: "add" }, { action: "reduce" }, { action: "remove" }],
  );
});

test("first add has no guest header and forwards a secure HttpOnly cookie to storefront", async () => {
  const { apiProxy } = load("../lib/api-proxy.ts", async (_, init) => {
    assert.equal(init.headers.has("X-Guest-Token"), false);
    return new Response(null, {
      status: 201,
      headers: {
        "Set-Cookie":
          "guest_token=issued; Domain=backend.test; Path=/api; Max-Age=2592000; Secure; HttpOnly; SameSite=Lax",
      },
    });
  });
  const response = await apiProxy(request(undefined, {}, "add"), "/cart/6/modify");
  assert.equal(response.status, 201);
  const cookie = response.headers.getSetCookie()[0];
  assert.match(cookie, /guest_token=issued/);
  assert.doesNotMatch(cookie, /Domain=|Path=\/api/);
  assert.match(cookie, /Path=\//);
  for (const flag of ["Secure", "HttpOnly", "SameSite=Lax", "Max-Age=2592000"])
    assert.ok(cookie.includes(flag));
});

test("proxy forwards cookie rotation/deletion and original backend errors", async () => {
  let cookie = "guest_token=rotated; Path=/api; HttpOnly; Secure; SameSite=Lax";
  const { apiProxy } = load(
    "../lib/api-proxy.ts",
    async () =>
      new Response(null, { status: 200, headers: { "Set-Cookie": cookie } }),
  );
  const rotated = await apiProxy(request("old"), "/cart/6/modify", "add");
  assert.match(rotated.headers.getSetCookie()[0], /guest_token=rotated/);
  cookie = "guest_token=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
  const removed = await apiProxy(
    request("rotated"),
    "/cart/6/modify",
    "remove",
  );
  assert.match(removed.headers.getSetCookie()[0], /Max-Age=0/);
  const failing = load(
    "../lib/api-proxy.ts",
    async () => new Response("private debug", { status: 500 }),
  );
  const error = await failing.apiProxy(
    request("old"),
    "/cart/6/modify",
    "add",
  );
  assert.equal(error.status, 500);
  assert.equal(await error.text(), "private debug");
});

test("invalid counts reject without affecting subsequent requests", async () => {
  let count = -1;
  const api = load("../lib/cart-client.ts", async () => json({ count }));
  await assert.rejects(api.getCartCount());
  count = 0;
  assert.equal((await api.getCartCount()).count, 0);
});

test("proxy preserves backend body, status and metadata for every cart endpoint", async () => {
  for (const [path, status, body, contentType] of [
    ["/cart/count", 200, '{ "count": 2, "extra": {"source":"backend"} }', "application/json"],
    ["/cart/items", 200, '[{"id":1,"product_id":6,"amount":0,"extra":true}]', "application/json"],
    ["/cart/items", 200, '{"data":[],"meta":{"total":0}}', "application/json"],
    ["/cart/6/modify", 201, '{"message":"Item ditambahkan","cart_id":42}', "application/json"],
    ["/cart/6/modify", 422, '{"message":"Stok tidak cukup","errors":{"action":["Ditolak"]}}', "application/json"],
    ["/cart/items", 401, '{"message":"Unauthorized"}', "application/json"],
    ["/cart/count", 429, '{"message":"Too many requests"}', "application/json"],
    ["/cart/items", 500, '<html>Backend error</html>', "text/html"],
    ["/cart/count", 503, 'Service unavailable', "text/plain"],
    ["/cart/6/modify", 204, null, null],
  ]) {
    const api = load("../lib/api-proxy.ts", async () => new Response(body, {
      status,
      headers: { ...(contentType ? { "Content-Type": contentType } : {}), "X-Request-Id": "backend-id", "Retry-After": "10" },
    }));
    const response = await api.apiProxy(request("guest"), path);
    assert.equal(response.status, status);
    assert.equal(await response.text(), body ?? "");
    assert.equal(response.headers.get("content-type"), contentType);
    assert.equal(response.headers.get("x-request-id"), "backend-id");
    assert.equal(response.headers.get("retry-after"), "10");
  }
});

test("proxy leaves validation to backend and does not follow redirects", async () => {
  const raw = '{ "action": "invalid", "extra": true }';
  const api = load("../lib/api-proxy.ts", async (_, init) => {
    assert.equal(init.body, raw);
    assert.equal(init.headers.get("Content-Type"), "application/json");
    assert.equal(init.redirect, "manual");
    return new Response(null, { status: 307, headers: { Location: "/another-endpoint" } });
  });
  const req = request("guest", { "Content-Type": "application/json" }, "add");
  req.text = async () => raw;
  const response = await api.apiProxy(req, "/cart/6/modify");
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "/another-endpoint");
});

test("only connection failures produce a proxy error", async () => {
  const api = load("../lib/api-proxy.ts", async () => { throw new Error("connection refused"); });
  const response = await api.apiProxy(request(), "/cart/count");
  assert.equal(response.status, 502);
  assert.equal((await response.json()).source, "proxy");
});

test("transport headers are removed but backend content headers survive", async () => {
  const api = load("../lib/api-proxy.ts", async () => new Response("hello", {
    headers: { "Content-Encoding": "gzip", "Content-Length": "100", Connection: "keep-alive, X-Hop", "X-Hop": "internal", "Content-Type": "text/plain" },
  }));
  const response = await api.apiProxy(request(), "/cart/items");
  for (const name of ["content-encoding", "content-length", "connection", "x-hop"]) assert.equal(response.headers.has(name), false);
  assert.equal(await response.text(), "hello");
});

test("cart rendering adapts raw arrays without changing response data", async () => {
  let calls = 0;
  const api = load("../lib/cart-view.ts", async () => {
    calls++;
    return json({ data: { id: 6, name: "Produk", price: 100, status: "published" } });
  });
  const data = [{ id: 1, product_id: 6, amount: 2, extra: true }, { id: 2, product_id: 6, amount: 3 }, { id: 3, product_id: 7, amount: 0 }];
  const original = JSON.stringify(data);
  const items = await api.prepareCartItems(data);
  assert.equal(calls, 1);
  assert.equal(items.length, 2);
  assert.equal(items[0].product.name, "Produk");
  assert.equal(items[0].extra, true);
  assert.equal(JSON.stringify(data), original);
  const embedded = { data: [{ id: 4, product_id: 8, amount: 1, product: { id: 8, name: "Backend product" } }] };
  assert.equal((await api.prepareCartItems(embedded))[0].product.name, "Backend product");
  assert.equal(calls, 1);
  await assert.rejects(api.prepareCartItems({ error: "invalid" }));
});

test("UI uses backend JSON and plain-text error messages", async () => {
  const api = load("../lib/cart-view.ts", () => {});
  assert.equal((await api.responseError(json({ message: "Stok habis" }), "Fallback")).message, "Stok habis");
  assert.equal((await api.responseError(new Response("Backend busy", { headers: { "Content-Type": "text/plain" } }), "Fallback")).message, "Backend busy");
  assert.equal((await api.responseError(new Response("<html>Error</html>", { headers: { "Content-Type": "text/html" } }), "Fallback")).message, "Fallback");
});

test("proxy forwards the selected variant id unchanged", async () => {
  const variant = 9;
  const raw = JSON.stringify({ action: "add", variant });
  const api = load("../lib/api-proxy.ts", async (_, init) => {
    assert.equal(init.body, raw);
    assert.deepEqual(JSON.parse(init.body).variant, variant);
    return json({ message: "success" });
  });
  const req = request("guest", { "Content-Type": "application/json" }, "add");
  req.text = async () => raw;
  assert.equal((await api.apiProxy(req, "/cart/1/modify")).status, 200);
});

test("cart view retains variant relation details for display", async () => {
  const variant = { color: "#d40d0b", label: "Biru XL", stock: 100, extra: { sku: "BLUE-XL" } };
  const api = load("../lib/cart-view.ts", async () => json({ data: { id: 1, status: "published" } }));
  const rows = await api.prepareCartItems([{ id: 1, product_id: 1, amount: 1, variant }]);
  assert.equal(rows[0].variant, variant);
  assert.deepEqual(rows[0].variant.extra, { sku: "BLUE-XL" });
});

test("cart price uses the full variant price instead of the base product price", () => {
  const { getCartUnitPrice } = load("../lib/cart.ts", () => {});
  const item = { id: 1, product_id: 1, amount: 3, product: { price: 891000 }, variant: { color: "#c4212a", label: "Biru XL", stock: 100, price: 200000 } };
  assert.equal(getCartUnitPrice(item), 200000);
  assert.equal(getCartUnitPrice(item) * item.amount, 600000);
  assert.equal(getCartUnitPrice({ ...item, product: null }), 200000);
  assert.equal(getCartUnitPrice({ ...item, variant: { ...item.variant, price: 0 } }), 0);
});

test("cart price falls back only when variant price is absent and unknown prices stay unknown", () => {
  const { getCartUnitPrice } = load("../lib/cart.ts", () => {});
  const item = { id: 1, product_id: 1, amount: 2, product: { price: 891000 } };
  assert.equal(getCartUnitPrice(item), 891000);
  assert.equal(getCartUnitPrice({ ...item, variant: { label: "L" } }), 891000);
  assert.equal(getCartUnitPrice({ ...item, variant: { price: null } }), 891000);
  assert.equal(getCartUnitPrice({ ...item, product: null }), null);
  for (const price of [-1, NaN, Infinity, "invalid"]) {
    assert.equal(getCartUnitPrice({ ...item, variant: { price } }), null);
  }
});

test("cart resolves product_variant_id to the correct label and price", async () => {
  const variants = [{ id: 1, product_id: 81, label: "jocelyn11", color: "#d5eb5f", price: 432277 }, { id: 2, product_id: 81, label: "Other", price: 200000 }];
  const view = load("../lib/cart-view.ts", async () => json({ data: { id: 81, price: 422000, status: "published", variants } }));
  const cart = load("../lib/cart.ts", () => {});
  const rows = await view.prepareCartItems([{ id: 4, product_id: 81, product_variant_id: 1, amount: 2 }, { id: 5, product_id: 81, product_variant_id: 2, amount: 1 }]);
  assert.equal(rows[0].variant.label, "jocelyn11");
  assert.equal(cart.getCartVariantId(rows[0]), 1);
  assert.equal(cart.getCartUnitPrice(rows[0]), 432277);
  assert.equal(cart.getCartVariantId(rows[1]), 2);
  assert.equal(cart.getCartUnitPrice(rows[1]), 200000);
});

test("missing variant details retain the id for mutations without inventing a price", async () => {
  const view = load("../lib/cart-view.ts", async () => json({ data: { id: 81, price: 422000, status: "published", variants: [] } }));
  const cart = load("../lib/cart.ts", () => {});
  const [item] = await view.prepareCartItems([{ id: 4, product_id: 81, product_variant_id: 99, amount: 2 }]);
  assert.equal(cart.getCartVariantId(item), 99);
  assert.equal(cart.getCartUnitPrice(item), null);
});

test("embedded variant relations and products without variants remain supported", async () => {
  const view = load("../lib/cart-view.ts", async () => new Response(null, { status: 503 }));
  const cart = load("../lib/cart.ts", () => {});
  const variant = { id: 1, product_id: 81, label: "jocelyn11", price: 432277 };
  const [item, simple] = await view.prepareCartItems([
    { id: 4, product_id: 81, product_variant_id: 1, product_variant: variant, amount: 2 },
    { id: 5, product_id: 82, amount: 1, product: { id: 82, price: 100 } },
  ]);
  assert.equal(cart.getCartVariantId(item), 1);
  assert.equal(cart.getCartUnitPrice(item), 432277);
  assert.equal(cart.getCartVariantId(simple), undefined);
  assert.equal(cart.getCartUnitPrice(simple), 100);
});

test("protected address proxy forwards authentication and preserves unauthorized responses", async () => {
  const api = load("../lib/api-proxy.ts", async (url, init) => {
    assert.equal(url.pathname, "/api/address");
    assert.equal(init.headers.get("Authorization"), "Bearer test-token");
    assert.equal(init.headers.get("Cookie"), "session=test-session");
    assert.equal(init.headers.get("X-XSRF-TOKEN"), "test-csrf");
    return new Response('{"message":"Unauthenticated."}', { status: 401, headers: { "Content-Type": "application/json" } });
  });
  const response = await api.apiProxy(request(undefined, { Authorization: "Bearer test-token", Cookie: "session=test-session", "X-XSRF-TOKEN": "test-csrf" }), "/address");
  assert.equal(response.status, 401);
  assert.equal((await response.json()).message, "Unauthenticated.");
});
