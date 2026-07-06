# ✅ VERIFICACIÓN COMPLETA DE CÁLCULOS

## ESCENARIOS DE TEST CON FÓRMULAS VERIFICADAS

---

### TEST 1️⃣: CÁLCULO BÁSICO DE FOV (Calcular: FOV)

**Inputs:**
- Sensor Format: 1/2.3" → Ancho: 6.4 mm, Alto: 4.8 mm
- Focal Length: 50 mm
- Working Distance: 1000 mm
- Exposición: 33 ms
- Readout: 10 ms
- Velocidad: 100 mm/s
- Píxel: 3.5 µm

**Cálculos Esperados:**

| Parámetro | Fórmula | Cálculo | Resultado | Precisión |
|-----------|---------|---------|-----------|-----------|
| FOV Horizontal | FOV_H = (W / f) × WD | (6.4 / 50) × 1000 | **128 mm** | 2 dec |
| FOV Vertical | FOV_V = (H / f) × WD | (4.8 / 50) × 1000 | **96 mm** | 2 dec |
| Magnification | Mag = f / WD | 50 / 1000 | **0.05 ×** | 4 dec |
| Max FPS | MaxFPS = 1000 / (E + R) | 1000 / (33 + 10) | **21.9 fps** | 1 dec |
| Spatial Res | SR = Píxel / 1000 | 3.5 / 1000 | **0.0035 mm** | 4 dec |
| Motion Blur | MB = (V / Píxel_mm) × E / 1000 | (100 / 0.0035) × 33 / 1000 | **942.86 px** | 2 dec |

**Verificación:** ✅ Todos son resultados POBRES de Motion Blur (> 1.0 px)

---

### TEST 2️⃣: CÁLCULO DE WORKING DISTANCE (Calcular: WD)

**Inputs:**
- Sensor Format: 1/2.3" → Ancho: 6.4 mm, Alto: 4.8 mm
- Focal Length: 50 mm
- **FOV Deseado: 64 mm** (lo que QUEREMOS)
- Exposición: 33 ms
- Readout: 10 ms
- Velocidad: 100 mm/s
- Píxel: 3.5 µm

**Cálculos Esperados:**

| Parámetro | Fórmula | Cálculo | Resultado | Notas |
|-----------|---------|---------|-----------|-------|
| **WD Calculado** | **WD = (FOV × f) / W** | **(64 × 50) / 6.4** | **500 mm** | 📌 SE CALCULA |
| FOV Horizontal | FOV_H = (W / f) × WD | (6.4 / 50) × 500 | **64 mm** | ✓ Coincide |
| FOV Vertical | FOV_V = (H / f) × WD | (4.8 / 50) × 500 | **48 mm** | ✓ Proporcional |
| Magnification | Mag = f / WD | 50 / 500 | **0.1 ×** | ✓ Correcto |

**Verificación:** 
- ✅ WD se calcula correctamente
- ✅ Cuando lo usamos en FOV_H, nos da exactamente lo que pedimos (64 mm)
- ✅ La dependencia FOV ← WD es correcta

---

### TEST 3️⃣: CÁLCULO DE FOCAL LENGTH (Calcular: f)

**Inputs:**
- Sensor Format: 1/2.3" → Ancho: 6.4 mm, Alto: 4.8 mm
- Working Distance: 1000 mm
- **FOV Deseado: 128 mm** (lo que QUEREMOS)
- Exposición: 33 ms
- Readout: 10 ms
- Velocidad: 100 mm/s
- Píxel: 3.5 µm

**Cálculos Esperados:**

| Parámetro | Fórmula | Cálculo | Resultado | Notas |
|-----------|---------|---------|-----------|-------|
| **Focal Calculado** | **f = (W × WD) / FOV** | **(6.4 × 1000) / 128** | **50 mm** | 📌 SE CALCULA |
| FOV Horizontal | FOV_H = (W / f) × WD | (6.4 / 50) × 1000 | **128 mm** | ✓ Coincide |
| FOV Vertical | FOV_V = (H / f) × WD | (4.8 / 50) × 1000 | **96 mm** | ✓ Proporcional |
| Magnification | Mag = f / WD | 50 / 1000 | **0.05 ×** | ✓ Correcto |

**Verificación:**
- ✅ Focal se calcula correctamente (formula sin errores)
- ✅ Cuando lo usamos en FOV_H, nos da exactamente lo que pedimos (128 mm)
- ✅ La dependencia f ← FOV es correcta

---

### TEST 4️⃣: CONVERSIÓN DE UNIDADES (WD)

**Input Base:** Working Distance = 1000 mm

**Conversiones Esperadas:**

| Unidad Seleccionada | Conversión | Valor Mostrado | Verificación |
|------------------|------------|-----------------|--------------|
| mm | 1000 mm × 1 | **1000 mm** | ✓ Base |
| cm | 1000 mm ÷ 10 | **100 cm** | ✓ 1000/10 = 100 |
| in | 1000 mm ÷ 25.4 | **39.37 in** | ✓ 1000/25.4 ≈ 39.37 |

**Inversas (si usuario ingresa 100 cm):**
- Almacenar en store: 100 × 10 = **1000 mm** ✓

**Verificación:**
- ✅ convertToMm(100, 'cm') = 1000 mm
- ✅ convertFromMm(1000, 'cm') = 100 cm
- ✅ No hay pérdida de precisión

---

### TEST 5️⃣: PROFUNDIDAD DE CAMPO (DOF)

**Inputs:**
- Focal Length: 50 mm (del calculador)
- Working Distance: 1000 mm (del calculador)
- f-Number: 2.8
- Circle of Confusion: 0.003 mm
- Min Focus Distance: 0.3 mm

**Cálculos Esperados:**

| Parámetro | Fórmula | Cálculo | Resultado |
|-----------|---------|---------|-----------|
| Hyperfocal | H = (f² / (N × c)) + f | (50² / (2.8 × 0.003)) + 50 | **≈ 297,841 mm** |
| Near Limit | N = (H × s) / (H + (s - f)) | (297841 × 1000) / (297841 + 950) | **≈ 996.8 mm** |
| Far Limit | F = (H × s) / (H - (s - f)) | (297841 × 1000) / (297841 - 950) | **≈ 1003.2 mm** |
| DOF Total | DOF = F - N | 1003.2 - 996.8 | **≈ 6.4 mm** |

**Verificación:**
- ✅ Hiperfocal es un valor grande (está lejos)
- ✅ Near < Working Distance < Far (el objeto está enfocado)
- ✅ DOF es pequeño (apertura estrecha = DOF pequeño)

---

### TEST 6️⃣: MOTION BLUR

**Inputs:**
- Velocidad: 100 mm/s
- Exposición: 10 ms
- Píxel: 3.5 µm = 0.0035 mm

**Cálculos Esperados:**

| Parámetro | Fórmula | Cálculo | Resultado | Calidad |
|-----------|---------|---------|-----------|---------|
| Velocity (px/s) | V_px = V_mm / píxel_mm | 100 / 0.0035 | **28,571 px/s** | - |
| Motion Blur | MB = (V_px × E) / 1000 | (28,571 × 10) / 1000 | **285.71 px** | 🔴 POOR |

**Condiciones de Calidad:**
- Excellent: < 0.1 px ✨
- Good: 0.1 - 0.5 px 👍
- Acceptable: 0.5 - 1.0 px ⚠️
- Poor: > 1.0 px 🔴

**Verificación:**
- ✅ Cálculo correcto
- ✅ Clasificación correcta (Poor porque 285.71 > 1.0)

---

### TEST 7️⃣: LECTURA DE CÓDIGOS (Code Readability)

**Inputs:**
- mm por píxel: 0.01 mm
- Tamaño de módulo: 2 mm
- Umbral (threshold): 3 px

**Cálculos Esperados:**

| Parámetro | Fórmula | Cálculo | Resultado |
|-----------|---------|---------|-----------|
| Píxeles por Módulo | PPM = Módulo / mm_px | 2 / 0.01 | **200 px/módulo** |
| Veredicto | IF PPM ≥ T×2 → Readable | 200 ≥ 3×2=6 | **READABLE** ✅ |
| Legibilidad % | (PPM / (T×2)) × 100 | (200 / 6) × 100 | **3,333%** (capped 100%) |

**Veredictos AIM/ISO:**
- Readable: PPM ≥ 6 (threshold × 2)
- Marginal: PPM ≥ 3 (threshold)
- Not Readable: PPM < 3

**Verificación:**
- ✅ Cálculo correcto
- ✅ Veredicto correcto (READABLE)

---

## 🎯 CHECKLIST DE VALIDACIÓN FINAL

### Fórmulas Ópticas
- [ ] FOV_H = (W / f) × WD ✓
- [ ] FOV_V = (H / f) × WD ✓
- [ ] Mag = f / WD ✓
- [ ] MaxFPS = 1000 / (E + R) ✓
- [ ] MotionBlur = (V / píxel_mm) × E / 1000 ✓

### Cálculos Derivados
- [ ] WD = (FOV × f) / W ✓
- [ ] f = (W × WD) / FOV ✓

### Profundidad de Campo
- [ ] H = (f² / (N × c)) + f ✓
- [ ] Near = (H × s) / (H + (s - f)) ✓
- [ ] Far = (H × s) / (H - (s - f)) ✓
- [ ] DOF = Far - Near ✓

### Código Readability
- [ ] PPM = Módulo / mm_px ✓
- [ ] Veredicto: Readable/Marginal/Not Readable ✓

### Dependencias de Parámetros
- [ ] Formato Sensor → Ancho/Alto ✓
- [ ] Target → Deshabilita Focal/WD ✓
- [ ] Unit Conversion → WD display ✓
- [ ] Auto CoC → PixelSize ✓
- [ ] Auto mm/px → PixelSize ✓

### Validaciones
- [ ] Sin división por cero ✓
- [ ] Sin valores negativos en raíces ✓
- [ ] Manejo de infinito (Far limit) ✓
- [ ] Precisión decimales según especificación ✓

---

## 🧪 PRÓXIMOS PASOS DE TESTING

1. **Iniciar dev server**
   ```bash
   npm run dev
   ```

2. **Abrir navegador** en `http://localhost:3000`

3. **Probar cada escenario** con los valores de arriba

4. **Verificar resultados** usando calculadora online o Excel como referencia

5. **Reportar cualquier discrepancia** con screenshot y valores exactos

---

**Estado:** LISTO PARA TESTING  
**Última actualización:** 2026-07-06  
**Responsable:** Verificación manual requerida

