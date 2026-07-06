'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { calculateCodeReadability } from '@/lib/calculationEngine';
import { useCalculatorStore } from '@/lib/store';

export function CodeReadabilityTab() {
  const store = useCalculatorStore();
  const [mmPerPixel, setMmPerPixel] = useState(0.01);
  const [moduleSize, setModuleSize] = useState(2);
  const [threshold, setThreshold] = useState(3);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');

    try {
      const result = calculateCodeReadability({
        mmPerPixel,
        moduleSizeMm: moduleSize,
        thresholdPixelsPerModule: threshold,
      });

      if (!result.success) {
        setError(result.error || 'Calculation failed');
        return;
      }

      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const verdictColor = {
    readable: '#22c55e',
    marginal: '#f59e0b',
    not_readable: '#ef4444',
  };

  return (
    <div className="grid grid-cols-6 gap-3 h-full overflow-hidden">
      {/* LEFT INPUTS */}
      <div className="col-span-3 space-y-2 overflow-y-auto pr-2">
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
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Tamaño módulo"
              type="number"
              value={moduleSize}
              onChange={(v) => setModuleSize(Number(v))}
              unit="mm"
              step="0.1"
            />
            <FormInput
              label="Umbral"
              type="number"
              value={threshold}
              onChange={(v) => setThreshold(Number(v))}
              unit="px"
              step="1"
              tooltip="AIM standard ≈ 3"
            />
          </div>
        </Card>

        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 px-2 py-2 rounded text-xs">
            {error}
          </div>
        )}

        <button
          onClick={handleCalculate}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2 rounded transition text-sm"
        >
          📖 Comprobar
        </button>
      </div>

      {/* RIGHT RESULTS */}
      <div className="col-span-3 overflow-y-auto">
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
                  <p className="text-slate-400 text-xs">Requerido</p>
                  <p className="text-amber-400 font-bold text-2xl">{threshold * 2}</p>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="bg-slate-700 p-2 rounded">
                <div className="flex justify-between items-center mb-2 text-xs">
                  <span className="text-slate-400">Legibilidad</span>
                  <span className="text-amber-400 font-bold">
                    {((results.pixelsPerModule / (threshold * 2)) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min((results.pixelsPerModule / (threshold * 2)) * 100, 100)}%` }}
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
                  <p className="text-slate-400">Ratio</p>
                  <p className="text-amber-400 font-bold">{(results.pixelsPerModule / (threshold * 2)).toFixed(2)}x</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-4">
              <p className="text-xs">Completa y comprueba</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
