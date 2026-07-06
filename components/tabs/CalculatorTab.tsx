'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { useCalculatorStore } from '@/lib/store';

const SENSOR_FORMATS = {
  'custom': [0, 0],
  '1/2.3"': [6.4, 4.8],
  '2/3"': [9.6, 7.2],
  '1"': [12.8, 9.6],
  'APS-C': [23.6, 15.7],
  'Full Frame': [36, 24],
};

export function CalculatorTab() {
  const store = useCalculatorStore();
  const [sensorFormat, setSensorFormat] = useState('1/2.3"');
  const [calculationTarget, setCalculationTarget] = useState('fieldOfView');
  const [unit, setUnit] = useState('mm');
  const [desiredFov, setDesiredFov] = useState(50);
  const [desiredWd, setDesiredWd] = useState(25);
  const [error, setError] = useState('');

  // Convertir valores según unidad
  const convertFromMm = (mmValue: number, targetUnit: string): number => {
    if (targetUnit === 'cm') return mmValue / 10;
    if (targetUnit === 'in') return mmValue / 25.4;
    return mmValue;
  };

  const convertToMm = (value: number, sourceUnit: string): number => {
    if (sourceUnit === 'cm') return value * 10;
    if (sourceUnit === 'in') return value * 25.4;
    return value;
  };

  const handleSensorFormatChange = (format: string | number) => {
    const formatStr = String(format);
    setSensorFormat(formatStr);
    if (formatStr !== 'custom') {
      const [width, height] = SENSOR_FORMATS[formatStr as keyof typeof SENSOR_FORMATS] || [0, 0];
      (store as any).setSensorWidth(width);
      (store as any).setSensorHeight(height);
    }
  };

  const handleCalculate = () => {
    setError('');

    // Validaciones básicas
    if (store.sensorWidth <= 0 || store.sensorHeight <= 0) {
      setError('El tamaño del sensor debe ser mayor a 0');
      return;
    }
    if (store.pixelSize <= 0) {
      setError('El tamaño del píxel debe ser mayor a 0');
      return;
    }

    try {
      const focalMm = store.focalLength;
      const wdMm = store.workingDistance;

      if (calculationTarget === 'fieldOfView') {
        if (focalMm <= 0) {
          setError('Focal length debe ser mayor a 0');
          return;
        }
        if (wdMm <= 0) {
          setError('Working distance debe ser mayor a 0');
          return;
        }

        // FOV = (SensorDim / Focal) * WorkingDistance
        const fovHMm = (store.sensorWidth / focalMm) * wdMm;
        const fovVMm = (store.sensorHeight / focalMm) * wdMm;
        const magnification = focalMm / wdMm; // Magnificación = f/WD

        const maxFps = 1000 / (store.exposure + store.readout);
        const blur = (store.velocity / store.pixelSize) * store.exposure / 1000;

        (store as any).setResults({
          success: true,
          fovHorizontalMm: Math.round(fovHMm * 100) / 100,
          fovVerticalMm: Math.round(fovVMm * 100) / 100,
          magnification: Math.round(magnification * 10000) / 10000,
          maxFrameRate: Math.round(maxFps * 10) / 10,
          spatialResolution: store.pixelSize / 1000,
          motionBlurPixels: Math.round(blur * 100) / 100,
        });

        // Guardar en historial
        store.addToHistory({
          created_at: new Date().toISOString(),
          focal_length_mm: focalMm,
          working_distance_mm: wdMm,
          result_fov_horizontal: Math.round(fovHMm * 100) / 100,
          result_fov_vertical: Math.round(fovVMm * 100) / 100,
          result_magnification: Math.round(magnification * 10000) / 10000,
        });

      } else if (calculationTarget === 'workingDistance') {
        if (focalMm <= 0) {
          setError('Focal length debe ser mayor a 0');
          return;
        }
        if (desiredFov <= 0) {
          setError('FOV deseado debe ser mayor a 0');
          return;
        }

        // Fórmula: FOV = (W/f) * WD => WD = (FOV * f) / W
        const calculatedWd = (desiredFov * focalMm) / store.sensorWidth;
        const fovVMm = (store.sensorHeight / focalMm) * calculatedWd;
        const magnification = focalMm / calculatedWd;

        const maxFps = 1000 / (store.exposure + store.readout);
        const blur = (store.velocity / store.pixelSize) * store.exposure / 1000;

        (store as any).setResults({
          success: true,
          fovHorizontalMm: Math.round(desiredFov * 100) / 100,
          fovVerticalMm: Math.round(fovVMm * 100) / 100,
          magnification: Math.round(magnification * 10000) / 10000,
          maxFrameRate: Math.round(maxFps * 10) / 10,
          spatialResolution: store.pixelSize / 1000,
          motionBlurPixels: Math.round(blur * 100) / 100,
          workingDistanceMm: Math.round(calculatedWd * 100) / 100,
        });

        // Actualizar WD en el store para que se vea en el gráfico
        (store as any).setWorkingDistance(calculatedWd);

        store.addToHistory({
          created_at: new Date().toISOString(),
          focal_length_mm: focalMm,
          working_distance_mm: Math.round(calculatedWd * 100) / 100,
          result_fov_horizontal: Math.round(desiredFov * 100) / 100,
          result_fov_vertical: Math.round(fovVMm * 100) / 100,
          result_magnification: Math.round(magnification * 10000) / 10000,
        });

      } else if (calculationTarget === 'focalLength') {
        if (wdMm <= 0) {
          setError('Working distance debe ser mayor a 0');
          return;
        }
        if (desiredFov <= 0) {
          setError('FOV deseado debe ser mayor a 0');
          return;
        }

        // Despejando FOV = (W/f) * WD => f = (W * WD) / FOV_deseado
        const calculatedFocal = (store.sensorWidth * wdMm) / desiredFov;
        // FOV vertical se calcula con el nuevo focal
        const fovVMm = (store.sensorHeight / calculatedFocal) * wdMm;
        const magnification = calculatedFocal / wdMm;

        const maxFps = 1000 / (store.exposure + store.readout);
        const blur = (store.velocity / store.pixelSize) * store.exposure / 1000;

        (store as any).setResults({
          success: true,
          fovHorizontalMm: Math.round(desiredFov * 100) / 100,
          fovVerticalMm: Math.round(fovVMm * 100) / 100,
          magnification: Math.round(magnification * 10000) / 10000,
          maxFrameRate: Math.round(maxFps * 10) / 10,
          spatialResolution: store.pixelSize / 1000,
          motionBlurPixels: Math.round(blur * 100) / 100,
          focalLengthMm: Math.round(calculatedFocal * 100) / 100,
        });

        (store as any).setFocalLength(calculatedFocal);

        store.addToHistory({
          created_at: new Date().toISOString(),
          focal_length_mm: Math.round(calculatedFocal * 100) / 100,
          working_distance_mm: wdMm,
          result_fov_horizontal: Math.round(desiredFov * 100) / 100,
          result_fov_vertical: Math.round(fovVMm * 100) / 100,
          result_magnification: Math.round(magnification * 10000) / 10000,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en cálculo');
    }
  };

  // Determinar qué campos deben estar deshabilitados
  const isFieldOfViewTarget = calculationTarget === 'fieldOfView';
  const isWorkingDistanceTarget = calculationTarget === 'workingDistance';
  const isFocalLengthTarget = calculationTarget === 'focalLength';

  return (
    <div className="grid grid-cols-6 gap-3 h-full overflow-hidden">
      {/* LEFT PANEL - INPUTS */}
      <div className="col-span-3 space-y-2 overflow-y-auto pr-2">
        {/* SENSOR SECTION */}
        <Card title="Sensor" icon="📊" className="p-2">
          <div className="grid grid-cols-3 gap-2">
            <FormInput
              label="Formato"
              type="select"
              value={sensorFormat}
              onChange={handleSensorFormatChange}
              options={Object.keys(SENSOR_FORMATS).map((k) => ({ value: k, label: k }))}
              tooltip="Formato de sensor estándar. Modifica automáticamente Ancho y Alto"
            />
            <FormInput
              label="Ancho"
              type="number"
              value={store.sensorWidth}
              onChange={(v) => {
                setSensorFormat('custom');
                const newWidth = typeof v === 'string' ? parseFloat(v) : v;
                (store as any).setSensorWidth(newWidth);
                // Auto-actualizar ResH basado en ancho y píxel
                const newResH = Math.round((newWidth / (store.pixelSize / 1000)) * 100) / 100;
                (store as any).setResolutionH(newResH);
              }}
              unit="mm"
              step="0.1"
              min={0.1}
              tooltip="Ancho del sensor. Modifica automáticamente Res H"
            />
            <FormInput
              label="Alto"
              type="number"
              value={store.sensorHeight}
              onChange={(v) => {
                setSensorFormat('custom');
                const newHeight = typeof v === 'string' ? parseFloat(v) : v;
                (store as any).setSensorHeight(newHeight);
                // Auto-actualizar ResV basado en alto y píxel
                const newResV = Math.round((newHeight / (store.pixelSize / 1000)) * 100) / 100;
                (store as any).setResolutionV(newResV);
              }}
              unit="mm"
              step="0.1"
              min={0.1}
              tooltip="Alto del sensor. Modifica automáticamente Res V"
            />
            <FormInput
              label="Píxel"
              type="number"
              value={store.pixelSize}
              onChange={(v) => (store as any).setPixelSize(typeof v === 'string' ? parseFloat(v) : v)}
              unit="µm"
              step="0.1"
              min={0.1}
              tooltip="Tamaño de cada píxel en µm. Afecta Motion Blur y resolución"
            />
            <FormInput
              label="Res H"
              type="number"
              value={store.resolution_h}
              onChange={(v) => {
                const newResH = typeof v === 'string' ? parseInt(v) : v;
                (store as any).setResolutionH(newResH);
                // Auto-actualizar Ancho basado en Res H y píxel
                const newWidth = (newResH * store.pixelSize) / 1000; // píxel está en µm
                (store as any).setSensorWidth(Math.round(newWidth * 100) / 100);
              }}
              unit="px"
              min={1}
              tooltip="Resolución horizontal. Modifica automáticamente Ancho"
            />
            <FormInput
              label="Res V"
              type="number"
              value={store.resolution_v}
              onChange={(v) => {
                const newResV = typeof v === 'string' ? parseInt(v) : v;
                (store as any).setResolutionV(newResV);
                // Auto-actualizar Alto basado en Res V y píxel
                const newHeight = (newResV * store.pixelSize) / 1000; // píxel está en µm
                (store as any).setSensorHeight(Math.round(newHeight * 100) / 100);
              }}
              unit="px"
              min={1}
              tooltip="Resolución vertical. Modifica automáticamente Alto"
            />
          </div>
        </Card>

        {/* OPTICAL SECTION */}
        <Card title="Óptica" icon="🔍" className="p-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">¿Qué calcular?</label>
              <select
                value={calculationTarget}
                onChange={(e) => setCalculationTarget(e.target.value)}
                className="w-full mt-1 px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
              >
                <option value="fieldOfView">Calcular: FOV</option>
                <option value="workingDistance">Calcular: Working Distance</option>
                <option value="focalLength">Calcular: Focal Length</option>
              </select>
            </div>
            <div>
              <FormInput
                label="Unidades"
                type="select"
                value={unit}
                onChange={(v) => setUnit(String(v))}
                options={[
                  { value: 'mm', label: 'Milímetros' },
                  { value: 'cm', label: 'Centímetros' },
                  { value: 'in', label: 'Pulgadas' },
                ]}
                tooltip="Unidades para Working Distance y FOV"
              />
            </div>

            <FormInput
              label="Focal Length"
              type="number"
              value={store.focalLength}
              onChange={(v) => (store as any).setFocalLength(typeof v === 'string' ? parseFloat(v) : v)}
              unit="mm"
              step="0.1"
              min={0.1}
              disabled={isFocalLengthTarget}
              tooltip={isFocalLengthTarget ? '❌ Se calculará automáticamente' : 'Distancia focal del lente en mm'}
            />
            <FormInput
              label="Working Distance"
              type="number"
              value={convertFromMm(store.workingDistance, unit)}
              onChange={(v) => {
                const mmValue = convertToMm(typeof v === 'string' ? parseFloat(v) : v, unit);
                (store as any).setWorkingDistance(mmValue);
              }}
              unit={unit}
              step="1"
              min={0.1}
              disabled={isWorkingDistanceTarget}
              tooltip={isWorkingDistanceTarget ? '❌ Se calculará automáticamente' : 'Distancia del lente al objeto'}
            />

            {/* Campo adicional: FOV deseado si se calcula WD */}
            {isWorkingDistanceTarget && (
              <FormInput
                label="FOV Deseado"
                type="number"
                value={desiredFov}
                onChange={(v) => setDesiredFov(typeof v === 'string' ? parseFloat(v) : v)}
                unit="mm"
                step="1"
                min={0.1}
                tooltip="FOV horizontal deseado"
              />
            )}

            {/* Campo adicional: FOV deseado si se calcula Focal */}
            {isFocalLengthTarget && (
              <FormInput
                label="FOV H Deseado"
                type="number"
                value={desiredFov}
                onChange={(v) => setDesiredFov(typeof v === 'string' ? parseFloat(v) : v)}
                unit="mm"
                step="1"
                min={0.1}
                tooltip="FOV horizontal que deseas (se calculará el Focal correcto)"
              />
            )}

            <FormInput
              label="Exposición"
              type="number"
              value={store.exposure}
              onChange={(v) => (store as any).setExposure(typeof v === 'string' ? parseFloat(v) : v)}
              unit="ms"
              step="0.1"
              min={0.01}
              tooltip="Tiempo de exposición. Afecta Motion Blur y Max FPS"
            />
            <FormInput
              label="Velocidad"
              type="number"
              value={store.velocity}
              onChange={(v) => (store as any).setVelocity(typeof v === 'string' ? parseFloat(v) : v)}
              unit="mm/s"
              step="10"
              min={0}
              tooltip="Velocidad del objeto. Afecta Motion Blur"
            />
          </div>

          <div className="mt-2 text-xs text-slate-400">
            <p>Fórmula base: <span className="text-amber-300">FOV = (W/f) × WD</span></p>
            {isWorkingDistanceTarget && (
              <p className="text-green-300">Calculando: <span className="font-bold">WD = (FOV × f) / W</span></p>
            )}
            {isFocalLengthTarget && (
              <p className="text-green-300">Calculando: <span className="font-bold">f = (W × WD) / FOV</span></p>
            )}
          </div>
        </Card>

        {/* PERFORMANCE SECTION */}
        <Card title="Rendimiento" icon="⚡" className="p-2">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Readout"
              type="number"
              value={store.readout}
              onChange={(v) => (store as any).setReadout(typeof v === 'string' ? parseFloat(v) : v)}
              unit="ms"
              step="0.1"
              min={0.01}
              tooltip="Tiempo de lectura del sensor. Afecta Max FPS"
            />
            <FormInput
              label="Max FPS"
              type="number"
              value={Math.round((1000 / (store.exposure + store.readout)) * 10) / 10}
              onChange={() => {}}
              unit="fps"
              disabled
            />
          </div>
        </Card>

        {/* ERROR & BUTTON */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 px-2 py-2 rounded text-xs">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={store.sensorWidth <= 0 || store.pixelSize <= 0}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-2 rounded transition text-sm"
        >
          🧮 CALCULAR
        </button>
      </div>

      {/* RIGHT PANEL - RESULTS */}
      <div className="col-span-3 overflow-y-auto">
        <div className="space-y-2">
          {/* MAIN CALCULATION RESULT */}
          {store.results && (
            <Card title="🎯 RESULTADO PRINCIPAL" icon="⭐" className="p-3 bg-slate-800 border-2 border-amber-500">
              <div className="text-center">
                {isFieldOfViewTarget && (
                  <>
                    <p className="text-amber-300 text-sm mb-1">FOV Horizontal Calculado</p>
                    <p className="text-amber-400 font-bold text-4xl">{store.results.fovHorizontalMm?.toFixed(2)}</p>
                    <p className="text-amber-300 text-sm">mm</p>
                    <p className="text-slate-400 text-xs mt-2">FOV V: {store.results.fovVerticalMm?.toFixed(2)} mm</p>
                  </>
                )}
                {isWorkingDistanceTarget && (
                  <>
                    <p className="text-amber-300 text-sm mb-1">Working Distance Calculado</p>
                    <p className="text-amber-400 font-bold text-4xl">{convertFromMm(store.results.workingDistanceMm || store.workingDistance, unit)?.toFixed(2)}</p>
                    <p className="text-amber-300 text-sm">{unit}</p>
                    <p className="text-slate-400 text-xs mt-2">FOV H: {store.results.fovHorizontalMm?.toFixed(2)} mm</p>
                  </>
                )}
                {isFocalLengthTarget && (
                  <>
                    <p className="text-amber-300 text-sm mb-1">Focal Length Calculado</p>
                    <p className="text-amber-400 font-bold text-4xl">{store.results.focalLengthMm?.toFixed(2)}</p>
                    <p className="text-amber-300 text-sm">mm</p>
                    <p className="text-slate-400 text-xs mt-2">FOV H: {store.results.fovHorizontalMm?.toFixed(2)} mm</p>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* OPTICAL RESULTS */}
          <Card title="📊 Resultados Ópticos" icon="✨" className="p-2">
            {store.results ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`${isFieldOfViewTarget ? 'bg-amber-900/50 border-amber-500 border-2' : 'bg-green-900/30 border border-green-700'} p-2 rounded`}>
                  <p className="text-green-300 text-xs">FOV H</p>
                  <p className="text-green-400 font-bold text-lg">{store.results.fovHorizontalMm?.toFixed(2)}</p>
                  <p className="text-green-300 text-xs">mm</p>
                </div>
                <div className="bg-green-900/30 border border-green-700 p-2 rounded">
                  <p className="text-green-300 text-xs">FOV V</p>
                  <p className="text-green-400 font-bold text-lg">{store.results.fovVerticalMm?.toFixed(2)}</p>
                  <p className="text-green-300 text-xs">mm</p>
                </div>
                <div className="bg-blue-900/30 border border-blue-700 p-2 rounded">
                  <p className="text-blue-300 text-xs">Magnification</p>
                  <p className="text-blue-400 font-bold text-lg">×{store.results.magnification?.toFixed(4)}</p>
                </div>
                <div className="bg-blue-900/30 border border-blue-700 p-2 rounded">
                  <p className="text-blue-300 text-xs">Max FPS</p>
                  <p className="text-blue-400 font-bold text-lg">{store.results.maxFrameRate?.toFixed(1)}</p>
                </div>
                <div className="bg-purple-900/30 border border-purple-700 p-2 rounded">
                  <p className="text-purple-300 text-xs">Spatial Res</p>
                  <p className="text-purple-400 font-bold text-lg">{store.results.spatialResolution ? (store.results.spatialResolution * 1000).toFixed(3) : '-'}</p>
                  <p className="text-purple-300 text-xs">µm</p>
                </div>
                <div className="bg-orange-900/30 border border-orange-700 p-2 rounded">
                  <p className="text-orange-300 text-xs">Motion Blur</p>
                  <p className="text-orange-400 font-bold text-lg">{store.results.motionBlurPixels?.toFixed(2) || '-'}</p>
                  <p className="text-orange-300 text-xs">px</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-4">
                <p className="text-xs">Completa parámetros y haz clic en Calcular</p>
              </div>
            )}
          </Card>

          {/* SENSOR METRICS */}
          <Card title="Métricas del Sensor" icon="📐" className="p-2">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-700 p-1.5 rounded text-center">
                <p className="text-slate-400">Resolución</p>
                <p className="text-amber-400 font-bold">{store.resolution_h}×{store.resolution_v}</p>
              </div>
              <div className="bg-slate-700 p-1.5 rounded text-center">
                <p className="text-slate-400">Tamaño</p>
                <p className="text-amber-400 font-bold">{store.sensorWidth?.toFixed(1)}×{store.sensorHeight?.toFixed(1)}</p>
              </div>
              <div className="bg-slate-700 p-1.5 rounded text-center">
                <p className="text-slate-400">Píxel</p>
                <p className="text-amber-400 font-bold">{store.pixelSize?.toFixed(2)}µm</p>
              </div>
            </div>
          </Card>

          {/* TIMING METRICS */}
          <Card title="Tiempos" icon="⏱️" className="p-2">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-700 p-1.5 rounded text-center">
                <p className="text-slate-400">Exposición</p>
                <p className="text-amber-400 font-bold">{store.exposure?.toFixed(1)}</p>
                <p className="text-slate-400">ms</p>
              </div>
              <div className="bg-slate-700 p-1.5 rounded text-center">
                <p className="text-slate-400">Readout</p>
                <p className="text-amber-400 font-bold">{store.readout?.toFixed(1)}</p>
                <p className="text-slate-400">ms</p>
              </div>
              <div className="bg-slate-700 p-1.5 rounded text-center">
                <p className="text-slate-400">Velocidad</p>
                <p className="text-amber-400 font-bold">{store.velocity?.toFixed(0)}</p>
                <p className="text-slate-400">mm/s</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
