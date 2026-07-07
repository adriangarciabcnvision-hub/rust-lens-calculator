import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalculatorState, OpticalCalculationResult, MotionBlurResult, DepthOfFieldResult, CalculationSnapshot } from './types';

export const useCalculatorStore = create<CalculatorState>()(persist((set) => ({
  // Initial state
  camera: null,
  lens: null,
  sensorWidth: 6.4,
  sensorHeight: 4.8,
  pixelSize: 3.5,
  resolution_h: 1920,
  resolution_v: 1440,
  exposure: 33,
  focalLength: 50,
  workingDistance: 1000,
  fov: 0,
  fovIsHorizontal: true,
  velocity: 100,
  readout: 10,

  // DOF specific
  fNumber: 2.8,
  circleOfConfusion: 0.003,
  minimumFocusDistance: 0.3,

  // Results
  results: null,
  motionBlurResults: null,
  dofResults: null,

  // Comparisons
  config1: null,
  config2: null,

  // Calculations log
  calculationHistory: [],

  // Actions
  setCamera: (camera) => set({ camera }),
  setLens: (lens) => set({ lens }),
  setSensorWidth: (sensorWidth) => set({ sensorWidth }),
  setSensorHeight: (sensorHeight) => set({ sensorHeight }),
  setPixelSize: (pixelSize) => set({ pixelSize }),
  setResolutionH: (resolution_h) => set({ resolution_h }),
  setResolutionV: (resolution_v) => set({ resolution_v }),
  setFocalLength: (focalLength) => set({ focalLength }),
  setWorkingDistance: (workingDistance) => set({ workingDistance }),
  setExposure: (exposure) => set({ exposure }),
  setReadout: (readout) => set({ readout }),
  setVelocity: (velocity) => set({ velocity }),
  setFNumber: (fNumber) => set({ fNumber }),
  setCircleOfConfusion: (circleOfConfusion) => set({ circleOfConfusion }),

  setResults: (results: OpticalCalculationResult) => {
    set({ results });
  },

  addToHistory: (snapshot: CalculationSnapshot) => {
    set((state) => ({
      calculationHistory: [snapshot, ...state.calculationHistory].slice(0, 50), // Keep last 50
    }));
  },

  clearHistory: () => {
    set({ calculationHistory: [] });
  },

  resetCalculator: () => {
    set({
      camera: null,
      lens: null,
      sensorWidth: 6.4,
      sensorHeight: 4.8,
      pixelSize: 3.5,
      resolution_h: 1920,
      resolution_v: 1440,
      exposure: 33,
      focalLength: 50,
      workingDistance: 1000,
      fov: 0,
      results: null,
      motionBlurResults: null,
      dofResults: null,
    });
  },
}), {
  name: 'rust-lens-history',
  // Solo el historial de cálculos sobrevive a recargas; el resto vuelve a valores por defecto
  partialize: (state) => ({ calculationHistory: state.calculationHistory } as any),
}));

/**
 * Creamos stores separados para cada funcionalidad
 */

interface DialogState {
  isOpen: boolean;
  type: 'none' | 'import_excel' | 'export_pdf' | 'new_camera' | 'new_lens' | 'manage_preset';
  data?: any;
  open: (type: string, data?: any) => void;
  close: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  isOpen: false,
  type: 'none',
  data: undefined,

  open: (type: string, data?: any) => {
    set({ isOpen: true, type: type as any, data });
  },

  close: () => {
    set({ isOpen: false, type: 'none', data: undefined });
  },
}));

interface ComparisonState {
  config1: any;
  config2: any;
  setConfig1: (config: any) => void;
  setConfig2: (config: any) => void;
  swap: () => void;
  clear: () => void;
}

export const useComparisonStore = create<ComparisonState>((set) => ({
  config1: null,
  config2: null,

  setConfig1: (config) => set({ config1: config }),
  setConfig2: (config) => set({ config2: config }),

  swap: () =>
    set((state) => ({
      config1: state.config2,
      config2: state.config1,
    })),

  clear: () =>
    set({
      config1: null,
      config2: null,
    }),
}));

interface AuthState {
  user: any;
  role: 'admin' | 'team_leader' | 'technician' | 'normal' | null;
  setUser: (user: any, role?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,

  setUser: (user, role = 'normal') => {
    set({ user, role: role as any });
  },

  logout: () => {
    set({ user: null, role: null });
  },
}));
