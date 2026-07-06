import { NextRequest, NextResponse } from 'next/server';

interface CalculationRequest {
  sensorWidthMm: number;
  sensorHeightMm: number;
  pixelSizeUm: number;
  focalLengthMm: number;
  workingDistanceMm: number;
  targetCalculation: 'focalLength' | 'workingDistance' | 'fieldOfView';
  exposureMs?: number;
  readoutMs?: number;
  velocityMmPerSec?: number;
}

interface CalculationResponse {
  success: boolean;
  focalLengthMm?: number;
  workingDistanceMm?: number;
  fovHorizontalMm?: number;
  fovVerticalMm?: number;
  magnification?: number;
  maxFrameRate?: number;
  motionBlurPixels?: number;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CalculationResponse>> {
  try {
    const body: CalculationRequest = await request.json();

    const {
      sensorWidthMm,
      sensorHeightMm,
      pixelSizeUm,
      focalLengthMm,
      workingDistanceMm,
      targetCalculation,
      exposureMs = 33,
      readoutMs = 10,
      velocityMmPerSec = 0
    } = body;

    // Validación
    if (!sensorWidthMm || !sensorHeightMm || !pixelSizeUm) {
      return NextResponse.json(
        { success: false, error: 'Sensor parameters are required' },
        { status: 400 }
      );
    }

    // Cálculos básicos (thin lens formula)
    let focal = focalLengthMm;
    let wd = workingDistanceMm;
    let fovH: number;
    let fovV: number;

    // Usar fórmula de triángulos semejantes: FOV = (SensorDim / FocalLength) * (WorkingDistance + FocalLength)
    if (targetCalculation === 'fieldOfView') {
      fovH = (sensorWidthMm / focal) * (wd + focal);
      fovV = (sensorHeightMm / focal) * (wd + focal);
    } else if (targetCalculation === 'workingDistance') {
      // WD = (SensorWidth * FOV) / (FocalLength * (SensorWidth + FOV))
      // Simplificado: usar valor enviado
      fovH = (sensorWidthMm / focal) * (wd + focal);
      fovV = (sensorHeightMm / focal) * (wd + focal);
    } else {
      // Asumir valores dados
      fovH = (sensorWidthMm / focal) * (wd + focal);
      fovV = (sensorHeightMm / focal) * (wd + focal);
    }

    // Magnificación = SensorWidth / FOV
    const magnification = sensorWidthMm / fovH;

    // Frame rate máximo = 1000 / (Exposure + Readout)
    const maxFrameRate = 1000 / (exposureMs + readoutMs);

    // Motion blur = (Velocity / PixelSize) * Exposure / 1000
    const motionBlurPixels = velocityMmPerSec > 0
      ? (velocityMmPerSec / (pixelSizeUm / 1000)) * exposureMs / 1000
      : 0;

    return NextResponse.json({
      success: true,
      focalLengthMm: focal,
      workingDistanceMm: wd,
      fovHorizontalMm: parseFloat(fovH.toFixed(2)),
      fovVerticalMm: parseFloat(fovV.toFixed(2)),
      magnification: parseFloat(magnification.toFixed(3)),
      maxFrameRate: parseFloat(maxFrameRate.toFixed(1)),
      motionBlurPixels: parseFloat(motionBlurPixels.toFixed(2))
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
