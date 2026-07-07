'use client';

interface HelpModalProps {
  onClose: () => void;
}

const SECTIONS = [
  {
    title: '¿Qué es esta aplicación?',
    body: (
      <p>
        Calculadora óptica profesional para visión artificial. Dado el sensor de una cámara y
        dos de las tres variables ópticas (FOV, distancia de trabajo, focal), calcula la tercera,
        además de magnificación, frame rate máximo y motion blur.
      </p>
    ),
  },
  {
    title: 'Cómo usar la calculadora',
    body: (
      <ol className="list-decimal list-inside space-y-1">
        <li>Selecciona el <b className="text-amber-300">formato de sensor</b> (o introduce ancho/alto manualmente). Ancho, alto, píxel y resolución están vinculados: al cambiar uno se recalculan los demás.</li>
        <li>En <b className="text-amber-300">¿Qué calcular?</b> elige la variable que quieres obtener: FOV, Working Distance o Focal Length. El campo calculado se deshabilita automáticamente.</li>
        <li>Rellena los campos restantes y pulsa <b className="text-amber-300">CALCULAR</b>. El resultado principal aparece destacado a la derecha.</li>
      </ol>
    ),
  },
  {
    title: 'Fórmulas',
    body: (
      <ul className="space-y-1 font-mono text-amber-300">
        <li>FOV = (W / f) × WD</li>
        <li>WD = (FOV × f) / W</li>
        <li>f = (W × WD) / FOV</li>
        <li>Magnificación = f / WD</li>
        <li>Max FPS = 1000 / (Exposición + Readout)</li>
        <li>Motion Blur (px) = (Velocidad / Píxel) × Exposición / 1000</li>
      </ul>
    ),
  },
  {
    title: 'Parámetros',
    body: (
      <ul className="space-y-1">
        <li><b className="text-amber-300">Ancho / Alto (mm)</b>: dimensiones físicas del sensor.</li>
        <li><b className="text-amber-300">Píxel (µm)</b>: tamaño de cada píxel; afecta al motion blur y a la resolución espacial.</li>
        <li><b className="text-amber-300">Res H / Res V (px)</b>: resolución del sensor; se sincroniza con las dimensiones físicas.</li>
        <li><b className="text-amber-300">Focal Length (mm)</b>: distancia focal del objetivo.</li>
        <li><b className="text-amber-300">Working Distance</b>: distancia del objetivo al objeto (en mm, cm o pulgadas según Unidades).</li>
        <li><b className="text-amber-300">Exposición / Readout (ms)</b>: tiempos de captura y lectura; determinan el frame rate máximo.</li>
        <li><b className="text-amber-300">Velocidad (mm/s)</b>: velocidad del objeto; determina el motion blur.</li>
      </ul>
    ),
  },
  {
    title: 'Pestañas',
    body: (
      <ul className="space-y-1">
        <li><b className="text-amber-300">📊 Calculadora</b>: cálculo principal FOV / WD / Focal.</li>
        <li><b className="text-amber-300">📋 Diagnóstico</b>: historial de cálculos realizados.</li>
        <li><b className="text-amber-300">📐 DOF</b>: profundidad de campo y distancias de trabajo mínima/máxima.</li>
        <li><b className="text-amber-300">🔬 Óptica</b>: diagrama óptico interactivo del montaje.</li>
        <li><b className="text-amber-300">⚡ Frame Rate</b>: análisis de tiempos, FPS máximo y motion blur.</li>
        <li><b className="text-amber-300">🔄 Comparador</b>: compara dos configuraciones lado a lado, usando el cálculo actual o sets guardados.</li>
        <li><b className="text-amber-300">📖 Códigos</b>: legibilidad de códigos DataMatrix según resolución espacial.</li>
        <li><b className="text-amber-300">🔐 Admin</b>: catálogos de cámaras/lentes (importación/exportación Excel) y aprobación de solicitudes. Acceden Administradores y Team Leaders; la gestión de usuarios y contraseñas es solo del Administrador (acceso inicial: admin / admin123).</li>
      </ul>
    ),
  },
  {
    title: 'Notas',
    body: (
      <p>
        Los cálculos usan la aproximación paraxial (lente delgada), válida cuando la distancia de
        trabajo es mucho mayor que la focal (WD ≫ f). Para ópticas telecéntricas o macro los
        resultados son orientativos.
      </p>
    ),
  },
];

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-amber-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="EQUIPO RUST" className="h-8 w-8" />
            <h2 className="text-lg font-bold text-amber-400">Ayuda y documentación</h2>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition"
            aria-label="Cerrar ayuda"
          >
            ✕ Cerrar
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-4 text-sm text-slate-300">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-amber-400 font-semibold mb-1">{section.title}</h3>
              {section.body}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
