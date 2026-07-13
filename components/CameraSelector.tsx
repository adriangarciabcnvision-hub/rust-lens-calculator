'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/lib/dataStore';
import CameraCard from './CameraCard';
import FilterChips from './FilterChips';
import { uniqueStrings, containsText } from '@/lib/catalogUtils';

interface CameraSelectorProps {
  value: string;
  onChange: (cameraId: string) => void;
}



export default function CameraSelector({
  value,
  onChange,
}: CameraSelectorProps) {

  const { cameras } = useDataStore();

  const [filters,setFilters] = useState({

    manufacturer:'',

    interface:'',

    shutter:'',

    color:'',

    sensor:''

});

const sensors = useMemo(
  () => uniqueStrings(cameras.map(c => c.sensor)),
  [cameras]
);

const colors = useMemo(
  () => uniqueStrings(cameras.map(c => c.color)),
  [cameras]
);
  const [search, setSearch] = useState('');
const updateFilter = (
  key: keyof typeof filters,
  value: string
) => {
  setFilters((prev) => ({
    ...prev,
    [key]: value,
  }));
};



  const manufacturers = useMemo(
    () => uniqueStrings(cameras.map(c => c.manufacturer)),
    [cameras]
  );

  const interfaces = useMemo(
    () => uniqueStrings(cameras.map(c => c.interface)),
    [cameras]
  );

  const shutters = useMemo(
    () => uniqueStrings(cameras.map(c => c.shutter)),
    [cameras]
  );

  const filtered = useMemo(() => {

    return cameras

      .filter(camera => {

        if (search.trim()) {

          const text = search.toLowerCase();

        const found =

                containsText(camera.name,text) ||

                containsText(camera.manufacturer,text) ||

                containsText(camera.model,text) ||

                containsText(camera.sensor,text) ||

                containsText(camera.interface,text) ||

                containsText(camera.shutter,text) ||

                containsText(camera.color,text) ||

                containsText(camera.pixelSize,text) ||

                containsText(camera.resolutionH,text) ||

                containsText(camera.resolutionV,text);
          if (!found)
            return false;
        }

    if (
  filters.manufacturer &&
  camera.manufacturer !== filters.manufacturer
)
  return false;

if (
  filters.interface &&
  camera.interface !== filters.interface
)
  return false;

if (
  filters.shutter &&
  camera.shutter !== filters.shutter
)
  return false;

if (
  filters.color &&
  camera.color !== filters.color
)
  return false;

if (
  filters.sensor &&
  camera.sensor !== filters.sensor
)
  return false;

        return true;

      })

      .sort((a, b) =>

        (a.manufacturer ?? '').localeCompare(b.manufacturer ?? '') ||

        (a.model ?? a.name).localeCompare(b.model ?? b.name)

      );

    }, [
    cameras,
    search,
    filters,
    ]);

  return (

    <div className="space-y-3">

      <input
        type="text"
        placeholder="🔍 Buscar cámara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white"
      />

        <FilterChips
        title="Fabricante"
        values={manufacturers}
        selected={filters.manufacturer}
        onChange={(v) => updateFilter('manufacturer', v)}
        />

        <FilterChips
        title="Interface"
        values={interfaces}
        selected={filters.interface}
        onChange={(v) => updateFilter('interface', v)}
        />

        <FilterChips
        title="Shutter"
        values={shutters}
        selected={filters.shutter}
        onChange={(v) => updateFilter('shutter', v)}
        />
        <FilterChips
            title="Sensor"
            values={sensors}
            selected={filters.sensor}
            onChange={(v) => updateFilter('sensor', v)}
            />

            <FilterChips
            title="Color"
            values={colors}
            selected={filters.color}
            onChange={(v) => updateFilter('color', v)}
            />

      <div className="text-xs text-slate-400">
        {filtered.length} cámara{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
      </div>

      <div className="max-h-[600px] overflow-y-auto space-y-2">

        {filtered.length === 0 && (

          <div className="text-center text-slate-400 text-sm py-8">

            No se encontraron cámaras

          </div>

        )}

        {filtered.map(camera => (

          <CameraCard
            key={camera.id}
            camera={camera}
            selected={camera.id === value}
            onClick={() => onChange(camera.id)}
          />

        ))}

      </div>

    </div>

  );

}