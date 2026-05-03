const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
const register = async (req, res) => {
    const { fullname, email, password, university } = req.body; /* university de alınır */

    if (!fullname || !email || !password) {
        return res.status(400).json({ message: 'Tüm alanları doldurun.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
    }

    /* Geçerli üniversite kontrolü - sadece bu üçünden biri olabilir */
    const validUnis = ['IBU', 'Bilkent', 'Bogazici'];
    const uni = validUnis.includes(university) ? university : 'IBU';

    try {
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Bu email zaten kullanımda.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        /* Kullanıcıyı veritabanına kaydet - university kolonu da eklendi */
        const [result] = await db.query(
            'INSERT INTO users (fullname, email, password_hash, university) VALUES (?, ?, ?, ?)',
            [fullname, email, passwordHash, uni]
        );

        const token = jwt.sign(
            { id: result.insertId, fullname, email, role: 'user', university: uni }, /* University token'a da eklenir */
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Hesap oluşturuldu.',
            token,
            user: { id: result.insertId, fullname, email, role: 'user', university: uni }
        });

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Tüm alanları doldurun.' });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email veya şifre hatalı.' });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email veya şifre hatalı.' });
        }

        const token = jwt.sign(
            { id: user.id, fullname: user.fullname, email: user.email, role: user.role, university: user.university }, /* University token'a eklenir */
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Giriş başarılı.',
            token,
            user: { id: user.id, fullname: user.fullname, email: user.email, role: user.role, university: user.university } /* University frontend'e gönderilir */
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

module.exports = { register, login };