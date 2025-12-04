import React from 'react';

export default function HelperTooltip({ text, position = 'top' }) {
    const positions = {
        top: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
        right: 'left-full ml-3 top-1/2 -translate-y-1/2',
        left: 'right-full mr-3 top-1/2 -translate-y-1/2'
    };

    return (
        <span className="relative group inline-flex">
            <span className="w-5 h-5 rounded-full border border-slate-500 text-slate-300 flex items-center justify-center text-xs cursor-pointer bg-slate-800/60 group-hover:border-cyan-300 group-hover:text-cyan-200 transition-colors">
                i
            </span>
            <span
                className={`pointer-events-none absolute ${positions[position] || positions.top
                    } bg-slate-900 text-slate-100 text-xs rounded-lg px-3 py-2 w-56 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-slate-700`}
            >
                {text}
            </span>
        </span>
    );
}

