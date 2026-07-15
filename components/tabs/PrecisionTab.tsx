'use client';

import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';

import { useCalculatorStore } from '@/lib/store';



type PrecisionField = "fov" | "resolution" | "spatial";

export function PrecisionTab() {

    const store = useCalculatorStore();


    const [useCalculatorValues, setUseCalculatorValues] = useState(true);

const [manualFov, setManualFov] = useState(0);

const [manualResolution, setManualResolution] = useState(0);

const [manualSpatial, setManualSpatial] = useState(0);

// FOV, Resolución cámara y Resolución del sistema están ligados por spatial = fov/resolution.
// Solo hay 2 grados de libertad: se recuerda el orden de edición (más reciente primero) y,
// al editar un campo, se recalcula el que lleve MÁS TIEMPO sin tocarse — el otro campo
// (el editado justo antes de este) se deja tal cual, igual que pidió el cliente.
const [editPriority, setEditPriority] = useState<PrecisionField[]>([
    "resolution",
    "fov",
    "spatial",
]);

const handleManualEdit = (
    field: PrecisionField,
    value: number
) => {
    const newPriority: PrecisionField[] = [
        field,
        ...editPriority.filter((f) => f !== field),
    ];
    const computedField = newPriority[2];

    let fovV = field === "fov" ? value : manualFov;
    let resV = field === "resolution" ? value : manualResolution;
    let spV = field === "spatial" ? value : manualSpatial;

    if (computedField === "spatial") {
        spV = resV > 0 ? fovV / resV : 0;
    } else if (computedField === "fov") {
        fovV = resV * spV;
    } else if (computedField === "resolution") {
        resV = spV > 0 ? fovV / spV : 0;
    }

    setEditPriority(newPriority);
    setManualFov(fovV);
    setManualResolution(resV);
    setManualSpatial(spV);
};

const fov = useCalculatorValues
    ? (store.results?.fovHorizontalMm ?? 0)
    : manualFov;

const resolution = useCalculatorValues
    ? (store.resolution_h ?? 0)
    : manualResolution;

const spatialResolution = useCalculatorValues
    ? (resolution > 0 ? fov / resolution : 0)
    : manualSpatial;

    const [blobSize, setBlobSize] =
        useState(1);

    const blobPixels = useMemo(() => {

        if (
            spatialResolution <= 0
        )
            return 0;

        return blobSize / spatialResolution;

    }, [
        blobSize,
        spatialResolution
    ]);

    const blobOk =
        blobPixels >= 5;

    const dimensional = [

        {
            title: "Óptica estándar + Backlight",
            factor: 1
        },

        {
            title: "Telecéntrica + Backlight",
            factor: 0.5
        },

        {
            title: "Telecéntrica + Backlight colimado",
            factor: 0.25
        },

        {
            title: "Telecéntrica + Backlight telecéntrico",
            factor: 0.125
        },

        {
            title: "Óptica estándar + Frontal",
            factor: 3
        }

    ];

    return (

        <div className="space-y-3">
<Card
    title="Origen de los datos"
    icon="📥"
>

    <div className="space-y-3">


        <label className="flex items-center gap-2 cursor-pointer">

            <input
                type="radio"
                checked={useCalculatorValues}
                onChange={() => setUseCalculatorValues(true)}
            />

            <span>

                Usar datos de la Calculadora

            </span>

        </label>

        <label className="flex items-center gap-2 cursor-pointer">

            <input
                type="radio"
                checked={!useCalculatorValues}
                onChange={() => setUseCalculatorValues(false)}
            />

            <span>

                Introducir manualmente

            </span>

        </label>

    </div>

</Card>

            <Card
    title="Características"
    icon="📏"
>

    <div className="grid grid-cols-3 gap-3">

        <FormInput
            label="Campo de visión X"
            type="number"
            value={fov}
            onChange={(v) =>
                handleManualEdit(
                    "fov",
                    typeof v === "string"
                        ? parseFloat(v)
                        : v
                )
            }
            disabled={useCalculatorValues}
            unit="mm"
        />

        <FormInput
            label="Resolución cámara X"
            type="number"
            value={resolution}
            onChange={(v) =>
                handleManualEdit(
                    "resolution",
                    typeof v === "string"
                        ? parseFloat(v)
                        : v
                )
            }
            disabled={useCalculatorValues}
            unit="px"
        />

        <FormInput
            label="Resolución del sistema"
            type="number"
            value={spatialResolution}
            onChange={(v) =>
                handleManualEdit(
                    "spatial",
                    typeof v === "string"
                        ? parseFloat(v)
                        : v
                )
            }
            disabled={useCalculatorValues}
            step="0.0001"
            unit="mm/px"
        />

    </div>

    {!useCalculatorValues && (
        <p className="text-xs text-slate-500 mt-2">
            Los 3 campos están ligados (Resolución del sistema = Campo de visión / Resolución cámara): al editar uno, se recalcula el que lleve más tiempo sin tocar.
        </p>
    )}

</Card>
                        <Card
                title="Detección de defectos"
                icon="🔍"
            >

                <div className="grid grid-cols-2 gap-4">

                    <div>

                        <FormInput
                            label="Tamaño mínimo del defecto"
                            type="number"
                            value={blobSize}
                            onChange={(v) =>
                                setBlobSize(
                                    typeof v === "string"
                                        ? parseFloat(v)
                                        : v
                                )
                            }
                            unit="mm"
                            step="0.1"
                            min={0.1}
                            tooltip="Tamaño mínimo del defecto que deseas detectar."
                        />

                    </div>

                    <div className="bg-slate-800 rounded p-4 flex flex-col justify-center">

                        <p className="text-slate-400 text-sm">

                            Tamaño equivalente

                        </p>

                        <p className="text-3xl font-bold text-amber-400">

                            {blobPixels.toFixed(1)} px

                        </p>

                        <p className="text-xs text-slate-500 mt-1">

                            Resolución espacial:
                            {" "}
                            {spatialResolution.toFixed(4)}
                            {" "}
                            mm/px

                        </p>

                    </div>

                </div>

                <div className="mt-4 rounded bg-slate-800 p-4">

                    <div className="flex justify-between items-center">

                        <span>

                            Regla mínima recomendada

                        </span>

                        <span className="font-bold">

                            5 × 5 píxeles

                        </span>

                    </div>

                    <div className="mt-3">

                        {blobOk ? (

                            <div className="text-green-400 font-semibold">

                                ✅ El defecto será detectable correctamente.

                            </div>

                        ) : (

                            <div className="text-red-400 font-semibold">

                                ❌ El defecto es demasiado pequeño.
                                <br />

                                Se recomienda aumentar resolución,
                                disminuir FOV o utilizar mayor aumento.

                            </div>

                        )}

                    </div>

                </div>

            </Card>

            <Card
                title="Control dimensional"
                icon="📐"
            >

                <div className="overflow-auto">

                    <table className="w-full text-sm">

                        <thead>

                            <tr className="border-b border-slate-700 text-amber-400">

                                <th className="text-left py-2">

                                    Configuración

                                </th>

                                <th className="text-center">

                                    Regla

                                </th>

                                <th className="text-right">

                                    Precisión

                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {dimensional.map((d, i) => (

                                <tr
                                    key={i}
                                    className="border-b border-slate-800 hover:bg-slate-800"
                                >

                                    <td className="py-2">

                                        {d.title}

                                    </td>

                                    <td className="text-center text-slate-400">

                                        × {d.factor}

                                    </td>

                                    <td className="text-right font-bold text-amber-400">

                                        ± {(spatialResolution * d.factor).toFixed(4)} mm

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </Card>
                        <Card
                title="Recomendaciones de visión artificial"
                icon="💡"
            >

                <div className="space-y-3">

                    <div className="bg-slate-800 rounded p-3">

                        <div className="font-semibold text-amber-400">

                            Herramientas de visión

                        </div>

                        <table className="w-full mt-2 text-sm">

                            <tbody>

                                <tr className="border-b border-slate-700">

                                    <td className="py-2">

                                        Blobs o manchas

                                    </td>

                                    <td className="text-right">

                                        ≥ 5 × 5 píxeles

                                    </td>

                                </tr>

                                <tr className="border-b border-slate-700">

                                    <td className="py-2">

                                        Calipers

                                    </td>

                                    <td className="text-right">

                                        Depende de óptica e iluminación

                                    </td>

                                </tr>

                                <tr>

                                    <td className="py-2">

                                        Histogramas

                                    </td>

                                    <td className="text-right">

                                        Δ ≥ 20 niveles

                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>

                    <div className="bg-slate-800 rounded p-3">

                        <div className="font-semibold text-green-400">

                            Posicionado Pick & Place

                        </div>

                        <div className="flex justify-between mt-2">

                            <span>

                                Pattern Matching

                            </span>

                            <span className="font-bold">

                                ± {(spatialResolution * 3).toFixed(4)} mm

                            </span>

                        </div>

                    </div>

                    <div className="bg-slate-800 rounded p-3">

                        <div className="font-semibold text-cyan-400">

                            Sistema 3D

                        </div>

                        <div className="flex justify-between mt-2">

                            <span>

                                Calipers

                            </span>

                            <span className="font-bold">

                                ± {(spatialResolution).toFixed(4)} mm

                            </span>

                        </div>

                    </div>

                </div>

            </Card>

            <Card
                title="Interpretación"
                icon="📊"
            >

                <div className="space-y-2 text-sm">

                    <div className="flex justify-between">

                        <span>

                            Resolución espacial

                        </span>

                        <span className="font-bold text-amber-400">

                            {spatialResolution.toFixed(4)} mm/px

                        </span>

                    </div>

                    <div className="flex justify-between">

                        <span>

                            Precisión típica (Backlight)

                        </span>

                        <span className="font-bold text-green-400">

                            ± {(spatialResolution).toFixed(4)} mm

                        </span>

                    </div>

                    <div className="flex justify-between">

                        <span>

                            Mejor caso (Telecéntrica + Backlight telecéntrico)

                        </span>

                        <span className="font-bold text-cyan-400">

                            ± {(spatialResolution / 8).toFixed(4)} mm

                        </span>

                    </div>

                    <div className="flex justify-between">

                        <span>

                            Peor caso (Iluminación frontal)

                        </span>

                        <span className="font-bold text-red-400">

                            ± {(spatialResolution * 3).toFixed(4)} mm

                        </span>

                    </div>

                </div>

            </Card>

        </div>

    );

}