'use client';

import { ReactNode, useState } from 'react';

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
}: FormInputProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 relative">
        <label className="text-xs font-semibold text-slate-300">{label}</label>
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
            value={value}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
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
