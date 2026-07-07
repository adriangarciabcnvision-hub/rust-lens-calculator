'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useCalculatorStore } from '@/lib/store';
import { useDataStore, SavedSet } from '@/lib/dataStore';

export function ComparatorTab() {
  const store = useCalculatorStore();
  const { savedSets } = useDataStore();
  const [config1, setConfig1] = useState<any>(null);
  const [config2, setConfig2] = useState<any>(null);

  const configFromSet = (saved: SavedSet) => ({
    camera: saved.name,
    lens: `${saved.params.sensorWidth}×${saved.params.sensorHeight}mm · ${saved.params.pixelSize}µm`,
    focalLength: saved.params.focalLength,
    workingDistance: saved.params.workingDistance,
    results: saved.results,
  });

  const handleLoadSet = (slot: 1 | 2, id: string) => {
    const saved = savedSets.find((s) => s.id === id);
    if (!saved) return;
    if (slot === 1) setConfig1(configFromSet(saved));
    else setConfig2(configFromSet(saved));
  };

  const handleLoadConfig1 = () => {
    if (store.results) {
      setConfig1({
        camera: store.camera?.display_name || 'Custom',
        lens: store.lens?.display_name || 'Custom',
        focalLength: store.focalLength,
        workingDistance: store.workingDistance,
        results: store.results,
      });
    }
  };

  const handleLoadConfig2 = () => {
    if (store.results) {
      setConfig2({
        camera: store.camera?.display_name || 'Custom',
        lens: store.lens?.display_name || 'Custom',
        focalLength: store.focalLength,
        workingDistance: store.workingDistance,
        results: store.results,
      });
    }
  };

  const handleSwap = () => {
    setConfig1(config2);
    setConfig2(config1);
  };

  return (
    <div className="space-y-2 lg:h-full lg:overflow-hidden flex flex-col">
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={handleLoadConfig1}
          disabled={!store.results}
          title="Usa el último cálculo de la pestaña Calculadora"
          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white rounded transition text-xs"
        >
          Cálculo actual → 1
        </button>
        <button
          onClick={handleLoadConfig2}
          disabled={!store.results}
          title="Usa el último cálculo de la pestaña Calculadora"
          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white rounded transition text-xs"
        >
          Cálculo actual → 2
        </button>
        <button
          onClick={handleSwap}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition text-xs"
        >
          Intercambiar
        </button>
        <button
          onClick={() => {
            setConfig1(null);
            setConfig2(null);
          }}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition text-xs"
        >
          Limpiar
        </button>
      </div>

      {savedSets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <select
            value=""
            onChange={(e) => handleLoadSet(1, e.target.value)}
            className="px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
          >
            <option value="" disabled>💾 Cargar set guardado → Config 1</option>
            {savedSets.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value=""
            onChange={(e) => handleLoadSet(2, e.target.value)}
            className="px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
          >
            <option value="" disabled>💾 Cargar set guardado → Config 2</option>
            {savedSets.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-xs text-slate-400 mb-2">
          💡 Guarda sets desde la pestaña Calculadora para compararlos aquí.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 lg:overflow-hidden">
        {/* Config 1 */}
        <Card title="CONFIG 1" icon="🔴">
          {config1 ? (
            <div className="space-y-1 overflow-y-auto max-h-96 text-xs">
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">Cámara:</span>
                <span className="font-semibold">{config1.camera}</span>
              </div>
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">Lente:</span>
                <span className="font-semibold">{config1.lens}</span>
              </div>
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">Focal:</span>
                <span className="font-bold text-amber-400">{config1.focalLength.toFixed(1)}mm</span>
              </div>
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">WD:</span>
                <span className="font-bold text-amber-400">{config1.workingDistance.toFixed(1)}mm</span>
              </div>
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">FOV H:</span>
                <span className="font-bold text-amber-400">{config1.results?.fovHorizontalMm.toFixed(2)}mm</span>
              </div>
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">Mag:</span>
                <span className="font-bold text-amber-400">×{config1.results?.magnification.toFixed(3)}</span>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-2 text-xs">Carga Config 1</p>
          )}
        </Card>

        {/* Config 2 */}
        <Card title="CONFIG 2" icon="🔵">
          {config2 ? (
            <div className="space-y-1 overflow-y-auto max-h-96 text-xs">
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">Cámara:</span>
                <span className="font-semibold">{config2.camera}</span>
              </div>
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">Lente:</span>
                <span className="font-semibold">{config2.lens}</span>
              </div>
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">Focal:</span>
                <span className="font-bold text-amber-400">{config2.focalLength.toFixed(1)}mm</span>
              </div>
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">WD:</span>
                <span className="font-bold text-amber-400">{config2.workingDistance.toFixed(1)}mm</span>
              </div>
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">FOV H:</span>
                <span className="font-bold text-amber-400">{config2.results?.fovHorizontalMm.toFixed(2)}mm</span>
              </div>
              <div className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">Mag:</span>
                <span className="font-bold text-amber-400">×{config2.results?.magnification.toFixed(3)}</span>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-2 text-xs">Carga Config 2</p>
          )}
        </Card>
      </div>

      {config1 && config2 && (
        <Card title="Diferencias" icon="📊">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between bg-slate-700 p-1 rounded">
              <span className="text-slate-400">Δ FOV H:</span>
              <span className={`font-bold ${Math.abs((config1.results?.fovHorizontalMm || 0) - (config2.results?.fovHorizontalMm || 0)) > 5 ? 'text-red-400' : 'text-green-400'}`}>
                {Math.abs((config1.results?.fovHorizontalMm || 0) - (config2.results?.fovHorizontalMm || 0)).toFixed(2)}mm
              </span>
            </div>
            <div className="flex justify-between bg-slate-700 p-1 rounded">
              <span className="text-slate-400">Δ Mag:</span>
              <span className={`font-bold ${Math.abs((config1.results?.magnification || 0) - (config2.results?.magnification || 0)) > 0.01 ? 'text-red-400' : 'text-green-400'}`}>
                ×{Math.abs((config1.results?.magnification || 0) - (config2.results?.magnification || 0)).toFixed(4)}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
