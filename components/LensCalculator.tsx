'use client';

import { useState } from 'react';

interface Result {
  focalLengthMm?: number;
  workingDistanceMm?: number;
  fovHorizontalMm?: number;
  fovVerticalMm?: number;
  magnification?: number;
  maxFrameRate?: number;
  motionBlurPixels?: number;
}

export default function LensCalculator() {
  const [sensorWidth, setSensorWidth] = useState('6.4');
  const [sensorHeight, setSensorHeight] = useState('4.8');
  const [pixelSize, setPixelSize] = useState('3.5');
  const [focalLength, setFocalLength] = useState('50');
  const [workingDistance, setWorkingDistance] = useState('1000');
  const [exposure, setExposure] = useState('33');
  const [readout, setReadout] = useState('10');
  const [velocity, setVelocity] = useState('100');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/lens/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensorWidthMm: parseFloat(sensorWidth),
          sensorHeightMm: parseFloat(sensorHeight),
          pixelSizeUm: parseFloat(pixelSize),
          focalLengthMm: parseFloat(focalLength),
          workingDistanceMm: parseFloat(workingDistance),
          exposureMs: parseFloat(exposure),
          readoutMs: parseFloat(readout),
          velocityMmPerSec: parseFloat(velocity),
          targetCalculation: 'fieldOfView'
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Calculation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">🔬 RUST Lens Calculator</h1>
        <p className="text-slate-400 mb-8">Dado el formato de sensor y dos variables, calcula la tercera</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FORM */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-amber-400 mb-6">📊 Parámetros</h2>

            <form onSubmit={handleCalculate} className="space-y-4">
              {/* Sensor Section */}
              <div className="border-b border-slate-700 pb-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">1. Sensor</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Ancho (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={sensorWidth}
                      onChange={(e) => setSensorWidth(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Alto (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={sensorHeight}
                      onChange={(e) => setSensorHeight(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400">Tamaño píxel (µm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pixelSize}
                      onChange={(e) => setPixelSize(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Optical Section */}
              <div className="border-b border-slate-700 pb-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">2. Óptica</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Focal (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={focalLength}
                      onChange={(e) => setFocalLength(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Distancia (mm)</label>
                    <input
                      type="number"
                      step="10"
                      value={workingDistance}
                      onChange={(e) => setWorkingDistance(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Performance Section */}
              <div className="border-b border-slate-700 pb-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">3. Rendimiento</h3>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-slate-400">Exposure (ms)</label>
                    <input
                      type="number"
                      step="1"
                      value={exposure}
                      onChange={(e) => setExposure(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Readout (ms)</label>
                    <input
                      type="number"
                      step="1"
                      value={readout}
                      onChange={(e) => setReadout(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Velocity (mm/s)</label>
                    <input
                      type="number"
                      step="10"
                      value={velocity}
                      onChange={(e) => setVelocity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-white font-bold py-3 rounded transition"
              >
                {loading ? '⏳ Calculando...' : '🧮 Calcular'}
              </button>
            </form>
          </div>

          {/* RESULTS */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-amber-400 mb-6">✨ Resultados</h2>

            {result ? (
              <div className="space-y-4">
                <div className="bg-slate-700 p-3 rounded">
                  <p className="text-xs text-slate-400">Field of View Horizontal</p>
                  <p className="text-2xl font-bold text-amber-400">{result.fovHorizontalMm?.toFixed(2)} mm</p>
                </div>

                <div className="bg-slate-700 p-3 rounded">
                  <p className="text-xs text-slate-400">Field of View Vertical</p>
                  <p className="text-2xl font-bold text-amber-400">{result.fovVerticalMm?.toFixed(2)} mm</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-xs text-slate-400">Magnification</p>
                    <p className="text-xl font-bold text-amber-400">×{result.magnification?.toFixed(3)}</p>
                  </div>

                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-xs text-slate-400">Max FPS</p>
                    <p className="text-xl font-bold text-amber-400">{result.maxFrameRate?.toFixed(1)} fps</p>
                  </div>
                </div>

                {result.motionBlurPixels ? (
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-xs text-slate-400">Motion Blur</p>
                    <p className="text-xl font-bold text-amber-400">{result.motionBlurPixels?.toFixed(2)} px</p>
                  </div>
                ) : null}

                <div className="text-xs text-slate-500 mt-6 p-3 bg-slate-700 rounded">
                  💡 Aproximación paraxial (lente delgada). Válida cuando WD ≫ Focal.
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                Completa los parámetros y haz clic en Calcular
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
