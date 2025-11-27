import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from '../../context/HistoryContext';

export default function Dashboard() {
  const { history } = useHistory();
  const [showAll, setShowAll] = useState(false);

  // Use history from context instead of hardcoded data
  // History is already expected to be in reverse chronological order (newest first) based on addToHistory implementation
  const displayedStudies = showAll ? history : history.slice(0, 3);

  const getStatusBadge = (result, status) => {
    const styles = {
        red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.green}`}>
            {result}
        </span>
    );
  };

  return (
    <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bienvenido, User</h1>
                <p className="text-slate-500 dark:text-slate-400">Resumen de tus análisis recientes.</p>
            </div>
            <Link to="/upload" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors">
                <span className="material-symbols-outlined mr-2 text-sm">add</span> Nueva Radiografía
            </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 font-medium text-sm dark:text-slate-400">Estudios Totales</h3>
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-lg dark:bg-slate-700 dark:text-blue-400"><span className="material-symbols-outlined">folder_shared</span></span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{history.length}</p>
                <p className="text-sm text-green-600 mt-1 flex items-center dark:text-green-400"><span className="material-symbols-outlined text-sm mr-1">trending_up</span> +12% este mes</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 font-medium text-sm dark:text-slate-400">Anomalías Detectadas</h3>
                    <span className="p-2 bg-red-50 text-red-600 rounded-lg dark:bg-slate-700 dark:text-red-400"><span className="material-symbols-outlined">warning</span></span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">142</p>
                <p className="text-sm text-slate-400 mt-1">11.3% del total</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 font-medium text-sm dark:text-slate-400">Tiempo Promedio</h3>
                    <span className="p-2 bg-green-50 text-green-600 rounded-lg dark:bg-slate-700 dark:text-green-400"><span className="material-symbols-outlined">timer</span></span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">18s</p>
                <p className="text-sm text-green-600 mt-1 flex items-center dark:text-green-400"><span className="material-symbols-outlined text-sm mr-1">arrow_downward</span> -2s vs mes anterior</p>
            </div>
        </div>

        {/* Recent Studies Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">Estudios Recientes</h3>
                <button 
                    onClick={() => setShowAll(!showAll)} 
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium dark:text-primary-400 flex items-center focus:outline-none"
                >
                    {showAll ? 'Ver menos' : 'Ver todos'}
                    <span className={`material-symbols-outlined text-sm ml-1 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th className="px-6 py-3">ID Paciente</th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Resultado IA</th>
                            <th className="px-6 py-3">Confianza</th>
                            <th className="px-6 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {displayedStudies.map((study, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-700">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{study.id.startsWith('#') ? study.id : `#${study.id}`}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{study.date}</td>
                                <td className="px-6 py-4">{getStatusBadge(study.result, study.status)}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{study.confidence}</td>
                                <td className="px-6 py-4 text-right"><Link to={`/report/${index + 1}`} className="text-primary-600 hover:text-primary-800 font-medium dark:text-primary-400 dark:hover:text-primary-300">Ver Reporte</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
