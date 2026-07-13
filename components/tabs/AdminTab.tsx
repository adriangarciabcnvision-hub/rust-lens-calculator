'use client';

import { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useDataStore, StoredCamera, StoredLens, StoredUser, ROLE_LABELS } from '@/lib/dataStore';
import { hashPassword, verifyPassword, isHashed } from '@/lib/passwords';
import { useSessionStore } from '@/lib/session';
import { COMMON_CAMERAS, COMMON_LENSES } from '@/lib/commonCatalog';
import { round } from '@/lib/calculationEngine';

// Cabeceras de las plantillas Excel (se aceptan también equivalentes en inglés al importar).
// Ancho_mm/Alto_mm/Readout_ms NO están aquí a propósito: se calculan siempre solos
// (Res×Píxel y 1000/MaxFPS) y no se piden ni se exportan.
const CAMERA_HEADERS = {
  manufacturer: 'Manufacturer',
  model: 'Model',
  sensor: 'Sensor',
  pixelSize: 'Pixel_um',
  resolutionH: 'ResH_px',
  resolutionV: 'ResV_px',
  maxFps: 'MaxFPS',
  interface: 'Interface',
  shutter: 'Shutter',
  color: 'Color'
};
const LENS_HEADERS = {
  manufacturer: 'Manufacturer',
  model: 'Model',
  focalLength: 'Focal_mm',
  aperture: 'Aperture',
  mount: 'Mount',
  maxSensor: 'MaxSensor',
  telecentric: 'Telecentric'
};
const num = (v: any): number => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

const pick = (row: any, ...keys: string[]) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k];
  }
  return undefined;
};

export function AdminTab() {
  const data = useDataStore();
  const session = useSessionStore();
  // La sesión persiste entre recargas; se invalida sola si el usuario se elimina o pierde el rol
  const currentUser =
    data.users.find((u) => u.id === session.userId && (u.role === 'admin' || u.role === 'teamleader')) || null;
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<StoredUser['role']>('normal');

  // Cambio de contraseña inline (solo admin)
  const [pwdEditId, setPwdEditId] = useState('');
  const [pwdValue, setPwdValue] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const cameraFileRef = useRef<HTMLInputElement>(null);
  const lensFileRef = useRef<HTMLInputElement>(null);

  const notify = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleLogin = async () => {
    setError('');
    const user = data.users.find((u) => u.username === username);
    const valid = user ? await verifyPassword(password, user.password) : false;
    if (!user || !valid) {
      setError('Usuario o contraseña incorrectos');
      return;
    }
    // Migración: contraseñas antiguas en texto plano pasan a hash en el primer login
    if (!isHashed(user.password)) {
      data.updateUserPassword(user.id, await hashPassword(password));
    }
    if (user.role === 'admin' || user.role === 'teamleader') {
      session.login(user.id);
      if (user.username === 'admin' && password === 'admin123') {
        notify('⚠️ Sigues usando la contraseña por defecto. Cámbiala con el botón 🔑 de tu usuario.');
      }
    } else {
      setError('Este usuario no tiene acceso al panel (se requiere Administrador o Team Leader)');
    }
  };

  const handleAddUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      notify('⚠️ Usuario y contraseña son obligatorios');
      return;
    }
    const ok = data.addUser({ username: newUsername.trim(), password: await hashPassword(newPassword), role: newRole });
    if (ok) {
      notify(`✓ Usuario "${newUsername.trim()}" creado`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('normal');
    } else {
      notify('⚠️ Ya existe un usuario con ese nombre');
    }
  };

  const exportExcel = async (rows: any[], sheetName: string, filename: string) => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };

const handleExportCameras = () => {
  const rows = data.cameras.length
    ? data.cameras.map((c) => ({
        [CAMERA_HEADERS.manufacturer]: c.manufacturer ?? '',
        [CAMERA_HEADERS.model]: c.model ?? c.name,
        [CAMERA_HEADERS.sensor]: c.sensor ?? '',

        [CAMERA_HEADERS.pixelSize]: c.pixelSize,
        [CAMERA_HEADERS.resolutionH]: c.resolutionH,
        [CAMERA_HEADERS.resolutionV]: c.resolutionV,
        [CAMERA_HEADERS.maxFps]: c.maxFps ?? '',

        [CAMERA_HEADERS.interface]: c.interface ?? '',
        [CAMERA_HEADERS.shutter]: c.shutter ?? '',
        [CAMERA_HEADERS.color]: c.color ?? '',
      }))
    : [{
        [CAMERA_HEADERS.manufacturer]: 'Basler',
        [CAMERA_HEADERS.model]: 'acA2440-20gm',
        [CAMERA_HEADERS.sensor]: 'Sony IMX264',

        [CAMERA_HEADERS.pixelSize]: 3.45,
        [CAMERA_HEADERS.resolutionH]: 2448,
        [CAMERA_HEADERS.resolutionV]: 2048,
        [CAMERA_HEADERS.maxFps]: 20,

        [CAMERA_HEADERS.interface]: 'GigE',
        [CAMERA_HEADERS.shutter]: 'Global',
        [CAMERA_HEADERS.color]: 'Mono',
      }];

  exportExcel(rows, 'Camaras', 'catalogo_camaras.xlsx');

  notify(
    data.cameras.length
      ? `✓ ${data.cameras.length} cámaras exportadas`
      : '✓ Plantilla de cámaras descargada'
  );
};

const handleExportLenses = () => {
  const rows = data.lenses.length
    ? data.lenses.map((l) => ({
        [LENS_HEADERS.manufacturer]: l.manufacturer ?? '',
        [LENS_HEADERS.model]: l.model ?? l.name,

        [LENS_HEADERS.focalLength]: l.focalLength,
        [LENS_HEADERS.aperture]: l.aperture ?? '',

        [LENS_HEADERS.mount]: l.mount ?? '',
        [LENS_HEADERS.maxSensor]: l.maxSensor ?? '',

        [LENS_HEADERS.telecentric]:
          l.telecentric === undefined
            ? ''
            : l.telecentric
            ? 'Yes'
            : 'No',
      }))
    : [{
        [LENS_HEADERS.manufacturer]: 'Computar',
        [LENS_HEADERS.model]: 'M2514-MP2',

        [LENS_HEADERS.focalLength]: 25,
        [LENS_HEADERS.aperture]: 'f/1.4',

        [LENS_HEADERS.mount]: 'C',

        [LENS_HEADERS.maxSensor]: '2/3"',

        [LENS_HEADERS.telecentric]: 'No',
      }];

  exportExcel(rows, 'Lentes', 'catalogo_lentes.xlsx');

  notify(
    data.lenses.length
      ? `✓ ${data.lenses.length} lentes exportados`
      : '✓ Plantilla de lentes descargada'
  );
};

  const readSheet = async (file: File): Promise<any[]> => {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws);
  };

const handleImportCameras = async (file: File | undefined) => {
  if (!file) return;

  try {

    const rows = await readSheet(file);

    const cameras: Omit<StoredCamera, 'id'>[] = rows.map((r: any) => {

      const pixelSize = num(
        pick(r, 'Pixel_um', 'PixelSize', 'pixelSize', 'Pixel')
      );

      const resolutionH = num(
        pick(r, 'ResH_px', 'ResH', 'resolutionH')
      );

      const resolutionV = num(
        pick(r, 'ResV_px', 'ResV', 'resolutionV')
      );

      const maxFps = pick(r, 'MaxFPS', 'MaxFps', 'maxFps')
        ? num(pick(r, 'MaxFPS', 'MaxFps', 'maxFps'))
        : undefined;

      const explicitReadout = pick(
        r,
        'Readout_ms',
        'Readout',
        'readout'
      );

      return {

        manufacturer: String(
          pick(r, 'Manufacturer', 'manufacturer') ?? ''
        ),

        model: String(
          pick(r, 'Model', 'model') ?? ''
        ),

        name: String(
          pick(
            r,
            'Model',
            'model',
            'Nombre',
            'Name',
            'name'
          ) ?? ''
        ),

        sensor: String(
          pick(r, 'Sensor', 'sensor') ?? ''
        ),

        interface: String(
          pick(r, 'Interface', 'interface') ?? ''
        ),

        shutter: String(
          pick(r, 'Shutter', 'shutter') ?? ''
        ),

        color: String(
          pick(r, 'Color', 'color') ?? ''
        ),

        sensorWidth:
          resolutionH > 0 && pixelSize > 0
            ? round((resolutionH * pixelSize) / 1000, 2)
            : 0,

        sensorHeight:
          resolutionV > 0 && pixelSize > 0
            ? round((resolutionV * pixelSize) / 1000, 2)
            : 0,

        pixelSize,

        resolutionH,

        resolutionV,

        maxFps,

        readout: explicitReadout
          ? num(explicitReadout)
          : maxFps
          ? round(1000 / maxFps, 3)
          : undefined,

      };

    });

    const count = data.importCameras(cameras);

    notify(
      count
        ? `✓ ${count} cámaras importadas`
        : '⚠️ Ninguna fila válida'
    );

  } catch (e) {

    console.error(e);

    notify('⚠️ No se pudo leer el archivo');

  }

  if (cameraFileRef.current)
    cameraFileRef.current.value = '';

};

  const handleImportLenses = async (file: File | undefined) => {
    if (!file) return;
    try {
      const rows = await readSheet(file);
      const lenses: Omit<StoredLens, 'id'>[] = rows.map((r: any) => {
        const manufacturer = pick(r, 'Manufacturer', 'manufacturer', 'Fabricante');
        const model = pick(r, 'Model', 'model', 'Modelo');
        const telecentric = pick(r, 'Telecentric', 'telecentric', 'Telecentrica');
        return {
          manufacturer: manufacturer !== undefined ? String(manufacturer) : undefined,
          model: model !== undefined ? String(model) : undefined,
          name: String(pick(r, 'Model', 'model', 'Nombre', 'Name', 'name') ?? ''),
          focalLength: num(pick(r, 'Focal_mm', 'FocalLength', 'focalLength', 'Focal')),
          aperture: pick(r, 'Aperture', 'Apertura', 'aperture') ? String(pick(r, 'Aperture', 'Apertura', 'aperture')) : undefined,
          mount: pick(r, 'Mount', 'mount', 'Montura') ? String(pick(r, 'Mount', 'mount', 'Montura')) : undefined,
          maxSensor: pick(r, 'MaxSensor', 'maxSensor', 'Max_Sensor') ? String(pick(r, 'MaxSensor', 'maxSensor', 'Max_Sensor')) : undefined,
          telecentric: telecentric !== undefined ? String(telecentric) : undefined,
          workingDistanceMin: pick(r, 'WD_Min', 'WorkingDistanceMin') ? num(pick(r, 'WD_Min', 'WorkingDistanceMin')) : undefined,
          workingDistanceMax: pick(r, 'WD_Max', 'WorkingDistanceMax') ? num(pick(r, 'WD_Max', 'WorkingDistanceMax')) : undefined,
        };
      });
      const count = data.importLenses(lenses);
      notify(count ? `✓ ${count} lentes importados` : '⚠️ Ninguna fila válida (revisa las columnas: Manufacturer, Model, Focal_mm)');
    } catch (e) {
      console.error(e);
      notify('⚠️ No se pudo leer el archivo');
    }
    if (lensFileRef.current) lensFileRef.current.value = '';
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card title="Acceso al Panel (Admin / Team Leader)" icon="🔐" className="w-full max-w-md">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-3 py-2 mt-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
            {error && <div className="text-xs text-red-400">{error}</div>}
            <button
              onClick={handleLogin}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded transition text-sm"
            >
              Iniciar Sesión
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-2 gap-2">
        <h2 className="text-lg font-bold text-amber-400 min-w-0 truncate">
          {isAdmin ? 'Panel de Administración' : 'Panel de Gestión'}
          <span className="text-xs font-normal text-slate-400"> · {currentUser.username} ({ROLE_LABELS[currentUser.role]})</span>
        </h2>
        <button
          onClick={() => {
            session.logout();
            setPassword('');
          }}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex-shrink-0"
        >
          Cerrar Sesión
        </button>
      </div>

      {message && (
        <div className="bg-amber-900/40 border border-amber-700 text-amber-200 px-3 py-2 rounded text-xs">
          {message}
        </div>
      )}

      {(() => {
        const pending = data.requests.filter((r) => r.status === 'pending');
        return (
          <Card title={`Solicitudes pendientes (${pending.length})`} icon="📨">
            {pending.length === 0 ? (
              <p className="text-xs text-slate-400">
                No hay solicitudes. Los usuarios pueden enviarlas con el botón &quot;➕ Solicitar&quot; de la Calculadora.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pending.map((r) => (
                  <div key={r.id} className="bg-slate-700 px-2 py-2 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        {r.type === 'camera' ? '📷' : '🔭'} {r.payload?.name}
                      </span>
                      <span className="text-slate-400 flex-shrink-0">
                        {r.requestedBy} · {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-400">
                      {r.type === 'camera'
                        ? `Sensor ${r.payload?.sensorWidth}×${r.payload?.sensorHeight}mm · píxel ${r.payload?.pixelSize}µm · ${r.payload?.resolutionH || '?'}×${r.payload?.resolutionV || '?'}px${r.payload?.maxFps ? ` · ${r.payload.maxFps}fps` : ''}${r.payload?.readout ? ` · readout ${r.payload.readout}ms` : ''}`
                        : `Focal ${r.payload?.focalLength}mm${r.payload?.aperture ? ` · ${r.payload.aperture}` : ''}`}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          data.resolveRequest(r.id, true);
                          notify(`✓ "${r.payload?.name}" añadido al catálogo`);
                        }}
                        className="flex-1 px-2 py-1 bg-green-700 hover:bg-green-600 text-white rounded transition"
                      >
                        ✓ Aprobar
                      </button>
                      <button
                        onClick={() => {
                          data.resolveRequest(r.id, false);
                          notify(`Solicitud "${r.payload?.name}" rechazada`);
                        }}
                        className="flex-1 px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded transition"
                      >
                        ✕ Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })()}

      {isAdmin && (
      <Card title={`Gestión de Usuarios (${data.users.length})`} icon="👥">
        <div className="space-y-2">
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {data.users.map((u) => (
              <div key={u.id} className="bg-slate-700 px-2 py-1 rounded text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">{u.username}</span>
                    <span className="text-slate-400"> · {ROLE_LABELS[u.role]}</span>
                  </span>
                  <span className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        setPwdEditId(pwdEditId === u.id ? '' : u.id);
                        setPwdValue('');
                      }}
                      className="px-2 py-0.5 bg-slate-600 hover:bg-amber-600 text-white rounded transition"
                      title="Cambiar contraseña"
                    >
                      🔑
                    </button>
                    <button
                      onClick={() => data.removeUser(u.id)}
                      disabled={u.role === 'admin' && data.users.filter((x) => x.role === 'admin').length <= 1}
                      className="px-2 py-0.5 bg-red-700 hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded"
                      title={u.role === 'admin' && data.users.filter((x) => x.role === 'admin').length <= 1 ? 'No se puede eliminar el último administrador' : 'Eliminar usuario'}
                    >
                      ✕
                    </button>
                  </span>
                </div>
                {pwdEditId === u.id && (
                  <div className="flex gap-1 mt-1">
                    <input
                      type="password"
                      placeholder="Nueva contraseña"
                      value={pwdValue}
                      onChange={(e) => setPwdValue(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && pwdValue.trim()) {
                          data.updateUserPassword(u.id, await hashPassword(pwdValue));
                          setPwdEditId('');
                          notify(`✓ Contraseña de "${u.username}" actualizada`);
                        }
                      }}
                      className="flex-1 min-w-0 px-2 py-1 bg-slate-800 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        if (!pwdValue.trim()) return;
                        data.updateUserPassword(u.id, await hashPassword(pwdValue));
                        setPwdEditId('');
                        notify(`✓ Contraseña de "${u.username}" actualizada`);
                      }}
                      disabled={!pwdValue.trim()}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white rounded transition flex-shrink-0"
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700">
            <input
              type="text"
              placeholder="Usuario"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="px-2 py-1 text-sm bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="technician">Técnico</option>
              <option value="teamleader">Team Leader</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              onClick={handleAddUser}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs transition"
            >
              Agregar Usuario
            </button>
          </div>
        </div>
      </Card>
      )}

      <Card title={`Cámaras (${data.cameras.length})`} icon="📷">
        <div className="space-y-2">
          {data.cameras.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {data.cameras.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-slate-700 px-2 py-1 rounded text-xs">
                  <span>
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-slate-400"> · {c.sensorWidth}×{c.sensorHeight}mm · {c.pixelSize}µm · {c.resolutionH}×{c.resolutionV}px{c.maxFps ? ` · ${c.maxFps} fps` : ''}{c.readout ? ` · readout ${c.readout}ms` : ''}</span>
                  </span>
                  <button onClick={() => data.removeCamera(c.id)} className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded">✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => cameraFileRef.current?.click()} className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs transition">
              📥 Importar Excel
            </button>
            <button onClick={handleExportCameras} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition">
              📤 {data.cameras.length ? 'Exportar Excel' : 'Descargar plantilla'}
            </button>
          </div>
          <button
            onClick={() => notify(`✓ ${data.importCameras(COMMON_CAMERAS)} cámaras del catálogo común importadas`)}
            className="w-full px-3 py-1 bg-slate-700 hover:bg-amber-700 text-white rounded text-xs transition border border-dashed border-slate-600"
            title="Modelos habituales en visión industrial (Basler, FLIR, IDS) con specs verificadas"
          >
            ⭐ Importar catálogo común ({COMMON_CAMERAS.length})
          </button>
          <input
            ref={cameraFileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleImportCameras(e.target.files?.[0])}
          />
          <p className="text-xs text-slate-400">Columnas:
Manufacturer,
Model,
Sensor,
Pixel_um,
ResH_px,
ResV_px,
MaxFPS,
Interface,
Shutter,
Color. Ancho/Alto y Readout se calculan solos — no hace falta indicarlos (Readout_ms admite un valor manual si lo quieres sobrescribir)</p>
        </div>
      </Card>

      <Card title={`Lentes (${data.lenses.length})`} icon="🔭">
        <div className="space-y-2">
          {data.lenses.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {data.lenses.map((l) => (
                <div key={l.id} className="flex items-center justify-between bg-slate-700 px-2 py-1 rounded text-xs">
                  <span>
                    <span className="font-semibold">{l.manufacturer ? `${l.manufacturer} ` : ''}{l.model ?? l.name}</span>
                    <span className="text-slate-400"> · {l.focalLength}mm{l.aperture ? ` · ${l.aperture}` : ''}{l.mount ? ` · ${l.mount}` : ''}{l.maxSensor ? ` · ${l.maxSensor}` : ''}{l.telecentric ? ` · ${l.telecentric}` : ''}</span>
                  </span>
                  <button onClick={() => data.removeLens(l.id)} className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded">✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => lensFileRef.current?.click()} className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs transition">
              📥 Importar Excel
            </button>
            <button onClick={handleExportLenses} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition">
              📤 {data.lenses.length ? 'Exportar Excel' : 'Descargar plantilla'}
            </button>
          </div>
          <button
            onClick={() => notify(`✓ ${data.importLenses(COMMON_LENSES)} lentes del catálogo común importados`)}
            className="w-full px-3 py-1 bg-slate-700 hover:bg-amber-700 text-white rounded text-xs transition border border-dashed border-slate-600"
            title="Modelos habituales en visión industrial (Computar, Fujinon, Kowa) con specs verificadas"
          >
            ⭐ Importar catálogo común ({COMMON_LENSES.length})
          </button>
          <input
            ref={lensFileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleImportLenses(e.target.files?.[0])}
          />
          <p className="text-xs text-slate-400">Columnas: Manufacturer, Model, Focal_mm, Aperture, Mount, MaxSensor, Telecentric (todas menos Model y Focal_mm son opcionales)</p>
        </div>
      </Card>

      <Card title="Configuración" icon="⚙️">
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex justify-between">
            <span>Versión:</span>
            <span className="text-amber-400">2.1.0</span>
          </div>
          <div className="flex justify-between">
            <span>Almacenamiento:</span>
            <span className="text-amber-400">{data.cloudActive ? 'Supabase (compartido)' : 'Local (este navegador)'}</span>
          </div>
          <div className="flex justify-between">
            <span>Sets guardados:</span>
            <span className="text-amber-400">{data.savedSets.length}</span>
          </div>
          <p className="text-slate-400 pt-1">
            {data.cloudActive
              ? 'El catálogo y las solicitudes se comparten vía Supabase. Usuarios y sets son locales de cada navegador.'
              : 'Los datos se guardan en este navegador. Usa Exportar/Importar Excel para llevarlos a otro equipo, o configura Supabase (ver SUPABASE_SETUP.md) para compartirlos.'}
          </p>
        </div>
      </Card>
    </div>
  );
}
