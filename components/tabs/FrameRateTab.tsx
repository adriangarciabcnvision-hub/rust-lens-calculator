'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { calculateMotionBlur } from '@/lib/calculationEngine';
import { useCalculatorStore } from '@/lib/store';

export function FrameRateTab() {
  const store = useCalculatorStore();
  const [readout, setReadout] = useState(10);
  const [ratedMax, setRatedMax] = useState(0);
  const [blurResults, setBlurResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');

    try {
      // Calcular FPS
      const maxFps = store.exposure + readout > 0 ? 1000 / (store.exposure + readout) : 0;
      const finalFps = ratedMax > 0 ? Math.min(maxFps, ratedMax) : maxFps;

      // Calcular motion blur
      const blurResult = calculateMotionBlur({
        velocityMmPerSec: store.velocity,
        exposureMs: store.exposure,
        pixelSizeMm: store.pixelSize / 1000,
      });

      if (!blurResult.success) {
        setError(blurResult.error || 'Calculation failed');
        return;
      }

      setBlurResults({
        maxFrameRate: Math.round(maxFps * 10) / 10,
        limitedBy: ratedMax > 0 && ratedMax < maxFps ? 'Datasheet limit' : 'Exposure + Readout',
        finalFps: Math.round(finalFps * 10) / 10,
        ...blurResult,
      });

      store.addToHistory({
        created_at: new Date().toISOString(),
        tab: 'Frame Rate',
        result_max_fps: Math.round(finalFps * 10) / 10,
        summary: `${Math.round(finalFps * 10) / 10} fps · blur ${blurResult.blurPixels?.toFixed(2)}px (${blurResult.qualityIndicator})`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 lg:h-full lg:overflow-hidden">
      {/* LEFT INPUTS */}
      <div className="lg:col-span-3 space-y-2 lg:overflow-y-auto lg:pr-2">
        <Card title="Tiempos" icon="⏱️" className="p-2">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Exposición"
              type="number"
              value={store.exposure}
              onChange={() => {}}
              unit="ms"
              step="0.1"
            />
            <FormInput
              label="Readout"
              type="number"
              value={readout}
              onChange={(v) => setReadout(Number(v))}
              unit="ms"
              step="1"
            />
            <FormInput
              label="FPS Máx (DS)"
              type="number"
              value={ratedMax}
              onChange={(v) => setRatedMax(Number(v))}
              unit="fps"
              step="1"
              tooltip="Datasheet max"
            />
            <div></div>
          </div>
        </Card>

        <Card title="Objeto" icon="🎬" className="p-2">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Velocidad"
              type="number"
              value={store.velocity}
              onChange={() => {}}
              unit="mm/s"
              step="10"
            />
            <FormInput
              label="Píxel"
              type="number"
              value={store.pixelSize}
              onChange={() => {}}
              unit="µm"
              disabled
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
          ⚡ Calcular
        </button>
      </div>

      {/* RIGHT RESULTS */}
      <div className="lg:col-span-3 lg:overflow-y-auto">
        <Card title="Rendimiento" icon="✨" className="p-2">
          {blurResults ? (
            <div className="space-y-2">
              {/* FPS */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-900/30 border border-green-700 p-3 rounded text-center">
                  <p className="text-green-300 text-xs">FPS Final</p>
                  <p className="text-green-400 font-bold text-3xl">{blurResults.finalFps}</p>
                  <p className="text-green-300 text-xs mt-1">{blurResults.limitedBy}</p>
                </div>
                <div className="bg-blue-900/30 border border-blue-700 p-3 rounded text-center">
                  <p className="text-blue-300 text-xs">FPS Calculado</p>
                  <p className="text-blue-400 font-bold text-2xl">{blurResults.maxFrameRate}</p>
                  <p className="text-blue-300 text-xs mt-1">Teorético</p>
                </div>
              </div>

              {/* Motion Blur */}
              <div className="bg-orange-900/30 border border-orange-700 p-2 rounded">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-orange-300 text-xs">Motion Blur</p>
                    <p className="text-orange-400 font-bold text-2xl">{blurResults.blurPixels?.toFixed(2)} px</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs capitalize px-2 py-1 bg-slate-700 rounded">{blurResults.qualityIndicator}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: '60%',
                      backgroundColor:
                        blurResults.qualityIndicator === 'excellent'
                          ? '#22c55e'
                          : blurResults.qualityIndicator === 'good'
                            ? '#84cc16'
                            : blurResults.qualityIndicator === 'acceptable'
                              ? '#f59e0b'
                              : '#ef4444',
                    }}
                  />
                </div>
              </div>

              {/* Time Summary */}
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-slate-400">Exposición</p>
                  <p className="text-amber-400 font-bold">{store.exposure.toFixed(1)}ms</p>
                </div>
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-slate-400">Readout</p>
                  <p className="text-amber-400 font-bold">{readout.toFixed(1)}ms</p>
                </div>
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-slate-400">Total</p>
                  <p className="text-amber-400 font-bold">{(store.exposure + readout).toFixed(1)}ms</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-4">
              <p className="text-xs">Completa y calcula</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
