'use client';

import { useEffect, useState } from 'react';
import { CalculatorTab } from '@/components/tabs/CalculatorTab';
import { DiagnosticsTab } from '@/components/tabs/DiagnosticsTab';
import { DepthOfFieldTab } from '@/components/tabs/DepthOfFieldTab';
import { OpticalDiagramTab } from '@/components/tabs/OpticalDiagramTab';
import { FrameRateTab } from '@/components/tabs/FrameRateTab';
import { ComparatorTab } from '@/components/tabs/ComparatorTab';
import { CodeReadabilityTab } from '@/components/tabs/CodeReadabilityTab';
import { AdminTab } from '@/components/tabs/AdminTab';
import { HelpModal } from '@/components/HelpModal';
import { useDataStore } from '@/lib/dataStore';

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
  const [showHelp, setShowHelp] = useState(false);

  // Si hay Supabase configurado, carga el catálogo compartido al arrancar
  useEffect(() => {
    useDataStore.getState().syncFromCloud();
  }, []);

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab)?.component || CalculatorTab;

  return (
    <main className="h-dvh bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col overflow-hidden">
      {/* Header - Compacto */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src="/logo.png" alt="EQUIPO RUST" className="h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-amber-400 truncate">EQUIPO RUST · Lens Calculator</h1>
                <p className="text-xs text-slate-400 hidden sm:block">Professional Optical Calculations</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-slate-400 hidden sm:inline">v2.0.0</span>
              <button
                onClick={() => setShowHelp(true)}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition"
              >
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-4 py-3 h-full">
          <ActiveComponent />
        </div>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </main>
  );
}
