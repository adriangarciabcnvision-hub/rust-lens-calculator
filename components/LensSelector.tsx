'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/lib/dataStore';
import { uniqueStrings, containsText } from '@/lib/catalogUtils';
import FilterChips from './FilterChips';
import LensCard from './LensCard';

interface LensSelectorProps {
  value: string;
  onChange: (lensId: string) => void;
}

export default function LensSelector({
  value,
  onChange,
}: LensSelectorProps) {

  const { lenses } = useDataStore();

  const [search, setSearch] = useState('');

  const [filters, setFilters] = useState({
    manufacturer: '',
    mount: '',
    sensor: '',
    telecentric: '',
  });

  const updateFilter = (
    key: keyof typeof filters,
    value: string
  ) => {

    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));

  };

  const manufacturers = useMemo(
    () => uniqueStrings(lenses.map(l => l.manufacturer)),
    [lenses]
  );

  const mounts = useMemo(
    () => uniqueStrings(lenses.map(l => l.mount)),
    [lenses]
  );

  const sensors = useMemo(
    () => uniqueStrings(lenses.map(l => l.maxSensor)),
    [lenses]
  );

  const telecentrics = useMemo(
    () => uniqueStrings(lenses.map(l => l.telecentric)),
    [lenses]
  );

  const filtered = useMemo(() => {

    return lenses

      .filter(lens => {

        if (search.trim()) {

          const text = search.toLowerCase();

          const found =

            containsText(lens.name, text) ||

            containsText(lens.manufacturer, text) ||

            containsText(lens.model, text) ||

            containsText(lens.mount, text) ||

            containsText(lens.maxSensor, text) ||

            containsText(lens.telecentric, text) ||

            containsText(lens.aperture, text) ||

            containsText(lens.focalLength, text);

          if (!found)
            return false;
        }

        if (
          filters.manufacturer &&
          lens.manufacturer !== filters.manufacturer
        )
          return false;

        if (
          filters.mount &&
          lens.mount !== filters.mount
        )
          return false;

        if (
          filters.sensor &&
          lens.maxSensor !== filters.sensor
        )
          return false;

        if (
          filters.telecentric &&
          lens.telecentric !== filters.telecentric
        )
          return false;

        return true;

      })

      .sort((a, b) =>

        (a.manufacturer ?? '').localeCompare(b.manufacturer ?? '') ||

        (a.model ?? a.name).localeCompare(b.model ?? b.name)

      );

  }, [
    lenses,
    search,
    filters.manufacturer,
    filters.mount,
    filters.sensor,
    filters.telecentric,
  ]);

  return (

    <div className="space-y-3">

      <input
        type="text"
        placeholder="🔍 Buscar lente..."
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
        title="Montura"
        values={mounts}
        selected={filters.mount}
        onChange={(v) => updateFilter('mount', v)}
      />

      <FilterChips
        title="Sensor"
        values={sensors}
        selected={filters.sensor}
        onChange={(v) => updateFilter('sensor', v)}
      />

      <FilterChips
        title="Telecéntrica"
        values={telecentrics}
        selected={filters.telecentric}
        onChange={(v) => updateFilter('telecentric', v)}
      />

      <div className="text-xs text-slate-400">
        {filtered.length} lente{filtered.length !== 1 ? 's' : ''}
      </div>

      <div className="max-h-[600px] overflow-y-auto space-y-2">

        {filtered.length === 0 && (

          <div className="text-center text-slate-400 py-8">

            No se encontraron lentes

          </div>

        )}

        {filtered.map(lens => (

          <LensCard
            key={lens.id}
            lens={lens}
            selected={lens.id === value}
            onClick={() => onChange(lens.id)}
          />

        ))}

      </div>

    </div>

  );

}