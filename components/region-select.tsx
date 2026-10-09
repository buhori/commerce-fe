"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { readRegions, regionLevels, type Region } from "@/lib/checkout";
import { Icon } from "./icons";

type State = { status: "loading" } | { status: "ready"; rows: Region[] } | { status: "error" };

export function RegionSelect({ level, parent, value, disabled = false, onChange }: {
  level: number;
  parent?: string;
  value: Region | null;
  disabled?: boolean;
  onChange: (region: Region | null) => void;
}) {
  const id = useId();
  const label = regionLevels[level].label;
  const enabled = level === 0 || Boolean(parent);
  const [state, setState] = useState<State>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch(`/api/regions${parent ? `/${encodeURIComponent(parent)}` : ""}`, {
      credentials: "same-origin", cache: "no-store", signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Region request failed");
      const rows = readRegions(await response.json(), level, parent);
      if (!controller.signal.aborted) setState({ status: "ready", rows });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: "error" });
    });
    return () => controller.abort();
  }, [parent, level, enabled, attempt]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const rows = state.status === "ready" ? state.rows : [];
  const filtered = rows.filter((region) =>
    `${region.name} ${region.code}`.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id")));
  const interactive = enabled && state.status === "ready" && rows.length > 0 && !disabled;
  const expanded = open && interactive;
  const active = filtered[activeIndex];
  const message = !enabled ? null
    : state.status === "loading" ? "Memuat wilayah…"
    : state.status === "error" ? "Wilayah belum dapat dimuat."
    : rows.length === 0 ? "Belum ada wilayah tersedia." : null;

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
  }, [expanded, activeIndex, filtered.length]);

  function showOptions() {
    if (!interactive || open) return;
    setQuery("");
    setActiveIndex(Math.max(0, rows.findIndex((row) => row.code === value?.code)));
    setOpen(true);
  }

  function choose(region: Region) {
    if (!interactive) return;
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
      if (!expanded) showOptions();
      else setActiveIndex((index) => Math.max(0, Math.min(filtered.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))));
    } else if (event.key === "Enter" && expanded) {
      event.preventDefault();
      if (active) choose(active);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className="checkout-field region-field" ref={root}
      aria-busy={enabled && state.status === "loading"}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}>
      <label htmlFor={id}>{label} <span className="required-indicator" aria-hidden="true">*</span></label>
      <div className="region-combobox">
        <div className="region-input-wrap" data-open={expanded}>
          <input id={id} ref={input} type="text" role="combobox" autoComplete="off"
            aria-autocomplete="list" aria-expanded={expanded} aria-controls={`${id}-options`}
            aria-activedescendant={expanded && active ? `${id}-option-${active.code}` : undefined}
            aria-required="true" aria-describedby={message ? `${id}-status` : undefined}
            placeholder={expanded ? `Cari ${label.toLowerCase()}…` : `Pilih ${label.toLowerCase()}`}
            value={expanded ? query : value?.name || ""} disabled={!interactive}
            onFocus={showOptions} onClick={showOptions} onKeyDown={onKeyDown}
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true); }} />
          {expanded ? <Icon name="search" className="region-input-icon" /> : (
            <svg className="region-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          )}
        </div>
        {expanded && (
          <div className="region-menu">
            <ul id={`${id}-options`} ref={list} role="listbox" aria-label={label} className="region-options">
              {filtered.map((region, index) => (
                <li key={region.code} id={`${id}-option-${region.code}`} role="option"
                  aria-selected={value?.code === region.code} data-active={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(region)}>
                  <span>{region.name}</span>
                  {value?.code === region.code && <span aria-hidden="true">✓</span>}
                </li>
              ))}
            </ul>
            {!filtered.length && <p className="region-no-results" role="status">Wilayah tidak ditemukan.</p>}
          </div>
        )}
      </div>
      {message && <p id={`${id}-status`} role={state.status === "error" ? "alert" : "status"} className="field-hint">{message}</p>}
      {enabled && (state.status === "error" || (state.status === "ready" && !rows.length)) && (
        <Button type="button" variant="text" disabled={disabled}
          onClick={() => { setState({ status: "loading" }); setOpen(false); setAttempt((value) => value + 1); }}>Coba lagi {label.toLowerCase()}</Button>
      )}
    </div>
  );
}
