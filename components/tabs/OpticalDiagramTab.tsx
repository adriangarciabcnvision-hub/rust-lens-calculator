'use client';

import { Card } from '@/components/ui/Card';
import { useCalculatorStore } from '@/lib/store';
import { useEffect, useRef } from 'react';

export function OpticalDiagramTab() {
  const store = useCalculatorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawOpticalDiagram = () => {
    if (!canvasRef.current || !store.results?.fovHorizontalMm) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padding = 60;
    const canvasWidth = w - padding * 2;
    const canvasHeight = h - padding * 2;

    // Fondo limpio
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Determinar escala
    const totalDistance = Math.max(store.workingDistance, 100) + store.focalLength;
    const scale = canvasWidth / totalDistance;
    const maxFovHalf = store.results.fovHorizontalMm / 2;
    const fovScale = Math.min(scale, (canvasHeight / 2) / Math.max(maxFovHalf, 50));
    const finalScale = Math.min(scale, fovScale);

    // Posiciones
    const centerY = h / 2;
    const objectX = padding + 20;
    const lensX = padding + store.workingDistance * finalScale;
    const sensorX = lensX + store.focalLength * finalScale;

    // ===== FONDO CON GRID =====
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // ===== EJE ÓPTICO =====
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, centerY);
    ctx.lineTo(w - padding, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // ===== OBJETO (ARROW izquierda) =====
    const objHalfHeight = maxFovHalf * finalScale;
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;

    // Flecha del objeto
    ctx.beginPath();
    ctx.moveTo(objectX, centerY - objHalfHeight);
    ctx.lineTo(objectX, centerY + objHalfHeight);
    ctx.stroke();

    // Punta de flecha arriba
    ctx.beginPath();
    ctx.moveTo(objectX - 6, centerY - objHalfHeight + 8);
    ctx.lineTo(objectX, centerY - objHalfHeight);
    ctx.lineTo(objectX + 6, centerY - objHalfHeight + 8);
    ctx.stroke();

    // Círculo en el objeto
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(objectX, centerY - objHalfHeight, 4, 0, Math.PI * 2);
    ctx.fill();

    // Etiqueta OBJETO
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('OBJETO', objectX - 15, centerY - objHalfHeight - 20);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Arial';
    ctx.fillText(`H=${store.results.fovHorizontalMm.toFixed(1)}mm`, objectX + 10, centerY - objHalfHeight - 10);

    // ===== LENTE (CÍRCULO en medio) =====
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#3b82f640';

    // Círculo lente
    ctx.beginPath();
    ctx.arc(lensX, centerY, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // Líneas verticales de la lente
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lensX, centerY - 32);
    ctx.lineTo(lensX, centerY + 32);
    ctx.stroke();

    // Etiqueta LENTE
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LENTE', lensX, centerY + 50);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Arial';
    ctx.fillText(`f=${store.focalLength.toFixed(1)}mm`, lensX - 45, centerY - 45);

    // ===== SENSOR (RECTÁNGULO derecha) =====
    const sensorHalfHeight = (store.sensorHeight / store.sensorWidth) * 25;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#10b98140';

    ctx.strokeRect(sensorX - 25, centerY - sensorHalfHeight, 50, sensorHalfHeight * 2);
    ctx.fillRect(sensorX - 25, centerY - sensorHalfHeight, 50, sensorHalfHeight * 2);

    // Etiqueta SENSOR
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SENSOR', sensorX, centerY + sensorHalfHeight + 25);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Arial';
    ctx.fillText(`${store.sensorWidth.toFixed(1)}×${store.sensorHeight.toFixed(1)}mm`, sensorX - 65, centerY + sensorHalfHeight + 15);

    // ===== RAYOS ÓPTICOS (líneas de luz) =====
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;

    // Rayo superior
    ctx.beginPath();
    ctx.moveTo(objectX, centerY - objHalfHeight);
    ctx.lineTo(lensX, centerY + 30);
    ctx.lineTo(sensorX, centerY + sensorHalfHeight);
    ctx.stroke();

    // Rayo inferior
    ctx.beginPath();
    ctx.moveTo(objectX, centerY + objHalfHeight);
    ctx.lineTo(lensX, centerY - 30);
    ctx.lineTo(sensorX, centerY - sensorHalfHeight);
    ctx.stroke();

    // Rayo central (sin deflexión)
    ctx.strokeStyle = '#a855f7';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(objectX, centerY);
    ctx.lineTo(lensX, centerY);
    ctx.lineTo(sensorX, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // ===== DISTANCIAS (anotaciones) =====
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';

    // Línea Working Distance
    const ydist = centerY + objHalfHeight + 30;
    ctx.beginPath();
    ctx.moveTo(objectX, ydist);
    ctx.lineTo(lensX, ydist);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(objectX, ydist, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lensX, ydist, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`WD = ${store.workingDistance.toFixed(0)}mm`, (objectX + lensX) / 2, ydist + 15);

    // Línea Focal Length
    const yf = centerY - objHalfHeight - 30;
    ctx.beginPath();
    ctx.moveTo(lensX, yf);
    ctx.lineTo(sensorX, yf);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(lensX, yf, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sensorX, yf, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`f = ${store.focalLength.toFixed(1)}mm`, (lensX + sensorX) / 2, yf - 10);

    // ===== INFORMACIÓN EN ESQUINA =====
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const infoX = padding + 10;
    let infoY = padding + 20;
    ctx.fillText(`FOV H: ${store.results.fovHorizontalMm.toFixed(2)} mm`, infoX, infoY);
    infoY += 15;
    ctx.fillText(`FOV V: ${store.results.fovVerticalMm.toFixed(2)} mm`, infoX, infoY);
    infoY += 15;
    ctx.fillText(`Mag: ×${store.results.magnification.toFixed(4)}`, infoX, infoY);
  };

  useEffect(() => {
    if (store.results?.fovHorizontalMm) {
      drawOpticalDiagram();
    }
  }, [store.results, store.workingDistance, store.focalLength, store.sensorWidth, store.sensorHeight]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 lg:h-full lg:overflow-hidden">
      {/* Canvas Principal */}
      <div className="lg:col-span-4">
        <Card title="Diagrama Óptico" icon="🔬">
          <div className="bg-slate-950 rounded border border-slate-700 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={700}
              height={500}
              className="w-full"
            />
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
              <span className="text-green-400 font-bold">{store.results?.fovHorizontalMm.toFixed(2)} mm</span>
            </div>
            <div className="flex justify-between bg-green-900/30 border border-green-700 p-1.5 rounded">
              <span className="text-green-300">FOV V:</span>
              <span className="text-green-400 font-bold">{store.results?.fovVerticalMm.toFixed(2)} mm</span>
            </div>
            <div className="flex justify-between bg-blue-900/30 border border-blue-700 p-1.5 rounded">
              <span className="text-blue-300">Magnification:</span>
              <span className="text-blue-400 font-bold">×{store.results?.magnification.toFixed(4)}</span>
            </div>
          </div>
        </Card>

        <Card title="Leyenda Visual" icon="📍" className="p-2">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
              <span>Objeto</span>
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
              <span>Eje óptico</span>
            </div>
          </div>
        </Card>

        <Card title="Nota" icon="ℹ️" className="p-2">
          <p className="text-xs text-slate-300">Diagrama esquemático basado en aproximación de lente delgada (paraxial)</p>
        </Card>
      </div>
    </div>
  );
}
