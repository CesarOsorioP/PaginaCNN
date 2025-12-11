import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
    const { isDark, toggleTheme } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-4">
                    <Link to="/" className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-3xl">medical_services</span>
                        <span className="font-bold text-xl truncate">NombrePagina</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/demo"
                            className="text-slate-600 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 transition-colors font-medium"
                        >
                            Demo en vivo
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        >
                            <span className="material-symbols-outlined">
                                {isDark ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                        <Link
                            to="/login"
                            className="text-slate-600 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 transition-colors font-medium"
                        >
                            Iniciar Sesión
                        </Link>
                        <Link
                            to="/signup"
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-cyan-600/20"
                        >
                            Registrarse
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                        >
                            <span className="material-symbols-outlined text-xl">
                                {isDark ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-2xl">
                                {mobileOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="px-4 py-4 space-y-3 flex flex-col">
                        <Link
                            to="/demo"
                            onClick={() => setMobileOpen(false)}
                            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors font-medium"
                        >
                            Demo en vivo
                        </Link>
                        <Link
                            to="/login"
                            onClick={() => setMobileOpen(false)}
                            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors font-medium"
                        >
                            Iniciar Sesión
                        </Link>
                        <Link
                            to="/signup"
                            onClick={() => setMobileOpen(false)}
                            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors font-medium text-center shadow-md"
                        >
                            Registrarse
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
