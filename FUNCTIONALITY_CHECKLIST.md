# ✅ RUST Lens Calculator - Checklist de Funcionalidad 100%

## 🎯 Estado: EN PROGRESO

---

## 📊 PESTAÑA 1: CALCULADORA

### Requisitos:
- [ ] Seleccionar formato de sensor (1/2.3", 2/3", 1", APS-C, Full Frame, Custom)
- [ ] Modificar ancho/alto del sensor
- [ ] Modificar tamaño de píxel
- [ ] Modificar resolución (H x V)
- [ ] Seleccionar qué calcular (FOV / WD / Focal)
- [ ] Modificar focal length (deshabilitado si se calcula)
- [ ] Modificar working distance (deshabilitado si se calcula)
- [ ] Modificar exposición
- [ ] Modificar velocidad del objeto
- [ ] Modificar readout time
- [ ] Botón CALCULAR funciona
- [ ] Muestra FOV H y FOV V correctos
- [ ] Muestra Magnification correcto
- [ ] Muestra Max FPS correcto
- [ ] Muestra Spatial Resolution
- [ ] Muestra Motion Blur
- [ ] Los valores se guardan en historial
- [ ] Manejo de errores (valores inválidos)

### Fórmulas a verificar:
```
FOV_H = (SensorWidth / Focal) × WD
FOV_V = (SensorHeight / Focal) × WD
Magnification = Focal / WD
MaxFPS = 1000 / (Exposure + Readout)
MotionBlur = (Velocity / PixelSize) × Exposure / 1000
```

---

## 📋 PESTAÑA 2: DIAGNÓSTICO

### Requisitos:
- [ ] Muestra historial de últimos cálculos
- [ ] Muestra hasta 50 cálculos
- [ ] Muestra timestamp de cada cálculo
- [ ] Botón "Limpiar" borra historial
- [ ] Botón "Copiar" copia como texto
- [ ] Los cálculos se agregan automáticamente

### Campos a mostrar:
- [ ] Timestamp
- [ ] Focal Length
- [ ] Working Distance
- [ ] FOV Horizontal
- [ ] Magnification

---

## 📐 PESTAÑA 3: PROFUNDIDAD DE CAMPO (DOF)

### Requisitos:
- [ ] Mostrar Focal Length (lectura: del principal)
- [ ] Mostrar Working Distance (lectura: del principal)
- [ ] Ingresar f-number (aperture)
- [ ] Ingresar circle of confusion (CoC)
- [ ] Ingresar distancia mínima de enfoque
- [ ] Botón "Auto" para usar píxel size
- [ ] Botón CALCULAR funciona
- [ ] Muestra distancia hiperfocal
- [ ] Muestra límite cercano de enfoque
- [ ] Muestra límite lejano de enfoque
- [ ] Muestra DOF total (Far - Near)
- [ ] Manejo de límite infinito (∞)

### Fórmulas a verificar:
```
Hyperfocal = (f² / (N × c)) + f
Near = (H × s) / (H + (s - f))
Far = (H × s) / (H - (s - f))
DOF_Total = Far - Near
```

---

## 🔬 PESTAÑA 4: VISUALIZACIÓN ÓPTICA

### Requisitos:
- [ ] Gráfico se actualiza automáticamente
- [ ] Muestra OBJETO (flecha amarilla)
- [ ] Muestra LENTE (círculo azul)
- [ ] Muestra SENSOR (rectángulo verde)
- [ ] Muestra RAYOS ÓPTICOS (líneas rosas)
- [ ] Muestra EJE ÓPTICO (línea punteada)
- [ ] Anotaciones de distancias (WD, f)
- [ ] Grid de referencia
- [ ] Escalado automático según valores
- [ ] Información de parámetros en esquina

### Datos mostrados en lado derecho:
- [ ] Parámetros de entrada (Focal, WD, Sensor, Píxel)
- [ ] Resultados (FOV H, FOV V, Mag)
- [ ] Leyenda visual (colores)
- [ ] Notas sobre aproximaciones

---

## ⚡ PESTAÑA 5: FRAME RATE & BLUR

### Requisitos:
- [ ] Ingresar exposición (ms)
- [ ] Ingresar readout (ms)
- [ ] Ingresar FPS máximo del datasheet (opcional)
- [ ] Ingresar velocidad del objeto
- [ ] Ingresar tamaño de píxel (lectura: del principal)
- [ ] Botón CALCULAR funciona
- [ ] Muestra FPS final calculado
- [ ] Muestra FPS teórico máximo
- [ ] Muestra motion blur en píxeles
- [ ] Indicador de calidad (Excellent/Good/Acceptable/Poor)
- [ ] Barra de progreso del blur
- [ ] Resumen de tiempos

### Indicadores de calidad:
- [ ] Excellent: < 0.1 px
- [ ] Good: 0.1 - 0.5 px
- [ ] Acceptable: 0.5 - 1.0 px
- [ ] Poor: > 1.0 px

---

## 🔄 PESTAÑA 6: COMPARADOR

### Requisitos:
- [ ] Botón "Config 1" guarda configuración actual
- [ ] Botón "Config 2" guarda configuración actual
- [ ] Botón "Intercambiar" cambia posiciones
- [ ] Botón "Limpiar" limpia ambas
- [ ] Muestra lado a lado las 2 configuraciones
- [ ] Muestra diferencias (Δ) entre configs
- [ ] Resalta diferencias en rojo si son > threshold
- [ ] Muestra:
  - [ ] Cámara / Lente
  - [ ] Focal
  - [ ] Working Distance
  - [ ] FOV H
  - [ ] Magnification

---

## 📖 PESTAÑA 7: LECTURA DE CÓDIGOS

### Requisitos:
- [ ] Ingresar mm por píxel
- [ ] Botón "Usar resolución sensor" - calcula automático
- [ ] Ingresar tamaño de módulo (mm)
- [ ] Ingresar umbral (píxeles, default = 3)
- [ ] Botón COMPROBAR funciona
- [ ] Muestra píxeles por módulo
- [ ] Muestra veredicto (Readable/Marginal/Not Readable)
- [ ] Barra de progreso de legibilidad (0-100%)
- [ ] Muestra detalles: mm/px, módulo, ratio

### Veredicto (AIM/ISO):
- [ ] Readable: PixelsPerModule ≥ Threshold × 2
- [ ] Marginal: PixelsPerModule ≥ Threshold
- [ ] Not Readable: PixelsPerModule < Threshold

---

## 🔐 PESTAÑA 8: ADMIN (Básico)

### Requisitos:
- [ ] Pantalla de login
- [ ] Usuario: admin, Contraseña: admin123
- [ ] Panel de admin muestra:
  - [ ] Gestión de Usuarios
  - [ ] Gestión de Cámaras
  - [ ] Gestión de Lentes
  - [ ] Configuración

---

## 🔧 FUNCIONALIDADES TRANSVERSALES

### Store y Estado Global:
- [ ] Los valores se guardan en Zustand store
- [ ] Los valores persisten entre pestañas
- [ ] El historial se guarda
- [ ] Los cálculos se agregan automáticamente al historial

### Validaciones:
- [ ] Todos los campos numéricos > 0
- [ ] Campos deshabilitados según qué se calcula
- [ ] Mensajes de error claros
- [ ] Botón Calcular deshabilitado si faltan parámetros

### Conversión de Unidades:
- [ ] mm, cm, in funcionan correctamente
- [ ] Working Distance convierte según unidad seleccionada

### UI/UX:
- [ ] Todos los botones responden
- [ ] Inputs aceptan modificaciones
- [ ] Gráfico se actualiza en tiempo real
- [ ] Sin scroll innecesario
- [ ] Errores mostrados claramente

---

## 📝 Notas de Testing

### Valores de Prueba Recomendados:

**Test 1 - Básico:**
- Sensor: 1/2.3" (6.4×4.8 mm)
- Focal: 50 mm
- WD: 1000 mm
- Esperado FOV_H: 128 mm, Mag: 0.05

**Test 2 - DOF:**
- Focal: 25 mm
- WD: 500 mm
- f-number: 2.8
- CoC: 0.003 mm
- Esperado: Hiperfocal > 0

**Test 3 - Motion Blur:**
- Velocidad: 100 mm/s
- Exposición: 10 ms
- Píxel: 3.5 µm
- Esperado: Blur ≈ 285.7 px (POOR)

**Test 4 - Códigos:**
- mm/px: 0.01
- Módulo: 2 mm
- Umbral: 3
- Esperado: 200 px/módulo = READABLE

---

## ✅ Criterio de Aceptación

- ✅ Todas las 7 pestañas funcionan
- ✅ Todos los cálculos son matemáticamente correctos
- ✅ Los datos persisten entre pestañas
- ✅ El gráfico se renderiza correctamente
- ✅ Sin errores en consola
- ✅ UI responsiva y profesional

---

**Última actualización:** 2026-07-06  
**Estado:** INICIANDO VERIFICACIÓN
