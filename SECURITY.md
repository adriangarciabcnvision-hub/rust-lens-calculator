# Seguridad — RUST Lens Calculator Web

Última revisión: 2026-07-09

## ⚠️ Vulnerabilidad corregida esta revisión

**La contraseña por defecto (`admin123`) aparecía en texto plano en la pestaña Ayuda**,
visible para cualquier visitante de la web, sin necesidad de iniciar sesión. Se ha eliminado
esa mención por completo. Si tu instancia sigue usando `admin123`, cámbiala ya desde
Admin → 🔑 junto a tu usuario — sigue siendo la puerta más obvia de entrada mientras no se cambie.

## Medidas aplicadas

| Medida | Detalle |
|---|---|
| Contraseñas hasheadas | SHA-256 + salt aleatoria por usuario (formato `v1$salt$hash`), vía Web Crypto. Nunca se almacena la contraseña en claro: la semilla inicial ya se distribuye pre-hasheada, las contraseñas antiguas en texto plano se migran solas al hash en el primer login, y además `syncFromCloud` auto-repara cualquier contraseña en claro que encuentre en Supabase (por ejemplo de una fila creada a mano) sin esperar a que ese usuario inicie sesión. |
| Cabeceras de seguridad | `public/_headers` (Cloudflare Pages): CSP restrictiva (solo scripts propios y conexión a Supabase), `X-Frame-Options: DENY` (anti-clickjacking), `nosniff`, `Referrer-Policy`, `Permissions-Policy`. |
| Dependencias saneadas | `xlsx` actualizado a 0.20.3 (corrige CVE-2023-30533 prototype pollution y CVE-2024-22363 ReDoS). Sin `jspdf` ni `dompurify`: el export a PDF usa el diálogo de impresión nativo del navegador (`window.print()`, ver `lib/printReport.ts`), evitando la cadena de CVEs críticos de jsPDF (ReDoS, path traversal, inyección de JS en formularios PDF) que descartamos al valorar reintroducir esa librería. Eliminadas también html2canvas, recharts, date-fns, clsx, auth-helpers (sin uso). |
| Superficie reducida | Eliminadas las rutas huérfanas `/app` y `/calculator` y la API muerta. |
| XSS | React escapa todo el contenido por defecto; no se usa `dangerouslySetInnerHTML` en ningún componente (verificado con búsqueda exhaustiva). El informe PDF escapa manualmente el HTML que genera (`escapeHtml` en `printReport.ts`, cubre título, secciones y cada fila) antes de escribirlo en la ventana nueva — incluye nombres de cámara/lente, que son texto libre introducido por técnicos. Los Excel importados se muestran como texto. |
| Aviso de credencial por defecto | El panel avisa si se entra con admin/admin123 y pide cambiarla — pero esa mención **ya no aparece en ningún sitio público** (ver arriba). |
| `.env.local` fuera de git | Verificado en `.gitignore` y en `git status`: nunca se ha comprometido. Las claves `NEXT_PUBLIC_*` sí viajan en el bundle público — es el diseño esperado de Supabase (protegido por RLS, ver limitación estructural abajo), no un descuido. |
| Ventana de impresión sin script inline | `printReport.ts` ya no inyecta un `<script>` dentro del HTML que genera; el `print()` se dispara desde la ventana que lo abre. Menos superficie de inyección aunque sea contenido propio. |

Avisos de `npm audit` restantes: solo advisories de Next.js/PostCSS que afectan a su **servidor**
(Image Optimizer, middleware, RSC). Esta app se publica como **export estático** en
Cloudflare Pages — ese servidor no existe en producción, no aplican. Verificado 2026-07-09:
0 vulnerabilidades relacionadas con dependencias del lado cliente (xlsx, zustand, supabase-js).

## Límite estructural (importante, leer)

Esta app es 100 % cliente: **toda** la lógica, incluidos los roles, corre en el navegador
del usuario, y la clave `anon` de Supabase viaja en el JavaScript público con políticas RLS
abiertas. Consecuencias:

1. **Cualquiera con conocimientos técnicos puede leer/escribir las tablas de Supabase
   directamente** (catálogos, solicitudes y usuarios —ahora solo hashes—), sin pasar por la UI.
2. Los roles (admin/teamleader) son un control de **conveniencia**, no de seguridad: se
   pueden saltar desde la consola del navegador.
3. El hash SHA-256+salt protege las contraseñas frente a lectura, pero un atacante con
   acceso a la tabla podría *sobrescribir* un hash y entrar.

**Es un nivel adecuado para una herramienta interna de equipo, no para datos sensibles.**

## Cómo cerrarlo de verdad (siguiente nivel, si se necesita)

- Migrar el login a **Supabase Auth** (usuarios gestionados por Supabase, contraseñas con
  bcrypt en su lado, sesiones con JWT).
- Reescribir las políticas RLS para que dependan del rol del JWT (`auth.uid()`), de forma
  que la base de datos misma rechace escrituras no autorizadas.
- Roles en una tabla `profiles` protegida, aprobaciones con funciones RPC `security definer`.

Esto requiere una sesión de trabajo dedicada (afecta a login, sync y políticas).
