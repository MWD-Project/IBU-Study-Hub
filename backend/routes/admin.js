const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

/* Admin kontrolü middleware */
function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin yetkisi gerekli.' });
    }
    next();
}

/* ==================== STATS ==================== */

/* GET /api/admin/stats - Dashboard istatistikleri */
router.get('/stats', auth, adminOnly, async (req, res) => {
    try {
        const [[{ totalUsers }]]     = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
        const [[{ totalMaterials }]] = await db.query('SELECT COUNT(*) AS totalMaterials FROM materials');
        const [[{ totalNotes }]]     = await db.query("SELECT COUNT(*) AS totalNotes FROM materials WHERE type = 'notes'");
        const [[{ totalExams }]]     = await db.query("SELECT COUNT(*) AS totalExams FROM materials WHERE type = 'exam'");
        res.json({ totalUsers, totalMaterials, totalNotes, totalExams });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

/* ==================== KULLANICILAR ==================== */

/* GET /api/admin/users - Tüm kullanıcıları getir */
router.get('/users', auth, adminOnly, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, fullname, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

/* DELETE /api/admin/users/:id - Kullanıcı sil */
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ message: 'Kendinizi silemezsiniz.' });
        }
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Kullanıcı silindi.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

/* PATCH /api/admin/users/:id/role - Kullanıcı rolünü değiştir */
router.patch('/users/:id/role', auth, adminOnly, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Geçersiz rol.' });
        }
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ message: 'Kendi rolünüzü değiştiremezsiniz.' });
        }
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ message: 'Rol güncellendi.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

/* ==================== MATERYALLER ==================== */

/* GET /api/admin/materials - Tüm materyalleri getir */
router.get('/materials', auth, adminOnly, async (req, res) => {
    try {
        const [materials] = await db.query(
            `SELECT m.*, u.fullname 
             FROM materials m 
             LEFT JOIN users u ON m.user_id = u.id 
             ORDER BY m.created_at DESC`
        );
        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

/* DELETE /api/admin/materials/:id - Materyal sil */
router.delete('/materials/:id', auth, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM materials WHERE id = ?', [req.params.id]);
        res.json({ message: 'Materyal silindi.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
/* GET /api/admin/materials/:id - Materyal detayını getir */
router.get('/materials/:id', auth, adminOnly, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT m.*, u.fullname AS uploader
             FROM materials m
             LEFT JOIN users u ON m.user_id = u.id
             WHERE m.id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Materyal bulunamadı.' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
module.exports = router;