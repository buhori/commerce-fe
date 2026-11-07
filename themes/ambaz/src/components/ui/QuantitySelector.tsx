'use client';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  /** Selama keranjang diperbarui. */
  disabled?: boolean;
}

/**
 * QuantitySelector Ambaz. Aslinya kelas Tailwind dengan token Ambaz (border, text-heading, bg-bg-light); di sini
 * nilai token yang sama ditulis sebagai CSS biasa.
 */
export function QuantitySelector({ value, onChange, min = 1, max = 99, className, disabled = false }: QuantitySelectorProps) {
  return (
    <div className={['ambaz-qty', className].filter(Boolean).join(' ')}>
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} className="ambaz-qty-btn" aria-label="Decrease quantity">
        −
      </button>
      <span className="ambaz-qty-value">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} className="ambaz-qty-btn" aria-label="Increase quantity">
        +
      </button>
      <style>{`
        .ambaz-qty { display: inline-flex; align-items: center; border: 1px solid #e5e5e5; border-radius: 6px; }
        .ambaz-qty-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #222; transition: background-color 150ms ease; }
        .ambaz-qty-btn:hover:not(:disabled) { background-color: #f7f7f7; }
        .ambaz-qty-btn:disabled { opacity: 0.3; cursor: default; }
        .ambaz-qty-value { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; color: #222; border-inline: 1px solid #e5e5e5; }
      `}</style>
    </div>
  );
}
