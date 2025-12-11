import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-x-hidden">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between z-30 w-full">
        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
          <span className="material-symbols-outlined text-xl">medical_services</span>
          <span className="font-bold truncate">NombrePagina</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex-shrink-0"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-52 p-4 lg:p-8 pt-20 lg:pt-8 text-slate-900 dark:text-white w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
