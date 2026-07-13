'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { useCalculatorStore } from '@/lib/store';
import { useDataStore, SavedSet } from '@/lib/dataStore';
import { RequestDialog } from '@/components/RequestDialog';
import { openPrintableReport } from '@/lib/printReport';
import CameraSelector from '@/components/CameraSelector';
import LensSelector from '@/components/LensSelector';
import Dialog from '@/components/ui/Dialog';
import {
  calculateMotionBlur,
  calculateDepthOfField,
  round,
  MOTION_BLUR_QUALITY_LABELS,
  INSPECTION_BLUR_THRESHOLDS,
  INSPECTION_TYPE_LABELS,
  InspectionType,
} from '@/lib/calculationEngine';



// Tabla estándar de formatos ópticos (convención "tipo tubo vidicon"), valores en mm
// tal y como los publican Sony/Basler/FLIR/Edmund Optics en sus tablas de formato de sensor.
const SENSOR_FORMATS = {
  '1/4"': [3.2, 2.4],
  '1/3.6"': [4.0, 3.0],
  '1/3.2"': [4.54, 3.42],
  '1/3"': [4.8, 3.6],
  '1/2.7"': [5.37, 4.04],
  '1/2.5"': [5.76, 4.29],
  '1/2.3"': [6.16, 4.62],
  '1/2"': [6.4, 4.8],
  '1/1.8"': [7.18, 5.32],
  '1/1.7"': [7.6, 5.7],
  '2/3"': [8.8, 6.6],
  '1"': [12.8, 9.6],
  '4/3"': [17.3, 13.0],
  'APS-C': [23.6, 15.6],
  'Full Frame': [36, 24],
};

// El formato de sensor es, por definición, un tamaño físico fijo (herencia de los tubos
// vidicon): 1/3" son siempre 4.8×3.6mm sea cual sea la resolución. Por eso se detecta
// comparando el Ancho/Alto YA CALCULADO (Res × Píxel) contra estos tamaños estándar,
// no a partir de la resolución sola.
// OJO: esta tabla asume sensores ~4:3, la relación de aspecto clásica de los tubos vidicon.
// Muchos sensores modernos de visión artificial (16:10, 16:9, 1:1...) no coinciden con
// NINGÚN formato estándar aunque su tamaño sea perfectamente normal — no es un fallo del
// cálculo, es que ese sensor concreto no tiene una designación "en pulgadas" que le encaje.
function detectSensorFormat(widthMm: number, heightMm: number): string {
  if (widthMm <= 0 || heightMm <= 0) return '';
  const match = Object.entries(SENSOR_FORMATS).find(
    ([, [w, h]]) => Math.abs(w - widthMm) < w * 0.04 && Math.abs(h - heightMm) < h * 0.04
  );
  return match ? match[0] : '';
}

const CUSTOM_FORMAT_VALUE = '__custom__';

export function CalculatorTab() {
  const store = useCalculatorStore();
  const dataStore = useDataStore();
  const [sensorFormat, setSensorFormat] = useState('');
  const [calculationTarget, setCalculationTarget] = useState('fieldOfView');
  const [unit, setUnit] = useState('mm');
  const [desiredFovX, setDesiredFovXState] = useState(0);
  const [desiredFovY, setDesiredFovYState] = useState(0);
  const [setName, setSetName] = useState('');
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedLensId, setSelectedLensId] = useState('');
  const [requestDialogType, setRequestDialogType] = useState<'camera' | 'lens' | null>(null);
  const [diagnosticMsg, setDiagnosticMsg] = useState('');
  const [activeDepKey, setActiveDepKey] = useState<string | null>(null);
const [cameraDialog,setCameraDialog]=useState(false);
const [lensDialog,setLensDialog]=useState(false);

  // Motion Blur / Frame Rate: qué campo se calcula de los 4 (FPS/Exposición/Velocidad/Fotos-mm)
  const [motionTarget, setMotionTarget] = useState<'exposure' | 'fps' | 'velocity' | 'fotosPerMm'>('exposure');
  const [fpsDeseado, setFpsDeseado] = useState(0);
  const [fotosPerMmDeseado, setFotosPerMmDeseado] = useState(0);

  // Matricial (área): Max FPS es directamente imágenes/segundo. Lineal (line-scan): Max Hz es
  // líneas/segundo, NO imágenes/segundo — hace falta el número de líneas que forman una imagen
  // completa para convertir uno en otro. store.maxFps siempre termina siendo el FPS "de imagen"
  // real, sea cual sea el origen, para que el resto del pipeline (motionCalc, etc.) no cambie.
  const [cameraKind, setCameraKind] = useState<'matricial' | 'lineal'>('matricial');
  const [lineRateHz, setLineRateHz] = useState(0);
  const [linesPerImage, setLinesPerImage] = useState(0);

  // Tipo de inspección: un único selector (al inicio de todo) que fija tanto el círculo de
  // confusión (DOF) como el umbral de motion blur aceptable — mismos 3 niveles para ambos.
  const [inspectionType, setInspectionType] = useState<InspectionType>('undefined');

  const isFieldOfViewTarget = calculationTarget === 'fieldOfView';
  const isWorkingDistanceTarget = calculationTarget === 'workingDistance';
  const isFocalLengthTarget = calculationTarget === 'focalLength';

  // Con una cámara/lente del catálogo seleccionada, sus campos propios quedan bloqueados
  // (para editarlos hay que elegir primero "Sin cámara/lente" en el selector)
  const isCameraLocked = !!selectedCameraId;
  const isLensLocked = !!selectedLensId;

  // ===== Resaltado de dependencias: clic en el título de un parámetro muestra de qué depende =====
  const dependencyMap: Record<string, string[]> = {
    sensorWidth: ['resolutionH', 'pixelSize'],
    sensorHeight: ['resolutionV', 'pixelSize'],
    workingDistance: ['desiredFovX', 'focalLength', 'sensorWidth'],
    focalLength: ['desiredFovX', 'workingDistance', 'sensorWidth'],
    desiredFovY: ['desiredFovX', 'sensorWidth', 'sensorHeight'],
    fovH: isFieldOfViewTarget ? ['sensorWidth', 'focalLength', 'workingDistance'] : ['desiredFovX'],
    fovV: isFieldOfViewTarget ? ['sensorHeight', 'focalLength', 'workingDistance'] : ['desiredFovY', 'focalLength', 'workingDistance'],
    magnification: isWorkingDistanceTarget
      ? ['focalLength', 'desiredFovX', 'sensorWidth']
      : isFocalLengthTarget
        ? ['workingDistance', 'desiredFovX', 'sensorWidth']
        : ['focalLength', 'workingDistance'],
    maxFps: ['maxFps'],
    // El blur se mide en mm/pixel SOBRE EL OBJETO (incorpora la magnificación), no en el
    // píxel físico del sensor — depende de todo el triángulo óptico, no solo del píxel
    motionBlur: ['velocity', 'exposure', 'sensorWidth', 'focalLength', 'workingDistance', 'resolutionH'],
    dof: ['focalLength', 'workingDistance', 'fNumber', 'circleOfConfusion', 'minimumFocusDistance'],
  };
  const handleLabelClick = (key: string) => setActiveDepKey((prev) => (prev === key ? null : key));
  const highlightedFields = activeDepKey ? dependencyMap[activeDepKey] || [] : [];
  const isHighlighted = (key: string) => highlightedFields.includes(key);

  // FOV deseado X/Y enlazados por la relación de aspecto del sensor
  const handleDesiredFovXChange = (v: string | number) => {
    const x = typeof v === 'string' ? parseFloat(v) : v;
    setDesiredFovXState(x);
    if (store.sensorWidth > 0) setDesiredFovYState(round((x * store.sensorHeight) / store.sensorWidth, 2));
  };
  const handleDesiredFovYChange = (v: string | number) => {
    const y = typeof v === 'string' ? parseFloat(v) : v;
    setDesiredFovYState(y);
    if (store.sensorHeight > 0) setDesiredFovXState(round((y * store.sensorWidth) / store.sensorHeight, 2));
  };
  // Si cambia el sensor (cámara/formato/resolución), re-sincroniza Y a partir de X con la nueva relación
  useEffect(() => {
    if (store.sensorWidth > 0) setDesiredFovYState(round((desiredFovX * store.sensorHeight) / store.sensorWidth, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.sensorWidth, store.sensorHeight]);

  // Formato de sensor: se detecta solo comparando el Ancho/Alto ya calculado (ResH/ResV × Píxel,
  // o el que venga de la cámara) contra los tamaños físicos estándar — no hace falta tocar el desplegable
  useEffect(() => {
    setSensorFormat(detectSensorFormat(store.sensorWidth, store.sensorHeight));
  }, [store.sensorWidth, store.sensorHeight]);

  const handleSelectCamera = (id: string) => {
    setSelectedCameraId(id);
    const cam = dataStore.cameras.find((c) => c.id === id);
    if (!cam) {
      // "Sin cámara / Personalizada": libera los campos para editarlos a mano
      store.setCamera(null);
      return;
    }
    // Las cámaras del catálogo hoy son todas matriciales (área)
    setCameraKind('matricial');
    store.setSensorWidth(cam.sensorWidth);
    store.setSensorHeight(cam.sensorHeight);
    store.setPixelSize(cam.pixelSize);
    if (cam.resolutionH > 0) store.setResolutionH(cam.resolutionH);
    if (cam.resolutionV > 0) store.setResolutionV(cam.resolutionV);
    if (cam.maxFps) store.setMaxFps(cam.maxFps);
    if (cam.readout !== undefined) store.setReadout(cam.readout);
    else if (cam.maxFps) store.setReadout(round(1000 / cam.maxFps, 3));
    store.setCamera({ display_name: cam.name } as any);
  };

  // Ya no hace falta al editar (esos campos quedan disabled mientras haya cámara elegida),
  // pero se deja como red de seguridad por si algún campo se edita por otra vía
  const deselectCamera = () => {
    if (selectedCameraId) {
      setSelectedCameraId('');
      store.setCamera(null);
    }
  };

  const handleSelectLens = (id: string) => {
    setSelectedLensId(id);
    const lens = dataStore.lenses.find((l) => l.id === id);
    if (!lens) {
      // "Sin lente / Personalizado": libera Focal Length para editarlo a mano
      store.setLens(null);
      return;
    }
    store.setFocalLength(lens.focalLength);
    store.setLens({ display_name: lens.name } as any);
  };

  // Ancho/Alto SIEMPRE se recalculan juntos a partir del mismo trío (Píxel, ResH, ResV) —
  // nunca por separado, para que no queden mezclados con un valor antiguo de otro origen
  // (p.ej. de un Formato elegido antes de tener resolución). Si falta un dato, el resultado
  // es 0 (honesto: "aún no calculable"), no un valor stale.
  const recalcSensorFromResolution = (pixelSize: number, resH: number, resV: number) => {
    store.setSensorWidth(resH > 0 && pixelSize > 0 ? round((resH * pixelSize) / 1000, 2) : 0);
    store.setSensorHeight(resV > 0 && pixelSize > 0 ? round((resV * pixelSize) / 1000, 2) : 0);
  };

  const handleSensorFormatChange = (format: string | number) => {
    const formatStr = String(format);
    // Opción sintética "Personalizado (WxH)": solo informativa, no un preset real que aplicar
    if (formatStr === CUSTOM_FORMAT_VALUE) return;
    setSensorFormat(formatStr);
    if (formatStr !== '') {
      const [width, height] = SENSOR_FORMATS[formatStr as keyof typeof SENSOR_FORMATS] || [0, 0];
      store.setSensorWidth(width);
      store.setSensorHeight(height);
      if (store.pixelSize > 0) {
        store.setResolutionH(Math.round((width / store.pixelSize) * 1000));
        store.setResolutionV(Math.round((height / store.pixelSize) * 1000));
      } else {
        // Sin píxel no hay forma de derivar una resolución que corresponda a este formato:
        // se limpian para no dejar una ResH/ResV antigua que ya no tenga relación con él
        store.setResolutionH(0);
        store.setResolutionV(0);
      }
    }
  };

  // ===== CÁLCULO EN VIVO (sin botón): un efecto por modo, cada uno solo activo en su modo =====

  // Motion Blur: puramente derivado, sin necesidad de escribir en el store (pero sí se
  // incluye en store.results para que Comparador y el historial lo tengan disponible).
  // mmPerPixel es la resolución espacial sobre el OBJETO (no el píxel físico del sensor:
  // incorpora la magnificación), así que necesita focal/WD/resolución ya calculados — si
  // falta alguno, debe dar 0 (no Infinity/NaN) para que calculateMotionBlur lo marque
  // limpiamente como "no calculable" en vez de un resultado falso o "NaN px".
  const motionBlur = useMemo(() => {
    const mmPerPixel =
      store.results?.spatialResolution ??
      (store.focalLength > 0 && store.resolution_h > 0
        ? ((store.sensorWidth / store.focalLength) * store.workingDistance) / store.resolution_h
        : 0);
    return calculateMotionBlur({
      velocityMmPerSec: store.velocity,
      exposureMs: store.exposure,
      mmPerPixel,
    });
  }, [
    store.velocity,
    store.exposure,
    store.sensorWidth,
    store.focalLength,
    store.workingDistance,
    store.resolution_h,
    store.results?.spatialResolution,
  ]);

  useEffect(() => {
    if (!isFieldOfViewTarget) return;
    if (store.sensorWidth <= 0 || store.sensorHeight <= 0 || store.pixelSize <= 0) return;
    if (store.focalLength <= 0 || store.workingDistance <= 0) return;
    const fovH = (store.sensorWidth / store.focalLength) * store.workingDistance;
    const fovV = (store.sensorHeight / store.focalLength) * store.workingDistance;
    const magnification = store.sensorWidth / fovH;

const mmPerPixel = fovH / store.resolution_h;

store.setResults({
  success: true,

  fovHorizontalMm: round(fovH, 2),
  fovVerticalMm: round(fovV, 2),

  magnification: round(magnification, 4),

  maxFrameRate: round(store.maxFps, 1),

  spatialResolution: round(mmPerPixel, 6),

  motionBlurPixels: motionBlur.blurPixels,
});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFieldOfViewTarget, store.sensorWidth, store.sensorHeight, store.pixelSize, store.focalLength, store.workingDistance, store.maxFps, motionBlur.blurPixels]);

  // Modo: calcular Working Distance a partir de Focal + FOV deseado
  useEffect(() => {
    if (!isWorkingDistanceTarget) return;
    if (store.sensorWidth <= 0 || store.focalLength <= 0 || desiredFovX <= 0) return;
    const calculatedWd = (desiredFovX * store.focalLength) / store.sensorWidth;
    const fovV = (store.sensorHeight / store.focalLength) * calculatedWd;
    const magnification =
    store.sensorWidth / desiredFovX;

const mmPerPixel =
    desiredFovX / store.resolution_h;


    store.setWorkingDistance(round(calculatedWd, 2));
   store.setResults({
    success: true,

    fovHorizontalMm: round(desiredFovX,2),
    fovVerticalMm: round(fovV,2),

    magnification: round(magnification,4),

    maxFrameRate: round(store.maxFps,1),

    spatialResolution: round(mmPerPixel,6),

    motionBlurPixels: motionBlur.blurPixels,

    workingDistanceMm: round(calculatedWd,2),
});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorkingDistanceTarget, desiredFovX, store.focalLength, store.sensorWidth, store.sensorHeight, store.maxFps, motionBlur.blurPixels]);

  // Modo: calcular Focal Length a partir de Working Distance + FOV deseado
  useEffect(() => {
    if (!isFocalLengthTarget) return;
    if (store.sensorWidth <= 0 || store.workingDistance <= 0 || desiredFovX <= 0) return;
    const calculatedFocal = (store.sensorWidth * store.workingDistance) / desiredFovX;
    const fovV = (store.sensorHeight / calculatedFocal) * store.workingDistance;
    const magnification =
    store.sensorWidth / desiredFovX;

const mmPerPixel =
    desiredFovX / store.resolution_h;
    store.setFocalLength(round(calculatedFocal, 2));
store.setResults({

    success:true,

    fovHorizontalMm: round(desiredFovX,2),

    fovVerticalMm: round(fovV,2),

    magnification: round(magnification,4),

    maxFrameRate: round(store.maxFps,1),

    spatialResolution: round(mmPerPixel,6),

    motionBlurPixels: motionBlur.blurPixels,

    focalLengthMm: round(calculatedFocal,2),

});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocalLengthTarget, desiredFovX, store.workingDistance, store.sensorWidth, store.sensorHeight, store.maxFps, motionBlur.blurPixels]);

  // Círculo de confusión: lo fija el Tipo de Inspección global (mismo preset 0.5/1/2px que el
  // umbral de motion blur). Con "No definida" queda en edición libre (mm a mano)
  useEffect(() => {
    if (inspectionType === 'undefined') return;
    const multiplier = INSPECTION_BLUR_THRESHOLDS[inspectionType];
    store.setCircleOfConfusion(round((multiplier * store.pixelSize) / 1000, 5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionType, store.pixelSize]);

  // Cámara lineal: convierte Max Hz (líneas/s) a FPS de imagen real usando las líneas/imagen —
  // el resto del pipeline (motionCalc, fpsExceedsCamera, etc.) sigue leyendo store.maxFps sin cambios
  useEffect(() => {
    if (cameraKind !== 'lineal') return;
    const effectiveFps = lineRateHz > 0 && linesPerImage > 0 ? lineRateHz / linesPerImage : 0;
    store.setMaxFps(round(effectiveFps, 3));
    if (effectiveFps > 0) store.setReadout(round(1000 / effectiveFps, 3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraKind, lineRateHz, linesPerImage]);

  // DOF: puramente derivado de focal/WD/apertura actuales (el hiperfocal se sigue calculando
  // internamente porque near/far dependen de él, pero ya no se muestra)
  const dofResults = useMemo(() => {
    if (store.focalLength <= 0 || store.fNumber <= 0 || store.circleOfConfusion <= 0 || store.workingDistance <= 0) return null;
    return calculateDepthOfField({
      focalLengthMm: store.focalLength,
      workingDistanceMm: store.workingDistance,
      fNumberAperture: store.fNumber,
      circleOfConfusionMm: store.circleOfConfusion,
      minimumFocusDistanceMm: store.minimumFocusDistance,
    });
  }, [store.focalLength, store.workingDistance, store.fNumber, store.circleOfConfusion, store.minimumFocusDistance]);

  // ===== Motion Blur & Frame Rate: 4 campos interdependientes (FPS/Exposición/Velocidad/Fotos-mm) =====
  // Regla: FPS y Exposición están ligados por el Readout fijo de la cámara; Velocidad y Fotos/mm
  // están ligados por el FPS. En cada modo, el campo objetivo (y su pareja) quedan bloqueados.
  const motionCalc = useMemo(() => {
    const readout = store.readout;
    if (motionTarget === 'fps') {
      const fps = store.exposure > 0 ? Math.min(1000 / (store.exposure + readout), store.maxFps > 0 ? store.maxFps : Infinity) : 0;
      const fotosPerMm = store.velocity > 0 && fps > 0 ? fps / store.velocity : 0;
      return { fps, exposure: store.exposure, velocity: store.velocity, fotosPerMm };
    }
    if (motionTarget === 'velocity') {
      const velocity = fotosPerMmDeseado > 0 && fpsDeseado > 0 ? fpsDeseado / fotosPerMmDeseado : 0;
      const exposure = fpsDeseado > 0 ? Math.max(0, 1000 / fpsDeseado - readout) : 0;
      return { fps: fpsDeseado, exposure, velocity, fotosPerMm: fotosPerMmDeseado };
    }
    if (motionTarget === 'fotosPerMm') {
      const fotosPerMm = store.velocity > 0 && fpsDeseado > 0 ? fpsDeseado / store.velocity : 0;
      const exposure = fpsDeseado > 0 ? Math.max(0, 1000 / fpsDeseado - readout) : 0;
      return { fps: fpsDeseado, exposure, velocity: store.velocity, fotosPerMm };
    }
    // 'exposure' (por defecto): dado el FPS deseado, calcula la exposición máxima
    const exposure = fpsDeseado > 0 ? Math.max(0, 1000 / fpsDeseado - readout) : 0;
    const fotosPerMm = store.velocity > 0 && fpsDeseado > 0 ? fpsDeseado / store.velocity : 0;
    return { fps: fpsDeseado, exposure, velocity: store.velocity, fotosPerMm };
  }, [motionTarget, store.exposure, store.velocity, store.maxFps, store.readout, fpsDeseado, fotosPerMmDeseado]);

  // Sincroniza en el store lo que en cada modo sea "salida" (para que PDF/diagnóstico/comparador lo vean)
  useEffect(() => {
    if (motionTarget === 'fps') return; // aquí la exposición es la entrada libre
    store.setExposure(round(motionCalc.exposure, 3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionTarget, motionCalc.exposure]);
  useEffect(() => {
    if (motionTarget !== 'velocity') return; // solo en este modo la velocidad es la salida
    store.setVelocity(round(motionCalc.velocity, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionTarget, motionCalc.velocity]);

  const fpsFieldDisabled = motionTarget === 'fps';
  const fpsFieldValue = fpsFieldDisabled ? motionCalc.fps : fpsDeseado;
  const exposureFieldDisabled = motionTarget !== 'fps';
  const velocityFieldDisabled = motionTarget === 'velocity';
  const fotosPerMmFieldDisabled = motionTarget !== 'velocity';
  const fotosPerMmFieldValue = fotosPerMmFieldDisabled ? motionCalc.fotosPerMm : fotosPerMmDeseado;

  const fpsExceedsCamera = store.maxFps > 0 && fpsFieldValue > store.maxFps;

  // Calidad de motion blur según el tipo de inspección elegido (si hay uno definido)
  const inspectionCheck =
    inspectionType !== 'undefined' && motionBlur.blurPixels !== undefined
      ? motionBlur.blurPixels <= INSPECTION_BLUR_THRESHOLDS[inspectionType]
      : null;

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

  const handleGenerateDiagnostic = () => {
    if (!store.results) return;
    store.addToHistory({
      created_at: new Date().toISOString(),
      tab: 'Calculadora',
      target_calculation: isFieldOfViewTarget ? 'Field of View' : isWorkingDistanceTarget ? 'Working Distance' : 'Focal Length',
      camera_model: store.camera?.display_name,
      lens_model: store.lens?.display_name,
      sensor_format: sensorFormat,
      sensor_width_mm: store.sensorWidth,
      sensor_height_mm: store.sensorHeight,
      pixel_size_um: store.pixelSize,
      resolution_h: store.resolution_h,
      resolution_v: store.resolution_v,
      exposure_ms: store.exposure,
      readout_ms: store.readout,
      velocity_mm_s: store.velocity,
      focal_length_mm: store.focalLength,
      working_distance_mm: store.workingDistance,
      result_fov_horizontal: store.results.fovHorizontalMm,
      result_fov_vertical: store.results.fovVerticalMm,
      result_magnification: store.results.magnification,
      result_max_fps: store.maxFps,
      result_spatial_resolution_um:store.results?.spatialResolution,
      result_motion_blur_px: motionBlur.blurPixels,
      result_motion_blur_quality: motionBlur.qualityIndicator ? MOTION_BLUR_QUALITY_LABELS[motionBlur.qualityIndicator] : undefined,
      f_number: store.fNumber,
      circle_of_confusion_mm: store.circleOfConfusion,
      circle_of_confusion_mode: inspectionType === 'undefined' ? 'Personalizado' : `${INSPECTION_BLUR_THRESHOLDS[inspectionType]} px`,
      minimum_focus_distance_mm: store.minimumFocusDistance,
      result_dof_near_mm: dofResults?.nearLimit,
      result_dof_far_mm: dofResults?.farLimit === Infinity ? undefined : dofResults?.farLimit,
      result_dof_total_mm: dofResults?.totalDepthOfField === Infinity ? undefined : dofResults?.totalDepthOfField,
      motion_target: motionTarget,
      fps_deseado: fpsFieldValue,
      fotos_per_mm: fotosPerMmFieldValue,
      inspection_type: INSPECTION_TYPE_LABELS[inspectionType],
      camera_kind: cameraKind,
      line_rate_hz: cameraKind === 'lineal' ? lineRateHz : undefined,
      lines_per_image: cameraKind === 'lineal' ? linesPerImage : undefined,
      summary: `FOV ${store.results.fovHorizontalMm}×${store.results.fovVerticalMm}mm · f/${store.fNumber} · ${fpsFieldValue.toFixed(1)}fps`,
    });
    setDiagnosticMsg('✓ Diagnóstico generado — revísalo en la pestaña Diagnóstico');
    setTimeout(() => setDiagnosticMsg(''), 4000);
  };

  const handleExportPdf = () => {
    if (!store.results) return;
    openPrintableReport('Informe de Cálculo Óptico', [
      {
        title: 'Equipo',
        rows: [
          { label: 'Cámara', value: store.camera?.display_name || 'Personalizada' },
          { label: 'Lente', value: store.lens?.display_name || 'Personalizada' },
        ],
      },
      {
        title: 'Sensor',
        rows: [
          { label: 'Formato', value: sensorFormat || 'Personalizado (por resolución)' },
          { label: 'Ancho', value: `${store.sensorWidth.toFixed(2)} mm` },
          { label: 'Alto', value: `${store.sensorHeight.toFixed(2)} mm` },
          { label: 'Tamaño de píxel', value: `${store.pixelSize.toFixed(2)} µm` },
          { label: 'Resolución', value: `${store.resolution_h} × ${store.resolution_v} px` },
        ],
      },
      {
        title: 'Parámetros ópticos',
        rows: [
          { label: 'Qué se calculó', value: isFieldOfViewTarget ? 'Field of View' : isWorkingDistanceTarget ? 'Working Distance' : 'Focal Length' },
          { label: 'Focal Length', value: `${store.focalLength.toFixed(2)} mm` },
          { label: 'Working Distance', value: `${convertFromMm(store.workingDistance, unit).toFixed(2)} ${unit}` },
        ],
      },
      {
        title: 'Profundidad de campo (DOF)',
        rows: dofResults
          ? [
              { label: 'Apertura', value: `f/${store.fNumber.toFixed(1)}` },
              { label: 'Círculo de confusión', value: `${store.circleOfConfusion.toFixed(4)} mm (${inspectionType === 'undefined' ? 'personalizado' : `${INSPECTION_BLUR_THRESHOLDS[inspectionType]} px`})` },
              { label: 'Límite cercano', value: `${dofResults.nearLimit?.toFixed(1)} mm` },
              { label: 'Límite lejano', value: dofResults.farLimit === Infinity ? '∞' : `${dofResults.farLimit?.toFixed(1)} mm` },
              { label: 'DOF total', value: dofResults.totalDepthOfField === Infinity ? '∞' : `${dofResults.totalDepthOfField?.toFixed(2)} mm` },
            ]
          : [{ label: 'DOF', value: 'No calculado' }],
      },
      {
        title: 'Motion Blur y Frame Rate',
        rows: [
          { label: 'Tipo de cámara', value: cameraKind === 'lineal' ? 'Lineal (line-scan)' : 'Matricial (área)' },
          ...(cameraKind === 'lineal'
            ? [{ label: 'Max Hz / Líneas por imagen', value: `${lineRateHz.toFixed(0)} Hz / ${linesPerImage} líneas → ${store.maxFps.toFixed(2)} fps equiv.` }]
            : [{ label: 'Max FPS (cámara)', value: `${store.maxFps.toFixed(1)} fps` }]),
          { label: 'Readout (cámara)', value: `${store.readout.toFixed(2)} ms` },
          { label: 'Qué se calculó', value: motionTarget === 'exposure' ? 'Exposición máxima' : motionTarget === 'fps' ? 'FPS máximo' : motionTarget === 'velocity' ? 'Velocidad máxima' : 'Fotos/mm' },
          { label: 'FPS deseado', value: `${fpsFieldValue.toFixed(1)} fps` },
          { label: 'Exposición', value: `${store.exposure.toFixed(2)} ms` },
          { label: 'Velocidad', value: `${store.velocity.toFixed(0)} mm/s` },
          { label: 'Fotos/mm', value: `${fotosPerMmFieldValue.toFixed(3)}` },
          { label: 'Motion Blur', value: `${motionBlur.blurPixels?.toFixed(2)} px (${motionBlur.qualityIndicator ? MOTION_BLUR_QUALITY_LABELS[motionBlur.qualityIndicator] : '—'})` },
          { label: 'Tipo de inspección', value: INSPECTION_TYPE_LABELS[inspectionType] },
        ],
      },
      {
        title: 'Resultados',
        rows: [
          { label: 'FOV Horizontal', value: `${store.results.fovHorizontalMm?.toFixed(2)} mm` },
          { label: 'FOV Vertical', value: `${store.results.fovVerticalMm?.toFixed(2)} mm` },
          { label: 'Magnificación', value: `×${store.results.magnification?.toFixed(4)}` },
        ],
      },
    ]);
  };

  const handleSaveSet = () => {
    if (!store.results || !setName.trim()) return;
    dataStore.saveSet({
      name: setName.trim(),
      params: {
        sensorWidth: store.sensorWidth,
        sensorHeight: store.sensorHeight,
        pixelSize: store.pixelSize,
        resolutionH: store.resolution_h,
        resolutionV: store.resolution_v,
        focalLength: store.focalLength,
        workingDistance: store.workingDistance,
        exposure: store.exposure,
        readout: store.readout,
        velocity: store.velocity,
        maxFps: store.maxFps,
        fNumber: store.fNumber,
        circleOfConfusion: store.circleOfConfusion,
        minimumFocusDistance: store.minimumFocusDistance,
      },
      results: store.results,
    });
    setSetName('');
  };

  const handleLoadSet = (saved: SavedSet) => {
    store.setSensorWidth(saved.params.sensorWidth);
    store.setSensorHeight(saved.params.sensorHeight);
    store.setPixelSize(saved.params.pixelSize);
    store.setResolutionH(saved.params.resolutionH);
    store.setResolutionV(saved.params.resolutionV);
    store.setFocalLength(saved.params.focalLength);
    store.setWorkingDistance(saved.params.workingDistance);
    store.setExposure(saved.params.exposure);
    if (saved.params.maxFps) store.setMaxFps(saved.params.maxFps);
    if (saved.params.readout) store.setReadout(saved.params.readout);
    if (saved.params.fNumber) store.setFNumber(saved.params.fNumber);
    if (saved.params.circleOfConfusion) {
      // 'undefined' deja el CoC en edición libre — un set guardado trae un valor exacto en mm,
      // no necesariamente uno de los 3 presets de tipo de inspección
      setInspectionType('undefined');
      store.setCircleOfConfusion(saved.params.circleOfConfusion);
    }
    if (saved.params.minimumFocusDistance) store.setMinimumFocusDistance(saved.params.minimumFocusDistance);
    store.setVelocity(saved.params.velocity);
    store.setResults(saved.results);
  };


return (
<>
    <div className="flex flex-col gap-2 lg:h-full lg:overflow-hidden">
      {/* TIPO DE INSPECCIÓN: al inicio de todo — fija a la vez el Círculo de Confusión (DOF) y el umbral de Motion Blur */}
      <Card title="Tipo de Inspección" icon="🎯" className="p-2 flex-shrink-0">
        <p className="text-xs text-slate-400 mb-1">Define primero la exigencia de la aplicación: fija a la vez el círculo de confusión (DOF) y el umbral de motion blur aceptable, más abajo.</p>
        <select
          value={inspectionType}
          onChange={(e) => setInspectionType(e.target.value as InspectionType)}
          className="w-full px-2 py-1 text-sm bg-slate-700 text-amber-300 rounded border border-amber-700/50 focus:border-amber-500 focus:outline-none"
        >
          <option value="undefined">{INSPECTION_TYPE_LABELS.undefined}</option>
          <option value="metrology">{INSPECTION_TYPE_LABELS.metrology} (CoC 0.5px · blur ≤ 0.5px)</option>
          <option value="dimensional">{INSPECTION_TYPE_LABELS.dimensional} (CoC 1px · blur ≤ 1px)</option>
          <option value="presence">{INSPECTION_TYPE_LABELS.presence} (CoC 2px · blur ≤ 2px)</option>
        </select>
      </Card>

    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 lg:flex-1 lg:overflow-hidden">
                {/* LEFT PANEL - INPUTS */}
                <div className="lg:col-span-3 flex flex-col lg:h-full lg:overflow-hidden">
                <div className="space-y-2 lg:flex-1 lg:overflow-y-auto lg:pr-2">
                  {/* SENSOR SECTION */}
                  <Card title="Sensor" icon="📊" className="p-2">
                    <div className="flex gap-2 mb-2">
              <button
                  onClick={()=>setCameraDialog(true)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 rounded px-3 py-2 text-left"
              >
                  {store.camera?.display_name
                      ? `📷 ${store.camera.display_name}`
                      : 'Seleccionar cámara'}
              </button>
            <button
              onClick={() => setRequestDialogType('camera')}
              title="Solicitar añadir una cámara al catálogo"
              className="px-2 py-1 bg-slate-700 hover:bg-amber-600 text-white rounded text-xs transition flex-shrink-0"
            >
              ➕ Solicitar
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <FormInput
              label="Formato"
              type="select"
              value={sensorFormat === '' && store.sensorWidth > 0 && store.sensorHeight > 0 ? CUSTOM_FORMAT_VALUE : sensorFormat}
              onChange={handleSensorFormatChange}
              options={[
                ...Object.keys(SENSOR_FORMATS).map((k) => ({ value: k, label: k })),
                ...(sensorFormat === '' && store.sensorWidth > 0 && store.sensorHeight > 0
                  ? [{ value: CUSTOM_FORMAT_VALUE, label: `Personalizado (${store.sensorWidth.toFixed(2)}×${store.sensorHeight.toFixed(2)}mm)` }]
                  : []),
              ]}
              tooltip="Se detecta solo a partir de Res H/Res V/Píxel (compara el Ancho/Alto calculado con los tamaños físicos estándar). Si no coincide con ninguno, muestra el tamaño real — muchos sensores modernos no son 4:3 y no tienen una designación en pulgadas exacta"
            />
            <FormInput
              label="Ancho"
              type="number"
              value={store.sensorWidth}
              onChange={() => {}}
              disabled
              unit="mm"
              tooltip="Se calcula solo a partir de Res H y Píxel. No hace falta editarlo directamente"
              onLabelClick={() => handleLabelClick('sensorWidth')}
              highlighted={isHighlighted('sensorWidth')}
            />
            <FormInput
              label="Alto"
              type="number"
              value={store.sensorHeight}
              onChange={() => {}}
              disabled
              unit="mm"
              tooltip="Se calcula solo a partir de Res V y Píxel. No hace falta editarlo directamente"
              onLabelClick={() => handleLabelClick('sensorHeight')}
              highlighted={isHighlighted('sensorHeight')}
            />
            <FormInput
              label="Píxel"
              type="number"
              value={store.pixelSize}
              onChange={(v) => {
                const newPixel = typeof v === 'string' ? parseFloat(v) : v;
                deselectCamera();
                store.setPixelSize(newPixel);
                recalcSensorFromResolution(newPixel, store.resolution_h, store.resolution_v);
              }}
              unit="µm"
              step="0.1"
              min={0.1}
              disabled={isCameraLocked}
              tooltip={isCameraLocked ? '❌ Viene de la cámara seleccionada — elige "Sin cámara" para editarlo' : 'Tamaño de cada píxel. Recalcula Ancho y Alto automáticamente'}
              highlighted={isHighlighted('pixelSize')}
            />
            <FormInput
              label="Res H"
              type="number"
              value={store.resolution_h}
              onChange={(v) => {
                deselectCamera();
                const newResH = typeof v === 'string' ? parseInt(v) : v;
                store.setResolutionH(newResH);
                recalcSensorFromResolution(store.pixelSize, newResH, store.resolution_v);
              }}
              unit="px"
              min={1}
              disabled={isCameraLocked}
              tooltip={isCameraLocked ? '❌ Viene de la cámara seleccionada — elige "Sin cámara" para editarlo' : 'Resolución horizontal. Junto al Píxel, calcula el Ancho del sensor automáticamente'}
              highlighted={isHighlighted('resolutionH')}
            />
            <FormInput
              label="Res V"
              type="number"
              value={store.resolution_v}
              onChange={(v) => {
                deselectCamera();
                const newResV = typeof v === 'string' ? parseInt(v) : v;
                store.setResolutionV(newResV);
                recalcSensorFromResolution(store.pixelSize, store.resolution_h, newResV);
              }}
              unit="px"
              min={1}
              disabled={isCameraLocked}
              tooltip={isCameraLocked ? '❌ Viene de la cámara seleccionada — elige "Sin cámara" para editarlo' : 'Resolución vertical. Junto al Píxel, calcula el Alto del sensor automáticamente'}
              highlighted={isHighlighted('resolutionV')}
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
              tooltip="Unidades para Working Distance"
            />

            <FormInput
              label="Focal Length"
              type="number"
              value={store.focalLength}
              onChange={(v) => {
                if (selectedLensId) { setSelectedLensId(''); store.setLens(null); }
                store.setFocalLength(typeof v === 'string' ? parseFloat(v) : v);
              }}
              unit="mm"
              step="0.1"
              min={0.1}
              disabled={isFocalLengthTarget || isLensLocked}
              tooltip={isFocalLengthTarget ? '❌ Se calcula automáticamente' : isLensLocked ? '❌ Viene del lente seleccionado — elige "Sin lente" para editarlo' : 'Distancia focal del lente en mm'}
              onLabelClick={isFocalLengthTarget ? () => handleLabelClick('focalLength') : undefined}
              highlighted={isHighlighted('focalLength')}
            />
            <FormInput
              label="Working Distance"
              type="number"
              value={convertFromMm(store.workingDistance, unit)}
              onChange={(v) => {
                const mmValue = convertToMm(typeof v === 'string' ? parseFloat(v) : v, unit);
                store.setWorkingDistance(mmValue);
              }}
              unit={unit}
              step="1"
              min={0.1}
              disabled={isWorkingDistanceTarget}
              tooltip={isWorkingDistanceTarget ? '❌ Se calcula automáticamente' : 'Distancia del lente al objeto'}
              onLabelClick={isWorkingDistanceTarget ? () => handleLabelClick('workingDistance') : undefined}
              highlighted={isHighlighted('workingDistance')}
            />
            <FormInput
              label="FOV Deseado X"
              type="number"
              value={isFieldOfViewTarget ? (store.results?.fovHorizontalMm ?? 0) : desiredFovX}
              onChange={handleDesiredFovXChange}
              disabled={isFieldOfViewTarget}
              unit="mm"
              step="1"
              min={0.1}
              tooltip={isFieldOfViewTarget ? '❌ Es el resultado calculado (FOV H)' : 'FOV horizontal deseado. Ajusta Y automáticamente según la relación de aspecto del sensor'}
              highlighted={isHighlighted('desiredFovX')}
            />
            <FormInput
              label="FOV Deseado Y"
              type="number"
              value={isFieldOfViewTarget ? (store.results?.fovVerticalMm ?? 0) : desiredFovY}
              onChange={handleDesiredFovYChange}
              disabled={isFieldOfViewTarget}
              unit="mm"
              step="1"
              min={0.1}
              tooltip={isFieldOfViewTarget ? '❌ Es el resultado calculado (FOV V)' : 'FOV vertical deseado. Ajusta X automáticamente según la relación de aspecto del sensor'}
              onLabelClick={() => handleLabelClick('desiredFovY')}
              highlighted={isHighlighted('desiredFovY') || isHighlighted('sensorWidth') || isHighlighted('sensorHeight')}
            />
          </div>

          <div className="mt-2 text-xs text-slate-400">
            <p>Fórmula base: <span className="text-amber-300">FOV = (W/f) × WD</span></p>
            {isWorkingDistanceTarget && (
              <p className="text-green-300">Calculando en vivo: <span className="font-bold">WD = (FOV × f) / W</span></p>
            )}
            {isFocalLengthTarget && (
              <p className="text-green-300">Calculando en vivo: <span className="font-bold">f = (W × WD) / FOV</span></p>
            )}
          </div>
        </Card>

        {/* DEPTH OF FIELD */}
        <Card title="Profundidad de Campo (DOF)" icon="📐" className="p-2">
        <div className="flex gap-2 mb-2">
          <button
              onClick={() => setLensDialog(true)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 rounded px-3 py-2 text-left"
          >
              {store.lens?.display_name
                  ? `🔭 ${store.lens.display_name}`
                  : 'Seleccionar lente'}
          </button>
          <button
            onClick={() => setRequestDialogType('lens')}
            title="Solicitar añadir un lente al catálogo"
            className="px-2 py-1 bg-slate-700 hover:bg-amber-600 text-white rounded text-xs transition flex-shrink-0"
          >
            ➕ Solicitar
          </button>
        </div>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Número f"
              type="number"
              value={store.fNumber}
              onChange={(v) => store.setFNumber(typeof v === 'string' ? parseFloat(v) : v)}
              step="0.1"
              min={0.1}
              tooltip="f-number de la lente (apertura)"
              highlighted={isHighlighted('fNumber')}
            />
            <div>
              <label className="text-xs font-semibold text-slate-300">Círculo de confusión</label>
              <div className="mt-1 px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded border border-slate-600" title="Lo fija el Tipo de Inspección, arriba del todo">
                {INSPECTION_TYPE_LABELS[inspectionType]}
              </div>
            </div>
            {inspectionType === 'undefined' ? (
              <div className="col-span-2">
                <FormInput
                  label="CoC personalizado"
                  type="number"
                  value={store.circleOfConfusion}
                  onChange={(v) => store.setCircleOfConfusion(typeof v === 'string' ? parseFloat(v) : v)}
                  unit="mm"
                  step="0.001"
                  min={0.001}
                  tooltip="Círculo de confusión máximo aceptable, en mm. Elige un tipo de inspección arriba para usar un preset en su lugar"
                  highlighted={isHighlighted('circleOfConfusion')}
                />
              </div>
            ) : (
              <div className={`col-span-2 text-xs text-slate-400 bg-slate-700 px-2 py-1.5 rounded ${isHighlighted('circleOfConfusion') ? 'ring-2 ring-amber-400' : ''}`}>
                CoC = {INSPECTION_BLUR_THRESHOLDS[inspectionType]} × {store.pixelSize > 0 ? `${store.pixelSize}µm` : 'píxel'} = <span className="text-amber-400 font-bold">{store.circleOfConfusion > 0 ? store.circleOfConfusion.toFixed(4) : '—'} mm</span>
              </div>
            )}
            <div className="col-span-2">
              <FormInput
                label="Distancia mínima de enfoque"
                type="number"
                value={store.minimumFocusDistance}
                onChange={(v) => store.setMinimumFocusDistance(typeof v === 'string' ? parseFloat(v) : v)}
                unit="mm"
                step="0.01"
                min={0.01}
                highlighted={isHighlighted('minimumFocusDistance')}
              />
            </div>
          </div>
        </Card>

        {/* MOTION BLUR & FRAME RATE */}
        <Card title="Motion Blur y Frame Rate" icon="⚡" className="p-2">
          <div className="mb-2">
            <label className="text-xs font-semibold text-slate-300">Tipo de cámara</label>
            <select
              value={cameraKind}
              onChange={(e) => { setCameraKind(e.target.value as 'matricial' | 'lineal'); deselectCamera(); }}
              className="w-full mt-1 px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
            >
              <option value="matricial">Matricial (área) — Max FPS</option>
              <option value="lineal">Lineal (line-scan) — Max Hz + líneas/imagen</option>
            </select>
          </div>
          <p className="text-xs text-slate-400 mb-2">Límites de la cámara (fijos, editables o desde el catálogo):</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {cameraKind === 'matricial' ? (
              <div className="col-span-2">
                <FormInput
                  label="Max FPS"
                  type="number"
                  value={store.maxFps}
                  onChange={(v) => {
                    deselectCamera();
                    const newMaxFps = typeof v === 'string' ? parseFloat(v) : v;
                    store.setMaxFps(newMaxFps);
                    if (newMaxFps > 0) store.setReadout(round(1000 / newMaxFps, 3));
                  }}
                  unit="fps"
                  step="1"
                  min={0.1}
                  disabled={isCameraLocked}
                  tooltip={isCameraLocked ? '❌ Viene de la cámara seleccionada — elige "Sin cámara" para editarlo' : 'FPS máximo de la cámara: imágenes completas por segundo. Recalcula el Readout por defecto (1000/MaxFPS)'}
                  highlighted={isHighlighted('maxFps')}
                />
              </div>
            ) : (
              <>
                <FormInput
                  label="Max Hz (líneas/s)"
                  type="number"
                  value={lineRateHz}
                  onChange={(v) => { deselectCamera(); setLineRateHz(typeof v === 'string' ? parseFloat(v) : v); }}
                  unit="Hz"
                  step="100"
                  min={1}
                  tooltip="Tasa de línea máxima del sensor lineal (líneas escaneadas por segundo) — NO es el FPS de imagen: una cámara lineal no captura imágenes completas de golpe"
                />
                <FormInput
                  label="Líneas por imagen"
                  type="number"
                  value={linesPerImage}
                  onChange={(v) => setLinesPerImage(typeof v === 'string' ? parseFloat(v) : v)}
                  unit="líneas"
                  step="1"
                  min={1}
                  tooltip="Cuántas líneas escaneadas componen una imagen completa del objeto (según su longitud en la dirección de avance y la resolución de escaneo)"
                />
                <div className={`col-span-2 text-xs text-slate-400 bg-slate-700 px-2 py-1.5 rounded ${isHighlighted('maxFps') ? 'ring-2 ring-amber-400' : ''}`}>
                  <button type="button" onClick={() => handleLabelClick('maxFps')} className="hover:text-amber-300 underline decoration-dotted underline-offset-2">FPS equivalente</button>
                  {' = '}{lineRateHz > 0 ? lineRateHz : '—'} / {linesPerImage > 0 ? linesPerImage : '—'} = <span className="text-amber-400 font-bold">{store.maxFps > 0 ? store.maxFps.toFixed(2) : '—'} fps</span>
                </div>
              </>
            )}
            <div className="col-span-2">
              <FormInput
                label="Readout (fijo de la cámara)"
                type="number"
                value={store.readout}
                onChange={(v) => { deselectCamera(); store.setReadout(typeof v === 'string' ? parseFloat(v) : v); }}
                unit="ms"
                step="0.1"
                min={0}
                disabled={isCameraLocked}
                tooltip={isCameraLocked ? '❌ Viene de la cámara seleccionada — elige "Sin cámara" para editarlo' : 'Tiempo de lectura del sensor. Se rellena solo al elegir cámara del catálogo, o se estima como 1000/MaxFPS — sobrescríbelo si tienes un dato más preciso del datasheet'}
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="text-xs font-semibold text-slate-300">¿Qué calcular?</label>
            <select
              value={motionTarget}
              onChange={(e) => setMotionTarget(e.target.value as any)}
              className="w-full mt-1 px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
            >
              <option value="exposure">Calcular: Exposición máxima</option>
              <option value="fps">Calcular: FPS máximo</option>
              <option value="velocity">Calcular: Velocidad máxima</option>
              <option value="fotosPerMm">Calcular: Fotos/mm</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="FPS Deseado"
              type="number"
              value={fpsFieldValue}
              onChange={(v) => setFpsDeseado(typeof v === 'string' ? parseFloat(v) : v)}
              disabled={fpsFieldDisabled}
              unit="fps"
              step="1"
              min={0.1}
              tooltip={fpsFieldDisabled ? '❌ Se calcula automáticamente' : 'A qué FPS quieres operar (frente al máximo de la cámara)'}
            />
            <FormInput
              label="Exposición"
              type="number"
              value={store.exposure}
              onChange={(v) => store.setExposure(typeof v === 'string' ? parseFloat(v) : v)}
              disabled={exposureFieldDisabled}
              unit="ms"
              step="0.1"
              min={0.01}
              tooltip={exposureFieldDisabled ? '❌ Se calcula automáticamente' : 'Tiempo de exposición'}
              highlighted={isHighlighted('exposure')}
            />
            <FormInput
              label="Velocidad"
              type="number"
              value={store.velocity}
              onChange={(v) => store.setVelocity(typeof v === 'string' ? parseFloat(v) : v)}
              disabled={velocityFieldDisabled}
              unit="mm/s"
              step="10"
              min={0}
              tooltip={velocityFieldDisabled ? '❌ Se calcula automáticamente' : 'Velocidad del objeto'}
              highlighted={isHighlighted('velocity')}
            />
            <FormInput
              label="Fotos/mm"
              type="number"
              value={fotosPerMmFieldValue}
              onChange={(v) => setFotosPerMmDeseado(typeof v === 'string' ? parseFloat(v) : v)}
              disabled={fotosPerMmFieldDisabled}
              step="0.1"
              min={0.01}
              tooltip={fotosPerMmFieldDisabled ? '❌ Se calcula automáticamente' : 'Imágenes capturadas por milímetro de desplazamiento (densidad de muestreo)'}
            />
          </div>

          {fpsExceedsCamera && (
            <p className="text-xs text-red-400 mt-2">⚠️ El FPS deseado ({fpsFieldValue.toFixed(1)}) supera el máximo de la cámara ({store.maxFps.toFixed(1)})</p>
          )}

          <div className="mt-2 space-y-2">
            <div className={`p-2 rounded text-xs flex justify-between items-center ${isHighlighted('motionBlur') ? 'ring-2 ring-amber-400' : ''} ${
              !motionBlur.success ? 'bg-slate-700 border border-slate-600' :
              motionBlur.qualityIndicator === 'excellent' ? 'bg-green-900/30 border border-green-700' :
              motionBlur.qualityIndicator === 'very_good' ? 'bg-lime-900/30 border border-lime-700' :
              motionBlur.qualityIndicator === 'good' ? 'bg-teal-900/30 border border-teal-700' :
              motionBlur.qualityIndicator === 'acceptable' ? 'bg-amber-900/30 border border-amber-700' :
              motionBlur.qualityIndicator === 'degraded' ? 'bg-orange-900/30 border border-orange-700' :
              'bg-red-900/30 border border-red-700'
            }`}>
              <button
                type="button"
                onClick={() => handleLabelClick('motionBlur')}
                className="text-slate-300 hover:text-amber-300 underline decoration-dotted underline-offset-2 text-left"
                title="Ver qué parámetros hacen falta para calcularlo"
              >
                Motion Blur: <span className="font-bold text-white">{motionBlur.success ? `${motionBlur.blurPixels?.toFixed(2)} px` : '—'}</span>
              </button>
              <span className="text-slate-300">
                {motionBlur.success
                  ? (motionBlur.qualityIndicator ? MOTION_BLUR_QUALITY_LABELS[motionBlur.qualityIndicator] : '')
                  : 'Faltan datos (pincha para ver cuáles)'}
              </span>
            </div>
            {motionBlur.success && inspectionCheck !== null && (
              <p className={`text-xs ${inspectionCheck ? 'text-green-400' : 'text-red-400'}`}>
                {inspectionCheck ? '✅' : '⚠️'} {inspectionCheck ? 'Adecuado' : 'Motion blur alto'} para {INSPECTION_TYPE_LABELS[inspectionType].toLowerCase()}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* ACCIONES: fuera del área con scroll, siempre visibles */}
      <div className="flex-shrink-0 pt-2 space-y-2">
        {diagnosticMsg && (
          <div className="bg-amber-900/30 border border-amber-700 text-amber-200 px-2 py-2 rounded text-xs">
            {diagnosticMsg}
          </div>
        )}
        <button
          onClick={handleGenerateDiagnostic}
          disabled={!store.results}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-2 rounded transition text-sm"
        >
          📝 Generar Diagnóstico
        </button>
      </div>
      </div>

      {/* RIGHT PANEL - RESULTS */}
      <div className="lg:col-span-3 lg:overflow-y-auto">
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
              <button
                onClick={handleExportPdf}
                className="w-full mt-3 px-3 py-1.5 bg-slate-700 hover:bg-amber-600 text-white rounded text-xs font-semibold transition"
              >
                🖨️ Exportar informe a PDF
              </button>
            </Card>
          )}

          {/* OPTICAL RESULTS */}
          <Card title="📊 Resultados Ópticos" icon="✨" className="p-2">
            {store.results ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`${isFieldOfViewTarget ? 'bg-amber-900/50 border-amber-500 border-2' : 'bg-green-900/30 border border-green-700'} p-2 rounded ${isHighlighted('fovH') ? 'ring-2 ring-amber-400' : ''}`}>
                  <button type="button" onClick={() => handleLabelClick('fovH')} className="text-green-300 text-xs hover:text-amber-300 underline decoration-dotted underline-offset-2">FOV H</button>
                  <p className="text-green-400 font-bold text-lg">{store.results.fovHorizontalMm?.toFixed(2)}</p>
                  <p className="text-green-300 text-xs">mm</p>
                </div>
                <div className={`bg-green-900/30 border border-green-700 p-2 rounded ${isHighlighted('fovV') ? 'ring-2 ring-amber-400' : ''}`}>
                  <button type="button" onClick={() => handleLabelClick('fovV')} className="text-green-300 text-xs hover:text-amber-300 underline decoration-dotted underline-offset-2">FOV V</button>
                  <p className="text-green-400 font-bold text-lg">{store.results.fovVerticalMm?.toFixed(2)}</p>
                  <p className="text-green-300 text-xs">mm</p>
                </div>
                <div className={`bg-blue-900/30 border border-blue-700 p-2 rounded ${isHighlighted('magnification') ? 'ring-2 ring-amber-400' : ''}`}>
                  <button type="button" onClick={() => handleLabelClick('magnification')} className="text-blue-300 text-xs hover:text-amber-300 underline decoration-dotted underline-offset-2">Magnification</button>
                  <p className="text-blue-400 font-bold text-lg">×{store.results.magnification?.toFixed(4)}</p>
                </div>
                <div className={`bg-blue-900/30 border border-blue-700 p-2 rounded ${isHighlighted('maxFps') ? 'ring-2 ring-amber-400' : ''}`}>
                  <button type="button" onClick={() => handleLabelClick('maxFps')} className="text-blue-300 text-xs hover:text-amber-300 underline decoration-dotted underline-offset-2">Max FPS</button>
                  <p className="text-blue-400 font-bold text-lg">{store.maxFps?.toFixed(1)}</p>
                </div>
                <div className="bg-purple-900/30 border border-purple-700 p-2 rounded">
                    <p className="text-purple-300 text-xs">Spatial Resolution</p>
                    <p className="text-purple-400 font-bold text-lg">
                      {store.results?.spatialResolution?.toFixed(4)}
                    </p>
                    <p className="text-purple-300 text-xs">mm/px</p>
                  </div>
                <div className={`bg-orange-900/30 border border-orange-700 p-2 rounded ${isHighlighted('motionBlur') ? 'ring-2 ring-amber-400' : ''}`}>
                  <button type="button" onClick={() => handleLabelClick('motionBlur')} className="text-orange-300 text-xs hover:text-amber-300 underline decoration-dotted underline-offset-2">Motion Blur</button>
                  <p className="text-orange-400 font-bold text-lg">{motionBlur.blurPixels?.toFixed(2)}</p>
                  <p className="text-orange-300 text-xs">px · {motionBlur.qualityIndicator ? MOTION_BLUR_QUALITY_LABELS[motionBlur.qualityIndicator] : ''}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-4">
                <p className="text-xs">Completa los parámetros del sensor y la óptica</p>
              </div>
            )}
          </Card>

          {/* DOF RESULTS */}
          <Card title="📐 Resultados DOF" icon="🔎" className="p-2">
            {dofResults ? (
              <div className={`grid grid-cols-3 gap-2 text-xs ${isHighlighted('dof') ? 'ring-2 ring-amber-400 rounded p-1' : ''}`}>
                <div className="bg-blue-900/30 border border-blue-700 p-2 rounded text-center">
                  <button type="button" onClick={() => handleLabelClick('dof')} className="text-blue-300 hover:text-amber-300 underline decoration-dotted underline-offset-2">Límite Cercano</button>
                  <p className="text-blue-400 font-bold">{dofResults.nearLimit?.toFixed(1)}</p>
                  <p className="text-blue-300">mm</p>
                </div>
                <div className="bg-blue-900/30 border border-blue-700 p-2 rounded text-center">
                  <button type="button" onClick={() => handleLabelClick('dof')} className="text-blue-300 hover:text-amber-300 underline decoration-dotted underline-offset-2">Límite Lejano</button>
                  <p className="text-blue-400 font-bold">{dofResults.farLimit === Infinity ? '∞' : dofResults.farLimit?.toFixed(1)}</p>
                  <p className="text-blue-300">mm</p>
                </div>
                <div className="bg-green-900/30 border border-green-700 p-2 rounded text-center">
                  <button type="button" onClick={() => handleLabelClick('dof')} className="text-green-300 hover:text-amber-300 underline decoration-dotted underline-offset-2">DOF Total</button>
                  <p className="text-green-400 font-bold">{dofResults.totalDepthOfField === Infinity ? '∞' : dofResults.totalDepthOfField?.toFixed(2)}</p>
                  <p className="text-green-300">mm</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-2">
                <p className="text-xs">Ajusta apertura y círculo de confusión</p>
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

          {/* SAVED SETS */}
          <Card title="Sets guardados" icon="💾" className="p-2">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Nombre del set"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSet()}
                className="flex-1 min-w-0 px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={handleSaveSet}
                disabled={!store.results || !setName.trim()}
                title={!store.results ? 'Completa los parámetros primero' : 'Guardar la configuración actual'}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded text-xs transition flex-shrink-0"
              >
                Guardar
              </button>
            </div>
            {dataStore.savedSets.length ? (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {dataStore.savedSets.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 bg-slate-700 px-2 py-1 rounded text-xs">
                    <span className="truncate">
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-slate-400"> · f{s.params.focalLength}mm · WD {s.params.workingDistance}mm</span>
                    </span>
                    <span className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleLoadSet(s)} className="px-2 py-0.5 bg-slate-600 hover:bg-amber-600 text-white rounded transition">Cargar</button>
                      <button onClick={() => dataStore.removeSet(s.id)} className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded">✕</button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Guarda un set para reutilizarlo en el Comparador.</p>
            )}
          </Card>
        </div>
      </div>

      {requestDialogType && <RequestDialog initialType={requestDialogType} onClose={() => setRequestDialogType(null)} />}
    </div>
    </div>

    <Dialog
        open={cameraDialog}
        onClose={() => setCameraDialog(false)}
        title="Seleccionar cámara"
    >
        <CameraSelector
            value={selectedCameraId}
            onChange={(id) => {
                handleSelectCamera(id);
                setCameraDialog(false);
            }}
        />
    </Dialog>
    
    <Dialog
    open={lensDialog}
    onClose={() => setLensDialog(false)}
    title="Seleccionar lente"
>
    <LensSelector
        value={selectedLensId}
        onChange={(id) => {
            handleSelectLens(id);
            setLensDialog(false);
        }}
    />
</Dialog>

</>

  );
  
}


