import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from '../../context/HistoryContext';

export default function History() {
  const { history } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredHistory = history.filter(item => 
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.result.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentData = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Historial de Análisis</h1>
                <p className="text-slate-500 dark:text-slate-400">Registro completo de radiografías procesadas.</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar por ID o resultado..." 
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th className="px-6 py-3">ID Paciente</th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Hora</th>
                            <th className="px-6 py-3">Resultado IA</th>
                            <th className="px-6 py-3">Confianza</th>
                            <th className="px-6 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {currentData.length > 0 ? (
                            currentData.map((study, index) => (
                                <tr key={index} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">#{study.id}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{study.date}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{study.time}</td>
                                    <td className="px-6 py-4">{getStatusBadge(study.result, study.status)}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{study.confidence}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/report/${index}`} className="text-primary-600 hover:text-primary-800 font-medium dark:text-primary-400 dark:hover:text-primary-300 flex items-center justify-end gap-1">
                                            <span className="material-symbols-outlined text-base">visibility</span> Ver
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                    No se encontraron resultados para "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center dark:bg-slate-700/50 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    Mostrando {filteredHistory.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredHistory.length)} de {filteredHistory.length} resultados
                </span>
                
                {/* Pagination */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-600"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-600"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}
