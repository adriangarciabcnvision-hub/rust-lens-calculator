'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/lib/dataStore';
import { COMMON_CAMERAS, COMMON_LENSES } from '@/lib/commonCatalog';
import { round } from '@/lib/calculationEngine';

interface RequestDialogProps {
  onClose: () => void;
  initialType?: 'camera' | 'lens';
}

const inputClass =
  'w-full px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none';

export function RequestDialog({ onClose, initialType = 'camera' }: RequestDialogProps) {
  const { addRequest, cameras, lenses, requests } = useDataStore();
  const [type, setType] = useState<'camera' | 'lens'>(initialType);
  const [requestedBy, setRequestedBy] = useState('');
  const [sent, setSent] = useState(false);

  // Cámara — el Ancho/Alto del sensor NUNCA se piden a mano: se derivan de Píxel + Res H/V,
  // igual que en la Calculadora y en la plantilla de importación Excel (Nombre, Pixel_um,
  // ResH_px, ResV_px, MaxFPS). Pedirlos como campos manuales aparte permitía que quedaran
  // desincronizados del resto de datos.
  const [camName, setCamName] = useState('');
  const [pixelSize, setPixelSize] = useState('');
  const [resolutionH, setResolutionH] = useState('');
  const [resolutionV, setResolutionV] = useState('');
  const [maxFps, setMaxFps] = useState('');
  const [readout, setReadout] = useState('');

  // Lente
  const [lensName, setLensName] = useState('');
  const [focalLength, setFocalLength] = useState('');
  const [aperture, setAperture] = useState('');

  const num = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  const sensorWidthMm = num(resolutionH) > 0 && num(pixelSize) > 0 ? (num(resolutionH) * num(pixelSize)) / 1000 : 0;
  const sensorHeightMm = num(resolutionV) > 0 && num(pixelSize) > 0 ? (num(resolutionV) * num(pixelSize)) / 1000 : 0;

  // Sugerencias para el datalist: catálogo actual + catálogo común (aunque no esté importado aún)
  const cameraSuggestions = useMemo(
    () => Array.from(new Set([...cameras.map((c) => c.name), ...COMMON_CAMERAS.map((c) => c.name)])).sort(),
    [cameras]
  );
  const lensSuggestions = useMemo(
    () => Array.from(new Set([...lenses.map((l) => l.name), ...COMMON_LENSES.map((l) => l.name)])).sort(),
    [lenses]
  );

  // Bloquea duplicados sin distinguir mayúsculas: si ya existe "Basler" no se puede pedir "basler"
  const nameClash = (name: string) => {
    const n = name.trim().toLowerCase();
    if (!n) return false;
    if (type === 'camera') {
      return (
        cameras.some((c) => c.name.toLowerCase() === n) ||
        requests.some((r) => r.type === 'camera' && r.status === 'pending' && r.payload?.name?.toLowerCase() === n)
      );
    }
    return (
      lenses.some((l) => l.name.toLowerCase() === n) ||
      requests.some((r) => r.type === 'lens' && r.status === 'pending' && r.payload?.name?.toLowerCase() === n)
    );
  };

  const camNameClash = nameClash(camName);
  const lensNameClash = nameClash(lensName);

  const cameraValid = camName.trim() && !camNameClash && num(pixelSize) > 0 && num(resolutionH) > 0 && num(resolutionV) > 0;
  const lensValid = lensName.trim() && !lensNameClash && num(focalLength) > 0;
  const valid = requestedBy.trim() && (type === 'camera' ? cameraValid : lensValid);

  const handleSubmit = () => {
    if (!valid) return;
    addRequest({
      type,
      requestedBy: requestedBy.trim(),
      payload:
        type === 'camera'
          ? {
              name: camName.trim(),
              sensorWidth: round(sensorWidthMm, 2),
              sensorHeight: round(sensorHeightMm, 2),
              pixelSize: num(pixelSize),
              resolutionH: Math.round(num(resolutionH)),
              resolutionV: Math.round(num(resolutionV)),
              maxFps: maxFps.trim() ? num(maxFps) : undefined,
              readout: readout.trim() ? num(readout) : (maxFps.trim() ? round(1000 / num(maxFps), 3) : undefined),
            }
          : {
              name: lensName.trim(),
              focalLength: num(focalLength),
              aperture: aperture.trim() || undefined,
            },
    });
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div
        className="bg-slate-800 border border-amber-700 rounded-lg shadow-2xl w-full max-w-md max-h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-base font-bold text-amber-400">➕ Solicitar alta en el catálogo</h2>
          <button onClick={onClose} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition">✕</button>
        </div>

        {sent ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-2xl">✅</p>
            <p className="text-sm text-slate-300">
              Solicitud enviada. Un administrador la revisará y, si la aprueba, aparecerá en el catálogo.
            </p>
            <button onClick={onClose} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm transition">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setType('camera')}
                className={`py-1.5 rounded text-xs font-semibold transition ${type === 'camera' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                📷 Cámara
              </button>
              <button
                onClick={() => setType('lens')}
                className={`py-1.5 rounded text-xs font-semibold transition ${type === 'lens' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                🔭 Lente
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-300">Tu nombre *</label>
              <input type="text" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} className={inputClass} />
            </div>

            {type === 'camera' ? (
              <>
                <div>
                  <label className="text-xs text-slate-300">Nombre / modelo de la cámara *</label>
                  <input
                    type="text"
                    list="camera-suggestions"
                    value={camName}
                    onChange={(e) => setCamName(e.target.value)}
                    placeholder="Ej: Basler acA2440-20gm"
                    className={inputClass}
                  />
                  <datalist id="camera-suggestions">
                    {cameraSuggestions.map((n) => <option key={n} value={n} />)}
                  </datalist>
                  {camNameClash && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ Ya existe "{camName.trim()}" en el catálogo o en una solicitud pendiente. Elige el nombre exacto de la lista o revisa antes de duplicar.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-300">Píxel (µm) *</label>
                    <input type="number" step="0.01" value={pixelSize} onChange={(e) => setPixelSize(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300">Resolución H × V (px) *</label>
                    <div className="flex gap-1">
                      <input type="number" value={resolutionH} onChange={(e) => setResolutionH(e.target.value)} placeholder="H" className={inputClass} />
                      <input type="number" value={resolutionV} onChange={(e) => setResolutionV(e.target.value)} placeholder="V" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300">Max FPS (opcional)</label>
                    <input type="number" step="1" value={maxFps} onChange={(e) => setMaxFps(e.target.value)} placeholder="Ej: 60" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300">Readout (ms, opcional)</label>
                    <input type="number" step="0.1" value={readout} onChange={(e) => setReadout(e.target.value)} placeholder={maxFps.trim() ? `Auto: ${round(1000 / num(maxFps), 3)}` : 'Ej: 10'} className={inputClass} />
                  </div>
                </div>
                {sensorWidthMm > 0 && sensorHeightMm > 0 && (
                  <p className="text-xs text-slate-400">
                    Sensor calculado: {sensorWidthMm.toFixed(2)} × {sensorHeightMm.toFixed(2)} mm (= Res × Píxel, igual que en la Calculadora)
                  </p>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-slate-300">Nombre / modelo del lente *</label>
                  <input
                    type="text"
                    list="lens-suggestions"
                    value={lensName}
                    onChange={(e) => setLensName(e.target.value)}
                    placeholder="Ej: Computar M2514-MP2"
                    className={inputClass}
                  />
                  <datalist id="lens-suggestions">
                    {lensSuggestions.map((n) => <option key={n} value={n} />)}
                  </datalist>
                  {lensNameClash && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ Ya existe "{lensName.trim()}" en el catálogo o en una solicitud pendiente. Elige el nombre exacto de la lista o revisa antes de duplicar.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-300">Focal (mm) *</label>
                    <input type="number" step="0.1" value={focalLength} onChange={(e) => setFocalLength(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300">Apertura</label>
                    <input type="text" value={aperture} onChange={(e) => setAperture(e.target.value)} placeholder="Ej: f/1.4" className={inputClass} />
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleSubmit}
              disabled={!valid}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded text-sm transition"
            >
              Enviar solicitud
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
