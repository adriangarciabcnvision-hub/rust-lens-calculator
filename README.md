# 🔬 RUST Lens Calculator - Web Version

Versión web de la calculadora óptica RUST, construida con **Next.js 14**, **TypeScript**, **Tailwind CSS** y **Supabase**.

## ✨ Características

- 🎯 **Cálculos ópticos precisos** - Focal, distancia de trabajo, campo de visión
- ⚡ **Rendimiento** - Frame rate máximo, motion blur
- ☁️ **100% Web** - Accede desde cualquier dispositivo
- 📊 **Resultados en tiempo real** - Cálculos instantáneos
- 🔐 **Seguro** - Autenticación con Supabase (opcional)
- 💾 **Persistencia** - Guarda presets en base de datos

## 🚀 Quick Start

### 1. Requisitos previos
- Node.js 18+ ([descargar](https://nodejs.org))
- npm o yarn
- Cuenta Supabase (gratis en [supabase.com](https://supabase.com))

### 2. Instalación

```bash
# Clonar o descargar el proyecto
cd RustLensCalculatorWeb

# Instalar dependencias
npm install

# Copiar configuración de ejemplo
cp .env.local.example .env.local
```

### 3. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. En "Project Settings" → "API", copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Pega en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
```

### 4. Ejecutar localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📦 Desplegar en Vercel

### Opción 1: Desde GitHub (RECOMENDADO)

1. Sube el proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com) y conecta tu GitHub
3. Selecciona este repositorio
4. En "Environment Variables", agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Haz clic en "Deploy"

### Opción 2: CLI de Vercel

```bash
npm i -g vercel
vercel
```

Sigue las instrucciones. Vercel te pedirá las variables de entorno.

---

## 📂 Estructura del Proyecto

```
RustLensCalculatorWeb/
├── app/
│   ├── api/
│   │   └── lens/
│   │       └── calculate/
│   │           └── route.ts          # API para cálculos
│   ├── calculator/
│   │   └── page.tsx                  # Página calculadora
│   ├── layout.tsx                    # Layout principal
│   ├── page.tsx                      # Home
│   └── globals.css                   # Estilos globales
├── components/
│   └── LensCalculator.tsx            # Componente calculadora
├── lib/
│   └── supabase.ts                   # Cliente Supabase + tipos
├── public/                           # Assets estáticos
├── .env.local.example                # Variables de entorno
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🧮 API Endpoints

### POST `/api/lens/calculate`

Calcula parámetros ópticos.

**Request:**
```json
{
  "sensorWidthMm": 6.4,
  "sensorHeightMm": 4.8,
  "pixelSizeUm": 3.5,
  "focalLengthMm": 50,
  "workingDistanceMm": 1000,
  "exposureMs": 33,
  "readoutMs": 10,
  "velocityMmPerSec": 100,
  "targetCalculation": "fieldOfView"
}
```

**Response:**
```json
{
  "success": true,
  "fovHorizontalMm": 76.8,
  "fovVerticalMm": 57.6,
  "magnification": 0.083,
  "maxFrameRate": 27.8,
  "motionBlurPixels": 1.15
}
```

---

## 🔧 Configurar Base de Datos

Si quieres agregar tabla de cámaras y lentes:

### En Supabase SQL Editor:

```sql
-- Tabla de cámaras
CREATE TABLE cameras (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  display_name TEXT NOT NULL,
  pixel_size_um FLOAT NOT NULL,
  resolution_h INT NOT NULL,
  resolution_v INT NOT NULL,
  sensor_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de lentes
CREATE TABLE lenses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  display_name TEXT NOT NULL,
  focal_length_mm FLOAT NOT NULL,
  min_aperture FLOAT,
  max_aperture FLOAT,
  minimum_focus_distance_mm FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de presets
CREATE TABLE presets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  camera_id BIGINT REFERENCES cameras(id),
  lens_id BIGINT REFERENCES lenses(id),
  sensor_width_mm FLOAT,
  sensor_height_mm FLOAT,
  pixel_size_um FLOAT,
  focal_length_mm FLOAT,
  working_distance_mm FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 Personalización

### Cambiar colores

En `tailwind.config.ts`:
```ts
theme: {
  extend: {
    colors: {
      // Cambia aquí
      primary: '#D97706', // Naranja
      secondary: '#1E40AF', // Azul
    },
  },
},
```

### Agregar más funcionalidades

1. **Autenticación**: Descomentar líneas en `lib/supabase.ts`
2. **Exportar PDF**: Instalar `jspdf`
3. **Gráficos**: Usar `recharts` o `chart.js`
4. **Dark mode**: Ya está incluido (Tailwind)

---

## 📝 Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública de Supabase |

> ⚠️ Las variables `NEXT_PUBLIC_*` se exponen al navegador. No incluyas keys secretos aquí.

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Error: "NEXT_PUBLIC_SUPABASE_URL is undefined"
Verifica que `.env.local` existe y contiene las variables correctas.

### Puerto 3000 en uso
```bash
npm run dev -- -p 3001
```

---

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

---

## 📄 Licencia

Mismo que el proyecto original de RUST Lens Calculator.

---

**¿Preguntas?** Abre un issue en GitHub o contacta al equipo.

¡Disfruta! 🔬✨
