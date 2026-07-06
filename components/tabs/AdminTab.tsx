'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

export function AdminTab() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('admin');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card title="Acceso de Administrador" icon="🔐" className="w-full max-w-md">
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
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-amber-400">Panel de Administración</h2>
        <button
          onClick={() => {
            setIsLoggedIn(false);
            setPassword('');
          }}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
        >
          Cerrar Sesión
        </button>
      </div>

      <Card title="Gestión de Usuarios" icon="👥">
        <div className="space-y-2">
          <p className="text-xs text-slate-300">Usuarios registrados: 1</p>
          <p className="text-xs text-slate-400">• admin (Rol: Super Admin)</p>
          <button className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition">
            Agregar Usuario
          </button>
        </div>
      </Card>

      <Card title="Cámaras" icon="📷">
        <div className="space-y-2">
          <p className="text-xs text-slate-300">Cámaras en BD: 0</p>
          <button className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition">
            Importar Catálogo
          </button>
        </div>
      </Card>

      <Card title="Lentes" icon="🔭">
        <div className="space-y-2">
          <p className="text-xs text-slate-300">Lentes en BD: 0</p>
          <button className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition">
            Importar Catálogo
          </button>
        </div>
      </Card>

      <Card title="Configuración" icon="⚙️">
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex justify-between">
            <span>Versión:</span>
            <span className="text-amber-400">2.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>BD:</span>
            <span className="text-amber-400">Desconectada</span>
          </div>
          <button className="w-full px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition mt-2">
            Conectar Supabase
          </button>
        </div>
      </Card>
    </div>
  );
}
