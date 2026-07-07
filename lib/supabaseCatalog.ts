import type { StoredCamera, StoredLens, CatalogRequest } from './dataStore';

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

export async function fetchCatalog(): Promise<{ cameras: StoredCamera[]; lenses: StoredLens[]; requests: CatalogRequest[] } | null> {
  const supabase = await getClient();
  if (!supabase) return null;
  const [cams, lens, reqs] = await Promise.all([
    supabase.from('cameras').select('*').order('name'),
    supabase.from('lenses').select('*').order('name'),
    supabase.from('catalog_requests').select('*').order('created_at', { ascending: false }),
  ]);
  if (cams.error || lens.error || reqs.error) {
    throw new Error(cams.error?.message || lens.error?.message || reqs.error?.message);
  }
  return {
    cameras: cams.data.map((c: any) => ({
      id: c.id, name: c.name, sensorWidth: Number(c.sensor_width), sensorHeight: Number(c.sensor_height),
      pixelSize: Number(c.pixel_size), resolutionH: c.resolution_h, resolutionV: c.resolution_v,
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
