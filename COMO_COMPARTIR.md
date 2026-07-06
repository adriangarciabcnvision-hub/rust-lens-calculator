# 🌐 CÓMO COMPARTIR LA APP CON UN COMPAÑERO

## 3 OPCIONES

---

## OPCIÓN 1: Compartir en Local Network (RECOMENDADO - Rápido)

### Paso 1: Instala Node.js
**Si no lo tienes ya**

1. Descarga desde: https://nodejs.org (versión LTS)
2. Instala normalmente
3. Abre terminal (PowerShell) y verifica:
   ```
   node --version
   npm --version
   ```

### Paso 2: Inicia el servidor
```bash
cd "H:\Aplicaciones\Claude\RustLensCalculatorWeb"
npm run dev
```

Verás algo como:
```
> ready - started server on 0.0.0.0:3000
```

### Paso 3: Dale la URL a tu compañero
- Si está en la misma red local (misma WiFi/LAN):
  ```
  http://[TU_IP_LOCAL]:3000
  ```

**¿Cómo encontrar tu IP local?**

PowerShell:
```powershell
ipconfig
```
Busca "IPv4 Address" (algo como `192.168.x.x`)

**Ejemplo:**
```
http://192.168.1.100:3000
```

### Ventajas:
- ✅ Rápido
- ✅ Funciona ahora
- ✅ Gratis
- ✅ Tu compañero ve cambios en tiempo real

### Desventajas:
- ❌ Solo funciona si están en la misma red
- ❌ Se cierra cuando cierres terminal
- ❌ No funciona desde internet

---

## OPCIÓN 2: Deploy a Vercel (RECOMENDADO - Profesional)

### Paso 1: Crea cuenta en GitHub
1. Ve a https://github.com/signup
2. Crea una cuenta (gratis)

### Paso 2: Sube tu código a GitHub
```bash
cd "H:\Aplicaciones\Claude\RustLensCalculatorWeb"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/rust-lens-calculator.git
git branch -M main
git push -u origin main
```

### Paso 3: Conecta Vercel a GitHub
1. Ve a https://vercel.com/signup
2. Click "Continue with GitHub"
3. Autoriza Vercel
4. Click "Import Project"
5. Selecciona tu repo `rust-lens-calculator`
6. Click "Deploy"

**¡Listo!** En 2-3 minutos tendrás URL como:
```
https://rust-calculator-xyz123.vercel.app
```

### Paso 4: Comparte la URL
Dale a tu compañero el link de Vercel. Funciona desde cualquier parte del mundo.

### Ventajas:
- ✅ Accesible desde cualquier lugar
- ✅ URL pública permanente
- ✅ Gratis para tráfico bajo
- ✅ Actualizaciones automáticas (git push)
- ✅ Profesional

### Desventajas:
- ⏱️ Toma 10-15 min la primera vez
- Requiere GitHub y Vercel (ambos gratis)

---

## OPCIÓN 3: Ejecutable Portable (Más Complejo)

### Para que tu compañero lo use sin instalar nada:

1. Hacer build:
```bash
npm run build
```

2. Crear ejecutable con Electron/Tauri (avanzado)

**Recomendación:** Usa OPCIÓN 1 u OPCIÓN 2 en lugar de esto.

---

## 🎯 RECOMENDACIÓN FINAL

| Situación | Opción |
|-----------|--------|
| Rápido test (hoy) | OPCIÓN 1 (Local) |
| Compartir profesional | OPCIÓN 2 (Vercel) |
| Producción seria | OPCIÓN 2 (Vercel) + Supabase (Ver SCALING_PLAN.md) |

---

## PASO A PASO RÁPIDO (OPCIÓN 1)

### En tu PC:
```bash
# Terminal
cd "H:\Aplicaciones\Claude\RustLensCalculatorWeb"
npm run dev

# Copiar línea que aparece:
# ► Local:        http://localhost:3000

# Pero para tu compañero necesitas IP local:
ipconfig
# Buscar IPv4 Address: 192.168.1.XXX

# URL a compartir:
http://192.168.1.XXX:3000
```

### Para tu compañero:
- Toma la URL
- Pega en navegador
- ¡Funciona!

---

## PASO A PASO VERCEL (OPCIÓN 2)

1. GitHub cuenta (2 min) → https://github.com/signup
2. Sube código a GitHub (5 min)
3. Vercel (5 min) → https://vercel.com → Connect GitHub → Deploy
4. Comparte URL → https://tu-app.vercel.app

**Total: 15 minutos**

---

## TROUBLESHOOTING

### "npm: command not found"
→ Instala Node.js https://nodejs.org

### "Port 3000 already in use"
→ Otro proceso usa puerto 3000. Cierra otros navegadores/apps.

### "Tu compañero no ve cambios"
→ A) Si es red local, hace refrescar (F5) navegador
→ B) Si es Vercel, espera 1-2 min después de hacer `git push`

### "¿Por qué sale 'localhost:3000' en la terminal?"
→ Es para tu PC. Para otros en la red, usa tu IP local (192.168.x.x)

---

## SEGURIDAD

- ⚠️ OPCIÓN 1 (Local): Solo funciona en tu red, es seguro
- ✅ OPCIÓN 2 (Vercel): Vercel maneja certificados SSL/HTTPS, es seguro
- ✅ Tu código está en tu control, no hay datos de terceros

---

## PRÓXIMOS PASOS

### Si usas Vercel, luego puedes agregar:
1. **Base de datos** (Supabase) - Ver SCALING_PLAN.md
2. **Autenticación** - Usuario/contraseña
3. **Historial persistente** - Guardar cálculos en cloud
4. **Admin panel** - Gestionar usuarios/cámaras

Ver: `SCALING_PLAN.md`

---

## RESUMEN

```
HOY: npm run dev → http://192.168.1.X:3000 → Comparte URL
LUEGO: GitHub + Vercel → https://app.vercel.app → Permanente
DESPUÉS: Supabase + Autenticación → Producción
```

---

**¿Preguntas?** Este documento te cubre las 3 opciones. Elige la que prefieras.

