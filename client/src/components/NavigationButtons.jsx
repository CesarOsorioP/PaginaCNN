import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavigationButtons() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center gap-2 mb-4 sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 py-2 sm:static sm:bg-transparent sm:py-0">
            <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-300 dark:border-slate-700"
                title="Ir atrás"
            >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <button
                onClick={() => navigate(1)}
                className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-300 dark:border-slate-700"
                title="Ir adelante"
            >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
        </div>
    );
}

