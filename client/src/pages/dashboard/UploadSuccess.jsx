import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UploadSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/report/1'); // Redirect to report
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="bg-slate-50 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full border border-slate-100">
            <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
                <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-primary-600 text-3xl">radiology</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Analizando Radiografía</h2>
            <p className="text-slate-500 mb-6">Nuestra IA está procesando la imagen. Esto tomará unos segundos...</p>
            
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                <div className="bg-primary-600 h-2.5 rounded-full animate-[pulse_2s_infinite]" style={{ width: '85%' }}></div>
            </div>
            <p className="text-xs text-slate-400">Procesando capas neuronales...</p>
        </div>
    </div>
  );
}

