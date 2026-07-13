'use client';

import { Card } from '@/components/ui/Card';
import { useCalculatorStore } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Colores del tema (dorado/negro EQUIPO RUST) trasladados a la escena 3D
const COLOR_BG = 0x0a0907;
const COLOR_GRID = 0x262014;
const COLOR_OBJECT = 0xfbbf24; // amber
const COLOR_LENS = 0x3b82f6; // blue
const COLOR_SENSOR = 0x10b981; // green
const COLOR_RAY = 0xec4899; // pink
const COLOR_AXIS = 0x64748b; // slate

// Etiqueta de texto flotante (sprite con textura de canvas): siempre mira a la cámara,
// no se deforma con la perspectiva — para anotar distancias/parámetros sobre la escena.
// `height` es un tamaño absoluto en unidades de escena (no en mm reales, la escena ya está
// normalizada a un cubo de ~10 unidades vía depthScale/sizeScale) para que el texto sea
// legible sea cual sea la escala física del montaje actual.
function makeTextSprite(text: string, accentColor: string, height = 0.4): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = 42;
  ctx.font = `600 ${fontSize}px Arial`;
  const textWidth = ctx.measureText(text).width;
  const padX = 18;
  const padY = 12;
  canvas.width = textWidth + padX * 2;
  canvas.height = fontSize + padY * 2;

  ctx.font = `600 ${fontSize}px Arial`;
  ctx.fillStyle = 'rgba(10, 9, 7, 0.85)';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  const r = 10;
  ctx.beginPath();
  ctx.roundRect(1.5, 1.5, canvas.width - 3, canvas.height - 3, r);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, sizeAttenuation: true });
  const sprite = new THREE.Sprite(material);
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(height * aspect, height, 1);
  return sprite;
}

export function OpticalDiagramTab({ isActive = true }: { isActive?: boolean } = {}) {
  const store = useCalculatorStore();
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const contentGroupRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number>(0);
  const resizeRef = useRef<(() => void) | null>(null);
  const [hasScene, setHasScene] = useState(false);

  // El FOV siempre es derivable de los parámetros actuales; si hay un cálculo previo se usa ese
  const results: { fovHorizontalMm: number; fovVerticalMm: number; magnification: number } =
    store.results?.fovHorizontalMm !== undefined
      ? {
          fovHorizontalMm: store.results.fovHorizontalMm,
          fovVerticalMm: store.results.fovVerticalMm ?? 0,
          magnification: store.results.magnification ?? 0,
        }
      : {
          fovHorizontalMm: store.focalLength > 0 ? (store.sensorWidth / store.focalLength) * store.workingDistance : 0,
          fovVerticalMm: store.focalLength > 0 ? (store.sensorHeight / store.focalLength) * store.workingDistance : 0,
          magnification: store.workingDistance > 0 ? store.focalLength / store.workingDistance : 0,
        };

  const canRender = store.focalLength > 0 && store.workingDistance > 0 && store.sensorWidth > 0 && store.sensorHeight > 0;

  // ===== Setup de la escena (una sola vez) =====
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLOR_BG);
    sceneRef.current = scene;

    // Si la pestaña arranca oculta (mount 0×0, montada en background para no perder estado
    // al cambiar de pestaña), usa un aspect ratio provisional razonable — el efecto de
    // "isActive" de más abajo corrige tamaño/aspect en cuanto la pestaña se hace visible.
    const initialAspect = mount.clientWidth > 0 && mount.clientHeight > 0 ? mount.clientWidth / mount.clientHeight : 16 / 9;
    const camera = new THREE.PerspectiveCamera(45, initialAspect, 0.1, 1000);
    camera.position.set(7, 4, 9);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth || 1, mount.clientHeight || 1);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 60;
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    const grid = new THREE.GridHelper(20, 20, COLOR_GRID, COLOR_GRID);
    grid.position.y = -2.5;
    scene.add(grid);

    const group = new THREE.Group();
    scene.add(group);
    contentGroupRef.current = group;

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      // La pestaña se queda montada (oculta con CSS) al cambiar de pestaña, para no perder
      // el estado de las demás — mientras esté oculta el contenedor mide 0×0, así que se
      // salta el render (GPU) pero se sigue pidiendo el siguiente frame para reengancharse
      // solo en cuanto vuelva a ser visible
      if (mount.clientWidth === 0 || mount.clientHeight === 0) return;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const doResize = () => {
      if (!mount || mount.clientWidth === 0 || mount.clientHeight === 0) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.render(scene, camera);
    };
    resizeRef.current = doResize;

    const resizeObserver = new ResizeObserver(doResize);
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  // La pestaña se queda montada en background al cambiar de pestaña (para no perder el
  // estado). El renderer se crea con el tamaño que tuviera el contenedor en ese momento —
  // si arrancó oculto (0×0), o si Chrome no dispara el ResizeObserver de forma fiable al
  // pasar de display:none a visible, el canvas se queda con tamaño incorrecto. Forzarlo
  // explícitamente en cuanto la pestaña se activa corrige esto sin depender de ese evento.
  useEffect(() => {
    if (isActive) resizeRef.current?.();
  }, [isActive]);

  // ===== Reconstrucción del contenido de la escena en cada cambio de parámetros =====
  useEffect(() => {
    const group = contentGroupRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!group) return;

    // Limpia la escena anterior liberando memoria de GPU
    while (group.children.length) {
      const obj = group.children.pop()!;
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => m.dispose());
        } else if (child instanceof THREE.Sprite) {
          child.material.map?.dispose();
          child.material.dispose();
        }
      });
    }

    setHasScene(canRender);
    if (!canRender || !camera || !controls) return;

    const fovH = results.fovHorizontalMm;
    const fovV = results.fovVerticalMm;

    // Escalas independientes: una para las distancias (eje óptico) y otra para los tamaños
    // (sensor/objeto), igual que en la versión 2D — si no, el sensor sería invisible frente a la WD.
    const totalDepth = Math.max(store.focalLength + store.workingDistance, 10);
    const depthScale = 10 / totalDepth;
    const maxSize = Math.max(fovH, fovV, store.sensorWidth, store.sensorHeight, 5);
    const sizeScale = 3.5 / maxSize;

    const sensorZ = 0;
    const lensZ = store.focalLength * depthScale;
    const objectZ = (store.focalLength + store.workingDistance) * depthScale;

    const sensorHalfW = (store.sensorWidth / 2) * sizeScale;
    const sensorHalfH = (store.sensorHeight / 2) * sizeScale;
    const objHalfW = (fovH / 2) * sizeScale;
    const objHalfH = (fovV / 2) * sizeScale;
    const lensRadius = Math.max(sensorHalfW, sensorHalfH) * 1.6;

    // --- Eje óptico ---
    const axisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, sensorZ),
      new THREE.Vector3(0, 0, objectZ),
    ]);
    const axisLine = new THREE.Line(axisGeom, new THREE.LineDashedMaterial({ color: COLOR_AXIS, dashSize: 0.15, gapSize: 0.1 }));
    axisLine.computeLineDistances();
    group.add(axisLine);

    // --- Sensor (rectángulo verde) ---
    const sensorPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(sensorHalfW * 2, sensorHalfH * 2),
      new THREE.MeshStandardMaterial({ color: COLOR_SENSOR, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    sensorPlane.position.z = sensorZ;
    group.add(sensorPlane);
    const sensorEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(sensorHalfW * 2, sensorHalfH * 2)),
      new THREE.LineBasicMaterial({ color: COLOR_SENSOR })
    );
    sensorEdges.position.z = sensorZ;
    group.add(sensorEdges);

    // --- Lente (disco azul) ---
    const lensDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(lensRadius, lensRadius, 0.06, 40),
      new THREE.MeshStandardMaterial({ color: COLOR_LENS, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    lensDisc.rotation.x = Math.PI / 2;
    lensDisc.position.z = lensZ;
    group.add(lensDisc);
    const lensRing = new THREE.Mesh(
      new THREE.TorusGeometry(lensRadius, 0.02, 12, 40),
      new THREE.MeshStandardMaterial({ color: COLOR_LENS })
    );
    lensRing.position.z = lensZ;
    group.add(lensRing);

    // --- Objeto (rectángulo ámbar, tamaño = FOV) ---
    const objectPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(objHalfW * 2, objHalfH * 2),
      new THREE.MeshStandardMaterial({ color: COLOR_OBJECT, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    objectPlane.position.z = objectZ;
    group.add(objectPlane);
    const objectEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(objHalfW * 2, objHalfH * 2)),
      new THREE.LineBasicMaterial({ color: COLOR_OBJECT })
    );
    objectEdges.position.z = objectZ;
    group.add(objectEdges);

    // --- Rayos ópticos: de cada esquina/borde del objeto, pasando por el centro de la lente, al sensor ---
    const rayCorners: [number, number][] = [
      [objHalfW, objHalfH],
      [-objHalfW, objHalfH],
      [objHalfW, -objHalfH],
      [-objHalfW, -objHalfH],
      [0, 0],
    ];
    rayCorners.forEach(([ox, oy], idx) => {
      const [sx, sy] = idx === rayCorners.length - 1 ? [0, 0] : [-ox * (sensorHalfW / objHalfW || 0), -oy * (sensorHalfH / objHalfH || 0)];
      const rayGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(ox, oy, objectZ),
        new THREE.Vector3(0, 0, lensZ),
        new THREE.Vector3(sx, sy, sensorZ),
      ]);
      const isCenter = idx === rayCorners.length - 1;
      const ray = new THREE.Line(
        rayGeom,
        new THREE.LineBasicMaterial({ color: isCenter ? 0xa855f7 : COLOR_RAY, transparent: true, opacity: isCenter ? 0.9 : 0.55 })
      );
      group.add(ray);
    });

    // --- Etiquetas de texto: distancias y parámetros anotados directamente sobre la escena ---
    const wdLabel = makeTextSprite(`WD: ${store.workingDistance.toFixed(1)} mm`, '#fbbf24');
    wdLabel.position.set(0, 0.35, (lensZ + objectZ) / 2);
    group.add(wdLabel);

    const focalLabel = makeTextSprite(`f: ${store.focalLength.toFixed(1)} mm`, '#3b82f6');
    focalLabel.position.set(0, 0.35, (sensorZ + lensZ) / 2);
    group.add(focalLabel);

    const sensorLabel = makeTextSprite(`Sensor: ${store.sensorWidth.toFixed(1)}×${store.sensorHeight.toFixed(1)} mm`, '#10b981');
    sensorLabel.position.set(0, -(sensorHalfH + 0.35), sensorZ);
    group.add(sensorLabel);

    const fovLabel = makeTextSprite(`FOV: ${fovH.toFixed(1)}×${fovV.toFixed(1)} mm`, '#fbbf24');
    fovLabel.position.set(0, objHalfH + 0.35, objectZ);
    group.add(fovLabel);

    const magLabel = makeTextSprite(`×${results.magnification.toFixed(3)}`, '#93c5fd');
    magLabel.position.set(lensRadius + 0.35, 0, lensZ);
    group.add(magLabel);

    // Encuadre inicial de cámara centrado en el montaje, sin resetear si el usuario ya interactuó mucho
    const midZ = (sensorZ + objectZ) / 2;
    controls.target.set(0, 0, midZ);
    camera.position.set(Math.max(objHalfW, 3) * 1.4, Math.max(objHalfH, 2) * 1.6, midZ + totalDepth * depthScale * 0.7 + 3);
    controls.update();
    // Render inmediato además del bucle de animación, para que el cambio se vea al instante
    // aunque el rAF esté retrasado (pestañas en segundo plano, etc.) — salvo que esté oculta
    // (0×0: la pestaña sigue montada en background para no perder su estado al cambiar de pestaña)
    const mountEl = mountRef.current;
    if (mountEl && mountEl.clientWidth > 0 && mountEl.clientHeight > 0) rendererRef.current?.render(sceneRef.current!, camera);
  }, [canRender, store.sensorWidth, store.sensorHeight, store.focalLength, store.workingDistance, results.fovHorizontalMm, results.fovVerticalMm]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 lg:h-full lg:overflow-hidden">
      {/* Escena 3D */}
      <div className="lg:col-span-4 lg:h-full flex flex-col">
        <Card title="Diagrama Óptico 3D" icon="🔬" className="flex-1 flex flex-col min-h-0">
          <p className="text-xs text-slate-400 mb-1">🖱️ Arrastra para rotar · rueda para zoom · clic derecho para desplazar</p>
          <div className="relative flex-1 min-h-[320px] bg-slate-950 rounded border border-slate-700 overflow-hidden">
            <div ref={mountRef} className="w-full h-full" />
            {!hasScene && (
              <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                <p className="text-xs text-slate-400">Completa Sensor, Focal Length y Working Distance para ver el montaje en 3D</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Parámetros e Información */}
      <div className="lg:col-span-2 space-y-2 lg:overflow-y-auto">
        <Card title="Parámetros de Entrada" icon="⚙️" className="p-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between bg-slate-700 p-1.5 rounded">
              <span className="text-slate-400">Focal:</span>
              <span className="text-amber-400 font-bold">{store.focalLength.toFixed(1)} mm</span>
            </div>
            <div className="flex justify-between bg-slate-700 p-1.5 rounded">
              <span className="text-slate-400">WD:</span>
              <span className="text-amber-400 font-bold">{store.workingDistance.toFixed(1)} mm</span>
            </div>
            <div className="flex justify-between bg-slate-700 p-1.5 rounded">
              <span className="text-slate-400">Sensor:</span>
              <span className="text-amber-400 font-bold">{store.sensorWidth.toFixed(1)}×{store.sensorHeight.toFixed(1)} mm</span>
            </div>
            <div className="flex justify-between bg-slate-700 p-1.5 rounded">
              <span className="text-slate-400">Píxel:</span>
              <span className="text-amber-400 font-bold">{store.pixelSize.toFixed(2)} µm</span>
            </div>
          </div>
        </Card>

        <Card title="Resultados" icon="✨" className="p-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between bg-green-900/30 border border-green-700 p-1.5 rounded">
              <span className="text-green-300">FOV H:</span>
              <span className="text-green-400 font-bold">{results.fovHorizontalMm.toFixed(2)} mm</span>
            </div>
            <div className="flex justify-between bg-green-900/30 border border-green-700 p-1.5 rounded">
              <span className="text-green-300">FOV V:</span>
              <span className="text-green-400 font-bold">{results.fovVerticalMm.toFixed(2)} mm</span>
            </div>
            <div className="flex justify-between bg-blue-900/30 border border-blue-700 p-1.5 rounded">
              <span className="text-blue-300">Magnification:</span>
              <span className="text-blue-400 font-bold">×{results.magnification.toFixed(4)}</span>
            </div>
          </div>
        </Card>

        <Card title="Leyenda Visual" icon="📍" className="p-2">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Objeto (tamaño = FOV)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
              <span>Lente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400"></div>
              <span>Sensor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-pink-400"></div>
              <span>Rayos ópticos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-purple-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #a855f7 0px, #a855f7 4px, transparent 4px, transparent 8px)' }}></div>
              <span>Rayo central</span>
            </div>
          </div>
        </Card>

        <Card title="Nota" icon="ℹ️" className="p-2">
          <p className="text-xs text-slate-300">Diagrama esquemático basado en aproximación de lente delgada (paraxial). Los tamaños del sensor y el objeto usan una escala distinta a las distancias para que sean visibles.</p>
        </Card>
      </div>
    </div>
  );
}
