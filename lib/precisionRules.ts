export interface PrecisionRule {
  category: string;
  application: string;
  optics?: string;
  lighting?: string;
  factor?: number;
  display?: string;
  description?: string;
}

export const PRECISION_RULES: PrecisionRule[] = [
  {
    category: "Vision Tools",
    application: "Blob Detection",
    description: "Minimum object size: 5 × 5 pixels",
  },
  {
    category: "Vision Tools",
    application: "Calipers",
    description: "Depends on optics and illumination",
  },
  {
    category: "Vision Tools",
    application: "Histogram",
    description: "Minimum contrast: 20 gray levels",
  },

  {
    category: "Dimensional Inspection",
    application: "Measurement",
    optics: "Standard",
    lighting: "Backlight",
    factor: 1,
    display: "Resolution × 1",
  },
  {
    category: "Dimensional Inspection",
    application: "Measurement",
    optics: "Telecentric",
    lighting: "Backlight",
    factor: 0.5,
    display: "Resolution / 2",
  },
  {
    category: "Dimensional Inspection",
    application: "Measurement",
    optics: "Telecentric",
    lighting: "Collimated Backlight",
    factor: 0.25,
    display: "Resolution / 4",
  },
  {
    category: "Dimensional Inspection",
    application: "Measurement",
    optics: "Telecentric",
    lighting: "Telecentric Backlight",
    factor: 0.125,
    display: "Resolution / 8",
  },
  {
    category: "Dimensional Inspection",
    application: "Measurement",
    optics: "Standard",
    lighting: "Front / Side Light",
    factor: 3,
    display: "Resolution × 3",
  },

  {
    category: "Pick & Place",
    application: "Pattern Matching",
    factor: 3,
    display: "Resolution × 3",
  },

  {
    category: "3D",
    application: "Calipers",
    factor: 1,
    display: "Resolution × 1",
  },
];