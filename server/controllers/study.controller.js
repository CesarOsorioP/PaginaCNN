const Study = require('../models/Study');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const onnxAnalyzer = require('../utils/onnxAnalyzer');
const uploadImage = require('../utils/cloudinary').uploadImage;
const deleteImage = require('../utils/cloudinary').deleteImage;

const PYTHON_EXAI_URL = process.env.PYTHON_EXAI_URL || 'http://localhost:8000';

const globalProgress = new Map();

// @desc    Get analysis progress
// @route   GET /api/studies/progress
// @access  Private
exports.getProgress = (req, res) => {
    const jobId = req.query.jobId;
    if (!jobId || !globalProgress.has(jobId)) {
        return res.json({ progress: 0, stepIndex: 0 });
    }
    return res.json(globalProgress.get(jobId));
};

// @desc    Get available models
// @route   GET /api/studies/models
// @access  Private
exports.getAvailableModels = async (req, res) => {
    try {
        const models = onnxAnalyzer.getAvailableModels();
        res.json({ models });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload image and analyze
// @route   POST /api/studies/analyze
// @access  Private
exports.analyzeImage = async (req, res) => {
    let predictionResult = null;
    let heatmapData = null;
    let imagePath = null;
    let imageUrl = null;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Por favor carga una imagen' });
        }

        imagePath = path.join(__dirname, '../uploads', req.file.filename);
        imageUrl = `/uploads/${req.file.filename}`;

        // Verificar que el archivo se subió correctamente
        if (!fs.existsSync(imagePath)) {
            return res.status(400).json({ message: 'Error al guardar la imagen en el servidor' });
        }

        console.log(`🔍 Analizando imagen: ${imagePath}`);
        console.log(`📁 Archivo existe: ${fs.existsSync(imagePath)}`);
        console.log(`📏 Tamaño del archivo: ${fs.statSync(imagePath).size} bytes`);

        // Obtener el tipo de modelo del body (default: efficientnet)
        const modelType = req.body.modelType || 'efficientnet';
        console.log(`🤖 Usando modelo: ${modelType}`);

        const startTime = Date.now();

        // Pre-clasificación: verificar si es radiografía de tórax
        let classificationResult = null;
        try {
            classificationResult = await onnxAnalyzer.classifyChestXray(imagePath);
        } catch (classifierError) {
            console.warn('⚠️ Error en pre-clasificación, continuando con el análisis:', classifierError.message);
        }

        if (classificationResult && !classificationResult.isChestXray) {
            console.log(`❌ Imagen rechazada: no es radiografía de tórax (confianza: ${(classificationResult.otherProbability * 100).toFixed(2)}%)`);
            // Intentar eliminar archivo subido de forma asíncrona
            try {
                await fs.promises.unlink(imagePath);
            } catch (unlinkErr) {
                console.warn(`⚠️ No se pudo eliminar el archivo rechazado (se limpiará después): ${unlinkErr.message}`);
            }
            return res.status(400).json({
                message: 'La imagen proporcionada no parece ser una radiografía de tórax. Por favor, sube una radiografía válida.',
                isNotXray: true,
                confidence: classificationResult.otherProbability
            });
        }

        if (classificationResult) {
            console.log(`✅ Imagen validada como radiografía de tórax (confianza: ${(classificationResult.chestXrayProbability * 100).toFixed(2)}%)`);
        }

        // Analizar imagen con modelo ONNX
        try {
            predictionResult = await onnxAnalyzer.predict(imagePath, modelType);
            console.log(`✅ Predicción exitosa: ${predictionResult.predictedClass} (${(predictionResult.confidence * 100).toFixed(2)}%)`);

            // Generar heatmap
            try {
                const heatmapResult = await onnxAnalyzer.generateHeatmap(imagePath, predictionResult);
                heatmapData = heatmapResult.heatmap;
                console.log(`✅ Heatmap generado: ${heatmapData ? 'Sí' : 'No'}`);
            } catch (heatmapError) {
                console.warn('⚠️ Error generando heatmap, continuando sin heatmap:', heatmapError.message);
                heatmapData = null;
            }
        } catch (modelError) {
            console.error('❌ Error en análisis del modelo:', modelError);
            console.error('Error message:', modelError.message);
            console.error('Stack trace:', modelError.stack);

            // Si el error es que no existe el modelo, usar resultados mock
            if (modelError.message.includes('not found') ||
                modelError.message.includes('Model file') ||
                modelError.message.includes('ENOENT') ||
                modelError.code === 'ENOENT') {
                console.warn('⚠️ Modelo no encontrado, usando resultados de ejemplo para desarrollo');
                predictionResult = {
                    results: [
                        { condition: 'Normal', conditionEn: 'Normal', probability: 0.75 },
                        { condition: 'Neumonía', conditionEn: 'Pneumonia', probability: 0.15 },
                        { condition: 'Atelectasia', conditionEn: 'Atelectasis', probability: 0.05 },
                        { condition: 'Nódulo', conditionEn: 'Nodule', probability: 0.03 },
                        { condition: 'Masa', conditionEn: 'Mass', probability: 0.01 },
                        { condition: 'Edema', conditionEn: 'Edema', probability: 0.01 },
                        { condition: 'COVID-19', conditionEn: 'COVID-19', probability: 0.00 },
                        { condition: 'Tuberculosis', conditionEn: 'Tuberculosis', probability: 0.00 }
                    ],
                    predictedClass: 'Normal',
                    predictedClassEn: 'Normal',
                    confidence: 0.75
                };
            } else {
                // Para otros errores, devolver error pero con información útil
                return res.status(500).json({
                    message: 'Error al analizar la imagen con el modelo de IA',
                    error: process.env.NODE_ENV === 'development' ? modelError.message : 'Error interno del servidor',
                    details: process.env.NODE_ENV === 'development' ? {
                        type: modelError.name,
                        stack: modelError.stack
                    } : undefined
                });
            }
        }

        // Asegurar que tenemos resultados
        if (!predictionResult || !predictionResult.results) {
            return res.status(500).json({
                message: 'Error: No se obtuvieron resultados del análisis'
            });
        }

        const processingTime = Date.now() - startTime;

        // Subir imagen a Cloudinary y eliminar archivo local temporal
        let cloudinaryId = null;
        try {
            const cloudResult = await uploadImage(imagePath);
            imageUrl = cloudResult.url;
            cloudinaryId = cloudResult.publicId;
            console.log(`☁️ Imagen subida a Cloudinary: ${imageUrl}`);
        } catch (cloudError) {
            console.error('❌ Error subiendo a Cloudinary:', cloudError.message);
            return res.status(500).json({ message: 'Error al almacenar la imagen en la nube' });
        }

        // Eliminar archivo local temporal
        try {
            await fs.promises.unlink(imagePath);
            console.log(`🗑️ Archivo local temporal eliminado: ${imagePath}`);
        } catch (unlinkErr) {
            console.warn(`⚠️ No se pudo eliminar archivo temporal: ${unlinkErr.message}`);
        }

        // Devolver respuesta exitosa
        return res.json({
            imageUrl,
            cloudinaryId,
            results: predictionResult.results,
            predictedClass: predictionResult.predictedClass,
            predictedClassEn: predictionResult.predictedClassEn,
            confidence: predictionResult.confidence,
            heatmap: heatmapData,
            modelType: modelType,
            processingTime,
            analysisDate: new Date()
        });

    } catch (error) {
        console.error('❌ Error general analizando imagen:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            message: 'Error del servidor al analizar la imagen',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? {
                type: error.name,
                stack: error.stack
            } : undefined
        });
    }
};

// @desc    Analyze image using Python EXAI microservice (real Grad-CAM)
// @route   POST /api/studies/analyze-exai
// @access  Private
exports.analyzeImageEXAI = async (req, res) => {
    let imagePath = null;
    let imageUrl = null;
    const jobId = req.body.jobId;

    const updateProgress = (progress, stepIndex) => {
        if (jobId) {
            globalProgress.set(jobId, { progress, stepIndex });
        }
    };

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Por favor carga una imagen' });
        }

        imagePath = path.join(__dirname, '../uploads', req.file.filename);
        imageUrl = `/uploads/${req.file.filename}`;

        if (!fs.existsSync(imagePath)) {
            return res.status(400).json({ message: 'Error al guardar la imagen en el servidor' });
        }

        console.log(`🔍 [EXAI] Analizando imagen: ${imagePath}`);
        const startTime = Date.now();

        updateProgress(20, 1); // Preprocesamiento

        // Pre-classification: verify it's a chest X-ray (reuse existing classifier)
        let classificationResult = null;
        try {
            classificationResult = await onnxAnalyzer.classifyChestXray(imagePath);
        } catch (classifierError) {
            console.warn('⚠️ Error en pre-clasificación, continuando:', classifierError.message);
        }

        if (classificationResult && !classificationResult.isChestXray) {
            console.log(`❌ Imagen rechazada: no es radiografía de tórax`);
            try { await fs.promises.unlink(imagePath); } catch (e) { /* ignore */ }
            if (jobId) globalProgress.delete(jobId);
            return res.status(400).json({
                message: 'La imagen proporcionada no parece ser una radiografía de tórax. Por favor, sube una radiografía válida.',
                isNotXray: true,
                confidence: classificationResult.otherProbability
            });
        }

        updateProgress(40, 2); // Inferencia IA

        // Determine which EXAI model to use
        // For ONNX models (efficientnet, densenet121) we still use the regular route;
        // for EXAI models (densenet121-exai, densenet-pro) we forward model_id to Python.
        const exaiModelId = req.body.modelType || 'densenet121-exai';

        // Forward image + model_id to Python EXAI microservice
        const formData = new FormData();
        formData.append('file', fs.createReadStream(imagePath));
        formData.append('model_id', exaiModelId);

        let exaiResponse;
        try {
            exaiResponse = await axios.post(
                `${PYTHON_EXAI_URL}/predict-exai`,
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 60000, // 60s timeout for model inference
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                }
            );
        } catch (axiosError) {
            console.error('❌ Error conectando con microservicio Python:', axiosError.message);
            if (jobId) globalProgress.delete(jobId);
            if (axiosError.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    message: 'El servicio de IA explicable no está disponible. Asegúrese de que el microservicio Python esté ejecutándose.',
                    error: 'EXAI_SERVICE_UNAVAILABLE'
                });
            }
            return res.status(500).json({
                message: 'Error al comunicarse con el servicio de IA explicable',
                error: axiosError.message
            });
        }

        updateProgress(75, 3); // Generando heatmap

        const exaiData = exaiResponse.data;
        const processingTime = Date.now() - startTime;

        // Map Python response to existing Study schema format
        const results = exaiData.predictions.map(p => ({
            condition: p.class_es,
            conditionEn: p.class_en,
            probability: p.probability
        }));

        // Extract heatmap (remove data URI prefix if present for storage)
        let heatmapBase64 = exaiData.heatmap_base64 || null;
        if (heatmapBase64 && heatmapBase64.startsWith('data:image/png;base64,')) {
            heatmapBase64 = heatmapBase64.replace('data:image/png;base64,', '');
        }

        console.log(`✅ [EXAI] Predicción: ${exaiData.predicted_class} (${(exaiData.confidence * 100).toFixed(2)}%) — ${processingTime}ms`);

        updateProgress(85, 4); // Finalizando / Subiendo a Cloudinary

        // Subir imagen a Cloudinary y eliminar archivo local temporal
        let cloudinaryId = null;
        try {
            const cloudResult = await uploadImage(imagePath);
            imageUrl = cloudResult.url;
            cloudinaryId = cloudResult.publicId;
            console.log(`☁️ [EXAI] Imagen subida a Cloudinary: ${imageUrl}`);
        } catch (cloudError) {
            console.error('❌ [EXAI] Error subiendo a Cloudinary:', cloudError.message);
            if (jobId) globalProgress.delete(jobId);
            return res.status(500).json({ message: 'Error al almacenar la imagen en la nube' });
        }

        updateProgress(95, 4); // Listo para retornar

        // Eliminar archivo local temporal
        try {
            await fs.promises.unlink(imagePath);
            console.log(`🗑️ [EXAI] Archivo local temporal eliminado`);
        } catch (unlinkErr) {
            console.warn(`⚠️ [EXAI] No se pudo eliminar archivo temporal: ${unlinkErr.message}`);
        }

        if (jobId) globalProgress.delete(jobId);

        return res.json({
            imageUrl,
            cloudinaryId,
            results,
            predictedClass: exaiData.predicted_class,
            predictedClassEn: exaiData.predicted_class_en,
            confidence: exaiData.confidence,
            heatmap: heatmapBase64,
            modelType: exaiModelId,
            processingTime,
            analysisDate: new Date()
        });

    } catch (error) {
        console.error('❌ Error general en análisis EXAI:', error);
        if (jobId) globalProgress.delete(jobId);
        return res.status(500).json({
            message: 'Error del servidor al analizar la imagen',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
        });
    }
};

// @desc    Save study
// @route   POST /api/studies
// @access  Private
exports.saveStudy = async (req, res) => {
    try {
        const { imageUrl, cloudinaryId, results, predictedClass, predictedClassEn, confidence, heatmap, modelType, processingTime, summary } = req.body;

        const study = await Study.create({
            user: req.user._id,
            imageUrl,
            cloudinaryId,
            results,
            predictedClass,
            predictedClassEn,
            confidence,
            heatmap,
            modelType: modelType || 'efficientnet',
            processingTime,
            summary
        });

        res.status(201).json(study);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user studies history
// @route   GET /api/studies
// @access  Private
exports.getHistory = async (req, res) => {
    try {
        const studies = await Study.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(studies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get study by ID
// @route   GET /api/studies/:id
// @access  Private
exports.getStudyById = async (req, res) => {
    try {
        const study = await Study.findById(req.params.id);

        if (study) {
            // Check if user owns the study or is admin
            if (study.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'Superadmin') {
                return res.status(401).json({ message: 'Not authorized' });
            }
            res.json(study);
        } else {
            res.status(404).json({ message: 'Study not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete study
// @route   DELETE /api/studies/:id
// @access  Private
exports.deleteStudy = async (req, res) => {
    try {
        const study = await Study.findById(req.params.id);

        if (!study) {
            return res.status(404).json({ message: 'Estudio no encontrado' });
        }

        // Check if user owns the study or is admin
        if (study.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'Superadmin') {
            return res.status(401).json({ message: 'No autorizado para eliminar este estudio' });
        }

        // Eliminar imagen de Cloudinary o del disco local (fallback para estudios antiguos)
        if (study.cloudinaryId) {
            try {
                await deleteImage(study.cloudinaryId);
                console.log(`☁️ Imagen eliminada de Cloudinary: ${study.cloudinaryId}`);
            } catch (cloudError) {
                console.warn(`⚠️ Error eliminando imagen de Cloudinary: ${cloudError.message}`);
            }
        } else if (study.imageUrl && study.imageUrl.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '../uploads', path.basename(study.imageUrl));
            if (fs.existsSync(imagePath)) {
                try {
                    await fs.promises.unlink(imagePath);
                    console.log(`✅ Imagen local eliminada: ${imagePath}`);
                } catch (fileError) {
                    console.warn(`⚠️ Error eliminando imagen local: ${fileError.message}`);
                }
            }
        }

        // Delete the study from database
        await Study.findByIdAndDelete(req.params.id);

        res.json({ message: 'Estudio eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting study:', error);
        res.status(500).json({ message: error.message });
    }
};

