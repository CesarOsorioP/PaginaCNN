import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavigationButtons() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center gap-2 mb-4">
            <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                title="Ir atrás"
            >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <button
                onClick={() => navigate(1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                title="Ir adelante"
            >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
        </div>
    );
}

