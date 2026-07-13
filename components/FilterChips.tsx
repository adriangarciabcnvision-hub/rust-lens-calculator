'use client';

interface FilterChipsProps {

    title: string;

    values: string[];

    selected: string;

    onChange: (value: string) => void;

}

export default function FilterChips({

    title,

    values,

    selected,

    onChange

}: FilterChipsProps) {

    return (

        <div className="space-y-1">

            <div className="text-xs text-slate-400">

                {title}

            </div>

            <div className="flex flex-wrap gap-2">

                <button

                    onClick={() => onChange('')}

                    className={`

                    px-2

                    py-1

                    rounded

                    text-xs

                    transition

                    ${selected === ''

                        ? 'bg-amber-500 text-black'

                        : 'bg-slate-700 text-white hover:bg-slate-600'

                    }

                    `}

                >

                    Todos

                </button>

                {values.map(value => (

                    <button

                        key={value}

                        onClick={() => onChange(value)}

                        className={`

                        px-2

                        py-1

                        rounded

                        text-xs

                        transition

                        ${selected === value

                            ? 'bg-amber-500 text-black'

                            : 'bg-slate-700 text-white hover:bg-slate-600'

                        }

                        `}

                    >

                        {value}

                    </button>

                ))}

            </div>

        </div>

    );

}