const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Giriş yapmanız gerekiyor.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        /* Veritabanından güncel kullanıcı bilgisini çeker - role değişikliklerini yansıtır */
        const [rows] = await db.query('SELECT id, fullname, email, role FROM users WHERE id = ?', [decoded.id]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
        }
        
        req.user = rows[0]; /* Güncel kullanıcı bilgisini req.user'a ekler */
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
    }
};