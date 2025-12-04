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

export default function Upload() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const fileInputRef = useRef(null);
    const [models, setModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [modelError, setModelError] = useState('');
    const [selectedModel, setSelectedModel] = useState('efficientnet');

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
                alert('El archivo es demasiado grande. Máximo 10MB.');
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            alert('Por favor selecciona una imagen JPG o PNG válida.');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            alert('Por favor carga una imagen primero.');
            return;
        }
        if (!selectedModel) {
            alert('Selecciona un modelo de IA antes de analizar.');
            return;
        }

        setAnalyzing(true);
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('modelType', selectedModel);

        try {
            const { data } = await api.post('/studies/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Save the study
            const { data: savedStudy } = await api.post('/studies', {
                imageUrl: data.imageUrl,
                results: data.results,
                predictedClass: data.predictedClass,
                predictedClassEn: data.predictedClassEn,
                confidence: data.confidence,
                heatmap: data.heatmap,
                modelType: selectedModel
            });

            navigate(`/report/${savedStudy._id}`);
        } catch (error) {
            console.error('Error analyzing image:', error);
            alert('Error al analizar la imagen');
        } finally {
            setAnalyzing(false);
        }
    };

    if (analyzing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
                    <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-cyan-400 text-3xl">
                        radiology
                    </span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Analizando Radiografía</h2>
                <p className="text-slate-400 text-center px-4">
                    Ejecutando <span className="text-cyan-400 font-semibold">{MODEL_INFO[selectedModel]?.name || 'modelo IA'}</span>.
                    Estamos generando probabilidades y mapas de calor interpretables.
                </p>
            </div>
        );
    }

    return (
        <div className="text-white">
            <NavigationButtons />
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-slate-400 mb-6">
                <Link to="/dashboard" className="hover:text-cyan-400">Dashboard</Link>
                <span className="mx-2">/</span>
                <span className="text-white">Nuevo Análisis</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Cargar Radiografía de Tórax</h1>
            <p className="text-slate-400 mb-6 text-sm sm:text-base">
                Selecciona el modelo de IA que quieres usar y luego sube la imagen. Guardaremos el estudio automáticamente con toda la trazabilidad.
            </p>

            {/* Model selector */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <p className="text-sm uppercase tracking-wider text-slate-400">MODELOS DISPONIBLES</p>
                        <h2 className="text-xl font-semibold">Selecciona tu motor de diagnóstico</h2>
                    </div>
                    <div className="text-sm text-slate-400">
                        {modelsLoading ? 'Cargando modelos...' : `Actualmente seleccionado: ${MODEL_INFO[selectedModel]?.name || 'EfficientNet'}`}
                    </div>
                </div>

                {modelError && (
                    <div className="mb-4 p-3 rounded border border-yellow-700 bg-yellow-900/20 text-yellow-200 text-sm">
                        {modelError}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    {(modelsLoading ? ['skeleton-1', 'skeleton-2'] : models).map((model, idx) => {
                        if (modelsLoading) {
                            return (
                                <div
                                    key={idx}
                                    className="h-32 rounded-xl border border-slate-700 bg-slate-800 animate-pulse"
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
                                    ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-900/40'
                                    : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-400">Modelo</p>
                                        <h3 className="text-lg font-semibold">{meta.name || model.name}</h3>
                                    </div>
                                    {meta.badge && (
                                        <span className="text-xs px-3 py-1 rounded-full bg-cyan-900/40 text-cyan-200 border border-cyan-700">
                                            {meta.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-300 mb-3">
                                    {meta.description || 'Modelo validado para análisis torácico.'}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                                    {meta.strengths?.map((strength) => (
                                        <span key={strength} className="px-2 py-1 rounded bg-slate-800 border border-slate-700">
                                            {strength}
                                        </span>
                                    ))}
                                    {meta.latency && (
                                        <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">
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
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 sm:p-8">
                        {!selectedFile ? (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragging ? 'border-cyan-400 bg-cyan-900/20' : 'border-slate-600 hover:border-slate-500'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                    className="hidden"
                                />
                                <div className="w-16 h-16 bg-cyan-900 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2">Arrastra y suelta tu imagen aquí</h3>
                                <p className="text-slate-400 mb-6">Soporta JPG, PNG (Max 10MB)</p>
                                <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors">
                                    Seleccionar archivo
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-slate-700 rounded-lg p-4">
                                    <div className="flex items-center gap-4">
                                        <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                                        <div className="flex-1">
                                            <p className="font-medium">{selectedFile.name}</p>
                                            <p className="text-sm text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedFile(null); setPreview(null); }}
                                            className="text-red-400 hover:text-red-300"
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
                                className="px-6 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </Link>
                            <button
                                onClick={handleAnalyze}
                                disabled={!selectedFile}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedFile
                                        ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
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
                    <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-300">
                            <span className="material-symbols-outlined">info</span>
                            Guía de Carga
                        </h3>
                        <ul className="space-y-3 text-sm text-blue-200">
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-400 text-lg mt-0.5">check_circle</span>
                                <span>Asegúrate de que la imagen sea nítida y tenga buen contraste.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-400 text-lg mt-0.5">check_circle</span>
                                <span>La radiografía debe ser frontal (AP o PA).</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-400 text-lg mt-0.5">check_circle</span>
                                <span>Elimina cualquier información personal incrustada en la imagen si no es necesario.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-sm">Formatos soportados</h4>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-slate-700 rounded text-xs">JPG</span>
                            <span className="px-3 py-1 bg-slate-700 rounded text-xs">PNG</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
