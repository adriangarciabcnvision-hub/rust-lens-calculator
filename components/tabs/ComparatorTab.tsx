'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useCalculatorStore } from '@/lib/store';
import { useDataStore, SavedSet } from '@/lib/dataStore';

interface ComparedConfig {
  camera: string;
  lens: string;
  focalLength: number;
  workingDistance: number;
  maxFps: number;
  results: {
    fovHorizontalMm?: number;
    fovVerticalMm?: number;
    magnification?: number;
    maxFrameRate?: number;
    spatialResolution?: number;
    motionBlurPixels?: number;
  };
}

// Filas mostradas por cada configuración y usadas para calcular las diferencias
const RESULT_ROWS: { key: keyof ComparedConfig['results']; label: string; digits: number; unit: string }[] = [
  { key: 'fovHorizontalMm', label: 'FOV H', digits: 2, unit: 'mm' },
  { key: 'fovVerticalMm', label: 'FOV V', digits: 2, unit: 'mm' },
  { key: 'magnification', label: 'Magnificación', digits: 4, unit: '×' },
  { key: 'maxFrameRate', label: 'Max FPS', digits: 1, unit: 'fps' },
  { key: 'spatialResolution', label: 'Spatial Res', digits: 4, unit: 'mm' },
  { key: 'motionBlurPixels', label: 'Motion Blur', digits: 2, unit: 'px' },
];

export function ComparatorTab() {
  const store = useCalculatorStore();
  const { savedSets } = useDataStore();
  const [config1, setConfig1] = useState<ComparedConfig | null>(null);
  const [config2, setConfig2] = useState<ComparedConfig | null>(null);

  const configFromSet = (saved: SavedSet): ComparedConfig => ({
    camera: saved.name,
    lens: `${saved.params.sensorWidth}×${saved.params.sensorHeight}mm · ${saved.params.pixelSize}µm`,
    focalLength: saved.params.focalLength,
    workingDistance: saved.params.workingDistance,
    maxFps: saved.params.maxFps ?? 0,
    results: saved.results || {},
  });

  const configFromCurrent = (): ComparedConfig => ({
    camera: store.camera?.display_name || 'Custom',
    lens: store.lens?.display_name || 'Custom',
    focalLength: store.focalLength,
    workingDistance: store.workingDistance,
    maxFps: store.maxFps,
    results: store.results || {},
  });

  const handleLoadSet = (slot: 1 | 2, id: string) => {
    const saved = savedSets.find((s) => s.id === id);
    if (!saved) return;
    if (slot === 1) setConfig1(configFromSet(saved));
    else setConfig2(configFromSet(saved));
  };

  const handleSwap = () => {
    setConfig1(config2);
    setConfig2(config1);
  };

  const renderConfigCard = (config: ComparedConfig | null, title: string, icon: string) => (
    <Card title={title} icon={icon}>
      {config ? (
        <div className="space-y-1 overflow-y-auto max-h-96 text-xs">
          <div className="flex justify-between bg-slate-700 p-1 rounded">
            <span className="text-slate-400">Cámara:</span>
            <span className="font-semibold">{config.camera}</span>
          </div>
          <div className="flex justify-between bg-slate-700 p-1 rounded">
            <span className="text-slate-400">Lente:</span>
            <span className="font-semibold">{config.lens}</span>
          </div>
          <div className="flex justify-between bg-slate-700 p-1 rounded">
            <span className="text-slate-400">Focal:</span>
            <span className="font-bold text-amber-400">{config.focalLength.toFixed(1)}mm</span>
          </div>
          <div className="flex justify-between bg-slate-700 p-1 rounded">
            <span className="text-slate-400">WD:</span>
            <span className="font-bold text-amber-400">{config.workingDistance.toFixed(1)}mm</span>
          </div>
          {RESULT_ROWS.map((row) => {
            const v = config.results[row.key];
            return (
              <div key={row.key} className="flex justify-between bg-slate-700 p-1 rounded">
                <span className="text-slate-400">{row.label}:</span>
                <span className="font-bold text-amber-400">
                  {v !== undefined ? `${row.unit === '×' ? '×' : ''}${v.toFixed(row.digits)}${row.unit !== '×' ? row.unit : ''}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-slate-400 py-2 text-xs">Sin configuración cargada</p>
      )}
    </Card>
  );

  return (
    <div className="space-y-2 lg:h-full lg:overflow-hidden flex flex-col">
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => store.results && setConfig1(configFromCurrent())}
          disabled={!store.results}
          title="Usa el cálculo actual de la pestaña Calculadora"
          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white rounded transition text-xs"
        >
          Cálculo actual → 1
        </button>
        <button
          onClick={() => store.results && setConfig2(configFromCurrent())}
          disabled={!store.results}
          title="Usa el cálculo actual de la pestaña Calculadora"
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
        {renderConfigCard(config1, 'CONFIG 1', '🔴')}
        {renderConfigCard(config2, 'CONFIG 2', '🔵')}
      </div>

      {config1 && config2 && (
        <Card title="Diferencias" icon="📊">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {RESULT_ROWS.map((row) => {
              const v1 = config1.results[row.key];
              const v2 = config2.results[row.key];
              if (v1 === undefined || v2 === undefined) return null;
              const delta = Math.abs(v1 - v2);
              // Umbral simple: >5% de la media se marca en rojo
              const avg = (Math.abs(v1) + Math.abs(v2)) / 2 || 1;
              const isBig = delta / avg > 0.05;
              return (
                <div key={row.key} className="flex justify-between bg-slate-700 p-1 rounded">
                  <span className="text-slate-400">Δ {row.label}:</span>
                  <span className={`font-bold ${isBig ? 'text-red-400' : 'text-green-400'}`}>
                    {row.unit === '×' ? '×' : ''}{delta.toFixed(row.digits)}{row.unit !== '×' ? row.unit : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
