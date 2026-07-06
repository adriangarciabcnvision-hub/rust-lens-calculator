import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for database
export interface Camera {
  id: number;
  display_name: string;
  pixel_size_um: number;
  resolution_h: number;
  resolution_v: number;
  sensor_name: string;
  created_at: string;
}

export interface Lens {
  id: number;
  display_name: string;
  focal_length_mm: number;
  min_aperture: number;
  max_aperture: number;
  minimum_focus_distance_mm: number;
  created_at: string;
}

export interface CalculationResult {
  focal_length_mm: number;
  working_distance_mm: number;
  fov_horizontal_mm: number;
  fov_vertical_mm: number;
  magnification: number;
  max_frame_rate: number;
}
