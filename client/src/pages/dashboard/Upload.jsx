import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Upload() {
  const navigate = useNavigate();

  const handleAnalyze = (e) => {
    e.preventDefault();
    navigate('/upload-success');
  };

  return (
    <div>
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-slate-500 mb-6 dark:text-slate-400">
            <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900 font-medium dark:text-white">Nuevo Análisis</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-6 dark:text-white">Cargar Radiografía de Tórax</h1>

        <div className="grid lg:grid-cols-3 gap-8">
            {/* Upload Area */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 dark:bg-slate-800 dark:border-slate-700">
                    
                    {/* Upload Zone */}
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer group dark:border-slate-600 dark:hover:bg-slate-700">
                        <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform dark:bg-slate-700 dark:text-primary-400">
                            <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-white">Arrastra y suelta tu imagen aquí</h3>
                        <p className="text-slate-500 mb-6 dark:text-slate-400">Soporta JPG, PNG (Max 10MB)</p>
                        <button className="bg-white border border-slate-300 text-slate-700 font-medium py-2 px-6 rounded-lg hover:bg-slate-50 transition-colors shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600">
                            Seleccionar archivo
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex justify-end gap-3">
                        <Link to="/dashboard" className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-700">Cancelar</Link>
                        <button onClick={handleAnalyze} className="px-8 py-3 bg-primary-600 text-white font-bold rounded-lg shadow-md hover:bg-primary-700 transition-colors flex items-center">
                            <span className="material-symbols-outlined mr-2">auto_fix_high</span> Analizar con IA
                        </button>
                    </div>
                </div>
            </div>

            {/* Instructions/Help */}
            <div className="lg:col-span-1">
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 dark:bg-slate-800 dark:border-slate-700">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center dark:text-blue-300">
                        <span className="material-symbols-outlined mr-2">info</span> Guía de Carga
                    </h3>
                    <ul className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
                        <li className="flex items-start">
                            <span className="material-symbols-outlined text-blue-600 text-lg mr-2 mt-0.5 dark:text-blue-400">check_circle</span>
                            <span>Asegúrate de que la imagen sea nítida y tenga buen contraste.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="material-symbols-outlined text-blue-600 text-lg mr-2 mt-0.5 dark:text-blue-400">check_circle</span>
                            <span>La radiografía debe ser frontal (AP o PA) para mejores resultados.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="material-symbols-outlined text-blue-600 text-lg mr-2 mt-0.5 dark:text-blue-400">check_circle</span>
                            <span>Elimina cualquier información personal incrustada en la imagen si no es necesario.</span>
                        </li>
                    </ul>
                </div>
                <div className="mt-6 p-4 bg-white rounded-xl border border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                     <h4 className="font-semibold text-slate-900 mb-2 text-sm dark:text-white">Formatos soportados</h4>
                     <div className="flex gap-2">
                         <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium dark:bg-slate-700 dark:text-slate-300">JPG</span>
                         <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium dark:bg-slate-700 dark:text-slate-300">PNG</span>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
}

