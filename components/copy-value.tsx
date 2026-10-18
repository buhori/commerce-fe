"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

/**
 * Shows a value next to a button that copies a paste-ready version of it:
 * `value` is what lands on the clipboard, `children` is what the buyer reads.
 */
export function CopyValue({ value, label, children }: {
  value: string;
  label: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      // The clipboard API needs a secure context; say so rather than fail quietly.
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 2400);
  }

  return (
    <>
      <div className="copy-row">
        <span className="copy-value">{children}</span>
        <Button type="button" variant="secondary" size="sm" className="copy-button" onClick={copy} aria-label={label} data-copied={state === "copied"}>
          <Icon name={state === "copied" ? "check" : "copy"} width={18} height={18} />
          {state === "copied" ? "Tersalin" : "Salin"}
        </Button>
      </div>
      <span role="status" className="sr-only">
        {state === "copied" ? "Tersalin ke papan klip." : state === "failed" ? "Gagal menyalin." : ""}
      </span>
      {state === "failed" && <p className="field-hint copy-failed">Gagal menyalin otomatis. Silakan salin manual dari layar.</p>}
    </>
  );
}
