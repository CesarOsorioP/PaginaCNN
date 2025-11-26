import React from 'react';
import { Link } from 'react-router-dom';

export default function UploadError() {
  return (
    <div className="bg-slate-50 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full border border-slate-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Error de Carga</h2>
            <p className="text-slate-500 mb-6">No pudimos procesar la imagen seleccionada. Por favor verifica el formato y vuelve a intentarlo.</p>
            
            <div className="flex flex-col gap-3">
                 <Link to="/upload" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">Intentar de nuevo</Link>
                 <Link to="/dashboard" className="text-slate-500 hover:text-slate-700 font-medium">Volver al Dashboard</Link>
            </div>
        </div>
    </div>
  );
}

