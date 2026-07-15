'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { calculateCodeReadability, CODE_TYPE_THRESHOLDS } from '@/lib/calculationEngine';
import { useCalculatorStore } from '@/lib/store';
import { CodeType } from '@/lib/types';

export function CodeReadabilityTab() {
  const store = useCalculatorStore();
  const [mmPerPixel, setMmPerPixel] = useState(0.01);
  const [moduleSize, setModuleSize] = useState(2);
  const [codeType, setCodeType] = useState<CodeType>('1D');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  // Cálculo en vivo: se recalcula solo en cuanto cambia cualquier dato, sin botón
  useEffect(() => {
    setError('');

    if (mmPerPixel <= 0 || moduleSize <= 0) {
      setResults(null);
      return;
    }

    const result = calculateCodeReadability({
      mmPerPixel,
      moduleSizeMm: moduleSize,
      codeType,
    });

    if (!result.success) {
      setError(result.error || 'Calculation failed');
      setResults(null);
      return;
    }

    setResults(result);
  }, [mmPerPixel, moduleSize, codeType]);

  const verdictColor = {
    readable: '#22c55e',
    marginal: '#f59e0b',
    not_readable: '#ef4444',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 lg:h-full lg:overflow-hidden">
      {/* LEFT INPUTS */}
      <div className="lg:col-span-3 space-y-2 lg:overflow-y-auto lg:pr-2">
        <Card title="Resolución" icon="📐" className="p-2">
          <div className="space-y-2">
            <FormInput
              label="mm por píxel"
              type="number"
              value={mmPerPixel}
              onChange={(v) => setMmPerPixel(Number(v))}
              step="0.001"
            />
            <button
              onClick={() => setMmPerPixel((store.pixelSize / 1000) * 1.5)}
              className="w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition"
            >
              Usar resolución sensor
            </button>
          </div>
        </Card>

        <Card title="Código" icon="📊" className="p-2">
          <div className="space-y-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">Tipo de código</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setCodeType('1D')}
                  className={`px-2 py-1.5 rounded text-xs font-bold border transition ${
                    codeType === '1D'
                      ? 'bg-amber-500 border-amber-400 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  📏 1D (barras)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType('2D')}
                  className={`px-2 py-1.5 rounded text-xs font-bold border transition ${
                    codeType === '2D'
                      ? 'bg-amber-500 border-amber-400 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  ⬛ 2D (Data Matrix/QR)
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {codeType === '1D'
                  ? `${CODE_TYPE_THRESHOLDS['1D'].standard} — mínimo ${CODE_TYPE_THRESHOLDS['1D'].marginal}px/módulo, recomendado ${CODE_TYPE_THRESHOLDS['1D'].readable}px/módulo`
                  : `${CODE_TYPE_THRESHOLDS['2D'].standard} — mínimo ${CODE_TYPE_THRESHOLDS['2D'].marginal}px/módulo, recomendado ${CODE_TYPE_THRESHOLDS['2D'].readable}px/módulo`}
              </p>
            </div>
            <FormInput
              label="Tamaño módulo"
              type="number"
              value={moduleSize}
              onChange={(v) => setModuleSize(Number(v))}
              unit="mm"
              step="0.1"
            />
          </div>
        </Card>

        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 px-2 py-2 rounded text-xs">
            {error}
          </div>
        )}
      </div>

      {/* RIGHT RESULTS */}
      <div className="lg:col-span-3 lg:overflow-y-auto">
        <Card title="Legibilidad de Códigos" icon="✨" className="p-2">
          {results ? (
            <div className="space-y-2">
              {/* VEREDICTO */}
              <div
                className="p-3 rounded text-center border-2"
                style={{
                  borderColor: verdictColor[results.verdict as keyof typeof verdictColor],
                  backgroundColor:
                    results.verdict === 'readable'
                      ? '#1a3a1a'
                      : results.verdict === 'marginal'
                        ? '#3a3a1a'
                        : '#3a1a1a',
                }}
              >
                <p className="text-xs opacity-70 mb-1">Veredicto (AIM/ISO)</p>
                <p
                  className="font-bold text-2xl capitalize"
                  style={{ color: verdictColor[results.verdict as keyof typeof verdictColor] }}
                >
                  {results.verdict.replace('_', ' ')}
                </p>
              </div>

              {/* PIXELS PER MODULE */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-900/30 border border-blue-700 p-2 rounded text-center">
                  <p className="text-blue-300 text-xs">Píxeles/Módulo</p>
                  <p className="text-blue-400 font-bold text-2xl">{results.pixelsPerModule?.toFixed(1)}</p>
                </div>
                <div className="bg-slate-700 p-2 rounded text-center">
                  <p className="text-slate-400 text-xs">Recomendado ({codeType})</p>
                  <p className="text-amber-400 font-bold text-2xl">{results.readableThreshold}</p>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="bg-slate-700 p-2 rounded">
                <div className="flex justify-between items-center mb-2 text-xs">
                  <span className="text-slate-400">Legibilidad</span>
                  <span className="text-amber-400 font-bold">
                    {((results.pixelsPerModule / results.readableThreshold) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min((results.pixelsPerModule / results.readableThreshold) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* DETAILS */}
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-slate-400">mm/px</p>
                  <p className="text-amber-400 font-bold">{mmPerPixel.toFixed(4)}</p>
                </div>
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-slate-400">Módulo</p>
                  <p className="text-amber-400 font-bold">{moduleSize.toFixed(1)}mm</p>
                </div>
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-slate-400">Mínimo ({codeType})</p>
                  <p className="text-amber-400 font-bold">{results.marginalThreshold}px</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-4">
              <p className="text-xs">Completa mm/píxel y tamaño de módulo</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
