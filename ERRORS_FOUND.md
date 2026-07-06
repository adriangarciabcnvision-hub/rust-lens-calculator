# 🔴 ERRORES CRÍTICOS ENCONTRADOS

## CALCULADORA - CalculatorTab.tsx

### ❌ ERROR 1: Fórmula de Cálculo Focal INCORRECTA (línea 155)

**Código actual:**
```typescript
const calculatedFocal = (store.sensorWidth * desiredWd) / desiredWd;
```

**Problema:** Esto SIEMPRE resulta en `store.sensorWidth` (la división se cancela)
- Si `desiredWd = 25` y `sensorWidth = 6.4`:
  - Resultado: `(6.4 * 25) / 25 = 6.4` ❌

**Fórmula correcta:**
```
FOV = (SensorWidth / Focal) × WD
Despejando Focal:
Focal = (SensorWidth × WD) / FOV_deseado
```

**Código correcto:**
```typescript
const calculatedFocal = (store.sensorWidth * wdMm) / desiredFov;
```

**Ejemplo correcto:**
- Sensor Width: 6.4 mm
- Working Distance: 1000 mm
- FOV Deseado: 50 mm
- Focal = (6.4 × 1000) / 50 = 128 mm ✅

---

### ❌ ERROR 2: Variable `desiredWd` mal nombrada en target "focalLength" (línea 149-152, 155, 158)

**Problema:** La variable se llama `desiredWd` pero se usa como FOV deseado cuando el target es "focalLength"

**Situación confusa:**
- `desiredFov` se usa cuando target = "workingDistance"
- `desiredWd` se usa cuando target = "focalLength"
- Pero en realidad, cuando calculamos Focal, el valor deseado es el **FOV**, no WD

**Debería ser:**
```typescript
// Cuando target = workingDistance: usa FOV deseado
// Cuando target = focalLength: TAMBIÉN usa FOV deseado
// NO debería haber `desiredWd` en absoluto
```

---

### ❌ ERROR 3: Cálculo de FOV en target "focalLength" es redundante e innecesario (línea 158)

**Código actual:**
```typescript
const fovDesired = (store.sensorWidth / calculatedFocal) * wdMm;
```

**Problema:** Esto recalcula el FOV del focal calculado, pero es redundante.
- Si queremos un FOV deseado de 50 mm y calculamos focal, el FOV resultante DEBE ser 50 mm
- Esta línea vuelve a calcularlo, introduciendo posibles inconsistencias

**Solución:** Usar directamente `desiredFov` como el FOV horizontal resultante:
```typescript
// El FOV horizontal debería ser el que especificamos
const fovH = desiredFov; // Es el que pedimos
```

---

### ❌ ERROR 4: Falta el campo input para especificar FOV deseado cuando target = "focalLength"

**Código actual (línea 334-345):**
```typescript
{isFocalLengthTarget && (
  <FormInput
    label="FOV Deseado"
    type="number"
    value={desiredFov}  // Aquí se usa desiredFov ✓
    onChange={(v) => setDesiredFov(...)}  // Correcto ✓
    ...
  />
)}
```

**Problema:** El campo existe pero tiene el mismo nombre que en workingDistance target
- UI confusa: dos targets diferentes pero el mismo nombre de campo

**Debería estar más claro:** 
```typescript
{isFocalLengthTarget && (
  <FormInput
    label="FOV Horizontal Deseado"
    type="number"
    value={desiredFov}
    onChange={(v) => setDesiredFov(typeof v === 'string' ? parseFloat(v) : v)}
    unit="mm"
    step="1"
    min={0.1}
    tooltip="FOV horizontal que quieres lograr"
  />
)}
```

---

## DEPENDENCIAS DE PARÁMETROS

### ✓ CORRECTO: Sensor Format → Ancho/Alto
- Línea 39-46: Cuando selecciona formato, actualiza automáticamente width/height
- Cuando modifica width/alto manualmente, cambia formato a "custom"

### ✓ CORRECTO: Cálculo target deshabilita campos
- Línea 193-195: Se definen correctamente los targets
- Línea 301, 315: Se deshabilita Focal o WD según target

### ✓ CORRECTO: Unit conversion para WD
- Línea 27-37: convertFromMm y convertToMm funcionan correctamente
- Línea 307-311: Convierte WD display según unidad seleccionada

---

## RESUMEN DE CORRECCIONES NECESARIAS

| # | Archivo | Línea | Tipo | Urgencia |
|---|---------|-------|------|----------|
| 1 | CalculatorTab.tsx | 155 | Fórmula matemática | 🔴 CRÍTICA |
| 2 | CalculatorTab.tsx | 149-186 | Variable naming | 🟡 ALTA |
| 3 | CalculatorTab.tsx | 158 | Lógica redundante | 🟡 ALTA |
| 4 | CalculatorTab.tsx | 334 | UI claridad | 🟢 BAJA |

---

## VERIFICACIÓN DE FÓRMULAS

### FOV (Field of View) ✓
```
FOV_H = (SensorWidth / Focal) × WorkingDistance
FOV_V = (SensorHeight / Focal) × WorkingDistance
✓ Implementado correctamente en línea 76-77
```

### Magnification ✓
```
Mag = Focal / WorkingDistance
✓ Implementado correctamente en línea 78, 116, 160
```

### Max FPS ✓
```
MaxFPS = 1000 / (Exposure + Readout)
✓ Implementado correctamente en línea 80, 118, 162
```

### Motion Blur ✓
```
MotionBlur = (Velocity / PixelSize_mm) × Exposure / 1000
✓ Implementado correctamente en línea 81, 119, 163
```

### Working Distance Calculation ✓
```
WD = FOV × Focal / SensorWidth
✓ Implementado correctamente en línea 114
```

### Focal Length Calculation ❌
```
Focal = SensorWidth × WD / FOV_deseado
❌ INCORRECTO en línea 155: (W * WD) / WD = W
✓ CORRECTO debería ser: (W * WD) / FOV
```

---
