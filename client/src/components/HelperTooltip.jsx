import React from 'react';

export default function HelperTooltip({ text, position = 'top' }) {
    // En móviles, siempre usar 'bottom' para evitar que se corte
    // En pantallas grandes (sm:), usar la posición especificada
    const positions = {
        top: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
        right: 'bottom-full mb-3 left-1/2 -translate-x-1/2 sm:bottom-auto sm:mb-0 sm:left-full sm:ml-3 sm:top-1/2 sm:-translate-y-1/2',
        left: 'bottom-full mb-3 left-1/2 -translate-x-1/2 sm:bottom-auto sm:mb-0 sm:right-full sm:mr-3 sm:top-1/2 sm:-translate-y-1/2'
    };

    return (
        <span className="relative group inline-flex">
            <span className="w-5 h-5 rounded-full border border-slate-500 text-slate-300 flex items-center justify-center text-xs cursor-pointer bg-slate-800/60 group-hover:border-cyan-300 group-hover:text-cyan-200 transition-colors">
                i
            </span>
            <span
                className={`pointer-events-none absolute ${positions[position] || positions.top
                    } bg-slate-900 text-slate-100 text-xs rounded-lg px-3 py-2 w-56 max-w-[calc(100vw-2rem)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-slate-700 z-50`}
            >
                {text}
            </span>
        </span>
    );
}

