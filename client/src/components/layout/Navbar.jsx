import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 dark:bg-slate-900 dark:border-b dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
                <div className="flex items-center">
                    <span className="material-symbols-outlined text-primary-600 text-3xl mr-2">radiology</span>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">MedScan AI</span>
                </div>
                <div className="hidden sm:flex items-center space-x-8">
                    <a href="#how-it-works" className="text-slate-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium dark:text-slate-300 dark:hover:text-white">Demo</a>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={toggleTheme} className="p-2 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <Link to="/login" className="text-primary-600 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium dark:text-primary-400 dark:hover:text-primary-300">Iniciar Sesión</Link>
                    <Link to="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Registrarse</Link>
                </div>
            </div>
        </div>
    </nav>
  );
}

