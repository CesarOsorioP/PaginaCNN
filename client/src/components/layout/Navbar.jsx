import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                        <span className="material-symbols-outlined text-3xl">medical_services</span>
                        <span className="font-bold text-xl">MedScan AI</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link
                            to="/demo"
                            className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors font-medium"
                        >
                            Demo en vivo
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
                                {isDark ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                        <Link
                            to="/login"
                            className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors"
                        >
                            Iniciar Sesión
                        </Link>
                        <Link
                            to="/signup"
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Registrarse
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
