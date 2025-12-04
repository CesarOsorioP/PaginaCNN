import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import NavigationButtons from '../../components/NavigationButtons';
import HelperTooltip from '../../components/HelperTooltip';

export default function Dashboard() {
    const { user } = useAuth();
    const [studies, setStudies] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // Calculate metrics
    const totalStudies = studies.length;
    
    // Calculate growth (this month vs last month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const studiesThisMonth = studies.filter(study => {
        const date = new Date(study.createdAt || study.analysisDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const studiesLastMonth = studies.filter(study => {
        const date = new Date(study.createdAt || study.analysisDate);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    }).length;

    const growth = studiesLastMonth === 0 
        ? (studiesThisMonth > 0 ? 100 : 0) 
        : ((studiesThisMonth - studiesLastMonth) / studiesLastMonth) * 100;

    const anomaliesDetected = studies.filter((study) => {
        const topResult = study.results?.reduce((max, current) =>
            current.probability > max.probability ? current : max,
            study.results[0]
        ) || { condition: 'Normal', probability: 0 };
        const conditionLower = topResult.condition?.toLowerCase() || '';
        return !conditionLower.includes('normal') && !conditionLower.includes('no finding');
    }).length;

    // Calculate average processing time
    const studiesWithTime = studies.filter(s => s.processingTime);
    const avgTimeMs = studiesWithTime.length > 0
        ? studiesWithTime.reduce((acc, s) => acc + s.processingTime, 0) / studiesWithTime.length
        : 0;
    const avgTimeSec = (avgTimeMs / 1000).toFixed(1);

    // Calculate average processing time for last month
    const studiesWithTimeLastMonth = studies.filter(s => {
        if (!s.processingTime) return false;
        const date = new Date(s.createdAt || s.analysisDate);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });
    const avgTimeLastMonthMs = studiesWithTimeLastMonth.length > 0
        ? studiesWithTimeLastMonth.reduce((acc, s) => acc + s.processingTime, 0) / studiesWithTimeLastMonth.length
        : 0;
    
    const timeDiff = avgTimeLastMonthMs > 0 
        ? (avgTimeMs - avgTimeLastMonthMs) / 1000 
        : 0;
    const timeDiffLabel = timeDiff > 0 ? `+${timeDiff.toFixed(1)}s` : `${timeDiff.toFixed(1)}s`;

    const getResultBadge = (condition) => {
        const conditionLower = condition?.toLowerCase() || '';

        if (conditionLower.includes('normal') || conditionLower.includes('no finding')) {
            return <span className="px-3 py-1 bg-green-900 text-green-300 rounded-md text-xs font-medium">Normal</span>;
        } else if (conditionLower.includes('pneumonia') || conditionLower.includes('neumonía')) {
            return <span className="px-3 py-1 bg-red-900 text-red-300 rounded-md text-xs font-medium">Neumonía</span>;
        } else if (conditionLower.includes('nódulo') || conditionLower.includes('nodule')) {
            return <span className="px-3 py-1 bg-yellow-900 text-yellow-300 rounded-md text-xs font-medium">Nódulo</span>;
        } else {
            return <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-md text-xs font-medium">{condition}</span>;
        }
    };

    const getModelLabel = (modelType) => {
        if (!modelType) return 'EfficientNet-B4';
        const map = {
            efficientnet: 'EfficientNet-B4',
            densenet121: 'DenseNet121'
        };
        return map[modelType] || modelType;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen dark:bg-slate-900 bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
        );
    }

    return (
        <div className="text-slate-900 dark:text-white transition-colors duration-300">
            <NavigationButtons />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                        Bienvenido, {user?.firstName || user?.username || 'User'}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Resumen de tus análisis recientes.</p>
                </div>
                <Link
                    to="/upload"
                    className="bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors justify-center sm:justify-start shadow-lg shadow-cyan-500/20"
                >
                    <span className="text-xl">+</span>
                    <span>Nueva Radiografía</span>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Estudios Totales</span>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">folder_open</span>
                        </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900 dark:text-white">{totalStudies}</div>
                    <div className={`text-sm flex items-center gap-1 ${growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <span className="material-symbols-outlined text-xs">{growth >= 0 ? 'trending_up' : 'trending_down'}</span>
                        <span>{growth > 0 ? '+' : ''}{growth.toFixed(0)}% este mes</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Anomalías Detectadas</span>
                            <HelperTooltip text="Cantidad de estudios que presentaron algún hallazgo patológico (no normal)." />
                        </div>
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                            <span className="material-symbols-outlined text-red-600 dark:text-red-400">warning</span>
                        </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900 dark:text-white">{anomaliesDetected}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm">
                        {totalStudies > 0 ? ((anomaliesDetected / totalStudies) * 100).toFixed(1) : 0}% del total
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Tiempo Promedio</span>
                            <HelperTooltip text="Tiempo medio que toma el modelo en procesar y retornar un diagnóstico." />
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <span className="material-symbols-outlined text-green-600 dark:text-green-400">schedule</span>
                        </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900 dark:text-white">{avgTimeSec}s</div>
                    <div className={`text-sm flex items-center gap-1 ${timeDiff <= 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        <span className="material-symbols-outlined text-xs">{timeDiff <= 0 ? 'trending_down' : 'trending_up'}</span>
                        <span>{timeDiff !== 0 ? `${timeDiffLabel} vs mes anterior` : 'Sin datos previos'}</span>
                    </div>
                </div>
            </div>

            {/* Recent Studies Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none transition-all">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Estudios Recientes</h2>
                    <Link to="/history" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 text-xs sm:text-sm">
                        Ver todos →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr className="text-left text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                                <th className="px-4 sm:px-6 py-3">ID Paciente</th>
                                <th className="px-4 sm:px-6 py-3">Fecha</th>
                                <th className="px-4 sm:px-6 py-3">Resultado IA</th>
                                <th className="px-4 sm:px-6 py-3">Confianza</th>
                                <th className="px-4 sm:px-6 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {studies.slice(0, 3).map((study) => {
                                const topResult = study.results?.reduce((max, current) =>
                                    current.probability > max.probability ? current : max,
                                    study.results[0]
                                ) || { condition: 'Pendiente', probability: 0 };

                                return (
                                    <tr key={study._id} className="text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            #{study._id.slice(-6).toUpperCase()}
                                            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-500 mt-1">
                                                {getModelLabel(study.modelType)}
                                            </p>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {new Date(study.createdAt).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">{getResultBadge(topResult.condition)}</td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-500 dark:text-slate-400">{(topResult.probability * 100).toFixed(1)}%</td>
                                        <td className="px-4 sm:px-6 py-4 text-right">
                                            <Link to={`/report/${study._id}`} className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
                                                Ver Reporte
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
