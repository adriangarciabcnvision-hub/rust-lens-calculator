'use client';

import { StoredLens } from '@/lib/dataStore';

interface Props {

    lens: StoredLens;

    selected:boolean;

    onClick:()=>void;

}

export default function LensCard({

    lens,

    selected,

    onClick

}:Props){

    return(

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
                ? 'border-amber-500 ring-2 ring-amber-500 bg-amber-500/10'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
            }

            `}

        >

            <div className="font-bold text-white">

                {lens.manufacturer}

                {' '}

                {lens.model ?? lens.name}

            </div>

            <div className="grid grid-cols-2 gap-y-2 mt-3 text-xs">

                <div>

                    <span className="text-slate-400">

                        Focal

                    </span>

                    <div className="text-white">

                        {lens.focalLength} mm

                    </div>

                </div>

                <div>

                    <span className="text-slate-400">

                        Aperture

                    </span>

                    <div className="text-white">

                        {lens.aperture ?? '-'}

                    </div>

                </div>

                <div>

                    <span className="text-slate-400">

                        Mount

                    </span>

                    <div className="text-white">

                        {lens.mount ?? '-'}

                    </div>

                </div>

                <div>

                    <span className="text-slate-400">

                        Max Sensor

                    </span>

                    <div className="text-white">

                        {lens.maxSensor ?? '-'}

                    </div>

                </div>

                <div>

                    <span className="text-slate-400">

                        Telecentric

                    </span>

                    <div className="text-white">

                        {lens.telecentric ?? '-'}

                    </div>

                </div>

            </div>

        </button>

    );

}