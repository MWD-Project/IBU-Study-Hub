const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

/* GET /api/comments/:materialId - Bir materyalin tüm yorumlarını getirir */
router.get('/:materialId', async (req, res) => {
    try {
        const [comments] = await db.query(
            `SELECT c.id, c.user_id, c.content, c.created_at, u.fullname, u.email
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.material_id = ?
             ORDER BY c.created_at DESC`,
            [req.params.materialId]
        );
        res.json(comments);
    } catch (err) {
        console.error('getComments error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

/* POST /api/comments/:materialId - Yeni yorum ekler (login gerekli) */
router.post('/:materialId', auth, async (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Yorum boş olamaz.' });
    }
    try {
        await db.query(
            'INSERT INTO comments (material_id, user_id, content) VALUES (?, ?, ?)',
            [req.params.materialId, req.user.id, content.trim()]
        );
        res.status(201).json({ message: 'Yorum eklendi.' });
    } catch (err) {
        console.error('postComment error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

/* DELETE /api/comments/:id - Yorum siler (sadece yorum sahibi veya admin) */
router.delete('/:id', auth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT user_id FROM comments WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Yorum bulunamadı.' });
        }
        /* Yorum sahibi veya admin silebilir */
        if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu yorumu silme yetkiniz yok.' });
        }
        await db.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Yorum silindi.' });
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;