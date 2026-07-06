import {
  LensCalculationRequest,
  OpticalCalculationResult,
  MotionBlurRequest,
  MotionBlurResult,
  DepthOfFieldRequest,
  DepthOfFieldResult,
  CodeReadabilityRequest,
  CodeReadabilityResult
} from './types';

const SENSOR_FORMATS: Record<string, [number, number]> = {
  'custom': [0, 0],
  '1/2.3"': [6.4, 4.8],
  '2/3"': [9.6, 7.2],
  '1"': [12.8, 9.6],
  '1.2"': [15.36, 11.52],
  '4/3"': [18, 13.5],
  'APS-C': [23.6, 15.7],
  'Full Frame': [36, 24],
};

/**
 * FÓRMULAS CORRECTAS - ÓPTICA BÁSICA
 *
 * FOV (Field of View):
 *   FOV_H = (SensorWidth / FocalLength) × WorkingDistance
 *   FOV_V = (SensorHeight / FocalLength) × WorkingDistance
 *
 * Magnification (ampliación):
 *   Mag = FocalLength / WorkingDistance
 *
 * Spatial Resolution (resolución espacial):
 *   SpatialRes_mm = PixelSize_um / 1000
 *
 * Max Frame Rate:
 *   MaxFPS = 1000 / (Exposure + Readout)
 */

export function calculateLensParameters(req: LensCalculationRequest): OpticalCalculationResult {
  try {
    const {
      sensorWidthMm,
      sensorHeightMm,
      pixelSizeUm,
      focalLengthMm,
      workingDistanceMm,
      targetCalculation,
    } = req;

    // Validaciones
    if (sensorWidthMm <= 0 || sensorHeightMm <= 0 || pixelSizeUm <= 0) {
      return { success: false, error: 'Sensor parameters must be positive' };
    }

    let focal = focalLengthMm;
    let wd = workingDistanceMm;
    let fovH: number;
    let fovV: number;

    // FÓRMULA CORRECTA: FOV = (SensorDim / Focal) × WD
    if (targetCalculation === 'fieldOfView') {
      if (focal <= 0) {
        return { success: false, error: 'Focal length must be positive' };
      }
      if (wd <= 0) {
        return { success: false, error: 'Working distance must be positive' };
      }
      // FOV = (SensorDim / Focal) × WorkingDistance
      fovH = (sensorWidthMm / focal) * wd;
      fovV = (sensorHeightMm / focal) * wd;
    } else if (targetCalculation === 'workingDistance') {
      if (focal <= 0) {
        return { success: false, error: 'Focal length must be positive' };
      }
      // Despejando: WD = FOV × Focal / SensorWidth
      // Este cálculo se hace en el componente
      fovH = (sensorWidthMm / focal) * wd;
      fovV = (sensorHeightMm / focal) * wd;
    } else if (targetCalculation === 'focalLength') {
      if (wd <= 0) {
        return { success: false, error: 'Working distance must be positive' };
      }
      // Despejando: f = SensorWidth × WD / FOV_deseado
      // Este cálculo se hace en el componente
      fovH = (sensorWidthMm / focal) * wd;
      fovV = (sensorHeightMm / focal) * wd;
    } else {
      fovH = (sensorWidthMm / focal) * wd;
      fovV = (sensorHeightMm / focal) * wd;
    }

    // Magnification = Focal / WorkingDistance
    const magnification = wd > 0 ? focal / wd : 0;

    // Frame rate máximo = 1000 / (Exposure + Readout)
    const exposure = req.exposureMs || 33;
    const readout = req.readoutMs || 10;
    const maxFrameRate = 1000 / (exposure + readout);

    // Resolución espacial: el tamaño físico de un píxel en mm
    const pixelSizeMm = pixelSizeUm / 1000;

    // Resolución del sensor (en megapixeles aproximado)
    const resolutionH = Math.round((sensorWidthMm / pixelSizeMm) * 100) / 100;
    const resolutionV = Math.round((sensorHeightMm / pixelSizeMm) * 100) / 100;
    const megapixels = (resolutionH * resolutionV) / 1000000;

    return {
      success: true,
      focalLengthMm: round(focal, 3),
      workingDistanceMm: round(wd, 2),
      fovHorizontalMm: round(fovH, 2),
      fovVerticalMm: round(fovV, 2),
      magnification: round(magnification, 4),
      maxFrameRate: round(maxFrameRate, 1),
      pixelHorizontal: round(pixelSizeMm, 4),
      pixelVertical: round(pixelSizeMm, 4),
      megapixels: round(megapixels, 2),
      spatialResolution: pixelSizeMm,
      motionBlurPixels: 0, // Se calcula en calculateMotionBlur
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * MOTION BLUR - Desenfoque por movimiento
 *
 * Fórmula:
 *   VelocityPixelsPerSec = VelocityMm/s / PixelSize_mm
 *   BlurPixels = (VelocityPixelsPerSec × ExposureMs) / 1000
 *
 * Ejemplo:
 *   - Velocidad: 100 mm/s
 *   - Tamaño píxel: 3.5 µm = 0.0035 mm
 *   - Exposición: 10 ms
 *   - VelocityPx/s = 100 / 0.0035 = 28,571 px/s
 *   - Blur = (28,571 × 10) / 1000 = 285.7 píxeles
 */
export function calculateMotionBlur(req: MotionBlurRequest): MotionBlurResult {
  try {
    const { velocityMmPerSec, exposureMs, pixelSizeMm } = req;

    if (pixelSizeMm <= 0) {
      return { success: false, error: 'Pixel size must be positive' };
    }

    if (velocityMmPerSec <= 0) {
      return {
        success: true,
        blurPixels: 0,
        velocityPixelsPerSecond: 0,
        qualityIndicator: 'excellent',
      };
    }

    // Velocidad en píxeles/segundo
    const velocityPixelsPerSec = velocityMmPerSec / pixelSizeMm;

    // Blur en píxeles = (velocidad_px/s × exposición_ms) / 1000
    const blurPixels = (velocityPixelsPerSec * exposureMs) / 1000;

    // Indicador de calidad basado en píxeles de desenfoque
    let qualityIndicator: 'excellent' | 'good' | 'acceptable' | 'poor';
    if (blurPixels < 0.1) qualityIndicator = 'excellent';
    else if (blurPixels < 0.5) qualityIndicator = 'good';
    else if (blurPixels < 1.0) qualityIndicator = 'acceptable';
    else qualityIndicator = 'poor';

    return {
      success: true,
      blurPixels: round(blurPixels, 2),
      velocityPixelsPerSecond: round(velocityPixelsPerSec, 2),
      qualityIndicator,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * DEPTH OF FIELD - Profundidad de campo
 *
 * Fórmula hiperfocal:
 *   H = (f² / (N × c)) + f
 *   donde:
 *     f = focal length (mm)
 *     N = f-number (aperture)
 *     c = circle of confusion (mm)
 *
 * Límites de enfoque:
 *   Near = (H × s) / (H + (s - f))
 *   Far = (H × s) / (H - (s - f))
 *   donde s = subject distance (working distance)
 *
 * DOF Total = Far - Near
 */
export function calculateDepthOfField(req: DepthOfFieldRequest): DepthOfFieldResult {
  try {
    const {
      focalLengthMm,
      workingDistanceMm,
      fNumberAperture,
      circleOfConfusionMm,
      minimumFocusDistanceMm = 0.3,
    } = req;

    if (focalLengthMm <= 0 || fNumberAperture <= 0 || circleOfConfusionMm <= 0) {
      return { success: false, error: 'Parameters must be positive' };
    }

    // Distancia hiperfocal: H = (f²) / (N × c) + f
    const hyperfocal =
      (focalLengthMm * focalLengthMm) / (fNumberAperture * circleOfConfusionMm) +
      focalLengthMm;

    // Límite cercano: N = (H × s) / (H + (s - f))
    const numeratorNear = hyperfocal * workingDistanceMm;
    const denominatorNear = hyperfocal + (workingDistanceMm - focalLengthMm);
    const nearLimit = denominatorNear !== 0 ? numeratorNear / denominatorNear : workingDistanceMm;

    // Límite lejano: F = (H × s) / (H - (s - f))
    const numeratorFar = hyperfocal * workingDistanceMm;
    const denominatorFar = hyperfocal - (workingDistanceMm - focalLengthMm);
    const farLimit = denominatorFar !== 0 ? numeratorFar / denominatorFar : Infinity;

    // Profundidad de campo total
    const totalDoF = isFinite(farLimit) ? farLimit - nearLimit : Infinity;

    // Distancia efectiva mínima de enfoque
    const effectiveMinimumFocus = Math.max(minimumFocusDistanceMm, nearLimit);

    return {
      success: true,
      effectiveMinimumFocusDistance: round(effectiveMinimumFocus, 3),
      nearLimit: round(nearLimit, 2),
      farLimit: isFinite(farLimit) ? round(farLimit, 2) : Infinity,
      totalDepthOfField: isFinite(totalDoF) ? round(totalDoF, 2) : Infinity,
      hyperfocalDistance: round(hyperfocal, 2),
      lensApertureHint: `f/${fNumberAperture.toFixed(1)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * CODE READABILITY - Legibilidad de códigos (Barcode/QR)
 *
 * Estándar AIM/ISO:
 *   PixelsPerModule = TamañoMódulo_mm / mm_per_pixel
 *
 * Veredicto:
 *   - Readable:     PixelsPerModule ≥ Threshold × 2
 *   - Marginal:     PixelsPerModule ≥ Threshold
 *   - Not Readable: PixelsPerModule < Threshold
 */
export function calculateCodeReadability(req: CodeReadabilityRequest): CodeReadabilityResult {
  try {
    const { mmPerPixel, moduleSizeMm, thresholdPixelsPerModule } = req;

    if (mmPerPixel <= 0 || moduleSizeMm <= 0 || thresholdPixelsPerModule <= 0) {
      return { success: false, error: 'Parameters must be positive' };
    }

    // Píxeles por módulo = Tamaño_módulo / mm_per_pixel
    const pixelsPerModule = moduleSizeMm / mmPerPixel;

    // Veredicto según AIM standard
    let verdict: 'readable' | 'marginal' | 'not_readable';
    if (pixelsPerModule >= thresholdPixelsPerModule * 2) {
      verdict = 'readable';
    } else if (pixelsPerModule >= thresholdPixelsPerModule) {
      verdict = 'marginal';
    } else {
      verdict = 'not_readable';
    }

    return {
      success: true,
      pixelsPerModule: round(pixelsPerModule, 2),
      verdict,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Funciones auxiliares
 */

export function getSensorDimensions(format: string): [number, number] {
  return SENSOR_FORMATS[format] || [0, 0];
}

export function round(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function convertLength(value: number, from: 'mm' | 'cm' | 'in', to: 'mm' | 'cm' | 'in'): number {
  // Convertir a mm primero
  let mm = value;
  if (from === 'cm') mm = value * 10;
  if (from === 'in') mm = value * 25.4;

  // Convertir de mm al target
  if (to === 'cm') return mm / 10;
  if (to === 'in') return mm / 25.4;
  return mm;
}

/**
 * Datos para visualización de diagrama óptico
 */
export function prepareOpticalDiagramData(
  sensorWidthMm: number,
  sensorHeightMm: number,
  focalLengthMm: number,
  workingDistanceMm: number,
  fieldOfViewMm: number
) {
  // Auto-scale to fit viewport
  const maxDimension = Math.max(workingDistanceMm, fieldOfViewMm, focalLengthMm);
  const scale = 300 / Math.max(maxDimension, 100);

  return {
    sensorWidthMm,
    sensorHeightMm,
    focalLengthMm,
    workingDistanceMm,
    fieldOfViewMm,
    scale,
    sensorX: 50,
    sensorY: 200,
    lensX: 50 + focalLengthMm * scale,
    lensY: 200,
    objectX: 50 + (workingDistanceMm + focalLengthMm) * scale,
    objectY: 200 - (fieldOfViewMm / 2) * scale,
  };
}
