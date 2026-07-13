// Catálogo semilla de cámaras y lentes habituales en visión artificial industrial.
// Specs verificadas en datasheets/distribuidores (Basler, Teledyne FLIR, IDS, Computar,
// Fujinon, Kowa) — ver fuentes citadas en la respuesta que introdujo este archivo.
import { StoredCamera, StoredLens } from './dataStore';

export const COMMON_CAMERAS: Omit<StoredCamera, 'id'>[] = [
  { name: 'Basler acA1300-60gm', sensorWidth: 6.78, sensorHeight: 5.43, pixelSize: 5.3, resolutionH: 1280, resolutionV: 1024, maxFps: 60 },
  { name: 'Basler acA2440-20gm', sensorWidth: 8.45, sensorHeight: 7.07, pixelSize: 3.45, resolutionH: 2448, resolutionV: 2048, maxFps: 20.6 },
  { name: 'Basler ace2 a2A1920-51gmPRO', sensorWidth: 6.6, sensorHeight: 4.1, pixelSize: 3.45, resolutionH: 1920, resolutionV: 1200, maxFps: 51 },
  { name: 'Basler acA4112-8gm', sensorWidth: 14.13, sensorHeight: 10.35, pixelSize: 3.45, resolutionH: 4096, resolutionV: 3000, maxFps: 8.3 },
  { name: 'FLIR Blackfly S BFS-U3-23S3M', sensorWidth: 6.62, sensorHeight: 4.14, pixelSize: 3.45, resolutionH: 1920, resolutionV: 1200, maxFps: 163 },
  { name: 'IDS UI-3080CP-M-GL Rev.2', sensorWidth: 8.47, sensorHeight: 7.09, pixelSize: 3.45, resolutionH: 2456, resolutionV: 2054, maxFps: 86 },
];

export const COMMON_LENSES: Omit<StoredLens, 'id'>[] = [
  { name: 'Computar M0814-MP2', focalLength: 8, aperture: 'f/1.4' },
  { name: 'Kowa LM12JC10M', focalLength: 12, aperture: 'f/1.8' },
  { name: 'Fujinon HF16SA-1', focalLength: 16, aperture: 'f/1.4' },
  { name: 'Computar M2514-MP2', focalLength: 25, aperture: 'f/1.4' },
  { name: 'Fujinon HF35SA-1', focalLength: 35, aperture: 'f/1.4' },
  { name: 'Fujinon HF50SA-1', focalLength: 50, aperture: 'f/1.8' },
];
