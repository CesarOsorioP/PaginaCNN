import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import FadeInWhenVisible from '../../components/animations/FadeInWhenVisible';

const ANALYSIS_STEPS = [
    { id: 'upload', label: 'Carga segura', icon: 'cloud_upload', threshold: 20, detail: 'Validamos formato, tamaño y anonimización.' },
    { id: 'preprocess', label: 'Preprocesamiento', icon: 'blur_on', threshold: 45, detail: 'Normalizamos y centramos la imagen (224x224).' },
    { id: 'inference', label: 'Inferencia IA', icon: 'neurology', threshold: 75, detail: 'Ejecutamos EfficientNet / DenseNet en CPU o GPU.' },
    { id: 'explain', label: 'Explicabilidad', icon: 'insights', threshold: 100, detail: 'Generamos heatmaps y resumen clínico.' }
];

const DEMO_CASES = [
    {
        id: 'normal',
        label: 'Seguimiento postoperatorio',
        patient: 'Luisa M.',
        age: 34,
        image: 'https://images.unsplash.com/photo-1580281780460-82d7d6f26a19?auto=format&fit=crop&w=900&q=80',
        model: 'EfficientNet-B4',
        analysisTime: '1.8s',
        summary: 'Radiografía dentro de parámetros normales. Sin opacidades focales.',
        confidence: 0.87,
        results: [
            { condition: 'Normal', probability: 0.87 },
            { condition: 'Neumonía', probability: 0.07 },
            { condition: 'Nódulo', probability: 0.03 },
            { condition: 'Edema', probability: 0.02 },
            { condition: 'Tuberculosis', probability: 0.01 }
        ],
        recommendations: [
            'Continuar seguimiento clínico habitual.',
            'No se detectan hallazgos que requieran intervención.'
        ],
        timeline: [
            'Imagen DICOM (2.3MB) verificada y anonimizada.',
            'Preprocesamiento completado en 320ms.',
            'EfficientNet-B4 ejecutado en CPU (1.2s).',
            'Heatmap generado y normalizado.',
            'Resumen clínico listo para descarga.'
        ]
    },
    {
        id: 'pneumonia',
        label: 'Consulta urgente respiratoria',
        patient: 'Carlos R.',
        age: 58,
        image: 'https://images.unsplash.com/photo-1580281657521-6c7980c541f8?auto=format&fit=crop&w=900&q=80',
        model: 'DenseNet121',
        analysisTime: '3.6s',
        summary: 'Opacidad alveolar en lóbulo inferior derecho compatible con neumonía.',
        confidence: 0.79,
        results: [
            { condition: 'Neumonía', probability: 0.79 },
            { condition: 'Normal', probability: 0.11 },
            { condition: 'Edema', probability: 0.06 },
            { condition: 'Atelectasia', probability: 0.03 },
            { condition: 'Nódulo', probability: 0.01 }
        ],
        recommendations: [
            'Correlacionar con clínica y laboratorio.',
            'Considerar inicio de antibiótico según protocolo.',
            'Repetir imagen en 4-6 semanas.'
        ],
        timeline: [
            'Carga segura y anonimización completadas.',
            'Preprocesamiento avanzado (CLAHE, centrado).',
            'DenseNet121 ejecutado en GPU (2.4s).',
            'Heatmap resaltó consolidación basal.',
            'Reporte estructurado generado.'
        ]
    },
    {
        id: 'nodule',
        label: 'Tamizaje anual',
        patient: 'Marina Q.',
        age: 46,
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
        model: 'EfficientNet + post-proceso',
        analysisTime: '2.4s',
        summary: 'Nódulo solitario de 8mm en lóbulo superior izquierdo. Sugerir TC de alta resolución.',
        confidence: 0.68,
        results: [
            { condition: 'Nódulo', probability: 0.68 },
            { condition: 'Normal', probability: 0.18 },
            { condition: 'Masa', probability: 0.07 },
            { condition: 'Tuberculosis', probability: 0.04 },
            { condition: 'Neumonía', probability: 0.03 }
        ],
        recommendations: [
            'Solicitar tomografía computarizada para caracterización.',
            'Comparar con estudios previos si están disponibles.',
            'Registrar en registro de nódulos pulmonares.'
        ],
        timeline: [
            'Imagen recibida vía API (HTTPS).',
            'Normalización gamma + reducción de ruido.',
            'Inferencia combinada (EfficientNet + heurísticas).',
            'Heatmap confirma foco apical.',
            'Generado checklist para radiólogo.'
        ]
    }
];

export default function Demo() {
    const [activeCaseIndex, setActiveCaseIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [analysisComplete, setAnalysisComplete] = useState(false);

    const activeCase = useMemo(() => DEMO_CASES[activeCaseIndex], [activeCaseIndex]);

    useEffect(() => {
        let intervalId;
        if (isRunning) {
            intervalId = setInterval(() => {
                setProgress((prev) => {
                    const next = Math.min(prev + 2, 100);
                    if (next >= 100) {
                        setIsRunning(false);
                        setAnalysisComplete(true);
                    }
                    return next;
                });
            }, 120);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isRunning]);

    useEffect(() => {
        const step = ANALYSIS_STEPS.findIndex(({ threshold }) => progress <= threshold);
        setCurrentStep(step === -1 ? ANALYSIS_STEPS.length - 1 : step);
    }, [progress]);

    useEffect(() => {
        setProgress(0);
        setIsRunning(false);
        setCurrentStep(0);
        setAnalysisComplete(false);
    }, [activeCaseIndex]);

    const handleDemo = () => {
        setProgress(0);
        setCurrentStep(0);
        setAnalysisComplete(false);
        setIsRunning(true);
    };

    const progressLabel = ANALYSIS_STEPS[currentStep]?.label || 'Listo';

    return (
        <div className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white min-h-screen transition-colors duration-300">
            <Navbar />
            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Hero */}
                    <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 lg:p-12 relative overflow-hidden shadow-lg dark:shadow-none">
                        <div className="absolute inset-0 opacity-40 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(34,211,238,0.3), transparent 45%)' }}></div>
                        <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
                            <FadeInWhenVisible>
                                <div>
                                    <p className="text-cyan-600 dark:text-cyan-300 text-sm font-semibold uppercase tracking-[0.2em] mb-4">DEMO EN TIEMPO REAL</p>
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-slate-900 dark:text-white">
                                        Analiza una radiografía en segundos y entiende cómo la IA llega al diagnóstico.
                                    </h1>
                                    <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
                                        Reproduce el flujo completo con casos reales pre-cargados. El modo invitado no permite subir imágenes propias; todas las pruebas usan radiografías ya anonimizadas.
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={handleDemo}
                                            disabled={isRunning}
                                            className="bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-900 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
                                        >
                                            <span className="material-symbols-outlined">play_arrow</span>
                                            {isRunning ? 'Analizando...' : 'Analizar caso seleccionado'}
                                        </button>
                                        <Link
                                            to="/signup"
                                            className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/20 text-slate-700 dark:text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-sm dark:shadow-none"
                                        >
                                            Crear cuenta gratuita
                                            <span className="material-symbols-outlined text-base">arrow_outward</span>
                                        </Link>
                                    </div>
                                </div>
                            </FadeInWhenVisible>

                            <FadeInWhenVisible delay="0.2s">
                                <div className="bg-slate-100/50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Estado actual</p>
                                            <p className="text-xl font-semibold text-slate-900 dark:text-white">{progressLabel}</p>
                                        </div>
                                        <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400 transition-all duration-200"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                        {ANALYSIS_STEPS.map((step, index) => (
                                            <li key={step.id} className={`flex items-start gap-3 ${index <= currentStep ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                                <span
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center border ${index <= currentStep ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-100 dark:bg-cyan-400/10 text-cyan-700 dark:text-cyan-300' : 'border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}
                                                >
                                                    <span className="material-symbols-outlined text-base">{step.icon}</span>
                                                </span>
                                                <div>
                                                    <p className="font-semibold">{step.label}</p>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs">{step.detail}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </FadeInWhenVisible>
                        </div>
                    </section>

                    {/* Main content */}
                    <section className="mt-12 grid lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
                            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Casos preparados</p>
                            <div className="space-y-4">
                                {DEMO_CASES.map((demoCase, idx) => {
                                    const isActive = idx === activeCaseIndex;
                                    return (
                                        <button
                                            key={demoCase.id}
                                            onClick={() => setActiveCaseIndex(idx)}
                                            className={`w-full text-left rounded-2xl border p-4 transition-all ${isActive ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-400/10 shadow-md dark:shadow-lg shadow-cyan-500/10 dark:shadow-cyan-900/30' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{demoCase.label}</p>
                                                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                                    {demoCase.analysisTime}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                                {demoCase.patient} • {demoCase.age} años
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400">
                                                <span className="material-symbols-outlined text-base">neurology</span>
                                                {demoCase.model}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                                <div className="grid md:grid-cols-2 gap-0">
                                    <div className="relative">
                                        <img
                                            src={activeCase.image}
                                            alt={`Radiografía demo ${activeCase.id}`}
                                            className="w-full h-full object-cover min-h-[320px]"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/90 dark:to-slate-950/90 pointer-events-none"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-white/80">Modelo seleccionado</p>
                                                <p className="text-xl font-semibold text-white">{activeCase.model}</p>
                                            </div>
                                            <div className="flex flex-col items-end text-xs text-white/80">
                                                <span>Tiempo total</span>
                                                <span className="text-cyan-300 font-semibold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-base">schedule</span>
                                                    {activeCase.analysisTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Diagnóstico principal</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`material-symbols-outlined ${activeCase.results[0].condition === 'Normal' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    {activeCase.results[0].condition === 'Normal' ? 'check_circle' : 'warning'}
                                                </span>
                                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{activeCase.results[0].condition}</h3>
                                            </div>
                                            <p className="text-3xl font-semibold text-cyan-600 dark:text-cyan-300">
                                                {analysisComplete ? `${(activeCase.confidence * 100).toFixed(1)}%` : '---'}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {analysisComplete ? activeCase.summary : 'Ejecuta la demo para ver el resultado completo.'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Probabilidades de la IA</p>
                                            <div className="space-y-2">
                                                {activeCase.results.map((result, idx) => (
                                                    <div key={`${activeCase.id}-${result.condition}`} className="text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-700 dark:text-slate-300">{idx + 1}. {result.condition}</span>
                                                            <span className="text-slate-500 dark:text-slate-400">
                                                                {analysisComplete ? `${(result.probability * 100).toFixed(1)}%` : '--'}
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                                                            <div
                                                                className={`h-full ${idx === 0 ? 'bg-cyan-500 dark:bg-cyan-400' : 'bg-slate-400 dark:bg-slate-600'}`}
                                                                style={{ width: analysisComplete ? `${result.probability * 100}%` : '0%' }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-300">list_alt</span>
                                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Bitácora en vivo</h4>
                                    </div>
                                    <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
                                        {activeCase.timeline.map((item, idx) => (
                                            <li key={`${activeCase.id}-timeline-${idx}`} className="leading-relaxed">
                                                {item}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-300">assignment_turned_in</span>
                                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Recomendaciones sugeridas</h4>
                                    </div>
                                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                        {activeCase.recommendations.map((rec, idx) => (
                                            <li key={`${activeCase.id}-rec-${idx}`} className="flex items-start gap-3">
                                                <span className="material-symbols-outlined text-base text-cyan-600 dark:text-cyan-300">check_circle</span>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="mt-12 bg-gradient-to-r from-cyan-700 to-blue-700 rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
                        <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-3">LISTO PARA PROBARLO</p>
                            <h2 className="text-3xl font-bold mb-3 text-white">Crea tu cuenta y lanza tu primer análisis real hoy.</h2>
                            <p className="text-white/80">
                                Incluimos 50 estudios gratuitos para demos, dashboard con historial, PDF automatizados y control de roles.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Link
                                to="/signup"
                                className="bg-white text-cyan-700 font-semibold px-6 py-3 rounded-2xl text-center shadow-lg hover:-translate-y-0.5 transition"
                            >
                                Crear cuenta ahora
                            </Link>
                            <Link
                                to="/login"
                                className="border border-white/60 text-white px-6 py-3 rounded-2xl text-center hover:bg-white/10 transition"
                            >
                                Ya tengo cuenta
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}


