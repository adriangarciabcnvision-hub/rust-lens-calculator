'use client';

import { StoredCamera } from '@/lib/dataStore';

interface CameraCardProps {
  camera: StoredCamera;
  selected: boolean;
  onClick: () => void;
}

export default function CameraCard({
  camera,
  selected,
  onClick,
}: CameraCardProps) {

  return (

    <button
      onClick={onClick}
      className={`

      w-full
      rounded-lg
      border
      p-3
      text-left
      transition

      ${
        selected
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-slate-700 bg-slate-800 hover:border-amber-600 hover:bg-slate-700'
      }

      `}
    >

      <div className="flex justify-between items-start">

        <div>

          <div className="font-bold text-white">

            {camera.manufacturer}

            {' '}

            {camera.model ?? camera.name}

          </div>

          <div className="text-xs text-slate-400 mt-1">

            {camera.sensor}

          </div>

        </div>

      </div>

      <div className="grid grid-cols-2 gap-y-1 mt-3 text-xs">

        <div>

          <span className="text-slate-400">Resolución</span>

          <div className="text-white">

            {camera.resolutionH} × {camera.resolutionV}

          </div>

        </div>

        <div>

          <span className="text-slate-400">Pixel</span>

          <div className="text-white">

            {camera.pixelSize} µm

          </div>

        </div>

        <div>

          <span className="text-slate-400">Interface</span>

          <div className="text-white">

            {camera.interface || '-'}

          </div>

        </div>

        <div>

          <span className="text-slate-400">Shutter</span>

          <div className="text-white">

            {camera.shutter || '-'}

          </div>

        </div>

        <div>

          <span className="text-slate-400">Color</span>

          <div className="text-white">

            {camera.color || '-'}

          </div>

        </div>

        <div>

          <span className="text-slate-400">FPS</span>

          <div className="text-white">

            {camera.maxFps ?? '-'}

          </div>

        </div>

      </div>

    </button>

  );

}