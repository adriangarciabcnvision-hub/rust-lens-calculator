'use client';

import { Card } from '@/components/ui/Card';
import { useCalculatorStore } from '@/lib/store';

export function DiagnosticsTab() {
  const { calculationHistory, clearHistory } = useCalculatorStore();

  return (
    <div className="space-y-2 h-full flex flex-col overflow-hidden">
      <Card title="Registro de Cálculos" icon="📋">
        <div className="flex gap-2 mb-2">
          <button
            onClick={clearHistory}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition"
          >
            Limpiar
          </button>
          <button
            onClick={() => {
              const text = calculationHistory.map((h) => `${h.created_at}: Focal=${h.focal_length_mm}mm, WD=${h.working_distance_mm}mm`).join('\n');
              navigator.clipboard.writeText(text);
            }}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs transition"
          >
            Copiar
          </button>
        </div>

        {calculationHistory.length === 0 ? (
          <div className="text-center text-slate-400 py-4">
            <p className="text-xs">Aún no hay cálculos guardados</p>
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto max-h-96">
            {calculationHistory.map((calc, idx) => (
              <div key={idx} className="bg-slate-700 p-2 rounded border border-slate-600 text-xs">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-white text-xs">#{idx + 1}</h4>
                  <span className="text-xs text-slate-400">{new Date(calc.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {calc.focal_length_mm && (
                    <div>
                      <p className="text-slate-400 text-xs">Focal</p>
                      <p className="text-amber-400 font-semibold text-xs">{calc.focal_length_mm}mm</p>
                    </div>
                  )}
                  {calc.working_distance_mm && (
                    <div>
                      <p className="text-slate-400 text-xs">WD</p>
                      <p className="text-amber-400 font-semibold text-xs">{calc.working_distance_mm}mm</p>
                    </div>
                  )}
                  {calc.result_fov_horizontal && (
                    <div>
                      <p className="text-slate-400 text-xs">FOV H</p>
                      <p className="text-amber-400 font-semibold text-xs">{calc.result_fov_horizontal}mm</p>
                    </div>
                  )}
                  {calc.result_magnification && (
                    <div>
                      <p className="text-slate-400 text-xs">Mag</p>
                      <p className="text-amber-400 font-semibold text-xs">×{calc.result_magnification}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
