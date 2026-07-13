import type { StoredCamera, StoredLens, CatalogRequest, StoredUser } from './dataStore';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Configurado solo si hay credenciales reales (no los placeholders de .env.local.example)
export const supabaseConfigured =
  url.startsWith('https://') && url.includes('.supabase.co') && !url.includes('your-project') && key.length > 40;

let clientPromise: Promise<any> | null = null;

// Carga diferida: supabase-js solo se descarga si hay credenciales configuradas
async function getClient() {
  if (!supabaseConfigured) return null;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(url, key));
  }
  return clientPromise;
}

export async function fetchCatalog(): Promise<{ cameras: StoredCamera[]; lenses: StoredLens[]; requests: CatalogRequest[]; users: StoredUser[] | null } | null> {
  const supabase = await getClient();
  if (!supabase) return null;
  const [cams, lens, reqs, usrs] = await Promise.all([
    supabase.from('cameras').select('*').order('name'),
    supabase.from('lenses').select('*').order('name'),
    supabase.from('catalog_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('app_users').select('*').order('username'),
  ]);
  if (cams.error || lens.error || reqs.error) {
    throw new Error(cams.error?.message || lens.error?.message || reqs.error?.message);
  }
  if (usrs.error) {
    // Tabla app_users aún no creada (esquema antiguo): sincroniza el resto y deja usuarios en local
    console.warn('[Supabase] tabla app_users no disponible:', usrs.error.message);
  }
  return {
    users: usrs.error
      ? null
      : usrs.data.map((u: any) => ({
          id: u.id, username: u.username, password: u.password, role: u.role, createdAt: u.created_at,
        })),
    cameras: cams.data.map((c: any) => ({
      id: c.id, name: c.name, sensorWidth: Number(c.sensor_width), sensorHeight: Number(c.sensor_height),
      pixelSize: Number(c.pixel_size), resolutionH: c.resolution_h, resolutionV: c.resolution_v,
      maxFps: c.max_fps !== undefined && c.max_fps !== null ? Number(c.max_fps) : undefined,
      readout: c.readout !== undefined && c.readout !== null ? Number(c.readout) : undefined,
    })),
    lenses: lens.data.map((l: any) => ({
      id: l.id, name: l.name, focalLength: Number(l.focal_length), aperture: l.aperture || undefined,
    })),
    requests: reqs.data.map((r: any) => ({
      id: r.id, type: r.type, requestedBy: r.requested_by, status: r.status,
      payload: r.payload, createdAt: r.created_at,
    })),
  };
}

export async function upsertCameras(cameras: StoredCamera[]) {
  const supabase = await getClient();
  if (!supabase) return;
  const { error } = await supabase.from('cameras').upsert(
    cameras.map((c) => ({
      id: c.id, name: c.name, sensor_width: c.sensorWidth, sensor_height: c.sensorHeight,
      pixel_size: c.pixelSize, resolution_h: c.resolutionH, resolution_v: c.resolutionV,
      max_fps: c.maxFps ?? null, readout: c.readout ?? null,
    })),
    { onConflict: 'name' }
  );
  if (error) throw new Error(error.message);
}

export async function deleteCameraRemote(id: string) {
  const supabase = await getClient();
  if (!supabase) return;
  await supabase.from('cameras').delete().eq('id', id);
}

export async function upsertLenses(lenses: StoredLens[]) {
  const supabase = await getClient();
  if (!supabase) return;
  const { error } = await supabase.from('lenses').upsert(
    lenses.map((l) => ({ id: l.id, name: l.name, focal_length: l.focalLength, aperture: l.aperture || null })),
    { onConflict: 'name' }
  );
  if (error) throw new Error(error.message);
}

export async function deleteLensRemote(id: string) {
  const supabase = await getClient();
  if (!supabase) return;
  await supabase.from('lenses').delete().eq('id', id);
}

export async function insertRequestRemote(request: CatalogRequest) {
  const supabase = await getClient();
  if (!supabase) return;
  const { error } = await supabase.from('catalog_requests').insert({
    id: request.id, type: request.type, requested_by: request.requestedBy,
    status: request.status, payload: request.payload, created_at: request.createdAt,
  });
  if (error) throw new Error(error.message);
}

export async function updateRequestStatusRemote(id: string, status: 'approved' | 'rejected') {
  const supabase = await getClient();
  if (!supabase) return;
  await supabase.from('catalog_requests').update({ status }).eq('id', id);
}

export async function upsertUsers(users: StoredUser[]) {
  const supabase = await getClient();
  if (!supabase) return;
  const { error } = await supabase.from('app_users').upsert(
    users.map((u) => ({ id: u.id, username: u.username, password: u.password, role: u.role, created_at: u.createdAt })),
    { onConflict: 'username' }
  );
  if (error) throw new Error(error.message);
}

export async function deleteUserRemote(id: string) {
  const supabase = await getClient();
  if (!supabase) return;
  await supabase.from('app_users').delete().eq('id', id);
}

export async function updateUserPasswordRemote(id: string, password: string) {
  const supabase = await getClient();
  if (!supabase) return;
  await supabase.from('app_users').update({ password }).eq('id', id);
}
