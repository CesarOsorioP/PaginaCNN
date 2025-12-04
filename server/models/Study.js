const mongoose = require('mongoose');

const studySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    analysisDate: {
        type: Date,
        default: Date.now
    },
    results: [{
        condition: String,
        conditionEn: String,
        probability: Number
    }],
    predictedClass: {
        type: String
    },
    predictedClassEn: {
        type: String
    },
    confidence: {
        type: Number
    },
    heatmap: {
        type: String // Base64 encoded heatmap
    },
    modelType: {
        type: String,
        default: 'efficientnet' // Tipo de modelo usado para el análisis
    },
    processingTime: {
        type: Number // Tiempo de análisis en milisegundos
    },
    summary: {
        type: String
    },
    reportUrl: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Study', studySchema);
