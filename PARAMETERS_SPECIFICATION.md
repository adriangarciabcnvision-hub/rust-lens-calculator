# 📋 Especificación Completa de Parámetros

## 🎯 OBJETIVO
Definir exactamente CADA parámetro: tipo, rango, origen, dependencias y cálculos.

---

# 📊 PESTAÑA 1: CALCULADORA

## SECCIÓN 1.1: SENSOR

### Parámetro 1: Formato de Sensor
- **Nombre:** Sensor Format / Formato
- **Tipo:** SELECT (dropdown)
- **Opciones:** 
  - "custom" (personalizado)
  - "1/2.3\"" → 6.4 × 4.8 mm
  - "2/3\"" → 9.6 × 7.2 mm
  - "1\"" → 12.8 × 9.6 mm
  - "APS-C" → 23.6 × 15.7 mm
  - "Full Frame" → 36 × 24 mm
- **Función:** Seleccionar formato estándar
- **Acción al cambiar:**
  - Si selecciona formato ≠ "custom" → Auto-calcula Ancho y Alto
  - Si modifica Ancho o Alto → Auto-cambia a "custom"
- **Cálculo:** NO (solo selección)
- **Dependencias:** Define Ancho y Alto automáticamente

---

### Parámetro 2: Ancho del Sensor
- **Nombre:** Sensor Width / Ancho
- **Tipo:** NUMBER (input)
- **Unidad:** mm (milímetros, fijo)
- **Rango:** 0.1 - 100 mm
- **Valor por defecto:** 6.4 (según formato inicial 1/2.3")
- **Editable:** ✅ SÍ (manual)
- **Acción al cambiar:** Automáticamente cambia Formato a "custom"
- **Cálculo:** 
  - Proviene de: Formato seleccionado O entrada manual
  - Fórmula: Ninguna (valor directo)
- **Dependencias:**
  - Usa para calcular: FOV_H, resolución H, dimensión del gráfico
  - Afecta: Magnification, FOV total

---

### Parámetro 3: Alto del Sensor
- **Nombre:** Sensor Height / Alto
- **Tipo:** NUMBER (input)
- **Unidad:** mm (milímetros, fijo)
- **Rango:** 0.1 - 100 mm
- **Valor por defecto:** 4.8 (según formato inicial 1/2.3")
- **Editable:** ✅ SÍ (manual)
- **Acción al cambiar:** Automáticamente cambia Formato a "custom"
- **Cálculo:**
  - Proviene de: Formato seleccionado O entrada manual
  - Fórmula: Ninguna (valor directo)
- **Dependencias:**
  - Usa para calcular: FOV_V, resolución V, aspect ratio gráfico
  - Afecta: FOV total, proporción en gráfico

---

### Parámetro 4: Tamaño de Píxel
- **Nombre:** Pixel Size / Píxel
- **Tipo:** NUMBER (input)
- **Unidad:** µm (micrónmetros)
- **Rango:** 0.1 - 50 µm
- **Valor por defecto:** 3.5
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual O especificaciones de sensor
  - Fórmula: Ninguna (valor directo)
- **Dependencias:**
  - Usa para calcular:
    - Spatial Resolution = PixelSize / 1000 (en mm)
    - Motion Blur = (Velocity / PixelSize_mm) × Exposure / 1000
    - Resolución total del sensor
  - Afecta: Precisión de medición, blur
- **Validación:** Debe ser > 0

---

### Parámetro 5: Resolución Horizontal (H)
- **Nombre:** Resolution H / Res H
- **Tipo:** NUMBER (input)
- **Unidad:** px (píxeles)
- **Rango:** 1 - 1000000 px
- **Valor por defecto:** 1920
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual O especificaciones del sensor
  - Fórmula: ResH = SensorWidth_mm / PixelSize_mm
- **Dependencias:**
  - Afecta: Megapixeles totales
  - Relación: ResH × ResV / 1000000 = Megapixeles
- **Validación:** Debe ser ≥ 1

---

### Parámetro 6: Resolución Vertical (V)
- **Nombre:** Resolution V / Res V
- **Tipo:** NUMBER (input)
- **Unidad:** px (píxeles)
- **Rango:** 1 - 1000000 px
- **Valor por defecto:** 1440
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual O especificaciones del sensor
  - Fórmula: ResV = SensorHeight_mm / PixelSize_mm
- **Dependencias:**
  - Afecta: Megapixeles totales
  - Relación: ResH × ResV / 1000000 = Megapixeles
- **Validación:** Debe ser ≥ 1

---

## SECCIÓN 1.2: ÓPTICA

### Parámetro 7: ¿Qué Calcular?
- **Nombre:** Calculation Target / ¿Qué calcular?
- **Tipo:** SELECT (radio button / dropdown)
- **Opciones:**
  - "fieldOfView" → Calcula FOV (Incógnita)
  - "workingDistance" → Calcula WD (Incógnita)
  - "focalLength" → Calcula Focal (Incógnita)
- **Función:** Define cuál parámetro es la incógnita
- **Acción al cambiar:**
  - Si = "fieldOfView" → Deshabilita FOV, habilita Focal y WD
  - Si = "workingDistance" → Deshabilita WD, habilita Focal, muestra campo "FOV Deseado"
  - Si = "focalLength" → Deshabilita Focal, habilita WD, muestra campo "FOV Deseado"
- **Cálculo:** NO (solo selector)
- **Dependencias:** Define qué campos se deshabilitan/habilitan

---

### Parámetro 8: Unidades de Distancia
- **Nombre:** Distance Units / Unidades
- **Tipo:** SELECT (dropdown)
- **Opciones:**
  - "mm" → Milímetros (1 mm = 1 mm)
  - "cm" → Centímetros (1 cm = 10 mm)
  - "in" → Pulgadas (1 in = 25.4 mm)
- **Función:** Define unidades para WD y FOV
- **Acción al cambiar:**
  - Convierte valores mostrados (no la BD)
  - WD mostrado = WD_interno_mm / conversion_factor
- **Cálculo:** NO (solo conversión de display)
- **Dependencias:** Afecta cómo se muestra WD en inputs

---

### Parámetro 9: Focal Length
- **Nombre:** Focal Length / Focal
- **Tipo:** NUMBER (input)
- **Unidad:** mm (milímetros, fijo)
- **Rango:** 0.1 - 10000 mm
- **Valor por defecto:** 50
- **Editable:** 
  - ✅ SÍ si "¿Qué calcular?" = "fieldOfView" O "workingDistance"
  - ❌ NO si "¿Qué calcular?" = "focalLength" (se calcula)
- **Cálculo:**
  - Si se calcula: f = (SensorWidth × WD) / FOV_Deseado
  - Proviene de: Entrada manual O cálculo
- **Dependencias:**
  - Usa para calcular:
    - FOV_H = (SensorWidth / f) × WD
    - FOV_V = (SensorHeight / f) × WD
    - Magnification = f / WD
    - Hiperfocal (en DOF)
  - Afecta: Todo cálculo óptico
- **Validación:** Debe ser > 0

---

### Parámetro 10: Working Distance
- **Nombre:** Working Distance / WD
- **Tipo:** NUMBER (input)
- **Unidad:** Según "Unidades" seleccionadas (mm/cm/in, se convierte internamente a mm)
- **Rango:** 0.1 - 100000 mm
- **Valor por defecto:** 1000 mm
- **Editable:**
  - ✅ SÍ si "¿Qué calcular?" = "fieldOfView" O "focalLength"
  - ❌ NO si "¿Qué calcular?" = "workingDistance" (se calcula)
- **Conversión:**
  - Input mostrado: en unidad seleccionada
  - BD interno: siempre en mm
  - Fórmula: valor_mm = valor_input × factor_conversión
- **Cálculo:**
  - Si se calcula: WD = FOV_Deseado × f / SensorWidth
  - Proviene de: Entrada manual O cálculo
- **Dependencias:**
  - Usa para calcular:
    - FOV_H = (SensorWidth / f) × WD
    - FOV_V = (SensorHeight / f) × WD
    - Magnification = f / WD
    - Hiperfocal (en DOF)
  - Afecta: Todo cálculo óptico
- **Validación:** Debe ser > 0

---

### Parámetro 11: FOV Deseado (Condicional)
- **Nombre:** Desired FOV / FOV Deseado
- **Tipo:** NUMBER (input)
- **Unidad:** mm (milímetros)
- **Rango:** 0.1 - 1000000 mm
- **Valor por defecto:** 50
- **Editable:** ✅ SÍ (manual)
- **Visible:** 
  - ✅ SÍ si "¿Qué calcular?" = "workingDistance" O "focalLength"
  - ❌ NO si "¿Qué calcular?" = "fieldOfView"
- **Cálculo:**
  - Proviene de: Entrada manual
  - Fórmula: Ninguna (valor directo)
- **Dependencias:**
  - Usa para calcular:
    - Si "workingDistance": WD = FOV × f / SensorWidth
    - Si "focalLength": f = SensorWidth × WD / FOV
- **Validación:** Debe ser > 0

---

### Parámetro 12: Exposición
- **Nombre:** Exposure / Exposición
- **Tipo:** NUMBER (input)
- **Unidad:** ms (milisegundos)
- **Rango:** 0.01 - 10000 ms
- **Valor por defecto:** 10
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual
  - Fórmula: Ninguna (valor directo)
- **Dependencias:**
  - Usa para calcular:
    - MaxFPS = 1000 / (Exposure + Readout)
    - Motion Blur = (Velocity / PixelSize) × Exposure / 1000
  - Afecta: Frame rate y motion blur
- **Validación:** Debe ser > 0

---

### Parámetro 13: Velocidad del Objeto
- **Nombre:** Object Velocity / Velocidad
- **Tipo:** NUMBER (input)
- **Unidad:** mm/s (milímetros por segundo)
- **Rango:** 0 - 100000 mm/s
- **Valor por defecto:** 100
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual
  - Fórmula: Ninguna (valor directo)
- **Dependencias:**
  - Usa para calcular:
    - Motion Blur = (Velocity / PixelSize_mm) × Exposure / 1000
  - Afecta: Motion blur
- **Validación:** Debe ser ≥ 0

---

## SECCIÓN 1.3: RENDIMIENTO

### Parámetro 14: Readout Time
- **Nombre:** Readout / Readout
- **Tipo:** NUMBER (input)
- **Unidad:** ms (milisegundos)
- **Rango:** 0.01 - 10000 ms
- **Valor por defecto:** 5
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual
  - Fórmula: Ninguna (valor directo)
- **Dependencias:**
  - Usa para calcular:
    - MaxFPS = 1000 / (Exposure + Readout)
  - Afecta: Frame rate total
- **Validación:** Debe ser > 0

---

## 🔢 RESULTADOS CALCULADOS (NO INPUTS)

### Resultado 1: FOV Horizontal
- **Cálculo:** FOV_H = (SensorWidth / Focal) × WorkingDistance
- **Unidad:** mm
- **Precisión:** 2 decimales
- **Depende de:** SensorWidth, Focal, WorkingDistance
- **Validación:** SI Focal = 0 → Error

---

### Resultado 2: FOV Vertical
- **Cálculo:** FOV_V = (SensorHeight / Focal) × WorkingDistance
- **Unidad:** mm
- **Precisión:** 2 decimales
- **Depende de:** SensorHeight, Focal, WorkingDistance

---

### Resultado 3: Magnification
- **Cálculo:** Mag = Focal / WorkingDistance
- **Unidad:** ratio (sin unidad, "×")
- **Precisión:** 4 decimales
- **Depende de:** Focal, WorkingDistance
- **Rango:** 0 - infinito

---

### Resultado 4: Max Frame Rate
- **Cálculo:** MaxFPS = 1000 / (Exposure + Readout)
- **Unidad:** fps (frames per second)
- **Precisión:** 1 decimal
- **Depende de:** Exposure, Readout
- **Validación:** SI (Exposure + Readout) = 0 → Error

---

### Resultado 5: Spatial Resolution
- **Cálculo:** SpatialRes = PixelSize_µm / 1000
- **Unidad:** mm (milímetros)
- **Precisión:** 4 decimales
- **Depende de:** PixelSize
- **Nota:** Representa el tamaño físico de 1 píxel

---

### Resultado 6: Motion Blur
- **Cálculo:** MotionBlur = (Velocity / PixelSize_mm) × Exposure / 1000
- **Unidad:** px (píxeles)
- **Precisión:** 2 decimales
- **Depende de:** Velocity, PixelSize, Exposure
- **Validación:** SI PixelSize = 0 → Error
- **Interpretación:**
  - < 0.1 px = Excellent
  - 0.1 - 0.5 px = Good
  - 0.5 - 1.0 px = Acceptable
  - > 1.0 px = Poor

---

---

# 📐 PESTAÑA 3: PROFUNDIDAD DE CAMPO

## INPUTS

### Parámetro 1: Focal Length (Referenciado)
- **Nombre:** Focal Length / Focal
- **Tipo:** NUMBER (display/referencia)
- **Unidad:** mm
- **Origen:** Tomado de la Calculadora principal
- **Editable:** ❌ NO (solo lectura desde Calculadora)
- **Propósito:** Informar qué focal se está usando

---

### Parámetro 2: Working Distance (Referenciado)
- **Nombre:** Working Distance / WD
- **Tipo:** NUMBER (display/referencia)
- **Unidad:** mm
- **Origen:** Tomado de la Calculadora principal
- **Editable:** ❌ NO (solo lectura desde Calculadora)
- **Propósito:** Informar qué WD se está usando

---

### Parámetro 3: f-Number (Apertura)
- **Nombre:** f-Number / f-number / Apertura
- **Tipo:** NUMBER (input)
- **Unidad:** (sin unidad, notación f/X)
- **Rango:** 0.7 - 64
- **Valor por defecto:** 2.8
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual
  - Fórmula: Ninguna (valor directo)
- **Dependencias:**
  - Usa para calcular:
    - Hyperfocal = (f² / (N × c)) + f
  - Afecta: Profundidad de campo total

---

### Parámetro 4: Circle of Confusion (CoC)
- **Nombre:** Circle of Confusion / Blur Máximo / CoC
- **Tipo:** NUMBER (input)
- **Unidad:** mm (milímetros)
- **Rango:** 0.001 - 1 mm
- **Valor por defecto:** 0.003
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual O auto-calculado
  - Fórmula: CoC = PixelSize_mm (si se presiona botón "Auto")
- **Dependencias:**
  - Usa para calcular:
    - Hyperfocal = (f² / (N × c)) + f
  - Afecta: Profundidad de campo total
- **Nota:** Representa el máximo círculo de desenfoque aceptable

---

### Parámetro 5: Minimum Focus Distance
- **Nombre:** Minimum Focus Distance / Dist Mín Enfoque
- **Tipo:** NUMBER (input)
- **Unidad:** mm (milímetros)
- **Rango:** 0.01 - 100000 mm
- **Valor por defecto:** 0.3
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual
  - Fórmula: Ninguna (valor directo)
- **Dependencias:**
  - Usa para calcular:
    - EffectiveMinFocus = MAX(MinFocusDistance, NearLimit)
  - Afecta: Límite cercano efectivo

---

## RESULTADOS CALCULADOS

### Resultado 1: Hyperfocal Distance
- **Cálculo:** H = (f² / (N × c)) + f
- **Unidad:** mm
- **Depende de:** Focal, f-Number, Circle of Confusion
- **Propósito:** Punto de referencia para calcular límites de enfoque

---

### Resultado 2: Near Limit (Límite Cercano)
- **Cálculo:** Near = (H × s) / (H + (s - f))
- **Unidad:** mm
- **Depende de:** Hyperfocal, WorkingDistance, Focal
- **Propósito:** Distancia más cercana donde hay enfoque aceptable

---

### Resultado 3: Far Limit (Límite Lejano)
- **Cálculo:** Far = (H × s) / (H - (s - f))
- **Unidad:** mm
- **Depende de:** Hyperfocal, WorkingDistance, Focal
- **Propósito:** Distancia más lejana donde hay enfoque aceptable
- **Nota:** Puede ser ∞ (infinito)

---

### Resultado 4: Total Depth of Field
- **Cálculo:** DOF = Far - Near
- **Unidad:** mm
- **Depende de:** Far Limit, Near Limit
- **Propósito:** Rango total de enfoque

---

---

# ⚡ PESTAÑA 5: FRAME RATE & BLUR

## INPUTS

### Parámetro 1: Exposición
- **Nombre:** Exposure / Exposición
- **Tipo:** NUMBER (input)
- **Unidad:** ms
- **Rango:** 0.01 - 10000 ms
- **Valor por defecto:** 10
- **Editable:** ✅ SÍ (manual)
- **Origen:** Entrada manual (igual a Calculadora)

---

### Parámetro 2: Readout
- **Nombre:** Readout / Readout
- **Tipo:** NUMBER (input)
- **Unidad:** ms
- **Rango:** 0.01 - 10000 ms
- **Valor por defecto:** 5
- **Editable:** ✅ SÍ (manual)
- **Origen:** Entrada manual

---

### Parámetro 3: Max FPS Datasheet (Opcional)
- **Nombre:** FPS Máximo (DS) / Max FPS (Datasheet)
- **Tipo:** NUMBER (input)
- **Unidad:** fps
- **Rango:** 1 - 10000 fps
- **Valor por defecto:** 0 (deshabilitado)
- **Editable:** ✅ SÍ (manual)
- **Función:** Límite del fabricante (si existe)
- **Cálculo:**
  - Proviene de: Entrada manual O 0 si no aplica
  - Fórmula: Ninguna (valor directo)

---

### Parámetro 4: Velocidad
- **Nombre:** Object Velocity / Velocidad
- **Tipo:** NUMBER (input)
- **Unidad:** mm/s
- **Rango:** 0 - 100000 mm/s
- **Valor por defecto:** 100
- **Editable:** ✅ SÍ (manual)
- **Origen:** Entrada manual (igual a Calculadora)

---

### Parámetro 5: Píxel (Referenciado)
- **Nombre:** Pixel Size / Píxel
- **Tipo:** NUMBER (display/referencia)
- **Unidad:** µm
- **Origen:** Tomado de Calculadora
- **Editable:** ❌ NO (solo lectura)

---

## RESULTADOS CALCULADOS

### Resultado 1: FPS Final
- **Cálculo:** 
  - MaxFPS_calc = 1000 / (Exposure + Readout)
  - Si Max_Datasheet > 0: FPS_final = MIN(MaxFPS_calc, Max_Datasheet)
  - Si Max_Datasheet = 0: FPS_final = MaxFPS_calc
- **Unidad:** fps
- **Depende de:** Exposure, Readout, Max_Datasheet

---

### Resultado 2: FPS Teórico
- **Cálculo:** MaxFPS = 1000 / (Exposure + Readout)
- **Unidad:** fps
- **Depende de:** Exposure, Readout
- **Propósito:** FPS sin limitación del datasheet

---

### Resultado 3: Motion Blur
- **Cálculo:** MotionBlur = (Velocity / PixelSize_mm) × Exposure / 1000
- **Unidad:** px
- **Depende de:** Velocity, PixelSize, Exposure
- **Precisión:** 2 decimales

---

### Resultado 4: Quality Indicator
- **Cálculo:**
  - SI MotionBlur < 0.1 px → "Excellent"
  - SI MotionBlur 0.1-0.5 px → "Good"
  - SI MotionBlur 0.5-1.0 px → "Acceptable"
  - SI MotionBlur > 1.0 px → "Poor"
- **Propósito:** Evaluación rápida de calidad

---

---

# 📖 PESTAÑA 7: LECTURA DE CÓDIGOS

## INPUTS

### Parámetro 1: mm por Píxel
- **Nombre:** Spatial Resolution / mm por píxel / mm/px
- **Tipo:** NUMBER (input)
- **Unidad:** mm
- **Rango:** 0.0001 - 100 mm
- **Valor por defecto:** 0.01
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual
  - Fórmula: Ninguna (valor directo)
- **Botón "Auto":**
  - Calcula: mm_per_px = PixelSize_µm / 1000 (convierte a mm)
  - Acción: Llena el input automáticamente

---

### Parámetro 2: Tamaño de Módulo
- **Nombre:** Module Size / Tamaño Módulo
- **Tipo:** NUMBER (input)
- **Unidad:** mm
- **Rango:** 0.01 - 1000 mm
- **Valor por defecto:** 2
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual
  - Fórmula: Ninguna (valor directo)
- **Propósito:** Tamaño de cada "celda" del código (barcode/QR)

---

### Parámetro 3: Umbral (Threshold)
- **Nombre:** Threshold / Umbral
- **Tipo:** NUMBER (input)
- **Unidad:** px (píxeles)
- **Rango:** 1 - 100 px
- **Valor por defecto:** 3 (AIM standard)
- **Editable:** ✅ SÍ (manual)
- **Cálculo:**
  - Proviene de: Entrada manual
  - Fórmula: Ninguna (valor directo)
- **Propósito:** Píxeles mínimos por módulo según estándar

---

## RESULTADOS CALCULADOS

### Resultado 1: Píxeles por Módulo
- **Cálculo:** PixelsPerModule = ModuleSize / mm_per_px
- **Unidad:** px
- **Precisión:** 2 decimales
- **Depende de:** ModuleSize, mm_per_px

---

### Resultado 2: Veredicto
- **Cálculo:**
  - SI PixelsPerModule ≥ Threshold × 2 → "Readable"
  - SI PixelsPerModule ≥ Threshold → "Marginal"
  - SI PixelsPerModule < Threshold → "Not Readable"
- **Propósito:** Evaluación de legibilidad (AIM/ISO standard)

---

### Resultado 3: Porcentaje de Legibilidad
- **Cálculo:** Legibility% = (PixelsPerModule / (Threshold × 2)) × 100
- **Unidad:** %
- **Rango:** 0 - 100%
- **Propósito:** Visualización en barra de progreso

---

---

# 🔄 PESTAÑA 6: COMPARADOR

## INPUTS (Acciones)

### Botón 1: Cargar Config 1
- **Acción:** Copia estado actual de Calculadora a Config1
- **Guarda:**
  - Focal
  - Working Distance
  - FOV H, FOV V
  - Magnification
  - Timestamp

---

### Botón 2: Cargar Config 2
- **Acción:** Copia estado actual de Calculadora a Config2
- **Guarda:** (igual a Config1)

---

### Botón 3: Intercambiar
- **Acción:** Invierte Config1 ↔ Config2

---

### Botón 4: Limpiar
- **Acción:** Borra Config1 y Config2

---

## RESULTADOS COMPARADOS

### Resultado 1: Diferencia FOV H
- **Cálculo:** Δ FOV_H = ABS(Config1.FOV_H - Config2.FOV_H)
- **Color:** 
  - Rojo SI Δ > 5 mm (diferencia significativa)
  - Verde SI Δ ≤ 5 mm (similar)

---

### Resultado 2: Diferencia Magnification
- **Cálculo:** Δ Mag = ABS(Config1.Mag - Config2.Mag)
- **Color:**
  - Rojo SI Δ > 0.01 (diferencia significativa)
  - Verde SI Δ ≤ 0.01 (similar)

---

---

# 📋 PESTAÑA 2: DIAGNÓSTICO

## No tiene inputs
Historial se genera automáticamente desde cada cálculo en Calculadora.

---

# 🔬 PESTAÑA 4: VISUALIZACIÓN ÓPTICA

## No tiene inputs propios
Usa datos de Calculadora:
- SensorWidth, SensorHeight
- Focal, WorkingDistance
- FOV_H (calculado)
- PixelSize (para leyenda)

---

---

## 🎯 RESUMEN DE FLUJO DE DATOS

```
CALCULADORA (inputs)
├── Sensor (formato → W, H, píxel, res)
├── Óptica (focal, WD, FOV_deseado si aplica)
├── Rendimiento (exposición, velocidad, readout)
│
└── CALCULA:
    ├── FOV_H = (W / f) × WD
    ├── FOV_V = (H / f) × WD
    ├── Mag = f / WD
    ├── MaxFPS = 1000 / (exp + readout)
    └── MotionBlur = (vel / px_mm) × exp / 1000

DATOS A OTRAS PESTAÑAS:
├── DOF ← Focal, WD (copy), PixelSize (auto CoC)
├── FrameRate ← Exposición, Readout, Velocidad, PixelSize
├── Códigos ← PixelSize (auto mm/px)
├── Visualización ← Focal, WD, FOV_H, Sensor W×H
├── Comparador ← Copia completa de estado
└── Diagnóstico ← Historial automático de cada cálculo
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Para que cada pestaña sea 100% correcta:

- [ ] CALCULADORA: Todos 14 parámetros funcionan, cálculos correctos
- [ ] DOF: Toma valores de Calculadora, calcula Hyperfocal correctamente
- [ ] FrameRate: Toma valores de Calculadora, calcula FPS y Blur
- [ ] Códigos: Permite entrada manual + botón "Auto"
- [ ] Comparador: Guarda/intercambia/limpia correctamente
- [ ] Diagnóstico: Agrega cálculo automáticamente
- [ ] Visualización: Se actualiza con Focal/WD/FOV de Calculadora
- [ ] Conversión de unidades: mm ↔ cm ↔ in correcta
- [ ] Validaciones: Sin división por cero, sin NaN
- [ ] Precisión: Según especificación (decimales)

---
