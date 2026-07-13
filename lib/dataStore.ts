import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StoredUser {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'teamleader' | 'technician' | 'normal';
  createdAt: string;
}

export const ROLE_LABELS: Record<StoredUser['role'], string> = {
  admin: 'Administrador',
  teamleader: 'Team Leader',
  technician: 'Técnico',
  normal: 'Normal',
};

export interface StoredCamera {
  id: string;

  name: string;               // ← seguir usándolo

  manufacturer?: string;
  model?: string;
  sensor?: string;

  interface?: string;
  shutter?: 'Global' | 'Rolling';
  color?: 'Mono' | 'Color';

  sensorWidth: number;
  sensorHeight: number;
  pixelSize: number;
  resolutionH: number;
  resolutionV: number;

  maxFps?: number;
  readout?: number;
}

export interface StoredLens {

  id: string;

  manufacturer?: string;

  model?: string;

  name: string;

  focalLength: number;

  aperture?: string;

  mount?: string;

  maxSensor?: string;

  telecentric?: string;

  workingDistanceMin?: number;

  workingDistanceMax?: number;

  sourceUrl?: string;

}

export interface CatalogRequest {
  id: string;
  type: 'camera' | 'lens';
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  payload: any; // Omit<StoredCamera,'id'> | Omit<StoredLens,'id'>
  createdAt: string;
}

export interface SavedSetParams {
  sensorWidth: number;
  sensorHeight: number;
  pixelSize: number;
  resolutionH: number;
  resolutionV: number;
  focalLength: number;
  workingDistance: number;
  exposure: number;
  readout: number;
  velocity: number;
  maxFps: number;
  fNumber: number;
  circleOfConfusion: number;
  minimumFocusDistance: number;
}

export interface SavedSet {
  id: string;
  name: string;
  createdAt: string;
  params: SavedSetParams;
  results: any;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Sincronización con Supabase: best-effort en segundo plano. Si falla (sin conexión,
// sin credenciales), el estado local sigue siendo válido y la app funciona igual.
const cloud = () => import('./supabaseCatalog');
const bestEffort = (fn: () => Promise<any>) => {
  fn().catch((e) => console.warn('[Supabase] sync falló:', e?.message || e));
};

// Auto-reparación: si algún usuario llega de Supabase con contraseña en claro
// (de antes de introducir el hash, o de una fila creada manualmente), se hashea
// y se sube de vuelta sin esperar a que ese usuario inicie sesión.
async function healPlaintextPasswords(users: StoredUser[]): Promise<StoredUser[]> {
  const { isHashed, hashPassword } = await import('./passwords');
  const toFix = users.filter((u) => !isHashed(u.password));
  if (!toFix.length) return users;
  const healed = await Promise.all(
    users.map(async (u) => (isHashed(u.password) ? u : { ...u, password: await hashPassword(u.password) }))
  );
  bestEffort(async () => (await cloud()).upsertUsers(healed.filter((u) => toFix.some((t) => t.id === u.id))));
  return healed;
}

interface DataState {
  users: StoredUser[];
  cameras: StoredCamera[];
  lenses: StoredLens[];
  savedSets: SavedSet[];
  requests: CatalogRequest[];
  cloudActive: boolean;

  syncFromCloud: () => Promise<void>;

  addUser: (user: Omit<StoredUser, 'id' | 'createdAt'>) => boolean;
  removeUser: (id: string) => void;
  updateUserPassword: (id: string, password: string) => void;

  importCameras: (cameras: Omit<StoredCamera, 'id'>[]) => number;
  removeCamera: (id: string) => void;

  importLenses: (lenses: Omit<StoredLens, 'id'>[]) => number;
  removeLens: (id: string) => void;

  addRequest: (request: Omit<CatalogRequest, 'id' | 'createdAt' | 'status'>) => void;
  resolveRequest: (id: string, approve: boolean) => void;

  saveSet: (set: Omit<SavedSet, 'id' | 'createdAt'>) => void;
  removeSet: (id: string) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      users: [
        // Contraseña inicial "admin123" ya hasheada (nunca en claro) — ver lib/passwords.ts
        {
          id: 'seed-admin',
          username: 'admin',
          password: 'v1$ad62dcca061cd06b6db10a90ff78b3e8$1e048a7b336761421a3f0bbdc2c4e12f1be4a57e65a757e0cada3f289138738c',
          role: 'admin',
          createdAt: '2026-07-06',
        },
      ],
      cameras: [],
      lenses: [],
      savedSets: [],
      requests: [],
      cloudActive: false,

      syncFromCloud: async () => {
        const mod = await cloud();
        if (!mod.supabaseConfigured) return;
        try {
          const data = await mod.fetchCatalog();
          if (data) {
            if (data.users === null) {
              // Tabla app_users no creada aún: sincroniza catálogos y mantén usuarios locales
              set({ cameras: data.cameras, lenses: data.lenses, requests: data.requests, cloudActive: true });
            } else if (data.users.length === 0) {
              // Primera sincronización: sube los usuarios locales (al menos el admin inicial)
              bestEffort(() => mod.upsertUsers(get().users));
              set({ cameras: data.cameras, lenses: data.lenses, requests: data.requests, cloudActive: true });
            } else {
              const healedUsers = await healPlaintextPasswords(data.users);
              set({ users: healedUsers, cameras: data.cameras, lenses: data.lenses, requests: data.requests, cloudActive: true });
            }
          }
        } catch (e: any) {
          console.warn('[Supabase] no se pudo sincronizar:', e?.message || e);
          set({ cloudActive: false });
        }
      },

      addUser: (user) => {
        if (get().users.some((u) => u.username === user.username)) return false;
        const full: StoredUser = { ...user, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ users: [...s.users, full] }));
        bestEffort(async () => (await cloud()).upsertUsers([full]));
        return true;
      },

      removeUser: (id) => {
        const s = get();
        const target = s.users.find((u) => u.id === id);
        if (!target) return;
        // Nunca eliminar el último administrador
        if (target.role === 'admin' && s.users.filter((u) => u.role === 'admin').length <= 1) return;
        set({ users: s.users.filter((u) => u.id !== id) });
        bestEffort(async () => (await cloud()).deleteUserRemote(id));
      },

      updateUserPassword: (id, password) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, password } : u)),
        }));
        bestEffort(async () => (await cloud()).updateUserPasswordRemote(id, password));
      },

      // Importación por nombre (sin distinguir mayúsculas): las filas nuevas sustituyen
      // a las existentes con el mismo nombre, para no acabar con "Basler" y "basler" duplicados
      importCameras: (cameras) => {
        const valid = cameras.filter(
          (c) => c.name && c.sensorWidth > 0 && c.sensorHeight > 0 && c.pixelSize > 0
        );
        if (!valid.length) return 0;
        const withIds = valid.map((c) => ({ ...c, id: uid() }));
        set((s) => ({
          cameras: [
            ...s.cameras.filter((c) => !valid.some((n) => n.name.toLowerCase() === c.name.toLowerCase())),
            ...withIds,
          ],
        }));
        bestEffort(async () => (await cloud()).upsertCameras(withIds));
        return valid.length;
      },

      removeCamera: (id) => {
        set((s) => ({ cameras: s.cameras.filter((c) => c.id !== id) }));
        bestEffort(async () => (await cloud()).deleteCameraRemote(id));
      },

      importLenses: (lenses) => {
        const valid = lenses.filter((l) => l.name && l.focalLength > 0);
        if (!valid.length) return 0;
        const withIds = valid.map((l) => ({ ...l, id: uid() }));
        set((s) => ({
          lenses: [
            ...s.lenses.filter((l) => !valid.some((n) => n.name.toLowerCase() === l.name.toLowerCase())),
            ...withIds,
          ],
        }));
        bestEffort(async () => (await cloud()).upsertLenses(withIds));
        return valid.length;
      },

      removeLens: (id) => {
        set((s) => ({ lenses: s.lenses.filter((l) => l.id !== id) }));
        bestEffort(async () => (await cloud()).deleteLensRemote(id));
      },

      addRequest: (request) => {
        const full: CatalogRequest = {
          ...request,
          id: uid(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [full, ...s.requests] }));
        bestEffort(async () => (await cloud()).insertRequestRemote(full));
      },

      resolveRequest: (id, approve) => {
        const request = get().requests.find((r) => r.id === id);
        if (!request || request.status !== 'pending') return;
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id ? { ...r, status: approve ? 'approved' : 'rejected' } : r
          ),
        }));
        bestEffort(async () => (await cloud()).updateRequestStatusRemote(id, approve ? 'approved' : 'rejected'));
        if (approve) {
          if (request.type === 'camera') get().importCameras([request.payload]);
          else get().importLenses([request.payload]);
        }
      },

      saveSet: (savedSet) =>
        set((s) => ({
          savedSets: [
            { ...savedSet, id: uid(), createdAt: new Date().toISOString() },
            ...s.savedSets.filter((x) => x.name !== savedSet.name),
          ].slice(0, 50),
        })),

      removeSet: (id) => set((s) => ({ savedSets: s.savedSets.filter((x) => x.id !== id) })),
    }),
    { name: 'rust-lens-data' }
  )
);
