# Configurar Supabase (base de datos compartida)

Sin Supabase la app funciona igualmente, pero cada navegador guarda sus propios datos.
Con Supabase, el catálogo de cámaras/lentes y las solicitudes se comparten entre todos los usuarios.

## Pasos (una sola vez, ~5 minutos)

1. **Crear el proyecto**: entra en [supabase.com](https://supabase.com) → New project (el plan gratuito sobra).

2. **Crear las tablas**: en el dashboard del proyecto → **SQL Editor** → New query →
   pega el contenido completo de [`supabase-schema.sql`](supabase-schema.sql) → Run.

3. **Copiar las credenciales**: dashboard → **Settings → API**:
   - `Project URL` (ej. `https://abcdefgh.supabase.co`)
   - `anon public` key

4. **Ponerlas en `.env.local`** (este archivo, en la raíz del proyecto):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=TU-ANON-KEY
   ```

5. **Recompilar y desplegar**: ejecutar `deploy.bat`.
   (Las credenciales se incrustan en el build, por eso hay que redesplegar.)

## Cómo saber si está activo

En la pestaña **Admin → Configuración**, "Almacenamiento" mostrará
**"Supabase (compartido)"** en lugar de "Local (este navegador)".

## Qué se comparte y qué no

| Dato | Dónde se guarda |
|---|---|
| Catálogo de cámaras y lentes | Supabase (compartido) |
| Solicitudes de alta y su estado | Supabase (compartido) |
| Usuarios, roles y contraseñas | Supabase (compartido) |
| Sets guardados e historial | Local de cada navegador |

**Sin Supabase, los usuarios creados en un dispositivo NO existen en los demás** — cada
navegador tiene su propia copia local. Configurar Supabase es lo que los comparte.

Nota: las contraseñas se guardan hasheadas (SHA-256+salt) en la tabla `app_users`, nunca en
claro — aun así es un control de acceso ligero para uso interno, no un sistema de seguridad
robusto (ver `SECURITY.md`).

## Si ya tenías Supabase configurado antes de julio de 2026

Si tu proyecto de Supabase es anterior a la columna `max_fps` en cámaras, vuelve a pegar y
ejecutar `supabase-schema.sql` en el SQL Editor — es seguro repetirlo, solo añade lo que falte
sin borrar datos existentes.
