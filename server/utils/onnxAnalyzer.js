const ort = require('onnxruntime-node');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Clases en español
const CLASS_NAMES = {
    'Atelectasis': 'Atelectasia',
    'Pneumonia': 'Neumonía',
    'Mass': 'Masa',
    'Nodule': 'Nódulo',
    'Edema': 'Edema',
    'Normal': 'Normal',
    'COVID-19': 'COVID-19',
    'Tuberculosis': 'Tuberculosis'
};

// Orden correcto de las clases según el modelo
const CLASS_ORDER = ['Atelectasis', 'COVID-19', 'Edema', 'Mass', 'Nodule', 'Normal', 'Pneumonia', 'Tuberculosis'];
const IMG_SIZE = 224; // El modelo espera imágenes de 224x224

// Configuración de modelos disponibles
const MODEL_CONFIGS = {
    'efficientnet': {
        name: 'EfficientNet',
        displayName: 'EfficientNet',
        paths: [
            path.join(__dirname, '../../model.onnx'),
            path.join(__dirname, '../model.onnx'),
            path.join(process.cwd(), 'model.onnx'),
            path.join(process.cwd(), 'server', 'model.onnx')
        ]
    },
    'densenet121': {
        name: 'DenseNet121',
        displayName: 'DenseNet121',
        paths: [
            path.join(__dirname, '../../densenet121.onnx'),
            path.join(__dirname, '../densenet121.onnx'),
            path.join(process.cwd(), 'densenet121.onnx'),
            path.join(process.cwd(), 'server', 'densenet121.onnx')
        ]
    }
};

class ONNXAnalyzer {
    constructor() {
        this.models = {}; // Cache de modelos cargados
    }

    getModelPath(modelType) {
        const config = MODEL_CONFIGS[modelType];
        if (!config) {
            throw new Error(`Modelo desconocido: ${modelType}`);
        }
        
        // Encontrar el primer path que existe
        const modelPath = config.paths.find(p => fs.existsSync(p));
        if (!modelPath) {
            throw new Error(`Modelo ${config.displayName} no encontrado. Buscado en: ${config.paths.join(', ')}`);
        }
        
        return modelPath;
    }

    async loadModel(modelType = 'efficientnet') {
        // Si el modelo ya está cargado, retornarlo
        if (this.models[modelType]) {
            return this.models[modelType];
        }

        try {
            const modelPath = this.getModelPath(modelType);
            const config = MODEL_CONFIGS[modelType];
            
            console.log(`📦 Cargando modelo ${config.displayName} desde: ${modelPath}`);
            const model = await ort.InferenceSession.create(modelPath, {
                executionProviders: ['cpu'] // Cambiar a 'cuda' si tienes GPU
            });
            
            // Guardar en cache
            this.models[modelType] = model;
            
            console.log(`✅ Modelo ${config.displayName} cargado exitosamente`);
            console.log(`📥 Inputs: ${model.inputNames.join(', ')}`);
            console.log(`📤 Outputs: ${model.outputNames.join(', ')}`);
            return model;
        } catch (error) {
            console.error(`❌ Error loading ${modelType} model:`, error.message);
            throw error;
        }
    }

    getAvailableModels() {
        const available = [];
        for (const [key, config] of Object.entries(MODEL_CONFIGS)) {
            const modelPath = config.paths.find(p => fs.existsSync(p));
            if (modelPath) {
                available.push({
                    id: key,
                    name: config.displayName
                });
            }
        }
        return available;
    }

    async preprocessImage(imagePath) {
        try {
            // Verificar que el archivo existe
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image file not found: ${imagePath}`);
            }

            console.log(`📷 Procesando imagen: ${imagePath}`);

            // Obtener información de la imagen original
            const originalMetadata = await sharp(imagePath).metadata();
            console.log(`📐 Imagen original: ${originalMetadata.width}x${originalMetadata.height}, formato: ${originalMetadata.format}`);

            // Leer y procesar imagen con sharp - redimensionar a tamaño del modelo manteniendo aspecto
            // Usar 'contain' para mantener proporciones, luego rellenar si es necesario
            let data, info;
            try {
                const result = await sharp(imagePath)
                    .resize(IMG_SIZE, IMG_SIZE, {
                        fit: 'contain', // Mantener proporciones, rellenar con fondo si es necesario
                        background: { r: 0, g: 0, b: 0 }, // Fondo negro para rayos X
                        kernel: sharp.kernel.lanczos3
                    })
                    .removeAlpha() // Remover canal alpha si existe, asegurando RGB de 3 canales
                    .raw() // Obtener datos raw
                    .toBuffer({ resolveWithObject: true });
                
                data = result.data;
                info = result.info;
            } catch (sharpError) {
                console.error('Error procesando imagen con sharp:', sharpError);
                throw new Error(`Error al procesar la imagen: ${sharpError.message}`);
            }

            console.log(`📐 Imagen procesada: ${info.width}x${info.height}, canales: ${info.channels}`);

            if (info.channels !== 3) {
                throw new Error(`Imagen debe tener 3 canales (RGB), pero tiene ${info.channels}`);
            }

            // Normalizar según ImageNet (usado en EfficientNet)
            const mean = [0.485, 0.456, 0.406];
            const std = [0.229, 0.224, 0.225];

            // Crear array para tensor [1, 3, 224, 224]
            const tensorData = new Float32Array(1 * 3 * IMG_SIZE * IMG_SIZE);
            
            // Reorganizar de HWC (Height, Width, Channels) a CHW (Channels, Height, Width) y normalizar
            // Sharp devuelve datos en formato RGB
            for (let h = 0; h < IMG_SIZE; h++) {
                for (let w = 0; w < IMG_SIZE; w++) {
                    const pixelIdx = (h * IMG_SIZE + w) * info.channels;
                    const r = data[pixelIdx] / 255.0;
                    const g = data[pixelIdx + 1] / 255.0;
                    const b = data[pixelIdx + 2] / 255.0;
                    
                    // Canal R (índice 0) - formato CHW
                    tensorData[0 * IMG_SIZE * IMG_SIZE + h * IMG_SIZE + w] = (r - mean[0]) / std[0];
                    // Canal G (índice 1)
                    tensorData[1 * IMG_SIZE * IMG_SIZE + h * IMG_SIZE + w] = (g - mean[1]) / std[1];
                    // Canal B (índice 2)
                    tensorData[2 * IMG_SIZE * IMG_SIZE + h * IMG_SIZE + w] = (b - mean[2]) / std[2];
                }
            }

            // Crear tensor: [1, 3, 224, 224]
            const tensor = new ort.Tensor('float32', tensorData, [1, 3, IMG_SIZE, IMG_SIZE]);
            
            console.log(`✅ Tensor creado: shape [${tensor.dims.join(', ')}]`);
            
            return { tensor };
        } catch (error) {
            console.error('❌ Error preprocessing image:', error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    }

    async predict(imagePath, modelType = 'efficientnet') {
        try {
            const model = await this.loadModel(modelType);
            console.log(`📥 Input names: ${model.inputNames.join(', ')}`);
            console.log(`📤 Output names: ${model.outputNames.join(', ')}`);
            
            const { tensor } = await this.preprocessImage(imagePath);

            // Ejecutar inferencia
            const inputName = model.inputNames[0];
            console.log(`🔄 Ejecutando inferencia con input: ${inputName}`);
            
            const feeds = { [inputName]: tensor };
            const results = await model.run(feeds);
            
            // Obtener output
            const outputName = model.outputNames?.[0] || Object.keys(results)[0];
            if (!outputName || !results[outputName]) {
                throw new Error(`Output "${outputName}" no encontrado en el resultado del modelo`);
            }
            const output = results[outputName];
            
            console.log(`📊 Output shape: [${output.dims.join(', ')}]`);
            console.log(`📊 Output size: ${output.size}`);

            // Convertir a array de probabilidades
            const probabilities = Array.from(output.data);
            console.log(`📊 Probabilidades raw (primeros 3): ${probabilities.slice(0, 3).map(p => p.toFixed(4)).join(', ')}`);
            
            // Aplicar softmax
            const expScores = probabilities.map(p => Math.exp(Math.max(-50, Math.min(50, p)))); // Clamp para evitar overflow
            const sumExp = expScores.reduce((a, b) => a + b, 0);
            const softmaxProbs = expScores.map(exp => exp / sumExp);

            console.log(`📊 Softmax (primeros 3): ${softmaxProbs.slice(0, 3).map(p => (p * 100).toFixed(2)).join('%, ')}%`);

            // Verificar que tenemos el número correcto de clases
            if (softmaxProbs.length !== CLASS_ORDER.length) {
                console.warn(`⚠️ Advertencia: El modelo devuelve ${softmaxProbs.length} clases, pero esperamos ${CLASS_ORDER.length}`);
            }

            // Crear resultados con nombres en español
            const resultsArray = CLASS_ORDER.map((className, index) => ({
                condition: CLASS_NAMES[className] || className,
                conditionEn: className,
                probability: softmaxProbs[index] || 0
            }));

            // Ordenar por probabilidad descendente
            resultsArray.sort((a, b) => b.probability - a.probability);

            console.log(`✅ Predicción: ${resultsArray[0].condition} (${(resultsArray[0].probability * 100).toFixed(2)}%)`);

            return {
                results: resultsArray,
                rawProbabilities: softmaxProbs,
                predictedClass: resultsArray[0].condition,
                predictedClassEn: resultsArray[0].conditionEn,
                confidence: resultsArray[0].probability
            };
        } catch (error) {
            console.error('❌ Error in prediction:', error);
            console.error('Stack:', error.stack);
            throw error;
        }
    }

    async generateHeatmap(imagePath, predictionResult) {
        try {
            // Obtener dimensiones originales de la imagen
            const originalMetadata = await sharp(imagePath).metadata();
            const originalWidth = originalMetadata.width;
            const originalHeight = originalMetadata.height;
            
            console.log(`🔥 Generando heatmap para imagen ${originalWidth}x${originalHeight}`);

            // Crear un heatmap basado en la predicción
            // El heatmap se genera a tamaño del modelo (224x224) y luego se redimensiona a la imagen original
            const heatmapData = this.createApproximateHeatmap(IMG_SIZE, predictionResult);

            // Convertir heatmap a imagen RGBA con colormap
            const heatmapRGBA = new Uint8Array(IMG_SIZE * IMG_SIZE * 4);
            for (let i = 0; i < IMG_SIZE * IMG_SIZE; i++) {
                const intensity = heatmapData[i];
                // Usar colormap jet (azul -> cyan -> verde -> amarillo -> rojo)
                const r = this.heatmapColor(intensity, 0); // Red component
                const g = this.heatmapColor(intensity, 1); // Green component
                const b = this.heatmapColor(intensity, 2); // Blue component
                const a = Math.min(255, intensity * 2); // Alpha basado en intensidad
                
                heatmapRGBA[i * 4] = r;
                heatmapRGBA[i * 4 + 1] = g;
                heatmapRGBA[i * 4 + 2] = b;
                heatmapRGBA[i * 4 + 3] = a;
            }

            // Limitar el tamaño máximo del heatmap para optimizar el tamaño del archivo
            // Mantener proporciones pero limitar a máximo 512px en el lado más largo
            const maxHeatmapSize = 512;
            let heatmapWidth = originalWidth;
            let heatmapHeight = originalHeight;
            
            if (originalWidth > maxHeatmapSize || originalHeight > maxHeatmapSize) {
                const ratio = Math.min(maxHeatmapSize / originalWidth, maxHeatmapSize / originalHeight);
                heatmapWidth = Math.floor(originalWidth * ratio);
                heatmapHeight = Math.floor(originalHeight * ratio);
            }

            // Crear imagen PNG del heatmap con compresión optimizada
            const heatmapBuffer = await sharp(Buffer.from(heatmapRGBA), {
                raw: {
                    width: IMG_SIZE,
                    height: IMG_SIZE,
                    channels: 4
                }
            })
            .resize(heatmapWidth, heatmapHeight, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png({
                compressionLevel: 9, // Máxima compresión
                quality: 90, // Buena calidad pero comprimida
                palette: false // No usar paleta para mantener colores del heatmap
            })
            .toBuffer();

            console.log(`✅ Heatmap generado: ${heatmapBuffer.length} bytes (${heatmapWidth}x${heatmapHeight})`);

            return {
                heatmap: heatmapBuffer.toString('base64'),
                heatmapData: Array.from(heatmapData)
            };
        } catch (error) {
            console.error('❌ Error generating heatmap:', error);
            console.error('Stack:', error.stack);
            // Retornar heatmap vacío si hay error
            return {
                heatmap: null,
                heatmapData: null
            };
        }
    }

    // Función para generar colores del heatmap (colormap tipo "jet")
    heatmapColor(value, channel) {
        // Normalizar valor de 0-255 a 0-1
        const normalized = value / 255.0;
        
        if (channel === 0) { // Red
            if (normalized < 0.25) return 0;
            if (normalized < 0.5) return Math.floor(255 * 4 * (normalized - 0.25));
            if (normalized < 0.75) return 255;
            return Math.floor(255 * (1 - 4 * (normalized - 0.75)));
        } else if (channel === 1) { // Green
            if (normalized < 0.25) return Math.floor(255 * 4 * normalized);
            if (normalized < 0.75) return 255;
            return Math.floor(255 * (1 - 4 * (normalized - 0.75)));
        } else { // Blue
            if (normalized < 0.5) return Math.floor(255 * (1 - 4 * normalized));
            return 0;
        }
    }

    createApproximateHeatmap(size, predictionResult) {
        // Crear un heatmap aproximado basado en la predicción
        // En producción, esto debería usar las activaciones reales del modelo (GradCAM, etc.)
        const heatmap = new Uint8Array(size * size);
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Determinar si hay una anomalía
        const hasAnomaly = predictionResult.predictedClassEn !== 'Normal';
        const confidence = predictionResult.confidence || 0;
        
        // Para rayos X de tórax, las áreas de interés suelen estar en el centro y ligeramente hacia arriba
        // Crear múltiples regiones de atención basadas en la confianza y tipo de anomalía
        const regions = this.getAttentionRegions(size, predictionResult);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let maxIntensity = 0;
                
                // Calcular intensidad basada en todas las regiones de atención
                for (const region of regions) {
                    const dx = x - region.x;
                    const dy = y - region.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Función gaussiana para suavizar el heatmap
                    const gaussian = Math.exp(-(distance * distance) / (2 * region.sigma * region.sigma));
                    const intensity = region.intensity * gaussian * confidence;
                    
                    maxIntensity = Math.max(maxIntensity, intensity);
                }
                
                // Asegurar que el valor esté en el rango 0-255
                heatmap[y * size + x] = Math.min(255, Math.max(0, Math.floor(maxIntensity * 255)));
            }
        }

        return heatmap;
    }

    getAttentionRegions(size, predictionResult) {
        const regions = [];
        const centerX = size / 2;
        const centerY = size / 2;
        const confidence = predictionResult.confidence || 0;
        const hasAnomaly = predictionResult.predictedClassEn !== 'Normal';
        
        if (hasAnomaly && confidence > 0.3) {
            // Para anomalías, crear regiones focales en áreas pulmonares típicas
            // Pulmón izquierdo (centro-izquierda)
            regions.push({
                x: centerX - size * 0.15,
                y: centerY - size * 0.1,
                sigma: size * 0.15,
                intensity: confidence
            });
            
            // Pulmón derecho (centro-derecha)
            regions.push({
                x: centerX + size * 0.15,
                y: centerY - size * 0.1,
                sigma: size * 0.15,
                intensity: confidence
            });
            
            // Área central (mediastino)
            if (confidence > 0.6) {
                regions.push({
                    x: centerX,
                    y: centerY,
                    sigma: size * 0.1,
                    intensity: confidence * 0.7
                });
            }
        } else {
            // Para Normal o baja confianza, crear un heatmap más difuso
            regions.push({
                x: centerX,
                y: centerY,
                sigma: size * 0.3,
                intensity: Math.max(0.1, confidence * 0.3)
            });
        }
        
        return regions;
    }
}

module.exports = new ONNXAnalyzer();

