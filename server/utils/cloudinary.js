const cloudinary = require('cloudinary').v2;

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
