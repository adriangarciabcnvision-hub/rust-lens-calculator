'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface FormInputProps {
  label: string;
  value: number | string;
  onChange: (value: string | number) => void;
  type?: 'number' | 'text' | 'select';
  step?: string | number;
  unit?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  tooltip?: string;
  icon?: ReactNode;
  error?: string;
  disabled?: boolean;
  /** Resalta el campo (ver dependencias) cuando el usuario pincha el título de otro parámetro relacionado */
  highlighted?: boolean;
  /** Si se pasa, el título es pinchable: resalta de qué depende este valor */
  onLabelClick?: () => void;
}

export function FormInput({
  label,
  value,
  onChange,
  type = 'number',
  step = '0.1',
  unit,
  min,
  max,
  placeholder,
  options,
  tooltip,
  icon,
  error,
  disabled = false,
  highlighted = false,
  onLabelClick,
}: FormInputProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  // Buffer local: mientras el usuario edita, se respeta literalmente lo que teclea
  // (incluye borrar del todo, o teclear "-" / "0." a medio camino) en vez de que el
  // valor numérico del padre lo reformatee en cada pulsación.
  const [localText, setLocalText] = useState<string | null>(null);
  // Recuerda el último valor que ESTE input le pidió al padre vía onChange, para poder
  // distinguir "el padre re-renderiza con el mismo valor que le acabo de mandar" (seguimos
  // editando, respeta el buffer) de "el valor cambió por otra vía" (cámara elegida, un
  // Formato aplicado, otro campo relacionado que lo recalculó...) — en ese segundo caso el
  // buffer debe soltarse, si no tapa el valor nuevo indefinidamente aunque no esté disabled.
  const lastEmitted = useRef<number | string | null>(null);

  useEffect(() => {
    if (localText !== null && value !== lastEmitted.current) setLocalText(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleNumberChange = (raw: string) => {
    setLocalText(raw);
    if (raw.trim() === '') {
      lastEmitted.current = 0;
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      lastEmitted.current = parsed;
      onChange(parsed);
    }
  };

  // Un valor numérico en 0 se muestra vacío: al arrancar todo debe verse en blanco
  const displayValue =
    localText !== null ? localText : type === 'number' && value === 0 ? '' : value;

  return (
    <div className={`space-y-1 rounded transition ${highlighted ? 'ring-2 ring-amber-400 bg-amber-400/10 -m-1 p-1' : ''}`}>
      <div className="flex items-center gap-1 relative">
        {onLabelClick ? (
          <button
            type="button"
            onClick={onLabelClick}
            data-dep-toggle="true"
            className="text-xs font-semibold text-slate-300 hover:text-amber-300 underline decoration-dotted underline-offset-2 transition text-left"
            title="Ver de qué depende este valor"
          >
            {label}
          </button>
        ) : (
          <label className="text-xs font-semibold text-slate-300">{label}</label>
        )}
        {icon && <span className="text-slate-400">{icon}</span>}
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-amber-400 cursor-help text-sm hover:text-amber-300 transition"
            >
              ⓘ
            </button>
            {showTooltip && (
              <div className="absolute left-0 top-6 z-50 bg-amber-900/95 text-amber-100 text-xs rounded px-2 py-1 whitespace-nowrap border border-amber-700 shadow-lg">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {type === 'select' ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="flex-1 px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select...</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={displayValue}
            onChange={(e) => (type === 'number' ? handleNumberChange(e.target.value) : onChange(e.target.value))}
            onBlur={() => setLocalText(null)}
            step={step}
            min={min}
            max={max}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none disabled:opacity-50"
          />
        )}
        {unit && <span className="px-2 py-1 text-slate-400 text-xs whitespace-nowrap">{unit}</span>}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
