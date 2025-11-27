import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useHistory } from '../../context/HistoryContext';

export default function Upload() {
  const navigate = useNavigate();
  const { addToHistory } = useHistory();
  // States: 'upload' | 'analyzing' | 'result'
  const [step, setStep] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const reportRef = useRef(null); // Referencia para capturar el reporte

  // Image controls state
  const [zoom, setZoom] = useState(100);
  const [contrast, setContrast] = useState(100); // 100% is normal
  const [brightness, setBrightness] = useState(100);
  const [invert, setInvert] = useState(false);

  const handleFileSelect = (file) => {
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      if (file.size > 10 * 1024 * 1024) {
        alert("El archivo es demasiado grande. Máximo 10MB.");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Por favor selecciona una imagen JPG o PNG válida.");
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Por favor carga una imagen primero.");
      return;
    }
    setStep('analyzing');
  };

  useEffect(() => {
    if (step === 'analyzing') {
        const timer = setTimeout(() => {
            setStep('result');
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [step]);

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
      setStep('upload');
      removeFile();
      // Reset controls
      setZoom(100);
      setContrast(100);
      setBrightness(100);
      setInvert(false);
  };

  // --- NEW: Save to History ---
  const handleSaveToHistory = () => {
      const newStudy = {
          id: `PT-${Math.floor(Math.random() * 10000)}`, // ID Mockeado
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'Tórax AP', // Tipo Mockeado
          result: 'Neumonía', // Resultado Hardcodeado por ahora
          status: 'red',
          confidence: '98.2%'
      };
      addToHistory(newStudy);
      alert("Análisis guardado correctamente en el historial.");
  };

  // Image Manipulation Handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetView = () => {
      setZoom(100);
      setContrast(100);
      setBrightness(100);
      setInvert(false);
  };
  const toggleInvert = () => setInvert(!invert);

  // PDF Generation Handler
  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
        // Esperar un momento para asegurar renderizado
        await new Promise(resolve => setTimeout(resolve, 500));

        const element = reportRef.current;
        
        // Configurar html2canvas con scrollHeight para capturar todo
        const canvas = await html2canvas(element, {
            scale: 2, // Mejor calidad
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            height: element.scrollHeight, // Capturar altura completa
            windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Si el contenido es más largo que una página, manejar múltiples páginas (básico)
        // Por ahora ajustamos para que quepa si es razonable, o dejamos que corte si es muy largo
        // Una mejor opción es escalar para ajustar
        if (pdfHeight > pdf.internal.pageSize.getHeight()) {
            const scaleFactor = pdf.internal.pageSize.getHeight() / pdfHeight;
             pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth * scaleFactor, pdfHeight * scaleFactor);
        } else {
             pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        
        pdf.save(`Reporte_Medico_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
        console.error("Error generando PDF:", error);
        alert("Hubo un error al generar el PDF.");
    }
  };

  // --- VIEW: UPLOAD ---
  if (step === 'upload') {
    return (
        <div>
            <div className="flex items-center text-sm text-slate-500 mb-6 dark:text-slate-400">
                <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">Dashboard</Link>
                <span className="mx-2">/</span>
                <span className="text-slate-900 font-medium dark:text-white">Nuevo Análisis</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-6 dark:text-white">Cargar Radiografía de Tórax</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 dark:bg-slate-800 dark:border-slate-700">
                        {!selectedFile ? (
                            <div 
                                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer group ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700'}`}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={triggerFileInput}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={onFileInputChange} 
                                    className="hidden" 
                                    accept="image/png, image/jpeg" 
                                />
                                <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform dark:bg-slate-700 dark:text-primary-400">
                                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-white">Arrastra y suelta tu imagen aquí</h3>
                                <p className="text-slate-500 mb-6 dark:text-slate-400">Soporta JPG, PNG (Max 10MB)</p>
                                <button type="button" className="bg-white border border-slate-300 text-slate-700 font-medium py-2 px-6 rounded-lg hover:bg-slate-50 transition-colors shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600">
                                    Seleccionar archivo
                                </button>
                            </div>
                        ) : (
                            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 dark:bg-slate-700/50 dark:border-slate-600">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Archivo Seleccionado</h3>
                                    <button onClick={removeFile} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center">
                                        <span className="material-symbols-outlined text-lg mr-1">delete</span> Eliminar
                                    </button>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-300 dark:border-slate-600">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate dark:text-white">{selectedFile.name}</p>
                                        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-600">
                                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                                        </div>
                                        <p className="text-xs text-green-600 mt-1 flex items-center dark:text-green-400">
                                            <span className="material-symbols-outlined text-xs mr-1">check_circle</span> Listo para analizar
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end gap-3">
                            <Link to="/dashboard" className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-700">Cancelar</Link>
                            <button 
                                onClick={handleAnalyze} 
                                disabled={!selectedFile}
                                className={`px-8 py-3 text-white font-bold rounded-lg shadow-md transition-colors flex items-center ${selectedFile ? 'bg-primary-600 hover:bg-primary-700' : 'bg-slate-300 cursor-not-allowed dark:bg-slate-600 dark:text-slate-400'}`}
                            >
                                <span className="material-symbols-outlined mr-2">auto_fix_high</span> Analizar con IA
                            </button>
                        </div>
                    </div>
                </div>

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
                                <span>La radiografía debe ser frontal (AP o PA).</span>
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

  // --- VIEW: ANALYZING ---
  if (step === 'analyzing') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full dark:border-slate-700"></div>
                    <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
                    <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-primary-600 text-3xl dark:text-primary-400">radiology</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 dark:text-white">Analizando Radiografía</h2>
                <p className="text-slate-500 mb-6 dark:text-slate-400">Nuestra IA está procesando la imagen. Esto tomará unos segundos...</p>
                
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden dark:bg-slate-700">
                    <div className="bg-primary-600 h-2.5 rounded-full animate-[pulse_2s_infinite]" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-slate-400">Procesando capas neuronales...</p>
            </div>
        </div>
      );
  }

  // --- VIEW: RESULT ---
  if (step === 'result') {
      return (
        <div>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center text-sm text-slate-500 mb-2 dark:text-slate-400">
                        <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">Dashboard</Link>
                        <span className="mx-2">/</span>
                        <span className="text-slate-900 font-medium dark:text-white">Resultado de Análisis</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reporte Generado</h1>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-3">
                        <button onClick={handleReset} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                            <span className="material-symbols-outlined mr-2 text-sm">restart_alt</span> Nuevo Análisis
                        </button>
                        <button onClick={handleSaveToHistory} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors">
                            <span className="material-symbols-outlined mr-2 text-sm">save</span> Guardar en Historial
                        </button>
                    </div>
                    <button onClick={generatePDF} className="text-slate-600 hover:text-red-600 font-medium text-sm flex items-center transition-colors dark:text-slate-400 dark:hover:text-red-400">
                        <span className="material-symbols-outlined mr-1 text-lg">picture_as_pdf</span> Exportar PDF
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                            <h3 className="font-bold text-slate-700 dark:text-white">Visualización de Rayos X</h3>
                            <div className="flex gap-2 text-sm">
                                <span className="flex items-center text-red-600 font-medium dark:text-red-400"><span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span> Anomalía Detectada</span>
                            </div>
                        </div>
                        <div className="relative bg-black flex justify-center items-center min-h-[500px] overflow-hidden">
                            <div 
                                className="transition-transform duration-200 ease-out"
                                style={{ 
                                    transform: `scale(${zoom / 100})`,
                                    filter: `contrast(${contrast}%) brightness(${brightness}%) invert(${invert ? 100 : 0}%)`
                                }}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Uploaded X-Ray" className="max-w-full max-h-[600px] object-contain" />
                                ) : (
                                    <div className="text-slate-500 flex flex-col items-center">
                                        <span className="material-symbols-outlined text-6xl opacity-50">image</span>
                                        <span className="mt-2">Imagen no disponible</span>
                                    </div>
                                )}
                                <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-red-500 rounded-full opacity-30 blur-xl pointer-events-none"></div>
                                <div className="absolute top-1/3 right-1/3 w-20 h-20 border-2 border-red-500 rounded-full opacity-80 pointer-events-none animate-pulse"></div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-slate-50 flex flex-wrap justify-between items-center text-sm text-slate-500 gap-4 dark:bg-slate-700 dark:text-slate-300">
                            <span className="font-mono">Zoom: {zoom}%</span>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden dark:bg-slate-800 dark:border-slate-600">
                                    <button onClick={handleZoomOut} className="p-2 hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-700" title="Reducir">
                                        <span className="material-symbols-outlined text-lg">remove</span>
                                    </button>
                                    <button onClick={handleResetView} className="p-2 hover:bg-slate-100 active:bg-slate-200 border-x border-slate-200 px-3 dark:border-slate-600 dark:hover:bg-slate-700" title="Restablecer">
                                        <span className="material-symbols-outlined text-lg">restart_alt</span>
                                    </button>
                                    <button onClick={handleZoomIn} className="p-2 hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-700" title="Aumentar">
                                        <span className="material-symbols-outlined text-lg">add</span>
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={toggleInvert} 
                                        className={`p-2 rounded-lg border transition-colors ${invert ? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900 dark:border-primary-700 dark:text-primary-300' : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700'}`}
                                        title="Invertir Colores"
                                    >
                                        <span className="material-symbols-outlined text-lg">contrast</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6" ref={reportRef}>
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

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 dark:bg-slate-800 dark:border-slate-700">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Detalles del Paciente</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">ID:</span>
                                <span className="font-medium text-slate-900 dark:text-white">--</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Fecha:</span>
                                <span className="font-medium text-slate-900 dark:text-white">{new Date().toLocaleDateString()}</span>
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

  return null; // Fallback
}
