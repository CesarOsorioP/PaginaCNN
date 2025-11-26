import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function Report() {
  const { id } = useParams();

  return (
    <div>
        {/* Top Bar */}
        <div className="flex justify-between items-start mb-6">
            <div>
                 <div className="flex items-center text-sm text-slate-500 mb-2 dark:text-slate-400">
                    <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">Dashboard</Link>
                    <span className="mx-2">/</span>
                    <span className="text-slate-900 font-medium dark:text-white">Reporte #{id || 'PT-4829'}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reporte de Análisis IA</h1>
            </div>
            <button className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                <span className="material-symbols-outlined mr-2 text-sm">download</span> Descargar PDF
            </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Image & Overlay */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                        <h3 className="font-bold text-slate-700 dark:text-white">Visualización de Rayos X</h3>
                        <div className="flex gap-2 text-sm">
                            <span className="flex items-center text-red-600 font-medium dark:text-red-400"><span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span> Anomalía Detectada</span>
                        </div>
                    </div>
                    <div className="relative bg-black flex justify-center items-center min-h-[500px]">
                        {/* Placeholder for X-Ray Image */}
                        <div className="text-slate-500 flex flex-col items-center">
                            <span className="material-symbols-outlined text-6xl opacity-50">image</span>
                            <span className="mt-2">Imagen de Radiografía</span>
                        </div>
                        {/* Simulate Heatmap Overlay */}
                        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-red-500 rounded-full opacity-30 blur-xl"></div>
                        <div className="absolute top-1/3 right-1/3 w-20 h-20 border-2 border-red-500 rounded-full opacity-80"></div>
                    </div>
                     <div className="p-4 bg-slate-50 flex justify-between items-center text-sm text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                        <span>Zoom: 100%</span>
                        <div className="flex gap-2">
                            <button className="hover:text-primary-600 dark:hover:text-primary-400"><span className="material-symbols-outlined">zoom_in</span></button>
                            <button className="hover:text-primary-600 dark:hover:text-primary-400"><span className="material-symbols-outlined">zoom_out</span></button>
                            <button className="hover:text-primary-600 dark:hover:text-primary-400"><span className="material-symbols-outlined">contrast</span></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Sidebar */}
            <div className="space-y-6">
                
                {/* Diagnosis Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 dark:bg-slate-800 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Diagnóstico Principal</h3>
                    <div className="flex items-start mb-4">
                        <div className="bg-red-100 p-2 rounded-lg mr-4 text-red-600 dark:bg-red-900 dark:text-red-200">
                            <span className="material-symbols-outlined">warning</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Neumonía</h2>
                            <p className="text-slate-500 text-sm dark:text-slate-400">Lóbulo superior derecho</p>
                        </div>
                    </div>
                    <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">Confianza IA</span>
                            <span className="font-bold text-slate-900 dark:text-white">98.2%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-700">
                            <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full" style={{ width: '98.2%' }}></div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                        Se observa opacidad focal en el lóbulo superior derecho sugestiva de consolidación neumónica.
                    </p>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 dark:bg-slate-800 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Recomendaciones</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start text-sm text-slate-700 dark:text-slate-300">
                            <span className="material-symbols-outlined text-primary-600 text-base mr-2 mt-0.5 dark:text-primary-400">check_circle</span>
                            Correlación clínica sugerida.
                        </li>
                        <li className="flex items-start text-sm text-slate-700 dark:text-slate-300">
                            <span className="material-symbols-outlined text-primary-600 text-base mr-2 mt-0.5 dark:text-primary-400">check_circle</span>
                            Considerar tratamiento antibiótico según protocolo.
                        </li>
                         <li className="flex items-start text-sm text-slate-700 dark:text-slate-300">
                            <span className="material-symbols-outlined text-primary-600 text-base mr-2 mt-0.5 dark:text-primary-400">check_circle</span>
                            Seguimiento radiológico en 4-6 semanas.
                        </li>
                    </ul>
                </div>

                {/* Patient Details */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 dark:bg-slate-800 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Detalles del Paciente</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">ID:</span>
                            <span className="font-medium text-slate-900 dark:text-white">PT-4829</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Fecha:</span>
                            <span className="font-medium text-slate-900 dark:text-white">20 Nov 2025</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Modalidad:</span>
                            <span className="font-medium text-slate-900 dark:text-white">Rayos X (DX)</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}

