"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { readRegionMatches, REGION_SEARCH_MIN_LENGTH, type RegionMatch } from "@/lib/checkout";
import { Icon } from "./icons";

type State = { status: "idle" } | { status: "loading" } | { status: "ready"; rows: RegionMatch[] } | { status: "error" };

/**
 * One field for the delivery area: the buyer types a kelurahan/desa, kecamatan, city, or postal code
 * and picks the kelurahan from the matches, instead of choosing province, city, kecamatan, and
 * kelurahan one list at a time.
 */
export function RegionSearch({ value, disabled = false, onChange }: {
  value: RegionMatch | null;
  disabled?: boolean;
  onChange: (region: RegionMatch | null) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const term = query.trim();
  const searching = term.length >= REGION_SEARCH_MIN_LENGTH;

  // Wait for a pause in typing, and drop answers to older queries.
  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({ status: "loading" });
      fetch(`/api/regions/search?q=${encodeURIComponent(term)}`, {
        credentials: "same-origin", cache: "no-store", signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok) throw new Error("Region search failed");
        const rows = readRegionMatches(await response.json());
        if (!controller.signal.aborted) { setState({ status: "ready", rows }); setActiveIndex(0); }
      }).catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term, searching, attempt]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const rows = searching && state.status === "ready" ? state.rows : [];
  const expanded = open && searching && !disabled;
  const active = rows[activeIndex];
  const status = !searching ? null
    : state.status === "loading" || state.status === "idle" ? "Mencari wilayah…"
    : state.status === "error" ? "Wilayah belum dapat dicari. Coba lagi."
    : rows.length === 0 ? "Wilayah tidak ditemukan. Coba nama kecamatan atau kode pos." : null;

  useEffect(() => {
    if (!expanded || !list.current) return;
    const option = list.current.children[activeIndex] as HTMLElement | undefined;
    if (!option) return;
    // Scroll only the options list, keeping the mobile form in place.
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.current.scrollTop) list.current.scrollTop = top;
    else if (bottom > list.current.scrollTop + list.current.clientHeight) {
      list.current.scrollTop = bottom - list.current.clientHeight;
    }
  }, [expanded, activeIndex, rows.length]);

  function choose(region: RegionMatch) {
    if (region.code !== value?.code) onChange(region);
    setOpen(false);
    setQuery("");
    input.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      if (expanded) event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.max(0, Math.min(rows.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))));
    } else if (event.key === "Enter" && expanded) {
      event.preventDefault();
      if (active) choose(active);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className="checkout-field checkout-field-wide region-field" ref={root}
      aria-busy={expanded && state.status === "loading"}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}>
      <label htmlFor={id}>Kelurahan / desa <span className="required-indicator" aria-hidden="true">*</span></label>
      <div className="region-combobox">
        <div className="region-input-wrap" data-open={expanded}>
          {/* While searching the field shows what is typed; otherwise the chosen area. */}
          <input id={id} ref={input} type="text" role="combobox" autoComplete="off" enterKeyHint="search"
            aria-autocomplete="list" aria-expanded={expanded} aria-controls={`${id}-options`}
            aria-activedescendant={expanded && active ? `${id}-option-${active.code}` : undefined}
            aria-required="true" aria-describedby={`${id}-hint`}
            placeholder="Ketik nama kelurahan, kecamatan, atau kode pos"
            value={open || !value ? query : value.label} disabled={disabled}
            onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onKeyDown={onKeyDown}
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true); }} />
          <Icon name="search" className="region-input-icon" />
        </div>
        {expanded && (rows.length > 0 || status) && (
          <div className="region-menu">
            {rows.length > 0 && (
              <ul id={`${id}-options`} ref={list} role="listbox" aria-label="Kelurahan / desa" className="region-options">
                {rows.map((region, index) => (
                  <li key={region.code} id={`${id}-option-${region.code}`} role="option"
                    aria-selected={value?.code === region.code} data-active={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(region)}>
                    <span>{region.label}</span>
                    {value?.code === region.code && <span aria-hidden="true">✓</span>}
                  </li>
                ))}
              </ul>
            )}
            {status && (
              <p className="region-no-results" role={state.status === "error" ? "alert" : "status"}>
                {status}
                {state.status === "error" && (
                  <> <button type="button" className="region-retry" onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setAttempt((count) => count + 1)}>Coba lagi</button></>
                )}
              </p>
            )}
          </div>
        )}
      </div>
      <p id={`${id}-hint`} className="field-hint">
        {value && !open ? "Ketik lagi untuk mengganti wilayah." : `Minimal ${REGION_SEARCH_MIN_LENGTH} huruf, mis. "Sukasari Bandung" atau "40151".`}
      </p>
    </div>
  );
}
