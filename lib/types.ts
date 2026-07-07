// User & Auth
export type UserRole = 'admin' | 'team_leader' | 'technician' | 'normal';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  created_at: string;
}

// Camera
export interface Camera {
  id: string;
  display_name: string;
  sensor_name: string;
  pixel_size_um: number;
  resolution_h: number;
  resolution_v: number;
  interface: string;
  source_url?: string;
  created_at: string;
}

// Lens
export interface Lens {
  id: string;
  display_name: string;
  focal_length_mm: number;
  min_aperture: number;
  max_aperture: number;
  minimum_focus_distance_mm: number;
  max_sensor_format: string;
  source_url?: string;
  created_at: string;
}

// Sensor Format
export interface SensorFormat {
  id: string;
  name: string;
  width_mm: number;
  height_mm: number;
  is_custom: boolean;
}

// Calculation Snapshot (saved for diagnostics)
export interface CalculationSnapshot {
  id?: string;
  user_id?: string;
  tab?: string;
  summary?: string;
  camera_model?: string;
  lens_model?: string;
  sensor_format?: string;
  sensor_width_mm?: number;
  sensor_height_mm?: number;
  pixel_size_um?: number;
  resolution_h?: number;
  resolution_v?: number;
  exposure_ms?: number;
  focal_length_mm?: number;
  working_distance_mm?: number;
  field_of_view_mm?: number;
  length_unit?: 'mm' | 'cm' | 'in';
  fov_is_horizontal?: boolean;
  result_focal_length?: number;
  result_working_distance?: number;
  result_fov_horizontal?: number;
  result_fov_vertical?: number;
  result_magnification?: number;
  result_max_fps?: number;
  created_at?: string;
}

// Preset
export interface Preset {
  id: string;
  user_id: string;
  name: string;
  camera_model: string;
  lens_model: string;
  sensor_format: string;
  sensor_width_mm: number;
  sensor_height_mm: number;
  pixel_size_um: number;
  resolution_h: number;
  resolution_v: number;
  exposure_ms: number;
  focal_length_mm: number;
  working_distance_mm: number;
  field_of_view_mm: number;
  length_unit: 'mm' | 'cm' | 'in';
  fov_is_horizontal: boolean;
  created_at: string;
  updated_at: string;
}

// Calculation Requests
export interface LensCalculationRequest {
  sensorWidthMm: number;
  sensorHeightMm: number;
  pixelSizeUm: number;
  focalLengthMm: number;
  workingDistanceMm: number;
  targetCalculation: 'focalLength' | 'workingDistance' | 'fieldOfView';
  exposureMs?: number;
  readoutMs?: number;
  velocityMmPerSec?: number;
  fNumberAperture?: number;
  circleOfConfusionMm?: number;
}

export interface MotionBlurRequest {
  velocityMmPerSec: number;
  exposureMs: number;
  pixelSizeMm: number;
}

export interface DepthOfFieldRequest {
  focalLengthMm: number;
  workingDistanceMm: number;
  fNumberAperture: number;
  circleOfConfusionMm: number;
  minimumFocusDistanceMm?: number;
}

export interface CodeReadabilityRequest {
  mmPerPixel: number;
  moduleSizeMm: number;
  thresholdPixelsPerModule: number;
}

// Calculation Results
export interface OpticalCalculationResult {
  success: boolean;
  focalLengthMm?: number;
  workingDistanceMm?: number;
  fovHorizontalMm?: number;
  fovVerticalMm?: number;
  magnification?: number;
  maxFrameRate?: number;
  pixelHorizontal?: number;
  pixelVertical?: number;
  megapixels?: number;
  spatialResolution?: number;
  motionBlurPixels?: number;
  error?: string;
}

export interface MotionBlurResult {
  success: boolean;
  blurPixels?: number;
  velocityPixelsPerSecond?: number;
  qualityIndicator?: 'excellent' | 'good' | 'acceptable' | 'poor';
  error?: string;
}

export interface DepthOfFieldResult {
  success: boolean;
  effectiveMinimumFocusDistance?: number;
  nearLimit?: number;
  farLimit?: number;
  totalDepthOfField?: number;
  hyperfocalDistance?: number;
  lensApertureHint?: string;
  error?: string;
}

export interface CodeReadabilityResult {
  success: boolean;
  pixelsPerModule?: number;
  verdict?: 'readable' | 'marginal' | 'not_readable';
  error?: string;
}

// Optical Diagram
export interface OpticalDiagramData {
  sensorWidthMm: number;
  sensorHeightMm: number;
  focalLengthMm: number;
  workingDistanceMm: number;
  fieldOfViewMm: number;
  scale: number;
  sensorX: number;
  sensorY: number;
  lensX: number;
  lensY: number;
  objectX: number;
  objectY: number;
}

// Comparison
export interface ComparisonConfig {
  id: string;
  cameraModel: string;
  lensModel: string;
  sensorWidth: number;
  sensorHeight: number;
  pixelSize: number;
  focalLength: number;
  workingDistance: number;
  exposure: number;
  results?: OpticalCalculationResult;
}

// Store State (Zustand)
export interface CalculatorState {
  // Current values
  camera: Camera | null;
  lens: Lens | null;
  sensorWidth: number;
  sensorHeight: number;
  pixelSize: number;
  resolution_h: number;
  resolution_v: number;
  exposure: number;
  focalLength: number;
  workingDistance: number;
  fov: number;
  fovIsHorizontal: boolean;
  velocity: number;
  readout: number;

  // DOF specific
  fNumber: number;
  circleOfConfusion: number;
  minimumFocusDistance: number;

  // Results
  results: OpticalCalculationResult | null;
  motionBlurResults: MotionBlurResult | null;
  dofResults: DepthOfFieldResult | null;

  // Comparisons
  config1: ComparisonConfig | null;
  config2: ComparisonConfig | null;

  // Calculations log
  calculationHistory: CalculationSnapshot[];

  // Actions
  setCamera: (camera: Camera | null) => void;
  setLens: (lens: Lens | null) => void;
  setResults: (results: OpticalCalculationResult) => void;
  addToHistory: (snapshot: CalculationSnapshot) => void;
  clearHistory: () => void;
  resetCalculator: () => void;
}

// Dialog / Modal
export interface DialogState {
  type: 'none' | 'import_excel' | 'export_pdf' | 'new_camera' | 'new_lens' | 'manage_preset';
  isOpen: boolean;
  data?: any;
}
