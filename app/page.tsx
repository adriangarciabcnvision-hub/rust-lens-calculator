'use client';

import { useState } from 'react';
import { CalculatorTab } from '@/components/tabs/CalculatorTab';
import { DiagnosticsTab } from '@/components/tabs/DiagnosticsTab';
import { DepthOfFieldTab } from '@/components/tabs/DepthOfFieldTab';
import { OpticalDiagramTab } from '@/components/tabs/OpticalDiagramTab';
import { FrameRateTab } from '@/components/tabs/FrameRateTab';
import { ComparatorTab } from '@/components/tabs/ComparatorTab';
import { CodeReadabilityTab } from '@/components/tabs/CodeReadabilityTab';
import { AdminTab } from '@/components/tabs/AdminTab';

const TABS = [
  { id: 'calculator', label: '📊 Calculadora', component: CalculatorTab },
  { id: 'diagnostics', label: '📋 Diagnóstico', component: DiagnosticsTab },
  { id: 'dof', label: '📐 DOF', component: DepthOfFieldTab },
  { id: 'optical', label: '🔬 Óptica', component: OpticalDiagramTab },
  { id: 'framerate', label: '⚡ Frame Rate', component: FrameRateTab },
  { id: 'comparator', label: '🔄 Comparador', component: ComparatorTab },
  { id: 'codes', label: '📖 Códigos', component: CodeReadabilityTab },
  { id: 'admin', label: '🔐 Admin', component: AdminTab },
];

export default function AppPage() {
  const [activeTab, setActiveTab] = useState('calculator');

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab)?.component || CalculatorTab;

  return (
    <main className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col overflow-hidden">
      {/* Header - Compacto */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-2xl font-bold">
                <span className="bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">⚙️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-amber-400">RUST Lens Calculator</h1>
                <p className="text-xs text-slate-400">Professional Optical Calculations</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <span className="text-xs text-slate-400">v2.0.0</span>
              <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition">
                ? Ayuda
              </button>
            </div>
          </div>

          {/* Tab Navigation - Horizontal Scroll */}
          <div className="flex overflow-x-auto gap-1 -mx-4 px-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3 py-1 rounded text-xs font-medium transition ${
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

      {/* Content - Sin scroll */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-3 h-full">
          <ActiveComponent />
        </div>
      </div>
    </main>
  );
}
