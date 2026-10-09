/** Circular progress used for every loading state in the storefront. */
export function Spinner({ size = 20, label }: { size?: number; label?: string }) {
  return (
    <span className="spinner-row" role={label ? "status" : undefined}>
      <svg className="spinner" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="2.5" className="spinner-track" />
        <circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="2.5" strokeLinecap="round" className="spinner-arc" />
      </svg>
      {label && <span>{label}</span>}
    </span>
  );
}

/** Full-page loading for route transitions: one spinner in the middle of the page. */
export function PageLoading({ label }: { label: string }) {
  return (
    <main className="page-loading" aria-busy="true">
      <Spinner size={32} label={label} />
    </main>
  );
}
