const express = require('express');
const router = express.Router();
const { analyzeImage, analyzeImageEXAI, saveStudy, getHistory, getStudyById, getAvailableModels, deleteStudy, getProgress } = require('../controllers/study.controller');
const { protect } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const checkFileType = (file, cb) => {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
};

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

router.get('/models', protect, getAvailableModels);
router.get('/progress', protect, getProgress);
router.post('/analyze', protect, upload.single('image'), analyzeImage);
router.post('/analyze-exai', protect, upload.single('image'), analyzeImageEXAI);
router.post('/', protect, saveStudy);
router.get('/', protect, getHistory);
router.delete('/:id', protect, deleteStudy);
router.get('/:id', protect, getStudyById);

module.exports = router;
