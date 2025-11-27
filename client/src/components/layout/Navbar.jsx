import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 dark:bg-slate-900 dark:border-b dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
                <div className="flex items-center">
                    <span className="material-symbols-outlined text-primary-600 text-3xl mr-2">radiology</span>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">NombrePagina</span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-4">
                    <button onClick={toggleTheme} className="p-2 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <Link to="/login" className="text-primary-600 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium dark:text-primary-400 dark:hover:text-primary-300">Iniciar Sesión</Link>
                    <Link to="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Registrarse</Link>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex items-center md:hidden">
                    <button onClick={toggleTheme} className="p-2 mr-2 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none"
                    >
                        <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <div className="px-4 pt-2 pb-4 space-y-2">
                    <Link 
                        to="/login" 
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-600 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Iniciar Sesión
                    </Link>
                    <Link 
                        to="/signup" 
                        className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Registrarse
                    </Link>
                </div>
            </div>
        )}
    </nav>
  );
}
