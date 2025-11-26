import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const isActive = (path) => location.pathname === path;
  
  const linkClasses = (path) => `flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
    isActive(path) 
      ? 'bg-primary-50 text-primary-700 dark:bg-slate-700 dark:text-white' 
      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
  }`;

  const finalClasses = `w-64 bg-white shadow-md flex flex-col fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out dark:bg-slate-800 dark:border-r dark:border-slate-700 
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
    md:translate-x-0`;

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <aside className={finalClasses}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center text-primary-700 dark:text-primary-400">
            <span className="material-symbols-outlined text-3xl mr-2">radiology</span>
            <span className="font-bold text-xl">MedScan AI</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link to="/dashboard" className={linkClasses('/dashboard')} onClick={() => setMobileOpen && setMobileOpen(false)}>
            <span className="material-symbols-outlined mr-3">dashboard</span> Dashboard
          </Link>
          <Link to="/upload" className={linkClasses('/upload')} onClick={() => setMobileOpen && setMobileOpen(false)}>
            <span className="material-symbols-outlined mr-3">upload_file</span> Nuevo Análisis
          </Link>
          <Link to="#" className={linkClasses('/history')} onClick={() => setMobileOpen && setMobileOpen(false)}>
            <span className="material-symbols-outlined mr-3">history</span> Historial
          </Link>
          <Link to="/profile" className={linkClasses('/profile')} onClick={() => setMobileOpen && setMobileOpen(false)}>
            <span className="material-symbols-outlined mr-3">person</span> Perfil
          </Link>
          
          <button onClick={toggleTheme} className="w-full flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white mt-4 text-left">
            <span className="material-symbols-outlined mr-3">{isDark ? 'light_mode' : 'dark_mode'}</span>
            {isDark ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <Link to="/login" className="flex items-center px-4 py-3 text-slate-500 hover:text-red-600 transition-colors dark:text-slate-400 dark:hover:text-red-400">
            <span className="material-symbols-outlined mr-3">logout</span> Cerrar Sesión
          </Link>
        </div>
      </aside>
    </>
  );
}

