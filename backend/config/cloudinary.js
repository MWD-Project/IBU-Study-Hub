const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        /* Dosya adını ve uzantısını korur */
        const originalName = file.originalname.split('.').slice(0, -1).join('.');
        const extension = file.originalname.split('.').pop();
        
        return {
            folder: 'ibu-study-hub',
            resource_type: 'raw',                                    /* PDF/DOCX için raw */
            public_id: Date.now() + '-' + originalName + '.' + extension,  /* Uzantıyı dosya adına dahil eder */
            use_filename: true,
            unique_filename: false
        };
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { cloudinary, upload };