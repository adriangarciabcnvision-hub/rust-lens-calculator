'use client';

import { useState } from 'react';
import { CalculatorTab } from '@/components/tabs/CalculatorTab';
import { DiagnosticsTab } from '@/components/tabs/DiagnosticsTab';
import { DepthOfFieldTab } from '@/components/tabs/DepthOfFieldTab';
import { OpticalDiagramTab } from '@/components/tabs/OpticalDiagramTab';
import { FrameRateTab } from '@/components/tabs/FrameRateTab';
import { ComparatorTab } from '@/components/tabs/ComparatorTab';
import { CodeReadabilityTab } from '@/components/tabs/CodeReadabilityTab';

const TABS = [
  { id: 'calculator', label: '📊 Calculadora', component: CalculatorTab },
  { id: 'diagnostics', label: '📋 Diagnóstico', component: DiagnosticsTab },
  { id: 'dof', label: '📐 Profundidad de Campo', component: DepthOfFieldTab },
  { id: 'optical', label: '🔬 Visualización Óptica', component: OpticalDiagramTab },
  { id: 'framerate', label: '⚡ Frame Rate & Blur', component: FrameRateTab },
  { id: 'comparator', label: '🔄 Comparador', component: ComparatorTab },
  { id: 'codes', label: '📖 Lectura de Códigos', component: CodeReadabilityTab },
];

export default function AppPage() {
  const [activeTab, setActiveTab] = useState('calculator');

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab)?.component || CalculatorTab;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-amber-400">🔬 RUST Lens Calculator PRO</h1>
              <p className="text-sm text-slate-400">Herramienta profesional de cálculos ópticos avanzados</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">v2.0.0</p>
              <button className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition">
                Documentación
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto gap-2 -mx-6 px-6 pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-t-lg font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <ActiveComponent />
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
          <p>© 2024 RUST Lens Calculator Pro - Herramienta de Cálculos Ópticos Avanzados</p>
          <p className="mt-2">Desarrollado con Next.js, TypeScript, Tailwind CSS y Supabase</p>
        </div>
      </footer>
    </main>
  );
}
