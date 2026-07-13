'use client';

import { ReactNode } from 'react';

interface DialogProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export default function Dialog({
    open,
    title,
    onClose,
    children,
}: DialogProps) {

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

            <div className="w-full max-w-5xl max-h-[90vh] bg-slate-900 rounded-xl border border-slate-700 shadow-2xl flex flex-col">

                <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">

                    <h2 className="text-lg font-bold text-amber-400">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-xl"
                    >
                        ✕
                    </button>

                </div>

                <div className="overflow-y-auto p-5">

                    {children}

                </div>

            </div>

        </div>
    );

}