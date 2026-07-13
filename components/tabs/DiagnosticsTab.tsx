'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useCalculatorStore } from '@/lib/store';
import { CalculationSnapshot } from '@/lib/types';

const fmt = (v: number | undefined, digits = 2, suffix = '') =>
  v === undefined || v === null || isNaN(v) ? '—' : `${v.toFixed(digits)}${suffix}`;

function buildReportText(history: CalculationSnapshot[]): string {
  return history
    .map((h, idx) => {
      const n = history.length - idx;
      const lines = [
        `#${n} — ${h.tab || 'Calculadora'}${h.target_calculation ? ` (${h.target_calculation})` : ''} — ${h.created_at ? new Date(h.created_at).toLocaleString() : '-'}`,
        h.summary ? `  Resumen: ${h.summary}` : null,
        h.camera_model || h.lens_model ? `  Equipo: ${h.camera_model || '-'} / ${h.lens_model || '-'}` : null,
        h.sensor_width_mm ? `  Sensor: ${h.sensor_format || 'personalizado'} ${h.sensor_width_mm}×${h.sensor_height_mm}mm, píxel ${h.pixel_size_um}µm, res ${h.resolution_h}×${h.resolution_v}px` : null,
        h.focal_length_mm || h.working_distance_mm ? `  Óptica: Focal ${h.focal_length_mm ?? '-'}mm, WD ${h.working_distance_mm ?? '-'}mm` : null,
        h.exposure_ms ? `  Tiempos: Exposición ${h.exposure_ms}ms, Readout ${h.readout_ms ?? '-'}ms, Velocidad ${h.velocity_mm_s ?? '-'}mm/s` : null,
        h.motion_target ? `  Motion/Frame Rate: calculó ${h.motion_target} · FPS deseado ${h.fps_deseado ?? '-'} · Fotos/mm ${h.fotos_per_mm ?? '-'} · Inspección: ${h.inspection_type ?? '-'}` : null,
        h.f_number ? `  DOF: f/${h.f_number}, CoC ${h.circle_of_confusion_mm ?? '-'}mm (${h.circle_of_confusion_mode ?? '-'}) · Cercano ${h.result_dof_near_mm ?? '-'}mm, Lejano ${h.result_dof_far_mm ?? '∞'}mm, Total ${h.result_dof_total_mm ?? '∞'}mm` : null,
        `  Resultados: FOV H=${h.result_fov_horizontal ?? '-'}mm, FOV V=${h.result_fov_vertical ?? '-'}mm, Mag=×${h.result_magnification ?? '-'}, MaxFPS=${h.result_max_fps ?? '-'}, MotionBlur=${h.result_motion_blur_px ?? '-'}px (${h.result_motion_blur_quality ?? '-'})`,
      ].filter(Boolean);
      return lines.join('\n');
    })
    .join('\n\n');
}

// ===== DESGLOSE DE FÓRMULAS: para cada resultado clicable, reconstruye la fórmula real =====
// con los números concretos de ESE diagnóstico, sustituidos paso a paso hasta el resultado.
// Todo se deriva de los campos ya guardados en el snapshot — no hace falta guardar nada más.
interface Breakdown {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  note?: string;
}

function n(v: number | undefined, digits = 2): string {
  return v === undefined || v === null || isNaN(v) ? '?' : v.toFixed(digits);
}

function buildBreakdowns(calc: CalculationSnapshot): Record<string, Breakdown> {
  const b: Record<string, Breakdown> = {};
  const mode = calc.target_calculation;
  const W = calc.sensor_width_mm;
  const H = calc.sensor_height_mm;
  const f = calc.focal_length_mm;
  const wd = calc.working_distance_mm;
  const fovH = calc.result_fov_horizontal;
  const fovV = calc.result_fov_vertical;

  // --- Ancho / Alto del sensor (a partir de resolución × píxel) ---
  if (calc.resolution_h && calc.pixel_size_um && W !== undefined) {
    b.sensorWidth = {
      label: 'Ancho del sensor',
      formula: 'Ancho = Res H × Píxel / 1000',
      substitution: `${calc.resolution_h} × ${n(calc.pixel_size_um)}µm / 1000`,
      result: `${n(W)} mm`,
    };
  }
  if (calc.resolution_v && calc.pixel_size_um && H !== undefined) {
    b.sensorHeight = {
      label: 'Alto del sensor',
      formula: 'Alto = Res V × Píxel / 1000',
      substitution: `${calc.resolution_v} × ${n(calc.pixel_size_um)}µm / 1000`,
      result: `${n(H)} mm`,
    };
  }

  // --- Max FPS: en cámara lineal NO es un dato directo, se deriva de Max Hz y líneas/imagen ---
  if (calc.camera_kind === 'lineal' && calc.line_rate_hz && calc.lines_per_image) {
    b.maxFps = {
      label: 'FPS equivalente (cámara lineal)',
      formula: 'FPS equivalente = Max Hz / Líneas por imagen',
      substitution: `${n(calc.line_rate_hz, 0)} / ${calc.lines_per_image}`,
      result: `${n(calc.result_max_fps, 2)} fps`,
      note: 'Max Hz es líneas/segundo, no imágenes/segundo — no son la misma magnitud.',
    };
  }

  // --- FOV H / FOV V / Focal / WD: la fórmula depende de qué se estaba calculando ---
  if (W !== undefined && f !== undefined && wd !== undefined) {
    if (mode === 'Field of View') {
      b.fovH = {
        label: 'FOV Horizontal',
        formula: 'FOV H = (Ancho / Focal) × WD',
        substitution: `(${n(W)} / ${n(f)}) × ${n(wd)}`,
        result: `${n(fovH)} mm`,
      };
      if (H !== undefined) {
        b.fovV = {
          label: 'FOV Vertical',
          formula: 'FOV V = (Alto / Focal) × WD',
          substitution: `(${n(H)} / ${n(f)}) × ${n(wd)}`,
          result: `${n(fovV)} mm`,
        };
      }
    } else if (mode === 'Working Distance') {
      b.fovH = {
        label: 'FOV Horizontal (deseado)',
        formula: 'FOV H = valor introducido directamente',
        substitution: `—`,
        result: `${n(fovH)} mm`,
        note: 'No se calcula: es el dato de partida en este modo.',
      };
      b.workingDistance = {
        label: 'Working Distance',
        formula: 'WD = (FOV H × Focal) / Ancho',
        substitution: `(${n(fovH)} × ${n(f)}) / ${n(W)}`,
        result: `${n(wd)} mm`,
      };
    } else if (mode === 'Focal Length') {
      b.fovH = {
        label: 'FOV Horizontal (deseado)',
        formula: 'FOV H = valor introducido directamente',
        substitution: `—`,
        result: `${n(fovH)} mm`,
        note: 'No se calcula: es el dato de partida en este modo.',
      };
      b.focalLength = {
        label: 'Focal Length',
        formula: 'Focal = (Ancho × WD) / FOV H',
        substitution: `(${n(W)} × ${n(wd)}) / ${n(fovH)}`,
        result: `${n(f)} mm`,
      };
    }
  }

  // --- Magnificación ---
  if (f !== undefined && wd !== undefined && calc.result_magnification !== undefined) {
    b.magnification = {
      label: 'Magnificación',
      formula: 'Mag = Focal / WD',
      substitution: `${n(f)} / ${n(wd)}`,
      result: `×${n(calc.result_magnification, 4)}`,
    };
  }

  // --- Motion Blur ---
  if (calc.velocity_mm_s !== undefined && calc.pixel_size_um && calc.exposure_ms !== undefined && calc.result_motion_blur_px !== undefined) {
    const pixelMm = calc.pixel_size_um / 1000;
    const velPxPerS = calc.velocity_mm_s / pixelMm;
    b.motionBlur = {
      label: 'Motion Blur',
      formula: 'Blur (px) = (Velocidad / Píxel_mm) × Exposición / 1000',
      substitution: `(${n(calc.velocity_mm_s, 0)} / ${n(pixelMm, 5)}) × ${n(calc.exposure_ms)} / 1000 = ${n(velPxPerS, 1)}px/s × ${n(calc.exposure_ms)}ms / 1000`,
      result: `${n(calc.result_motion_blur_px)} px (${calc.result_motion_blur_quality || '—'})`,
    };
  }

  // --- Círculo de Confusión ---
  if (calc.circle_of_confusion_mm !== undefined && calc.pixel_size_um) {
    if (calc.circle_of_confusion_mode && calc.circle_of_confusion_mode !== 'Personalizado') {
      const multiplier = parseFloat(calc.circle_of_confusion_mode);
      b.coc = {
        label: 'Círculo de Confusión',
        formula: 'CoC = multiplicador × Píxel / 1000',
        substitution: `${n(multiplier, 1)} × ${n(calc.pixel_size_um)}µm / 1000`,
        result: `${n(calc.circle_of_confusion_mm, 5)} mm`,
        note: `Preset: ${calc.circle_of_confusion_mode}`,
      };
    } else {
      b.coc = {
        label: 'Círculo de Confusión',
        formula: 'Valor personalizado, introducido directamente',
        substitution: '—',
        result: `${n(calc.circle_of_confusion_mm, 5)} mm`,
      };
    }
  }

  // --- DOF: Near / Far / Total (reconstruye también la hiperfocal, aunque no se muestre) ---
  if (f !== undefined && calc.f_number && calc.circle_of_confusion_mm && wd !== undefined) {
    const hyperfocal = (f * f) / (calc.f_number * calc.circle_of_confusion_mm) + f;
    b.dofNear = {
      label: 'Límite Cercano (DOF)',
      formula: 'Cercano = (H × WD) / (H + (WD − Focal)), con H = Focal²/(N×CoC) + Focal',
      substitution: `H=${n(hyperfocal)}mm → (${n(hyperfocal)} × ${n(wd)}) / (${n(hyperfocal)} + (${n(wd)} − ${n(f)}))`,
      result: `${n(calc.result_dof_near_mm)} mm`,
    };
    if (calc.result_dof_far_mm !== undefined) {
      b.dofFar = {
        label: 'Límite Lejano (DOF)',
        formula: 'Lejano = (H × WD) / (H − (WD − Focal))',
        substitution: `(${n(hyperfocal)} × ${n(wd)}) / (${n(hyperfocal)} − (${n(wd)} − ${n(f)}))`,
        result: `${n(calc.result_dof_far_mm)} mm`,
      };
      b.dofTotal = {
        label: 'DOF Total',
        formula: 'Total = Lejano − Cercano',
        substitution: `${n(calc.result_dof_far_mm)} − ${n(calc.result_dof_near_mm)}`,
        result: `${n(calc.result_dof_total_mm)} mm`,
      };
    } else {
      b.dofFar = {
        label: 'Límite Lejano (DOF)',
        formula: 'Lejano = (H × WD) / (H − (WD − Focal))',
        substitution: `denominador ≤ 0 → el límite lejano se extiende al infinito`,
        result: '∞',
      };
      b.dofTotal = { label: 'DOF Total', formula: 'Total = Lejano − Cercano', substitution: 'Lejano = ∞', result: '∞' };
    }
  }

  // --- Motion / Frame Rate: el campo que se calculó según motion_target ---
  if (calc.motion_target && calc.readout_ms !== undefined) {
    const r = calc.readout_ms;
    if (calc.motion_target === 'exposure' && calc.fps_deseado) {
      b.motionResult = {
        label: 'Exposición Máxima',
        formula: 'Exposición = 1000 / FPS deseado − Readout',
        substitution: `1000 / ${n(calc.fps_deseado, 1)} − ${n(r)}`,
        result: `${n(calc.exposure_ms)} ms`,
      };
    } else if (calc.motion_target === 'fps' && calc.exposure_ms !== undefined) {
      b.motionResult = {
        label: 'FPS Máximo',
        formula: 'FPS = 1000 / (Exposición + Readout)',
        substitution: `1000 / (${n(calc.exposure_ms)} + ${n(r)})`,
        result: `${n(calc.fps_deseado, 1)} fps`,
        note: 'Limitado también por el Max FPS de la cámara.',
      };
    } else if (calc.motion_target === 'velocity' && calc.fps_deseado && calc.fotos_per_mm) {
      b.motionResult = {
        label: 'Velocidad Máxima',
        formula: 'Velocidad = FPS deseado / Fotos por mm',
        substitution: `${n(calc.fps_deseado, 1)} / ${n(calc.fotos_per_mm, 3)}`,
        result: `${n(calc.velocity_mm_s, 0)} mm/s`,
      };
    } else if (calc.motion_target === 'fotosPerMm' && calc.fps_deseado && calc.velocity_mm_s) {
      b.motionResult = {
        label: 'Fotos/mm',
        formula: 'Fotos/mm = FPS deseado / Velocidad',
        substitution: `${n(calc.fps_deseado, 1)} / ${n(calc.velocity_mm_s, 0)}`,
        result: `${n(calc.fotos_per_mm, 3)}`,
      };
    }
  }

  return b;
}

// Botón clicable para un resultado: si tiene desglose disponible, lo resalta y lo abre
function Stat({
  cls, title, value, sub, breakdownKey, active, onClick,
}: {
  cls: string; title: string; value: string; sub?: string; breakdownKey?: string; active?: boolean; onClick?: (key: string) => void;
}) {
  const clickable = !!breakdownKey && !!onClick;
  return (
    <div className={`${cls} p-1.5 rounded text-center ${active ? 'ring-2 ring-amber-400' : ''}`}>
      {clickable ? (
        <button
          type="button"
          onClick={() => onClick!(breakdownKey!)}
          className="w-full underline decoration-dotted underline-offset-2 hover:text-amber-300 transition"
        >
          {title}
        </button>
      ) : (
        <p>{title}</p>
      )}
      <p className="font-bold">{value}</p>
      {sub && <p className="opacity-70">{sub}</p>}
    </div>
  );
}

export function DiagnosticsTab() {
  const { calculationHistory, clearHistory } = useCalculatorStore();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [breakdownKey, setBreakdownKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleToggleExpand = (idx: number) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
    setBreakdownKey(null);
  };
  const handleToggleBreakdown = (key: string) => setBreakdownKey((prev) => (prev === key ? null : key));

  const handleCopyReport = () => {
    navigator.clipboard.writeText(buildReportText(calculationHistory));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Estadísticas rápidas del historial completo
  const stats = calculationHistory.length
    ? {
        total: calculationHistory.length,
        byTab: calculationHistory.reduce<Record<string, number>>((acc, h) => {
          const key = h.tab || 'Calculadora';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
        avgFov: (() => {
          const vals = calculationHistory.map((h) => h.result_fov_horizontal).filter((v): v is number => v !== undefined);
          return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;
        })(),
        oldest: calculationHistory[calculationHistory.length - 1]?.created_at,
        newest: calculationHistory[0]?.created_at,
      }
    : null;

  return (
    <div className="space-y-2 h-full flex flex-col overflow-hidden">
      {stats && (
        <Card title="Resumen del historial" icon="📈" className="p-2 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-700 p-1.5 rounded text-center">
              <p className="text-slate-400">Total cálculos</p>
              <p className="text-amber-400 font-bold text-lg">{stats.total}</p>
            </div>
            <div className="bg-slate-700 p-1.5 rounded text-center">
              <p className="text-slate-400">FOV H medio</p>
              <p className="text-amber-400 font-bold text-lg">{fmt(stats.avgFov, 1, 'mm')}</p>
            </div>
            <div className="bg-slate-700 p-1.5 rounded text-center col-span-2 sm:col-span-1">
              <p className="text-slate-400">Por pestaña</p>
              <p className="text-amber-400 font-bold text-xs">
                {Object.entries(stats.byTab).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </p>
            </div>
            <div className="bg-slate-700 p-1.5 rounded text-center col-span-2 sm:col-span-1">
              <p className="text-slate-400">Periodo</p>
              <p className="text-amber-400 font-bold text-xs">
                {stats.oldest ? new Date(stats.oldest).toLocaleDateString() : '-'} → {stats.newest ? new Date(stats.newest).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card title="Registro de Cálculos" icon="📋" className="flex-1 min-h-0 flex flex-col">
        <div className="flex gap-2 mb-2 flex-shrink-0">
          <button
            onClick={clearHistory}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition"
          >
            Limpiar
          </button>
          <button
            onClick={handleCopyReport}
            disabled={!calculationHistory.length}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white rounded text-xs transition"
          >
            {copied ? '✓ Copiado' : '📋 Copiar informe completo'}
          </button>
        </div>

        {calculationHistory.length === 0 ? (
          <div className="text-center text-slate-400 py-4">
            <p className="text-xs">Aún no hay cálculos guardados. Pulsa "📝 Generar Diagnóstico" en la Calculadora para registrar uno.</p>
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
            {calculationHistory.map((calc, idx) => {
              const isOpen = expandedIdx === idx;
              const breakdowns = isOpen ? buildBreakdowns(calc) : {};
              const activeBreakdown = isOpen && breakdownKey ? breakdowns[breakdownKey] : null;
              return (
                <div key={idx} className="bg-slate-700 rounded border border-slate-600 text-xs overflow-hidden">
                  <button
                    onClick={() => handleToggleExpand(idx)}
                    className="w-full flex justify-between items-center p-2 hover:bg-slate-600/50 transition text-left"
                  >
                    <span className="min-w-0">
                      <span className="font-semibold text-white">#{calculationHistory.length - idx}</span>
                      <span className="text-amber-400"> · {calc.tab || 'Calculadora'}</span>
                      {calc.target_calculation && <span className="text-slate-400"> ({calc.target_calculation})</span>}
                      {calc.summary && <span className="text-slate-300"> — {calc.summary}</span>}
                    </span>
                    <span className="flex items-center gap-2 flex-shrink-0 pl-2">
                      <span className="text-slate-400">{calc.created_at ? new Date(calc.created_at).toLocaleString() : '-'}</span>
                      <span className="text-slate-400">{isOpen ? '▲' : '▼'}</span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-2 pb-2 space-y-2 border-t border-slate-600 pt-2">
                      <p className="text-slate-500 italic">💡 Pincha el título subrayado de cualquier resultado para ver de dónde sale, paso a paso.</p>

                      {(calc.camera_model || calc.lens_model) && (
                        <div>
                          <p className="text-slate-400 mb-1">Equipo</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-800 p-1.5 rounded"><span className="text-slate-400">Cámara: </span><span className="text-white">{calc.camera_model || '—'}</span></div>
                            <div className="bg-slate-800 p-1.5 rounded"><span className="text-slate-400">Lente: </span><span className="text-white">{calc.lens_model || '—'}</span></div>
                          </div>
                        </div>
                      )}

                      {calc.sensor_width_mm !== undefined && (
                        <div>
                          <p className="text-slate-400 mb-1">Sensor</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="bg-slate-800 p-1.5 rounded text-center"><p className="text-slate-400">Formato</p><p className="text-amber-400 font-bold">{calc.sensor_format || 'personalizado'}</p></div>
                            <Stat cls="bg-slate-800" title="Ancho" value={`${fmt(calc.sensor_width_mm, 1)}mm`} breakdownKey="sensorWidth" active={breakdownKey === 'sensorWidth'} onClick={handleToggleBreakdown} />
                            <Stat cls="bg-slate-800" title="Alto" value={`${fmt(calc.sensor_height_mm, 1)}mm`} breakdownKey="sensorHeight" active={breakdownKey === 'sensorHeight'} onClick={handleToggleBreakdown} />
                            <div className="bg-slate-800 p-1.5 rounded text-center"><p className="text-slate-400">Resolución</p><p className="text-amber-400 font-bold">{calc.resolution_h}×{calc.resolution_v}</p></div>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-slate-400 mb-1">Óptica y tiempos</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <Stat cls="bg-slate-800 text-slate-400" title="Focal" value={`${fmt(calc.focal_length_mm, 1)}mm`} breakdownKey={breakdowns.focalLength ? 'focalLength' : undefined} active={breakdownKey === 'focalLength'} onClick={handleToggleBreakdown} />
                          <Stat cls="bg-slate-800 text-slate-400" title="WD" value={`${fmt(calc.working_distance_mm, 1)}mm`} breakdownKey={breakdowns.workingDistance ? 'workingDistance' : undefined} active={breakdownKey === 'workingDistance'} onClick={handleToggleBreakdown} />
                          <div className="bg-slate-800 p-1.5 rounded text-center"><p className="text-slate-400">Exposición</p><p className="text-amber-400 font-bold">{fmt(calc.exposure_ms, 1, 'ms')}</p></div>
                          <div className="bg-slate-800 p-1.5 rounded text-center"><p className="text-slate-400">Readout</p><p className="text-amber-400 font-bold">{fmt(calc.readout_ms, 1, 'ms')}</p></div>
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-400 mb-1">Resultados</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <Stat cls="bg-green-900/30 border border-green-700 text-green-300" title="FOV H" value={fmt(calc.result_fov_horizontal, 2, 'mm')} breakdownKey="fovH" active={breakdownKey === 'fovH'} onClick={handleToggleBreakdown} />
                          <Stat cls="bg-green-900/30 border border-green-700 text-green-300" title="FOV V" value={fmt(calc.result_fov_vertical, 2, 'mm')} breakdownKey={breakdowns.fovV ? 'fovV' : undefined} active={breakdownKey === 'fovV'} onClick={handleToggleBreakdown} />
                          <Stat cls="bg-blue-900/30 border border-blue-700 text-blue-300" title="Magnificación" value={`×${fmt(calc.result_magnification, 4)}`} breakdownKey={breakdowns.magnification ? 'magnification' : undefined} active={breakdownKey === 'magnification'} onClick={handleToggleBreakdown} />
                          <div className="bg-blue-900/30 border border-blue-700 p-1.5 rounded text-center"><p className="text-blue-300">Max FPS</p><p className="text-blue-400 font-bold">{fmt(calc.result_max_fps, 1)}</p></div>
                          {calc.result_motion_blur_px !== undefined && (
                            <Stat cls="bg-orange-900/30 border border-orange-700 text-orange-300" title="Motion Blur" value={fmt(calc.result_motion_blur_px, 2, 'px')} breakdownKey={breakdowns.motionBlur ? 'motionBlur' : undefined} active={breakdownKey === 'motionBlur'} onClick={handleToggleBreakdown} />
                          )}
                          {calc.velocity_mm_s !== undefined && (
                            <div className="bg-slate-800 p-1.5 rounded text-center"><p className="text-slate-400">Velocidad</p><p className="text-amber-400 font-bold">{fmt(calc.velocity_mm_s, 0, 'mm/s')}</p></div>
                          )}
                        </div>
                        {calc.motion_target && (
                          <div className="mt-1 flex flex-wrap items-center gap-x-1 text-slate-400">
                            <span>Motion/Frame Rate: calculó</span>
                            {breakdowns.motionResult ? (
                              <button type="button" onClick={() => handleToggleBreakdown('motionResult')} className={`text-amber-400 underline decoration-dotted underline-offset-2 hover:text-amber-300 ${breakdownKey === 'motionResult' ? 'ring-2 ring-amber-400 rounded px-1' : ''}`}>
                                {calc.motion_target}
                              </button>
                            ) : (
                              <span className="text-amber-400">{calc.motion_target}</span>
                            )}
                            {calc.fps_deseado !== undefined && <span> · FPS deseado <span className="text-amber-400">{fmt(calc.fps_deseado, 1)}</span></span>}
                            {calc.fotos_per_mm !== undefined && <span> · Fotos/mm <span className="text-amber-400">{fmt(calc.fotos_per_mm, 3)}</span></span>}
                            {calc.inspection_type && <span> · Inspección: <span className="text-amber-400">{calc.inspection_type}</span></span>}
                          </div>
                        )}
                      </div>

                      {calc.f_number !== undefined && (
                        <div>
                          <p className="text-slate-400 mb-1">Profundidad de campo (DOF)</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="bg-slate-800 p-1.5 rounded text-center">
                              <p className="text-slate-400">Apertura</p>
                              <p className="text-amber-400 font-bold">f/{fmt(calc.f_number, 1)}</p>
                              {breakdowns.coc ? (
                                <button type="button" onClick={() => handleToggleBreakdown('coc')} className={`text-slate-500 underline decoration-dotted underline-offset-2 hover:text-amber-300 ${breakdownKey === 'coc' ? 'ring-2 ring-amber-400 rounded px-1' : ''}`}>
                                  {calc.circle_of_confusion_mode}
                                </button>
                              ) : (
                                <p className="text-slate-500">{calc.circle_of_confusion_mode}</p>
                              )}
                            </div>
                            <Stat cls="bg-purple-900/30 border border-purple-700 text-purple-300" title="Cercano" value={fmt(calc.result_dof_near_mm, 1, 'mm')} breakdownKey={breakdowns.dofNear ? 'dofNear' : undefined} active={breakdownKey === 'dofNear'} onClick={handleToggleBreakdown} />
                            <Stat cls="bg-purple-900/30 border border-purple-700 text-purple-300" title="Lejano" value={calc.result_dof_far_mm !== undefined ? fmt(calc.result_dof_far_mm, 1, 'mm') : '∞'} breakdownKey={breakdowns.dofFar ? 'dofFar' : undefined} active={breakdownKey === 'dofFar'} onClick={handleToggleBreakdown} />
                            <Stat cls="bg-purple-900/30 border border-purple-700 text-purple-300" title="Total" value={calc.result_dof_total_mm !== undefined ? fmt(calc.result_dof_total_mm, 2, 'mm') : '∞'} breakdownKey={breakdowns.dofTotal ? 'dofTotal' : undefined} active={breakdownKey === 'dofTotal'} onClick={handleToggleBreakdown} />
                          </div>
                        </div>
                      )}

                      {activeBreakdown && (
                        <div className="bg-amber-900/20 border border-amber-700 rounded p-2 space-y-0.5">
                          <p className="text-amber-400 font-semibold">📐 {activeBreakdown.label}</p>
                          <p className="text-slate-300 font-mono">{activeBreakdown.formula}</p>
                          <p className="text-slate-400 font-mono">= {activeBreakdown.substitution}</p>
                          <p className="text-white font-bold">= {activeBreakdown.result}</p>
                          {activeBreakdown.note && <p className="text-slate-500 italic">{activeBreakdown.note}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
