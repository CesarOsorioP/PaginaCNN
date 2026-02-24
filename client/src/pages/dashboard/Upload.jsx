import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import NavigationButtons from '../../components/NavigationButtons';

const MODEL_INFO = {
    efficientnet: {
        name: 'EfficientNet-B4',
        description: 'Modelo optimizado para velocidad y excelente balance precisión/recuperación.',
        latency: '< 2s',
        strengths: ['Alta precisión en casos comunes', 'Ideal para demos y triaje rápido'],
        badge: 'Recomendado'
    },
    densenet121: {
        name: 'DenseNet121',
        description: 'Arquitectura profunda enfocada en máxima sensibilidad para detectar hallazgos sutiles.',
        latency: '3-4s',
        strengths: ['Mayor sensibilidad en patologías raras', 'Mejor desempeño con datasets ruidosos'],
        badge: 'Alta Sensibilidad'
    }
};

const ANALYSIS_STEPS = [
    { id: 'upload', label: 'Carga de imagen', icon: 'cloud_upload', threshold: 15 },
    { id: 'preprocess', label: 'Preprocesamiento', icon: 'blur_on', threshold: 40 },
    { id: 'inference', label: 'Inferencia IA', icon: 'neurology', threshold: 75 },
    { id: 'explain', label: 'Generando heatmap', icon: 'insights', threshold: 95 },
    { id: 'complete', label: 'Finalizando', icon: 'check_circle', threshold: 100 }
];

const ALERT_PRESETS = {
    error: {
        icon: 'error',
        borderColor: 'border-red-300 dark:border-red-700',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        iconColor: 'text-red-600 dark:text-red-400',
        titleColor: 'text-red-900 dark:text-red-200',
        textColor: 'text-red-700 dark:text-red-300',
        btnBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
    },
    warning: {
        icon: 'warning',
        borderColor: 'border-amber-300 dark:border-amber-700',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-600 dark:text-amber-400',
        titleColor: 'text-amber-900 dark:text-amber-200',
        textColor: 'text-amber-700 dark:text-amber-300',
        btnBg: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600',
    },
};

function AlertModal({ alert, onClose }) {
    const timerRef = useRef(null);

    useEffect(() => {
        if (alert?.autoDismiss) {
            timerRef.current = setTimeout(onClose, 5000);
            return () => clearTimeout(timerRef.current);
        }
    }, [alert, onClose]);

    if (!alert) return null;

    const preset = ALERT_PRESETS[alert.type] || ALERT_PRESETS.info;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />
            <div
                className={`relative w-full max-w-md rounded-2xl border ${preset.borderColor} ${preset.bgColor} shadow-2xl animate-[scaleIn_0.25s_ease-out] overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full ${preset.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`material-symbols-outlined text-2xl ${preset.iconColor}`}>
                                {alert.icon || preset.icon}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={`text-lg font-bold ${preset.titleColor} mb-1`}>{alert.title}</h3>
                            <p className={`text-sm ${preset.textColor} leading-relaxed`}>{alert.message}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>
                </div>
                <div className="px-6 pb-5 flex justify-end">
                    <button
                        onClick={onClose}
                        className={`px-5 py-2 rounded-lg text-sm font-medium text-white ${preset.btnBg} transition-colors`}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Upload() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const fileInputRef = useRef(null);
    const [models, setModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [modelError, setModelError] = useState('');
    const [selectedModel, setSelectedModel] = useState('efficientnet');
    const [alertInfo, setAlertInfo] = useState(null);

    const showAlert = (type, title, message, opts = {}) => {
        setAlertInfo({ type, title, message, ...opts });
    };

    useEffect(() => {
        let isMounted = true;

        const fetchModels = async () => {
            try {
                const { data } = await api.get('/studies/models');
                if (!isMounted) return;

                if (data.models?.length) {
                    setModels(data.models);
                    setSelectedModel(data.models[0].id);
                } else {
                    // Si no hay modelos desde el backend, usar la configuración local
                    const fallback = Object.keys(MODEL_INFO).map((key) => ({
                        id: key,
                        name: MODEL_INFO[key].name
                    }));
                    setModels(fallback);
                    setSelectedModel(fallback[0]?.id || 'efficientnet');
                }
            } catch (error) {
                if (!isMounted) return;
                console.warn('No se pudieron cargar los modelos disponibles:', error);
                setModelError('No pudimos contactar al servidor de modelos. Usaremos EfficientNet por defecto.');
                const fallback = Object.keys(MODEL_INFO).map((key) => ({
                    id: key,
                    name: MODEL_INFO[key].name
                }));
                setModels(fallback);
                setSelectedModel(fallback[0]?.id || 'efficientnet');
            } finally {
                if (isMounted) {
                    setModelsLoading(false);
                }
            }
        };

        fetchModels();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleFileSelect = (file) => {
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            if (file.size > 10 * 1024 * 1024) {
                showAlert('warning', 'Archivo muy grande', 'El archivo supera el límite de 10 MB. Por favor, selecciona una imagen más liviana.', { icon: 'upload_file' });
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            showAlert('warning', 'Formato no soportado', 'Por favor selecciona una imagen en formato JPG o PNG válida.', { icon: 'image_not_supported' });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleAnalyze = async () => {
        if (!selectedFile || !selectedModel) return;

        setAnalyzing(true);
        setAnalysisProgress(0);
        setCurrentStep(0);
        
        const jobId = Math.random().toString(36).substring(7);
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('modelType', selectedModel);
        formData.append('jobId', jobId);

        // Polling interval para progreso real desde el backend
        const pollInterval = setInterval(async () => {
            try {
                const { data } = await api.get(`/studies/progress?jobId=${jobId}`);
                if (data && data.progress > 0) {
                    setAnalysisProgress(prev => Math.max(prev, data.progress));
                    if (data.stepIndex !== undefined) {
                        setCurrentStep(prev => Math.max(prev, data.stepIndex));
                    }
                }
            } catch (err) {
                // Ignore polling errors to not interrupt the UI
            }
        }, 800);

        try {
            const { data } = await api.post('/studies/analyze-exai', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        // El proceso de subida corresponde al primer 15% del progreso total
                        const mappedProgress = percentCompleted * 0.15;
                        setAnalysisProgress(prev => Math.max(prev, mappedProgress));
                        setCurrentStep(0);
                    }
                }
            });

            clearInterval(pollInterval);
            setAnalysisProgress(100);
            setCurrentStep(4);
            
            // Artificial delay para que el usuario vea el 100% completado antes de navegar
            await new Promise(r => setTimeout(r, 600));

            // Save the study
            const { data: savedStudy } = await api.post('/studies', {
                imageUrl: data.imageUrl,
                cloudinaryId: data.cloudinaryId,
                results: data.results,
                predictedClass: data.predictedClass,
                predictedClassEn: data.predictedClassEn,
                confidence: data.confidence,
                heatmap: data.heatmap,
                modelType: selectedModel,
                processingTime: data.processingTime
            });

            navigate(`/report/${savedStudy._id}`);
        } catch (error) {
            clearInterval(pollInterval);
            console.error('Error analyzing image:', error);
            if (error.response?.data?.isNotXray) {
                showAlert(
                    'error',
                    'No es una radiografía de tórax',
                    'La imagen proporcionada no fue reconocida como una radiografía de tórax válida. Asegúrate de subir una radiografía frontal (AP/PA) de tórax para poder realizar el análisis.',
                    { icon: 'radiology' }
                );
            } else {
                showAlert(
                    'error',
                    'Error en el análisis',
                    error.response?.data?.message || 'Ocurrió un error inesperado al analizar la imagen. Por favor, intenta de nuevo.',
                    { icon: 'error' }
                );
            }
        } finally {
            clearInterval(pollInterval);
            setAnalyzing(false);
        }
    };

    if (analyzing) {
        const currentStepInfo = ANALYSIS_STEPS[currentStep] || ANALYSIS_STEPS[0];

        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900">
                <AlertModal alert={alertInfo} onClose={() => setAlertInfo(null)} />
                <div className="max-w-2xl w-full px-6">
                    {/* Spinner y título principal */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative w-32 h-32 mb-6">
                            <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-cyan-500 dark:border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
                            <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-5xl">
                                radiology
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold mb-3 text-center">Analizando Radiografía</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-center text-lg mb-2">
                            Ejecutando <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{MODEL_INFO[selectedModel]?.name || 'modelo IA'}</span>
                        </p>
                        <p className="text-slate-500 dark:text-slate-500 text-center text-sm">
                            Estamos generando probabilidades y mapas de calor interpretables.
                        </p>
                    </div>

                    {/* Barra de progreso principal */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400 text-2xl">
                                    {currentStepInfo.icon}
                                </span>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Estado actual</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{currentStepInfo.label}</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{Math.round(analysisProgress)}%</span>
                        </div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400 transition-all duration-300 ease-out"
                                style={{ width: `${analysisProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Pasos del proceso */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
                        <h3 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Proceso de análisis</h3>
                        <div className="space-y-4">
                            {ANALYSIS_STEPS.map((step, index) => {
                                const isActive = index === currentStep;
                                const isCompleted = index < currentStep;

                                return (
                                    <div
                                        key={step.id}
                                        className={`flex items-start gap-4 p-3 rounded-lg transition-all ${isActive
                                            ? 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800'
                                            : isCompleted
                                                ? 'bg-slate-50 dark:bg-slate-700/30'
                                                : 'bg-transparent'
                                            }`}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${isActive
                                                ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
                                                : isCompleted
                                                    ? 'border-green-500 dark:border-green-400 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                                    : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <span className="material-symbols-outlined text-lg">check</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-lg">{step.icon}</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p
                                                className={`font-semibold mb-1 ${isActive
                                                    ? 'text-cyan-900 dark:text-cyan-200'
                                                    : isCompleted
                                                        ? 'text-slate-700 dark:text-slate-300'
                                                        : 'text-slate-400 dark:text-slate-500'
                                                    }`}
                                            >
                                                {step.label}
                                            </p>
                                            {isActive && (
                                                <div className="flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400">
                                                    <div className="flex gap-1">
                                                        <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></div>
                                                        <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                                        <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                                    </div>
                                                    <span>En proceso...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Esto puede tomar unos segundos. Por favor, no cierres esta ventana.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            <AlertModal alert={alertInfo} onClose={() => setAlertInfo(null)} />
            <NavigationButtons />
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                <Link to="/dashboard" className="hover:text-cyan-600 dark:hover:text-cyan-400">Dashboard</Link>
                <span className="mx-2">/</span>
                <span className="text-slate-900 dark:text-white">Nuevo Análisis</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900 dark:text-white">Cargar Radiografía de Tórax</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm sm:text-base">
                Selecciona el modelo de IA que quieres usar y luego sube la imagen. Guardaremos el estudio automáticamente con toda la trazabilidad.
            </p>

            {/* Model selector */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 mb-8 shadow-sm dark:shadow-none">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <p className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">MODELOS DISPONIBLES</p>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Selecciona tu motor de diagnóstico</h2>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {modelsLoading ? 'Cargando modelos...' : `Actualmente seleccionado: ${MODEL_INFO[selectedModel]?.name || 'EfficientNet'}`}
                    </div>
                </div>

                {modelError && (
                    <div className="mb-4 p-3 rounded border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm">
                        {modelError}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    {(modelsLoading ? ['skeleton-1', 'skeleton-2'] : models).map((model, idx) => {
                        if (modelsLoading) {
                            return (
                                <div
                                    key={idx}
                                    className="h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 animate-pulse"
                                ></div>
                            );
                        }

                        const meta = MODEL_INFO[model.id] || {};
                        const isActive = selectedModel === model.id;

                        return (
                            <button
                                key={model.id}
                                type="button"
                                onClick={() => setSelectedModel(model.id)}
                                className={`text-left rounded-xl border p-4 transition-all ${isActive
                                    ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-400/10 shadow-lg shadow-cyan-100 dark:shadow-cyan-900/40'
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Modelo</p>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{meta.name || model.name}</h3>
                                    </div>
                                    {meta.badge && (
                                        <span className="text-xs px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-700">
                                            {meta.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                                    {meta.description || 'Modelo validado para análisis torácico.'}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    {meta.strengths?.map((strength) => (
                                        <span key={strength} className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                            {strength}
                                        </span>
                                    ))}
                                    {meta.latency && (
                                        <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                            Latencia {meta.latency}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Upload Area */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm dark:shadow-none">
                        {!selectedFile ? (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragging ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                    className="hidden"
                                />
                                <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Arrastra y suelta tu imagen aquí</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-6">Soporta JPG, PNG (Max 10MB)</p>
                                <button className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-6 py-2 rounded-lg transition-colors">
                                    Seleccionar archivo
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                                    <div className="flex items-center gap-4">
                                        <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 dark:text-white">{selectedFile.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedFile(null); setPreview(null); }}
                                            className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <Link
                                to="/dashboard"
                                className="px-6 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </Link>
                            <button
                                onClick={handleAnalyze}
                                disabled={!selectedFile}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedFile
                                    ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                <span className="material-symbols-outlined">auto_fix_high</span>
                                Analizar con IA
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-300">
                            <span className="material-symbols-outlined">info</span>
                            Guía de Carga
                        </h3>
                        <ul className="space-y-3 text-sm text-blue-700 dark:text-blue-200">
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg mt-0.5">check_circle</span>
                                <span>Asegúrate de que la imagen sea nítida y tenga buen contraste.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg mt-0.5">check_circle</span>
                                <span>La radiografía debe ser frontal (AP o PA).</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg mt-0.5">check_circle</span>
                                <span>Elimina cualquier información personal incrustada en la imagen si no es necesario.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm dark:shadow-none">
                        <h4 className="font-semibold mb-3 text-sm text-slate-900 dark:text-white">Formatos soportados</h4>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300">JPG</span>
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300">PNG</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
