# 🚀 RUST Lens Calculator Pro - Guía de Instalación

## ⚡ Quick Start (5 minutos)

### 1. Requisitos
- Node.js 18+ ([descargar](https://nodejs.org))
- npm o yarn
- Cuenta Supabase (gratis en [supabase.com](https://supabase.com))

### 2. Clonar y instalar

```bash
cd H:\Aplicaciones\Claude\RustLensCalculatorWeb
npm install
```

### 3. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia tu URL y API key:
   - Ve a **Project Settings → API**
   - Copia `Project URL` y `Anon public key`

4. Renombra `.env.local.example` a `.env.local` y agrega:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Ejecutar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📦 Estructura del Proyecto

```
RustLensCalculatorWeb/
├── app/
│   ├── app/
│   │   └── page.tsx           # Página principal con todas las pestañas
│   ├── api/
│   │   ├── lens/calculate/    # API para cálculos ópticos
│   │   ├── dof/calculate/     # API para profundidad de campo
│   │   └── ...
│   ├── layout.tsx
│   ├── page.tsx               # Home
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Card.tsx
│   │   └── FormInput.tsx
│   └── tabs/
│       ├── CalculatorTab.tsx
│       ├── DiagnosticsTab.tsx
│       ├── DepthOfFieldTab.tsx
│       ├── OpticalDiagramTab.tsx
│       ├── FrameRateTab.tsx
│       ├── ComparatorTab.tsx
│       └── CodeReadabilityTab.tsx
├── lib/
│   ├── calculationEngine.ts   # Motor de cálculos (traducido de C#)
│   ├── store.ts               # Estado global (Zustand)
│   ├── supabase.ts            # Cliente Supabase
│   └── types.ts               # TypeScript interfaces
├── public/
├── package.json
└── README.md
```

---

## 🎯 Funcionalidades

### ✅ 7 Pestañas Completas

| Pestaña | Descripción |
|---------|------------|
| 📊 Calculadora | Cálculos ópticos: focal, distancia, FOV |
| 📋 Diagnóstico | Log de todos los cálculos realizados |
| 📐 Profundidad de Campo | DOF, límites cercanos/lejanos, apertura |
| 🔬 Visualización Óptica | Diagrama esquemático del sistema óptico |
| ⚡ Frame Rate & Blur | FPS máximo, motion blur, rendimiento |
| 🔄 Comparador | Comparar 2 configuraciones lado a lado |
| 📖 Lectura de Códigos | Legibilidad de barcode/QR (estándar AIM) |

### 🔧 Características

- ✅ Cálculos ópticos precisos (lente delgada)
- ✅ Motion blur y análisis de rendimiento
- ✅ Profundidad de campo avanzada
- ✅ Diagramas ópticos automáticos
- ✅ Comparación side-by-side
- ✅ Historial de cálculos
- ✅ UI responsiva (mobile, tablet, desktop)
- ✅ Tipo-seguro (TypeScript)

---

## 📊 Fórmulas Utilizadas

### Óptica - Thin Lens Formula
```
FOV = (SensorDim / Focal) * (WD + Focal)
Magnification = SensorWidth / FOV
```

### Motion Blur
```
Blur = (Velocidad / TamañoPíxel) * TiempoExposición / 1000
```

### Profundidad de Campo
```
H = (f² / (N * c)) + f  [Distancia hiperfocal]
Near = (H * s) / (H + (s - f))
Far = (H * s) / (H - (s - f))
```

### Legibilidad de Códigos (AIM/ISO)
```
PixelsPerModule = ModuleSize / mmPerPixel
Readable si PixelsPerModule ≥ Threshold * 2
```

---

## 🚢 Desplegar en Vercel

### Opción 1: Con GitHub

1. Sube el proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Conecta tu GitHub
4. Selecciona este repositorio
5. En "Environment Variables", agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Haz clic en "Deploy"

### Opción 2: CLI de Vercel

```bash
npm i -g vercel
vercel
```

---

## 🗄️ Base de Datos (Opcional)

Si quieres agregar soporte para cámaras y lentes en BD:

### Crear tablas en Supabase

En **SQL Editor**, copia y ejecuta:

```sql
-- Cámaras
CREATE TABLE cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL UNIQUE,
  sensor_name TEXT,
  pixel_size_um FLOAT NOT NULL,
  resolution_h INT NOT NULL,
  resolution_v INT NOT NULL,
  interface TEXT,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lentes
CREATE TABLE lenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL UNIQUE,
  focal_length_mm FLOAT NOT NULL,
  min_aperture FLOAT,
  max_aperture FLOAT,
  minimum_focus_distance_mm FLOAT,
  max_sensor_format TEXT,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Presets
CREATE TABLE presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  camera_model TEXT,
  lens_model TEXT,
  sensor_width_mm FLOAT,
  sensor_height_mm FLOAT,
  pixel_size_um FLOAT,
  focal_length_mm FLOAT,
  working_distance_mm FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT name_unique UNIQUE(user_id, name)
);

-- Habilitar Row Level Security
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE lenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para lectura
CREATE POLICY "Allow public read cameras" ON cameras FOR SELECT USING (true);
CREATE POLICY "Allow public read lenses" ON lenses FOR SELECT USING (true);
CREATE POLICY "Allow users read own presets" ON presets FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
```

---

## 🛠️ Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### "NEXT_PUBLIC_SUPABASE_URL is undefined"
- Verifica que `.env.local` existe en la raíz del proyecto
- Verifica que contiene las variables correctas
- Reinicia el servidor (`npm run dev`)

### Puerto 3000 en uso
```bash
npm run dev -- -p 3001
```

### Cálculos no funcionan
- Verifica que los valores de entrada son positivos
- Revisa la consola del navegador (F12 → Console)
- Revisa que `lib/calculationEngine.ts` está presente

---

## 📚 API Endpoints

### POST `/api/lens/calculate`
Calcula focal, WD, FOV

### POST `/api/dof/calculate`
Calcula profundidad de campo

### POST `/api/blur/calculate`
Calcula motion blur

### POST `/api/code/readability`
Calcula legibilidad de códigos

---

## 🎨 Personalización

### Cambiar colores

En `tailwind.config.ts`:
```typescript
colors: {
  primary: '#D97706',    // Tu color
  secondary: '#1E40AF'
}
```

### Agregar más sensores

En `lib/calculationEngine.ts`, función `SENSOR_FORMATS`:
```typescript
const SENSOR_FORMATS: Record<string, [number, number]> = {
  'custom': [0, 0],
  'Tu Sensor': [width_mm, height_mm],  // Agrega aquí
};
```

---

## 📝 Notas Importantes

- ⚠️ Las fórmulas usan **aproximación paraxial** (válida cuando WD ≫ Focal)
- ⚠️ Motion blur es una **estimación teórica**, no simula óptica real
- ⚠️ DOF usa **distancia hiperfocal** clásica
- ⚠️ Códigos: legibilidad es estándar AIM/ISO, depende de contraste real

---

## 🤝 Soporte

¿Preguntas? Contacta al equipo o revisa la documentación completa en `README.md`.

---

**¡Disfruta! 🚀✨**
