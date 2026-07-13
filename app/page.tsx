'use client';

import { useEffect, useState } from 'react';
import { CalculatorTab } from '@/components/tabs/CalculatorTab';
import { DiagnosticsTab } from '@/components/tabs/DiagnosticsTab';
import { OpticalDiagramTab } from '@/components/tabs/OpticalDiagramTab';
import { ComparatorTab } from '@/components/tabs/ComparatorTab';
import { CodeReadabilityTab } from '@/components/tabs/CodeReadabilityTab';
import { AdminTab } from '@/components/tabs/AdminTab';
import { HelpModal } from '@/components/HelpModal';
import { useDataStore } from '@/lib/dataStore';

// DOF y Frame Rate viven ahora como secciones dentro de Calculadora (ver CalculatorTab)
const TABS = [
  { id: 'calculator', label: '📊 Calculadora', component: CalculatorTab },
  { id: 'diagnostics', label: '📋 Diagnóstico', component: DiagnosticsTab },
  { id: 'optical', label: '🔬 Óptica', component: OpticalDiagramTab },
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
      {/* Todas las pestañas se quedan montadas (solo se ocultan con CSS): cambiar de
          pestaña no debe borrar lo que el usuario ya había rellenado en otra (Motion
          Blur, sensor/óptica, selección de cámara/lente, etc.) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-4 py-3 h-full">
          {TABS.map((tab) => {
            const TabComponent = tab.component;
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className={isActive ? 'h-full' : 'hidden'}>
                {tab.id === 'optical' ? <OpticalDiagramTab isActive={isActive} /> : <TabComponent />}
              </div>
            );
          })}
        </div>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </main>
  );
}
