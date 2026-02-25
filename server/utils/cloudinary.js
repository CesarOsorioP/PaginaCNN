const cloudinary = require('cloudinary').v2;

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImage(filePath) {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: 'chest-xray-studies',
        resource_type: 'image'
    });
    return { url: result.secure_url, publicId: result.public_id };
}

async function deleteImage(publicId) {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadImage, deleteImage };
