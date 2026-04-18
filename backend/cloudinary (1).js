const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary hesap bilgilerini .env'den alır
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Yüklenen dosyaların nereye ve nasıl kaydedileceğini ayarlar
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'ibu-study-hub',      // Cloudinary'de bu klasöre kaydeder
        resource_type: 'raw',          // PDF/DOCX gibi ham dosyalar için
        allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx']
    }
});

// Dosya boyutunu 10MB ile sınırlar
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { cloudinary, upload };
