'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { calculateDepthOfField } from '@/lib/calculationEngine';
import { useCalculatorStore } from '@/lib/store';

export function DepthOfFieldTab() {
  const store = useCalculatorStore();
  const [fNumber, setFNumber] = useState(2.8);
  const [coc, setCoc] = useState(0.003);
  const [minFocus, setMinFocus] = useState(0.3);
  const [dofResults, setDofResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');

    try {
      const result = calculateDepthOfField({
        focalLengthMm: store.focalLength,
        workingDistanceMm: store.workingDistance,
        fNumberAperture: fNumber,
        circleOfConfusionMm: coc,
        minimumFocusDistanceMm: minFocus,
      });

      if (!result.success) {
        setError(result.error || 'Calculation failed');
        return;
      }

      setDofResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="grid grid-cols-6 gap-3 h-full overflow-hidden">
      {/* LEFT INPUTS */}
      <div className="col-span-3 space-y-2 overflow-y-auto pr-2">
        <Card title="Parámetros Base" icon="📏" className="p-2">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Focal"
              type="number"
              value={store.focalLength}
              onChange={() => {}}
              unit="mm"
              step="0.1"
            />
            <FormInput
              label="WD"
              type="number"
              value={store.workingDistance}
              onChange={() => {}}
              unit="mm"
              step="1"
            />
          </div>
        </Card>

        <Card title="Apertura" icon="🔍" className="p-2">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Número f"
              type="number"
              value={fNumber}
              onChange={(v) => setFNumber(Number(v))}
              step="0.1"
              tooltip="f-number de la lente"
            />
            <FormInput
              label="Blur Máximo"
              type="number"
              value={coc}
              onChange={(v) => setCoc(Number(v))}
              unit="mm"
              step="0.001"
              tooltip="Círculo de confusión"
            />
          </div>
        </Card>

        <Card title="Mínimo Enfoque" icon="📌" className="p-2">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <FormInput
                label="Distancia Mín"
                type="number"
                value={minFocus}
                onChange={(v) => setMinFocus(Number(v))}
                unit="mm"
                step="0.01"
                min={0.1}
              />
            </div>
            <button
              onClick={() => setCoc(store.pixelSize / 1000)}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition whitespace-nowrap"
            >
              Auto
            </button>
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
          📊 Calcular DOF
        </button>
      </div>

      {/* RIGHT RESULTS */}
      <div className="col-span-3 overflow-y-auto">
        <Card title="Resultados DOF" icon="✨" className="p-2">
          {dofResults ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-900/30 border border-green-700 p-2 rounded">
                  <p className="text-green-300">Enf. Mín Efectivo</p>
                  <p className="text-green-400 font-bold text-lg">{dofResults.effectiveMinimumFocusDistance?.toFixed(1)}</p>
                  <p className="text-green-300 text-xs">mm</p>
                </div>
                <div className="bg-green-900/30 border border-green-700 p-2 rounded">
                  <p className="text-green-300">DOF Total</p>
                  <p className="text-green-400 font-bold text-lg">{dofResults.totalDepthOfField?.toFixed(2)}</p>
                  <p className="text-green-300 text-xs">mm</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-900/30 border border-blue-700 p-2 rounded text-center">
                  <p className="text-blue-300 text-xs">Límite Cercano</p>
                  <p className="text-blue-400 font-bold">{dofResults.nearLimit?.toFixed(1)}</p>
                  <p className="text-blue-300 text-xs">mm</p>
                </div>
                <div className="bg-blue-900/30 border border-blue-700 p-2 rounded text-center">
                  <p className="text-blue-300 text-xs">Límite Lejano</p>
                  <p className="text-blue-400 font-bold">{dofResults.farLimit === Infinity ? '∞' : dofResults.farLimit?.toFixed(1)}</p>
                  <p className="text-blue-300 text-xs">mm</p>
                </div>
                <div className="bg-purple-900/30 border border-purple-700 p-2 rounded text-center">
                  <p className="text-purple-300 text-xs">Hiperfocal</p>
                  <p className="text-purple-400 font-bold">{dofResults.hyperfocalDistance?.toFixed(0)}</p>
                  <p className="text-purple-300 text-xs">mm</p>
                </div>
              </div>

              <div className="bg-slate-700 p-2 rounded text-xs">
                <p className="text-slate-400">Rango Enfoque</p>
                <div className="mt-1 bg-slate-600 h-8 rounded flex items-center relative">
                  <div className="absolute left-2 text-xs text-slate-300">{dofResults.nearLimit?.toFixed(0)}mm</div>
                  <div className="absolute right-2 text-xs text-slate-300">{dofResults.farLimit === Infinity ? '∞' : dofResults.farLimit?.toFixed(0)}mm</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 text-xs text-amber-400 font-bold">DOF</div>
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
