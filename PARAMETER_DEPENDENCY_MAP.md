# 🗺️ MAPA DE DEPENDENCIAS DE PARÁMETROS

## 📊 FLUJO GENERAL DE DATOS

```
INPUTS (Usuario) → STORE (Zustand) → CÁLCULOS → RESULTADOS → DISPLAY
```

---

## 🔴 SECCIÓN 1: SENSOR (6 parámetros)

### 1.1 Formato de Sensor
```
┌─────────────────────────────────────┐
│ Sensor Format (SELECT)              │
│ Options:                            │
│  • custom                           │
│  • 1/2.3" ──→ [6.4×4.8]             │
│  • 2/3" ──→ [9.6×7.2]               │
│  • 1" ──→ [12.8×9.6]                │
│  • APS-C ──→ [23.6×15.7]            │
│  • Full Frame ──→ [36×24]           │
└─────────────────────────────────────┘
         │
         ├──→ setSensorWidth() ─┐
         └──→ setSensorHeight() ├──→ STORE
                                 │
         ┌──────────────────────┘
         │
    MODIFICA ANCHO/ALTO
    (↓ ver Parámetro 1.2 y 1.3)
```

### 1.2 Ancho del Sensor (mm)
```
┌─────────────────────────────────────┐
│ Sensor Width: 6.4 mm (NUMBER)       │
│ Editable: ✅ SÍ (manual)             │
│ Acción: Cambia formato a "custom"   │
└─────────────────────────────────────┘
         │
         ├──→ CÁLCULOS QUE LO USAN:
         │    • FOV_H = (W / f) × WD
         │    • Magnification = f / WD (indirecta)
         │    • Resolution H = W / PixelSize
         │
         └──→ RESULTADOS QUE DEPENDEN:
              • FOV Horizontal
              • Magnification
              • Sensor Metrics
```

### 1.3 Alto del Sensor (mm)
```
┌─────────────────────────────────────┐
│ Sensor Height: 4.8 mm (NUMBER)      │
│ Editable: ✅ SÍ (manual)             │
│ Acción: Cambia formato a "custom"   │
└─────────────────────────────────────┘
         │
         ├──→ CÁLCULOS QUE LO USAN:
         │    • FOV_V = (H / f) × WD
         │    • Resolution V = H / PixelSize
         │
         └──→ RESULTADOS QUE DEPENDEN:
              • FOV Vertical
              • Sensor Metrics
              • Optical Diagram (aspect ratio)
```

### 1.4 Tamaño de Píxel (µm)
```
┌─────────────────────────────────────┐
│ Pixel Size: 3.5 µm (NUMBER)         │
│ Editable: ✅ SÍ (manual)             │
│ Rango: 0.1 - 50 µm                  │
│ Validación: > 0                     │
└─────────────────────────────────────┘
         │
         ├──→ CÁLCULOS QUE LO USAN:
         │    • MotionBlur = (V / Píxel_mm) × E
         │    • SpatialResolution = Píxel / 1000
         │    • Auto CoC (si presiona botón)
         │
         └──→ PARÁMETROS AFECTADOS:
              • Motion Blur
              • Spatial Resolution
              • DOF (auto CoC)
              • Code Readability (auto mm/px)
```

### 1.5 Resolución Horizontal (px)
```
┌─────────────────────────────────────┐
│ Resolution H: 1920 px (NUMBER)      │
│ Editable: ✅ SÍ (manual)             │
│ Rango: 1 - 1,000,000 px             │
└─────────────────────────────────────┘
         │
         └──→ AFECTA:
              • Megapixels = (ResH × ResV) / 1M
              • Sensor Metrics display
```

### 1.6 Resolución Vertical (px)
```
┌─────────────────────────────────────┐
│ Resolution V: 1440 px (NUMBER)      │
│ Editable: ✅ SÍ (manual)             │
│ Rango: 1 - 1,000,000 px             │
└─────────────────────────────────────┘
         │
         └──→ AFECTA:
              • Megapixels = (ResH × ResV) / 1M
              • Sensor Metrics display
```

---

## 🟠 SECCIÓN 2: ÓPTICA (5 parámetros + 1 condicional)

### 2.1 ¿Qué Calcular? (TARGET SELECTOR)
```
┌──────────────────────────────────────────┐
│ Calculation Target (SELECT)              │
│ • fieldOfView (default)                  │
│ • workingDistance                        │
│ • focalLength                            │
└──────────────────────────────────────────┘
         │
         ├──→ SI "fieldOfView":
         │    • Focal Length: HABILITADO (input)
         │    • Working Distance: HABILITADO (input)
         │    • Cálculo: FOV_H = (W/f) × WD
         │    • FOV Deseado: NO VISIBLE
         │
         ├──→ SI "workingDistance":
         │    • Focal Length: HABILITADO (input)
         │    • Working Distance: DESHABILITADO ❌
         │    • Cálculo: WD = (FOV × f) / W
         │    • FOV Deseado: VISIBLE ✅
         │
         └──→ SI "focalLength":
              • Focal Length: DESHABILITADO ❌
              • Working Distance: HABILITADO (input)
              • Cálculo: f = (W × WD) / FOV
              • FOV Deseado: VISIBLE ✅
```

### 2.2 Unidades de Distancia
```
┌──────────────────────────────────────────┐
│ Distance Units (SELECT)                  │
│ • mm (milímetros) - ALMACENADO           │
│ • cm (centímetros) - DISPLAY CONVERSION  │
│ • in (pulgadas) - DISPLAY CONVERSION     │
└──────────────────────────────────────────┘
         │
         ├──→ CONVERSIONES:
         │    1 cm = 10 mm
         │    1 in = 25.4 mm
         │
         └──→ AFECTA SOLO DISPLAY DE:
              • Working Distance (input/output)
              • No afecta cálculos internos
```

### 2.3 Focal Length (mm)
```
┌──────────────────────────────────────────┐
│ Focal Length: 50 mm (NUMBER)             │
│ Editable: SEGÚN TARGET                   │
│  • SI target="fieldOfView" → ✅ SÍ       │
│  • SI target="workingDistance" → ✅ SÍ   │
│  • SI target="focalLength" → ❌ NO       │
│ Rango: 0.1 - 10,000 mm                   │
│ Validación: > 0                          │
└──────────────────────────────────────────┘
         │
         ├──→ CÁLCULOS QUE LO USAN:
         │    • FOV_H = (W / f) × WD
         │    • FOV_V = (H / f) × WD
         │    • Magnification = f / WD
         │    • DOF calculations
         │
         └──→ RESULTADOS AFECTADOS:
              • FOV Horizontal/Vertical
              • Magnification
              • Optical Diagram
              • DOF (todas las pestaña)
```

### 2.4 Working Distance (mm)
```
┌──────────────────────────────────────────┐
│ Working Distance: 1000 mm (NUMBER)       │
│ Display: Según unidad seleccionada       │
│ Editable: SEGÚN TARGET                   │
│  • SI target="fieldOfView" → ✅ SÍ       │
│  • SI target="workingDistance" → ❌ NO   │
│  • SI target="focalLength" → ✅ SÍ       │
│ Rango: 0.1 - 100,000 mm                  │
│ Validación: > 0                          │
└──────────────────────────────────────────┘
         │
         ├──→ CÁLCULOS QUE LO USAN:
         │    • FOV_H = (W / f) × WD
         │    • FOV_V = (H / f) × WD
         │    • Magnification = f / WD
         │    • DOF calculations
         │
         └──→ RESULTADOS AFECTADOS:
              • FOV Horizontal/Vertical
              • Magnification
              • Optical Diagram
              • DOF (todas las pestaña)
```

### 2.5 FOV Deseado (mm) - CONDICIONAL
```
┌──────────────────────────────────────────┐
│ Desired FOV: 50 mm (NUMBER)              │
│ Visible: SOLO SI target ≠ "fieldOfView"  │
│  • SI target="workingDistance" → ✅      │
│  • SI target="focalLength" → ✅          │
│ Rango: 0.1 - 1,000,000 mm                │
│ Validación: > 0                          │
└──────────────────────────────────────────┘
         │
         ├──→ CÁLCULOS QUE LO USAN:
         │    SI target="workingDistance":
         │    • WD = (FOV × f) / W
         │
         │    SI target="focalLength":
         │    • f = (W × WD) / FOV
         │
         └──→ NOTA: Es el FOV HORIZONTAL que deseas lograr
```

### 2.6 Exposición (ms)
```
┌──────────────────────────────────────────┐
│ Exposure: 33 ms (NUMBER)                 │
│ Editable: ✅ SÍ (manual)                  │
│ Rango: 0.01 - 10,000 ms                  │
│ Validación: > 0                          │
└──────────────────────────────────────────┘
         │
         ├──→ CÁLCULOS QUE LO USAN:
         │    • MaxFPS = 1000 / (E + R)
         │    • MotionBlur = (V/Píxel_mm)×E/1000
         │
         └──→ RESULTADOS AFECTADOS:
              • Max FPS
              • Motion Blur
              • Quality Indicator
              • Frame Rate Tab
```

### 2.7 Velocidad del Objeto (mm/s)
```
┌──────────────────────────────────────────┐
│ Object Velocity: 100 mm/s (NUMBER)       │
│ Editable: ✅ SÍ (manual)                  │
│ Rango: 0 - 100,000 mm/s                  │
│ Validación: ≥ 0                          │
└──────────────────────────────────────────┘
         │
         └──→ CÁLCULOS QUE LO USAN:
              • MotionBlur = (V/Píxel_mm)×E/1000
              
         └──→ RESULTADOS AFECTADOS:
              • Motion Blur
              • Quality Indicator
              • Frame Rate Tab
```

---

## 🟡 SECCIÓN 3: RENDIMIENTO (2 parámetros)

### 3.1 Readout Time (ms)
```
┌──────────────────────────────────────────┐
│ Readout: 10 ms (NUMBER)                  │
│ Editable: ✅ SÍ (manual)                  │
│ Rango: 0.01 - 10,000 ms                  │
│ Validación: > 0                          │
└──────────────────────────────────────────┘
         │
         └──→ CÁLCULOS QUE LO USAN:
              • MaxFPS = 1000 / (Exposure + R)
              
         └──→ RESULTADOS AFECTADOS:
              • Max FPS
              • Frame Rate Tab
              • Timing Metrics
```

### 3.2 Max FPS (DISPLAY/AUTO)
```
┌──────────────────────────────────────────┐
│ Max FPS: 21.9 fps (DISPLAY ONLY)         │
│ Editable: ❌ NO (auto-calculated)        │
│ Fórmula: 1000 / (Exposure + Readout)     │
│ Precisión: 1 decimal                     │
└──────────────────────────────────────────┘
         │
         └──→ DERIVADO DE:
              • Exposure (Input)
              • Readout (Input)
```

---

## 🟢 SECCIÓN 4: RESULTADOS (6 parámetros calculados)

### 4.1 FOV Horizontal
```
FÓRMULA: FOV_H = (Sensor Width / Focal Length) × Working Distance
DEPENDE: Sensor Width, Focal Length, Working Distance
IMPACTO: Mostrado en card verde, afecta gráfico óptico
PRECISIÓN: 2 decimales
UNIDAD: mm
```

### 4.2 FOV Vertical
```
FÓRMULA: FOV_V = (Sensor Height / Focal Length) × Working Distance
DEPENDE: Sensor Height, Focal Length, Working Distance
IMPACTO: Mostrado en card verde, aspect ratio gráfico
PRECISIÓN: 2 decimales
UNIDAD: mm
```

### 4.3 Magnification
```
FÓRMULA: Magnification = Focal Length / Working Distance
DEPENDE: Focal Length, Working Distance
IMPACTO: Mostrado en card azul
PRECISIÓN: 4 decimales
UNIDAD: × (ratio)
```

### 4.4 Max Frame Rate
```
FÓRMULA: MaxFPS = 1000 / (Exposure + Readout)
DEPENDE: Exposure, Readout
IMPACTO: Mostrado en card azul, Frame Rate tab
PRECISIÓN: 1 decimal
UNIDAD: fps
```

### 4.5 Spatial Resolution
```
FÓRMULA: SR = Pixel Size / 1000
DEPENDE: Pixel Size (en µm)
IMPACTO: Mostrado en card púrpura
PRECISIÓN: 4 decimales
UNIDAD: mm
NOTA: Representa el tamaño físico de 1 píxel
```

### 4.6 Motion Blur
```
FÓRMULA: MB = (Velocity / Pixel Size_mm) × Exposure / 1000
DEPENDE: Velocity, Pixel Size, Exposure
IMPACTO: Mostrado en card naranja, Quality Indicator
PRECISIÓN: 2 decimales
UNIDAD: px (píxeles)
CALIDAD:
  • < 0.1 px = Excellent ✨
  • 0.1-0.5 px = Good 👍
  • 0.5-1.0 px = Acceptable ⚠️
  • > 1.0 px = Poor 🔴
```

---

## 📈 GRÁFICO DE IMPACTO GLOBAL

```
                     SENSOR SECTION
                     ├─ Formato ─────┬──→ Ancho (W)
                     │               └──→ Alto (H)
                     ├─ Píxel (P) ────────→ Blur, Res
                     ├─ Res H/V ──────────→ MP, Display
                     │
                     │              ÓPTICA SECTION
    ┌────────────────┼─ Target ──────┬──→ Deshabilita campos
    │                │               └──→ Mostrar FOV Deseado
    │                │
    │                ├─ Unidades ────────→ Display WD conversión
    │                │
    │                ├─ Focal (f) ───────→ FOV, Mag, DOF
    │                │                     Gráfico óptico
    │                │
    │                ├─ WD ──────────────→ FOV, Mag, DOF
    │                │                     Gráfico óptico
    │                │
    │                ├─ Exposición (E) ──→ FPS, Motion Blur
    │                │
    │                ├─ Velocidad (V) ───→ Motion Blur
    │                │
    │                └─ Readout (R) ─────→ FPS
    │
    └────────────────→ CÁLCULOS
                     │
                     ├─ FOV_H = (W/f) × WD
                     ├─ FOV_V = (H/f) × WD
                     ├─ Mag = f / WD
                     ├─ MaxFPS = 1000/(E+R)
                     ├─ SpatialRes = P/1000
                     └─ MotionBlur = (V/P_mm)×E/1000
                     │
                     └─→ RESULTADOS (cards)
```

---

## ✅ MATRIZ DE VALIDACIONES

| Parámetro | Validación | Error Si... | Acción |
|-----------|-----------|-----------|--------|
| Sensor Width | > 0 | ≤ 0 | Botón Calcular deshabilitado |
| Sensor Height | > 0 | ≤ 0 | Botón Calcular deshabilitado |
| Pixel Size | > 0 | ≤ 0 | Botón Calcular deshabilitado |
| Focal Length | > 0 | ≤ 0 | Error mensaje + Calcular deshabilitado |
| Working Distance | > 0 | ≤ 0 | Error mensaje + Calcular deshabilitado |
| FOV Deseado | > 0 | ≤ 0 | Error mensaje + Calcular deshabilitado |
| Exposición | > 0 | ≤ 0 | Error mensaje + Calcular deshabilitado |
| Readout | > 0 | ≤ 0 | Usado en cálculo pero no validado |

---

## 🔧 CORRECCIONES APLICADAS

### ✅ Focal Length Calculation (CRÍTICO)
```javascript
// ❌ ANTES:
const calculatedFocal = (store.sensorWidth * desiredWd) / desiredWd;
// Resultado: SIEMPRE = sensorWidth (INCORRECTO)

// ✅ DESPUÉS:
const calculatedFocal = (store.sensorWidth * wdMm) / desiredFov;
// Resultado: (W × WD) / FOV (CORRECTO)
```

### ✅ Working Distance Calculation (VERIFICADO)
```javascript
// ✓ Fórmula correcta implementada:
const calculatedWd = (desiredFov * focalMm) / store.sensorWidth;
```

### ✅ FOV Calculation (VERIFICADO)
```javascript
// ✓ Fórmula correcta implementada:
const fovHMm = (store.sensorWidth / focalMm) * wdMm;
const fovVMm = (store.sensorHeight / focalMm) * wdMm;
```

---

## 📝 RESUMEN DE PARÁMETROS

**Total de parámetros de entrada:** 14  
**Total de resultados calculados:** 6  
**Dependencias críticas:** 12  
**Validaciones activas:** 8  
**Conversiones de unidades:** 3 (mm, cm, in)

**Estado:** ✅ TODOS LOS PARÁMETROS DOCUMENTADOS Y VERIFICADOS

