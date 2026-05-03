const db = require('../config/db');

// GET /api/resources?search=...&type=...&university=...
const getResources = async (req, res) => {
    const { search, type, university } = req.query; /* University filtresi de query'den alınır */

    let query = `
        SELECT 
            m.id,
            m.title,
            m.course_code,
            m.professor,
            m.type,
            m.description,
            m.file_url,
            m.university,
            m.created_at,
            u.fullname AS uploader,
            u.email AS uploader_email
        FROM materials m
        JOIN users u ON m.user_id = u.id
        WHERE 1=1
    `;
    const params = [];

    // Arama filtresi
    if (search) {
        query += ' AND (m.title LIKE ? OR m.course_code LIKE ? OR m.professor LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Materyal türü filtresi
    if (type && type !== 'all') {
        query += ' AND m.type = ?';
        params.push(type);
    }

    /* Üniversite filtresi - sadece belirli üniversitenin materyallerini getirir */
    if (university) {
        query += ' AND m.university = ?';
        params.push(university);
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

// POST /api/resources/upload
const uploadResource = async (req, res) => {
    const { title, courseCode, professor, type, description } = req.body;

    if (!title || !courseCode || !type) {
        return res.status(400).json({ message: 'Başlık, ders kodu ve tür zorunludur.' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Lütfen bir dosya seçin.' });
    }

    try {
        const fileUrl = req.file.path;
        const filePublicId = req.file.filename;

        /* Kullanıcının üniversitesini veritabanından çeker */
        const [userRows] = await db.query(
            'SELECT university FROM users WHERE id = ?',
            [req.user.id]
        );
        const userUniversity = userRows[0]?.university || 'IBU';

        /* Materyale user'ın üniversitesi otomatik eklenir */
        await db.query(
            `INSERT INTO materials 
                (user_id, title, course_code, professor, type, description, file_url, file_public_id, university) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, title, courseCode, professor || null, type, description || null, fileUrl, filePublicId, userUniversity]
        );

        res.status(201).json({ message: 'Materyal başarıyla yüklendi.' });

    } catch (err) {
        console.error('uploadResource error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// GET /api/resources/dashboard
const getDashboard = async (req, res) => {
    try {
        /* Kullanıcının üniversitesini çeker */
        const [userRows] = await db.query(
            'SELECT university FROM users WHERE id = ?',
            [req.user.id]
        );
        const userUniversity = userRows[0]?.university || 'IBU';

        /* Sadece aynı üniversitenin toplam materyal sayısı */
        const [[totalRow]] = await db.query(
            'SELECT COUNT(*) AS total FROM materials WHERE university = ?',
            [userUniversity]
        );

        /* Bu kullanıcının yüklediği materyal sayısı */
        const [[myRow]] = await db.query(
            'SELECT COUNT(*) AS total FROM materials WHERE user_id = ?',
            [req.user.id]
        );

        /* Aynı üniversitedeki toplam Notes sayısı */
        const [[notesRow]] = await db.query(
            "SELECT COUNT(*) AS total FROM materials WHERE university = ? AND type = 'notes'",
            [userUniversity]
        );

        /* Aynı üniversitedeki toplam Past Exam sayısı */
        const [[examsRow]] = await db.query(
            "SELECT COUNT(*) AS total FROM materials WHERE university = ? AND type = 'exam'",
            [userUniversity]
        );

        /* Aynı üniversitenin son 4 materyali */
        const [recent] = await db.query(
            `SELECT m.*, u.fullname AS uploader
             FROM materials m
             JOIN users u ON m.user_id = u.id
             WHERE m.university = ?
             ORDER BY m.created_at DESC
             LIMIT 4`,
            [userUniversity]
        );

        res.json({
            totalMaterials: totalRow.total,
            myUploads: myRow.total,
            totalNotes: notesRow.total,
            totalExams: examsRow.total,
            recentMaterials: recent,
            university: userUniversity
        });

    } catch (err) {
        console.error('getDashboard error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

module.exports = { getResources, uploadResource, getDashboard };