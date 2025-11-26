import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-white z-20 shadow-sm p-4 flex justify-between items-center dark:bg-slate-800">
         <div className="flex items-center text-primary-700 dark:text-primary-400">
            <span className="material-symbols-outlined text-2xl mr-2">radiology</span>
            <span className="font-bold text-lg">MedScan AI</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}

