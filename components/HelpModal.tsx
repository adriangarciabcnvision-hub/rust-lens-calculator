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
        además de magnificación, frame rate, motion blur y profundidad de campo (DOF) — todo en vivo.
      </p>
    ),
  },
  {
    title: 'Cómo usar la calculadora',
    body: (
      <ol className="list-decimal list-inside space-y-1">
        <li>Empieza por <b className="text-amber-300">Tipo de Inspección</b>, arriba del todo: fija a la vez el círculo de confusión (DOF) y el umbral de motion blur aceptable para el resto de la pantalla.</li>
        <li>Selecciona la <b className="text-amber-300">cámara del catálogo</b> o ajusta Píxel / Res H / Res V a mano: el Ancho y el Alto del sensor se calculan solos a partir de esos valores. El <b className="text-amber-300">Formato</b> también se detecta solo (compara el Ancho/Alto calculado contra los tamaños físicos estándar) — no hace falta tocarlo, aunque puedes elegirlo a mano como atajo.</li>
        <li>En <b className="text-amber-300">¿Qué calcular?</b> elige la variable que quieres obtener: FOV, Working Distance o Focal Length. Los 4 campos (Focal Length, Working Distance, FOV Deseado X, FOV Deseado Y) están siempre visibles; el que se calcula automáticamente aparece en gris, nunca desaparece.</li>
        <li>Todo se recalcula <b className="text-amber-300">en vivo</b> según escribes, sin botón de calcular. El resultado principal aparece destacado a la derecha.</li>
        <li>Si borras un campo por completo, se queda vacío (no salta a 0 mientras escribes); al salir del campo se muestra en blanco mientras valga 0.</li>
        <li>Pincha el <b className="text-amber-300">título subrayado</b> de cualquier resultado o campo calculado (FOV H, Magnification, Ancho, Readout, DOF...) para resaltar en dorado de qué otros parámetros depende — útil para saber qué te falta rellenar.</li>
        <li>Cuando quieras dejar constancia de un cálculo concreto, pulsa <b className="text-amber-300">📝 Generar Diagnóstico</b>: guarda una foto completa de ese momento en la pestaña Diagnóstico.</li>
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
        <li>Exposición máxima = 1000 / FPS deseado − Readout</li>
        <li>Fotos/mm = FPS / Velocidad</li>
        <li>Motion Blur (px) = (Velocidad / Píxel) × Exposición / 1000</li>
      </ul>
    ),
  },
  {
    title: 'Sensor y Óptica',
    body: (
      <ul className="space-y-1">
        <li><b className="text-amber-300">Ancho / Alto (mm)</b>: dimensiones físicas del sensor, calculadas solas — no se editan a mano.</li>
        <li><b className="text-amber-300">Píxel (µm)</b>: tamaño de cada píxel; afecta al motion blur y recalcula Ancho/Alto.</li>
        <li><b className="text-amber-300">Res H / Res V (px)</b>: resolución del sensor; recalculan Ancho/Alto junto con Píxel.</li>
        <li><b className="text-amber-300">Formato</b>: se detecta solo comparando el Ancho/Alto calculado con los tamaños físicos estándar (1/3", 1/2.3", 2/3", 1", APS-C, Full Frame) — un formato es, por definición, un tamaño fijo en mm, no depende de la resolución sola.</li>
        <li><b className="text-amber-300">Focal Length / Working Distance / FOV Deseado X / FOV Deseado Y</b>: los 4 campos del triángulo óptico. Siempre visibles; el que corresponde al modo activo en "¿Qué calcular?" aparece en gris (se calcula solo). FOV X e Y se ajustan entre sí según la relación de aspecto del sensor.</li>
        <li><b className="text-amber-300">Editar campos de la cámara</b> (Píxel, Res H, Res V, Max FPS, Readout) después de elegir una del catálogo deselecciona esa cámara del desplegable, para que quede claro que ya no coincide exactamente con ese modelo.</li>
      </ul>
    ),
  },
  {
    title: 'Profundidad de Campo (DOF)',
    body: (
      <ul className="space-y-1">
        <li><b className="text-amber-300">Círculo de confusión</b>: lo fija el selector <b className="text-amber-300">Tipo de Inspección</b> de arriba del todo (recalcula solo si cambias el píxel), o queda en edición libre en mm si eliges "No definida":
          <ul className="ml-4 mt-1 space-y-0.5 list-disc list-inside">
            <li>Metrología muy precisa → 0.5 px</li>
            <li>Inspección dimensional → 1 px (la más habitual)</li>
            <li>Presencia/ausencia, OCR sencillo → 2 px</li>
          </ul>
        </li>
        <li>Los resultados son Límite Cercano, Límite Lejano y DOF Total. La distancia hiperfocal ya no se muestra (se sigue usando internamente para el cálculo, pero no es un dato de interés directo).</li>
      </ul>
    ),
  },
  {
    title: 'Motion Blur y Frame Rate',
    body: (
      <>
        <p className="mb-2">
          <b className="text-amber-300">Max FPS / Max Hz</b> y <b className="text-amber-300">Readout</b> son
          características de la cámara (se rellenan solas al elegirla del catálogo, o se editan a mano).
          Max FPS (cámaras matriciales) y Max Hz (cámaras lineales) son el mismo dato — cambiar uno cambia el otro.
          El Readout se estima como <b className="text-amber-300">1000/MaxFPS</b> al editar el MaxFPS (la mayoría de
          datasheets solo publican el FPS máximo, no el readout) — sobrescríbelo si tienes un dato más preciso.
        </p>
        <p className="mb-2">
          En <b className="text-amber-300">¿Qué calcular?</b> eliges uno de 4 campos para que se calcule solo
          (aparece en gris), mientras los otros 3 son editables:
        </p>
        <ul className="space-y-0.5 mb-2">
          <li>• <b className="text-amber-300">Exposición máxima</b>: dado el FPS deseado, cuánto puedes exponer sin bajar de ese FPS.</li>
          <li>• <b className="text-amber-300">FPS máximo</b>: dada la exposición, el FPS máximo alcanzable (limitado también por el Max FPS de la cámara).</li>
          <li>• <b className="text-amber-300">Velocidad máxima</b>: dado el FPS deseado y los Fotos/mm que necesitas, la velocidad máxima del objeto.</li>
          <li>• <b className="text-amber-300">Fotos/mm</b>: dado el FPS deseado y la Velocidad, cuántas imágenes capturas por milímetro de desplazamiento (densidad de inspección).</li>
        </ul>
        <p className="mb-1 font-semibold text-amber-400">Calidad de Motion Blur</p>
        <table className="w-full text-xs border-collapse mb-2">
          <tbody>
            <tr className="border-b border-slate-600"><td className="py-0.5 pr-2 text-slate-400">&lt; 0.25 px</td><td className="text-green-400">Excelente</td></tr>
            <tr className="border-b border-slate-600"><td className="py-0.5 pr-2 text-slate-400">0.25–0.5 px</td><td className="text-lime-400">Muy bueno</td></tr>
            <tr className="border-b border-slate-600"><td className="py-0.5 pr-2 text-slate-400">0.5–1 px</td><td className="text-teal-400">Bueno</td></tr>
            <tr className="border-b border-slate-600"><td className="py-0.5 pr-2 text-slate-400">1–2 px</td><td className="text-amber-400">Aceptable según la aplicación</td></tr>
            <tr className="border-b border-slate-600"><td className="py-0.5 pr-2 text-slate-400">2–5 px</td><td className="text-orange-400">Empieza a degradar</td></tr>
            <tr><td className="py-0.5 pr-2 text-slate-400">&gt; 5 px</td><td className="text-red-400">Normalmente inaceptable</td></tr>
          </tbody>
        </table>
        <p>
          El <b className="text-amber-300">Tipo de Inspección</b> elegido arriba del todo (metrología ≤0.5px,
          dimensional ≤1px, presencia/ausencia ≤2px) añade aquí un aviso ✅/⚠️ de si el motion blur actual es
          adecuado para ese umbral; con "No definida" no se muestra ningún aviso.
        </p>
      </>
    ),
  },
  {
    title: 'Pestañas',
    body: (
      <ul className="space-y-1">
        <li><b className="text-amber-300">📊 Calculadora</b>: sensor, óptica (FOV/WD/Focal), profundidad de campo (DOF) y motion blur + frame rate, todo en una sola pantalla con cálculo en vivo.</li>
        <li><b className="text-amber-300">📋 Diagnóstico</b>: historial de los cálculos que has guardado explícitamente con "Generar Diagnóstico".</li>
        <li><b className="text-amber-300">🔬 Óptica</b>: diagrama óptico 3D interactivo del montaje (arrastra para rotar, rueda para zoom), actualizado en vivo.</li>
        <li><b className="text-amber-300">🔄 Comparador</b>: compara dos configuraciones lado a lado (inputs y resultados), usando el cálculo actual o sets guardados.</li>
        <li><b className="text-amber-300">📖 Códigos</b>: legibilidad de códigos DataMatrix según resolución espacial.</li>
        <li><b className="text-amber-300">🔐 Admin</b>: catálogos de cámaras/lentes (importación/exportación Excel) y aprobación de solicitudes. Acceden Administradores y Team Leaders; la gestión de usuarios y contraseñas es solo del Administrador.</li>
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
  {
    title: 'Créditos',
    body: (
      <p>
        Aplicación desarrollada por <b className="text-amber-300">Adrián García Remiro</b>.
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
