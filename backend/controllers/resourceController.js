const db = require('../config/db');

// GET /api/resources?search=...&type=...
const getResources = async (req, res) => {
    const { search, type } = req.query;

    // Temel sorgu - kullanıcı adını da çekiyoruz
    let query = `
        SELECT 
            m.id,
            m.title,
            m.course_code,
            m.professor,
            m.type,
            m.description,
            m.file_url,
            m.created_at,
            u.fullname AS uploader
        FROM materials m
        JOIN users u ON m.user_id = u.id
        WHERE 1=1
    `;
    const params = [];

    // Arama filtresi (başlık, ders kodu veya hoca adında arar)
    if (search) {
        query += ' AND (m.title LIKE ? OR m.course_code LIKE ? OR m.professor LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Materyal türü filtresi
    if (type && type !== 'all') {
        query += ' AND m.type = ?';
        params.push(type);
    }

    query += ' ORDER BY m.created_at DESC';

    try {
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('getResources error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// POST /api/resources/upload  (auth gerekli + dosya gerekli)
const uploadResource = async (req, res) => {
    const { title, courseCode, professor, type, description } = req.body;

    // Zorunlu alan kontrolü
    if (!title || !courseCode || !type) {
        return res.status(400).json({ message: 'Başlık, ders kodu ve tür zorunludur.' });
    }

    // Dosya yüklendi mi?
    if (!req.file) {
        return res.status(400).json({ message: 'Lütfen bir dosya seçin.' });
    }

    try {
        // Cloudinary'den gelen dosya URL'si ve ID'si
        const fileUrl = req.file.path;
        const filePublicId = req.file.filename;

        await db.query(
            `INSERT INTO materials 
                (user_id, title, course_code, professor, type, description, file_url, file_public_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, title, courseCode, professor || null, type, description || null, fileUrl, filePublicId]
        );

        res.status(201).json({ message: 'Materyal başarıyla yüklendi.' });

    } catch (err) {
        console.error('uploadResource error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// GET /api/resources/dashboard  (auth gerekli)
const getDashboard = async (req, res) => {
    try {
        // Toplam materyal sayısı
        const [[totalRow]] = await db.query(
            'SELECT COUNT(*) AS total FROM materials'
        );

        // Bu kullanıcının yüklediği materyal sayısı
        const [[myRow]] = await db.query(
            'SELECT COUNT(*) AS total FROM materials WHERE user_id = ?',
            [req.user.id]
        );

        // Son 4 materyal
        const [recent] = await db.query(
            `SELECT m.*, u.fullname AS uploader
             FROM materials m
             JOIN users u ON m.user_id = u.id
             ORDER BY m.created_at DESC
             LIMIT 4`
        );

        res.json({
            totalMaterials: totalRow.total,
            myUploads: myRow.total,
            recentMaterials: recent
        });

    } catch (err) {
        console.error('getDashboard error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

module.exports = { getResources, uploadResource, getDashboard };
