import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import NavigationButtons from '../../components/NavigationButtons';
import HelperTooltip from '../../components/HelperTooltip';
import { useTheme } from '../../context/ThemeContext';

const MODEL_METADATA = {
    efficientnet: {
        label: 'EfficientNet-B4',
        description: 'Modelo balanceado entrenado con 50k radiografías validadas.',
        throughput: '1.8s en CPU',
        focus: 'Triaje rápido'
    },
    densenet121: {
        label: 'DenseNet121',
        description: 'Arquitectura profunda para hallazgos sutiles.',
        throughput: '3.5s en GPU',
        focus: 'Sensibilidad avanzada'
    }
};

const getModelMeta = (modelType) => {
    if (!modelType) return MODEL_METADATA.efficientnet;
    return MODEL_METADATA[modelType] || {
        label: modelType,
        description: 'Modelo personalizado registrado',
        throughput: '—',
        focus: 'Personalizado'
    };
};

export default function Report() {
    const { id } = useParams();
    const { isDark } = useTheme();
    const [study, setStudy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('overlay'); // 'original', 'heatmap', 'overlay', 'contour'
    const overlayCanvasRef = useRef(null);

    useEffect(() => {
        const fetchStudy = async () => {
            try {
                const { data } = await api.get(`/studies/${id}`);
                setStudy(data);
            } catch (error) {
                console.error('Error fetching study:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchStudy();
        }
    }, [id]);

    // Función para obtener la URL completa de la imagen
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        // Asegurar que tenga el protocolo y host correcto
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        return `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
    };

    const getDiagnosisInfo = (results) => {
        if (!results || results.length === 0) {
            return {
                condition: 'Pendiente',
                probability: 0,
                location: 'N/A',
                description: 'Análisis en proceso'
            };
        }

        const topResult = results[0]; // Ya viene ordenado del backend

        const conditionMap = {
            'Neumonía': {
                location: 'Lóbulo superior derecho',
                description: 'Se observa opacidad focal en el lóbulo superior derecho sugestiva de consolidación neumónica.'
            },
            'Atelectasia': {
                location: 'Región pulmonar',
                description: 'Colapso parcial o completo del pulmón detectado.'
            },
            'Masa': {
                location: 'Pulmón',
                description: 'Masa pulmonar detectada. Se recomienda evaluación adicional.'
            },
            'Nódulo': {
                location: 'Pulmón',
                description: 'Nódulo pulmonar detectado. Considerar seguimiento radiológico.'
            },
            'Edema': {
                location: 'Espacio pulmonar',
                description: 'Edema pulmonar detectado. Requiere evaluación clínica inmediata.'
            },
            'Normal': {
                location: 'Sin anomalías',
                description: 'Radiografía dentro de parámetros normales. No se detectaron anomalías significativas.'
            },
            'COVID-19': {
                location: 'Pulmón bilateral',
                description: 'Patrón radiológico sugestivo de COVID-19. Se recomienda confirmación con prueba molecular.'
            },
            'Tuberculosis': {
                location: 'Lóbulos superiores',
                description: 'Patrón radiológico sugestivo de tuberculosis. Se requiere confirmación microbiológica.'
            }
        };

        const conditionInfo = conditionMap[topResult.condition] || {
            location: 'Pulmón',
            description: 'Anomalía detectada en la radiografía.'
        };

        return {
            condition: topResult.condition,
            probability: topResult.probability,
            location: conditionInfo.location,
            description: conditionInfo.description
        };
    };

    const getRecommendations = (condition) => {
        const conditionLower = condition?.toLowerCase() || '';
        
        if (conditionLower.includes('neumonía')) {
            return [
                'Correlación clínica sugerida.',
                'Considerar tratamiento antibiótico según protocolo.',
                'Seguimiento radiológico en 4-6 semanas.'
            ];
        } else if (conditionLower.includes('nódulo')) {
            return [
                'Evaluación adicional recomendada.',
                'Considerar tomografía computarizada para caracterización.',
                'Seguimiento en 3-6 meses según protocolo.'
            ];
        } else if (conditionLower.includes('normal')) {
            return [
                'Radiografía dentro de parámetros normales.',
                'Continuar con seguimiento de rutina.'
            ];
        } else if (conditionLower.includes('covid-19')) {
            return [
                'Confirmación con prueba molecular requerida.',
                'Aislamiento según protocolo sanitario.',
                'Monitoreo clínico estrecho.'
            ];
        } else if (conditionLower.includes('tuberculosis')) {
            return [
                'Confirmación microbiológica necesaria.',
                'Aislamiento respiratorio hasta confirmación.',
                'Evaluación de contactos cercanos.'
            ];
        } else if (conditionLower.includes('edema')) {
            return [
                'Evaluación clínica inmediata.',
                'Considerar tratamiento diurético según indicación.',
                'Monitoreo de función cardíaca.'
            ];
        } else {
            return [
                'Correlación clínica sugerida.',
                'Evaluación adicional según presentación clínica.',
                'Seguimiento según indicación médica.'
            ];
        }
    };

    const getResultColor = (condition) => {
        const conditionLower = condition?.toLowerCase() || '';
        if (conditionLower.includes('normal')) {
            return 'text-green-600 dark:text-green-400';
        } else if (conditionLower.includes('neumonía') || conditionLower.includes('edema') || conditionLower.includes('covid-19') || conditionLower.includes('tuberculosis')) {
            return 'text-red-600 dark:text-red-400';
        } else {
            return 'text-orange-600 dark:text-orange-400';
        }
    };

    const getBarColor = (condition, isPredicted) => {
        if (isPredicted) {
            return 'bg-cyan-500 dark:bg-cyan-500';
        }
        const conditionLower = condition?.toLowerCase() || '';
        if (conditionLower.includes('normal')) {
            return 'bg-green-500 dark:bg-green-600';
        } else if (conditionLower.includes('neumonía') || conditionLower.includes('edema') || conditionLower.includes('covid-19') || conditionLower.includes('tuberculosis')) {
            return 'bg-red-500 dark:bg-red-600';
        } else {
            return 'bg-orange-500 dark:bg-orange-600';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
            </div>
        );
    }

    if (!study) {
        return (
            <div className="text-slate-900 dark:text-white text-center py-12 bg-white dark:bg-slate-900 min-h-screen">
                <p className="text-slate-500 dark:text-slate-400">Estudio no encontrado</p>
                <Link to="/dashboard" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 mt-4 inline-block">
                    Volver al Dashboard
                </Link>
            </div>
        );
    }

    const diagnosisInfo = getDiagnosisInfo(study.results);
    const modelMeta = getModelMeta(study.modelType);
    const recommendations = getRecommendations(diagnosisInfo.condition);
    const hasAnomaly = diagnosisInfo.probability > 0.5 && !diagnosisInfo.condition.toLowerCase().includes('normal');
    const top3Results = study.results?.slice(0, 3) || [];

    return (
        <div className="text-slate-900 dark:text-white bg-white dark:bg-slate-900 min-h-screen">
            <NavigationButtons />
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                <Link to="/dashboard" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Dashboard</Link>
                <span className="mx-2">/</span>
                <span className="text-slate-900 dark:text-white font-medium">Reporte #{id.slice(-6).toUpperCase()}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900 dark:text-white">Reporte de Análisis IA</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Inteligencia Artificial Explicable - Visualización de Atención</p>
                </div>
                <button className="bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md">
                    <span className="material-symbols-outlined">download</span>
                    Descargar PDF
                </button>
            </div>

            {/* Main Visualization Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Column 1: Image Views */}
                <div className="lg:col-span-2 space-y-6">
                    {/* View Mode Selector */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Visualización de Rayos X</h2>
                                <HelperTooltip text="Alterna entre la imagen original, el mapa de calor y la superposición para entender por qué la IA tomó su decisión." position="right" />
                            </div>
                            {hasAnomaly && (
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <span className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-pulse"></span>
                                    <span className="text-sm font-medium">Anomalía Detectada</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Mode Buttons */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {['original', 'heatmap', 'overlay', 'contour'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        viewMode === mode
                                            ? 'bg-cyan-600 dark:bg-cyan-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {mode === 'original' && 'Original'}
                                    {mode === 'heatmap' && 'Mapa de Calor'}
                                    {mode === 'overlay' && 'Superposición'}
                                    {mode === 'contour' && 'Contornos'}
                                </button>
                            ))}
                        </div>

                        {/* Image Display */}
                        <div className="relative bg-slate-100 dark:bg-black rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700" style={{ minHeight: '400px' }}>
                            {viewMode === 'original' && study.imageUrl && (
                                <img
                                    src={getImageUrl(study.imageUrl)}
                                    alt="Radiografía Original"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        console.error('Error loading image:', study.imageUrl);
                                        e.target.src = ''; // Limpiar src para evitar loops
                                    }}
                                />
                            )}
                            
                            {viewMode === 'heatmap' && study.heatmap && (
                                <img
                                    src={`data:image/png;base64,${study.heatmap}`}
                                    alt="Mapa de Calor"
                                    className="w-full h-full object-contain"
                                    style={{ filter: 'hue-rotate(180deg)' }}
                                    onError={(e) => {
                                        console.error('Error loading heatmap');
                                        e.target.style.display = 'none';
                                    }}
                                />
                            )}
                            
                            {viewMode === 'overlay' && study.imageUrl && (
                                <div className="relative w-full h-full">
                                    <img
                                        src={getImageUrl(study.imageUrl)}
                                        alt="Radiografía"
                                        className="w-full h-full object-contain"
                                        onLoad={(e) => {
                                            if (study.heatmap && overlayCanvasRef.current) {
                                                const canvas = overlayCanvasRef.current;
                                                const ctx = canvas.getContext('2d');
                                                const img = e.target;
                                                canvas.width = img.naturalWidth || img.width || 400;
                                                canvas.height = img.naturalHeight || img.height || 400;
                                                
                                                // Dibujar imagen base
                                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                                
                                                // Dibujar heatmap encima si existe
                                                if (study.heatmap) {
                                                    const heatmapImg = new Image();
                                                    heatmapImg.onload = () => {
                                                        ctx.globalAlpha = 0.5;
                                                        ctx.drawImage(heatmapImg, 0, 0, canvas.width, canvas.height);
                                                        ctx.globalAlpha = 1.0;
                                                    };
                                                    heatmapImg.onerror = () => {
                                                        console.warn('Error loading heatmap for overlay');
                                                    };
                                                    heatmapImg.src = `data:image/png;base64,${study.heatmap}`;
                                                }
                                            }
                                        }}
                                        onError={(e) => {
                                            console.error('Error loading image for overlay:', study.imageUrl);
                                        }}
                                    />
                                    {study.heatmap && (
                                        <canvas
                                            ref={overlayCanvasRef}
                                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                        />
                                    )}
                                </div>
                            )}
                            
                            {viewMode === 'contour' && study.imageUrl && (
                                <div className="relative w-full h-full">
                                    <img
                                        src={getImageUrl(study.imageUrl)}
                                        alt="Radiografía con Contornos"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            console.error('Error loading image for contour:', study.imageUrl);
                                        }}
                                    />
                                    {hasAnomaly && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-32 h-32 border-4 border-red-600 dark:border-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!study.imageUrl && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                                    <span className="material-symbols-outlined text-6xl mb-4">image</span>
                                    <p>Imagen de Radiografía</p>
                                </div>
                            )}
                        </div>

                        {/* View Label */}
                        <div className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                            {viewMode === 'original' && '(A) Radiografía Original'}
                            {viewMode === 'heatmap' && '(B) Mapa de Atención (Heatmap)'}
                            {viewMode === 'overlay' && `(C) Superposición - ${diagnosisInfo.condition} (${(diagnosisInfo.probability * 100).toFixed(1)}%)`}
                            {viewMode === 'contour' && '(E) Vista de Contornos'}
                        </div>
                    </div>

                    {/* Predictions Chart */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">(D) Probabilidades de Diagnóstico</h2>
                        <div className="space-y-3">
                            {study.results?.map((result, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-slate-900 dark:text-white">{result.condition}</span>
                                        <span className="text-slate-600 dark:text-slate-400">{(result.probability * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${getBarColor(result.condition, index === 0)}`}
                                            style={{ width: `${result.probability * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Column 2: Diagnosis and Stats */}
                <div className="space-y-6">
                    {/* Main Diagnosis */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                            <span className={`material-symbols-outlined ${getResultColor(diagnosisInfo.condition)}`}>
                                {hasAnomaly ? 'warning' : 'check_circle'}
                            </span>
                            DIAGNÓSTICO PRINCIPAL
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <h3 className={`text-xl font-bold ${getResultColor(diagnosisInfo.condition)}`}>
                                    {diagnosisInfo.condition}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{diagnosisInfo.location}</p>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-2">
                                    <span>Confianza IA</span>
                                    <HelperTooltip text="Probabilidad calculada por la red neuronal para el diagnóstico principal. Se expresa como porcentaje." />
                                </div>
                                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                                    {(diagnosisInfo.probability * 100).toFixed(1)}%
                                </p>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{diagnosisInfo.description}</p>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">ESTADÍSTICAS</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-400">Modelo:</span>
                                    <HelperTooltip text="Arquitectura de red neuronal utilizada (e.g., EfficientNet-B4). Cada modelo tiene fortalezas distintas en velocidad o precisión." />
                                </div>
                                <span className="text-slate-900 dark:text-white font-medium">{modelMeta.label}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Predicción:</span>
                                <span className="text-slate-900 dark:text-white font-medium">{diagnosisInfo.condition}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Confianza:</span>
                                <span className="text-cyan-600 dark:text-cyan-400 font-medium">{(diagnosisInfo.probability * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-400">Rendimiento:</span>
                                    <HelperTooltip text="Tiempo promedio que toma el modelo en procesar una imagen en el hardware actual." />
                                </div>
                                <span className="text-slate-900 dark:text-white font-medium">{modelMeta.throughput}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Enfoque:</span>
                                <span className="text-slate-900 dark:text-white font-medium">{modelMeta.focus}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="text-slate-600 dark:text-slate-400">Top 3 Diagnósticos:</p>
                                    <HelperTooltip text="Las tres condiciones con mayor probabilidad según el análisis del modelo." />
                                </div>
                                <ul className="space-y-1">
                                    {top3Results.map((result, index) => (
                                        <li key={index} className="flex justify-between text-xs">
                                            <span className="text-slate-700 dark:text-slate-300">{index + 1}. {result.condition}</span>
                                            <span className="text-slate-600 dark:text-slate-400">{(result.probability * 100).toFixed(1)}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                                <p>{modelMeta.description}</p>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-2 mb-1">
                                    <p>Leyenda del Heatmap:</p>
                                    <HelperTooltip text="Indica qué colores corresponden a zonas de alta o baja atención por parte de la IA." position="top" />
                                </div>
                                <p>🔴 Rojo/Amarillo = Alta atención</p>
                                <p>🔵 Azul/Oscuro = Baja atención</p>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">RECOMENDACIONES</h2>
                        <ul className="space-y-3">
                            {recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400 text-lg mt-0.5 flex-shrink-0">
                                        check_circle
                                    </span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
