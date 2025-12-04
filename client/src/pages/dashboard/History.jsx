import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import NavigationButtons from '../../components/NavigationButtons';

export default function History() {
    const [studies, setStudies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const getModelLabel = (modelType) => {
        if (!modelType) return 'EfficientNet-B4';
        const map = {
            efficientnet: 'EfficientNet-B4',
            densenet121: 'DenseNet121'
        };
        return map[modelType] || modelType;
    };

    useEffect(() => {
        const fetchStudies = async () => {
            try {
                const { data } = await api.get('/studies');
                setStudies(data);
            } catch (error) {
                console.error('Error fetching studies:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudies();
    }, []);

    const getResultBadge = (condition) => {
        const conditionLower = condition?.toLowerCase() || '';

        if (conditionLower.includes('normal') || conditionLower.includes('no finding')) {
            return <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">Normal</span>;
        } else if (conditionLower.includes('pneumonia') || conditionLower.includes('neumonía')) {
            return <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">Neumonía</span>;
        } else if (conditionLower.includes('nódulo') || conditionLower.includes('nodule')) {
            return <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 rounded-full text-xs font-medium">Nódulo</span>;
        } else if (conditionLower.includes('edema')) {
            return <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">Edema pulmonar</span>;
        } else {
            return <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-full text-xs font-medium">{condition}</span>;
        }
    };

    const filteredStudies = studies.filter((study) => {
        const topResult = study.results?.reduce((max, current) =>
            current.probability > max.probability ? current : max,
            study.results[0]
        ) || { condition: 'Pendiente', probability: 0 };

        const searchLower = searchTerm.toLowerCase();
        return (
            study._id.toLowerCase().includes(searchLower) ||
            topResult.condition.toLowerCase().includes(searchLower) ||
            getModelLabel(study.modelType).toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
        );
    }

    return (
        <div className="max-w-full">
            <NavigationButtons />
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900 dark:text-white">Historial de Análisis</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Registro completo de radiografías procesadas.</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por ID o resultado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm dark:shadow-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr className="text-left text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                                <th className="px-4 sm:px-6 py-3">ID Paciente</th>
                                <th className="px-4 sm:px-6 py-3">Fecha</th>
                                <th className="px-4 sm:px-6 py-3">Hora</th>
                                <th className="px-4 sm:px-6 py-3">Modelo</th>
                                <th className="px-4 sm:px-6 py-3">Resultado IA</th>
                                <th className="px-4 sm:px-6 py-3">Confianza</th>
                                <th className="px-4 sm:px-6 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredStudies.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No se encontraron estudios
                                    </td>
                                </tr>
                            ) : (
                                filteredStudies.map((study) => {
                                    const topResult = study.results?.reduce((max, current) =>
                                        current.probability > max.probability ? current : max,
                                        study.results[0]
                                    ) || { condition: 'Pendiente', probability: 0 };

                                    const studyDate = new Date(study.createdAt || study.analysisDate);
                                    const dateStr = studyDate.toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    });
                                    const timeStr = studyDate.toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });

                                    return (
                                        <tr key={study._id} className="text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                #{study._id.slice(-6).toUpperCase()}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-500 dark:text-slate-400">{dateStr}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-500 dark:text-slate-400">{timeStr}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                                                {getModelLabel(study.modelType)}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">{getResultBadge(topResult.condition)}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-500 dark:text-slate-400">
                                                {(topResult.probability * 100).toFixed(1)}%
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-right">
                                                <Link
                                                    to={`/report/${study._id}`}
                                                    className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300"
                                                >
                                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                                    Ver
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Summary */}
                {filteredStudies.length > 0 && (
                    <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Mostrando 1 - {filteredStudies.length} de {filteredStudies.length} resultados
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button
                                disabled
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

