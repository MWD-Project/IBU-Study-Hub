const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
const register = async (req, res) => {
    const { fullname, email, password } = req.body;

    // Boş alan kontrolü
    if (!fullname || !email || !password) {
        return res.status(400).json({ message: 'Tüm alanları doldurun.' });
    }

    // Şifre minimum uzunluğu
    if (password.length < 6) {
        return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
    }

    try {
        // Email zaten kayıtlı mı?
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Bu email zaten kullanımda.' });
        }

        // Şifreyi hashle (10 = güvenlik seviyesi)
        const passwordHash = await bcrypt.hash(password, 10);

        // Kullanıcıyı veritabanına kaydet
        const [result] = await db.query(
            'INSERT INTO users (fullname, email, password_hash) VALUES (?, ?, ?)',
            [fullname, email, passwordHash]
        );

        // JWT token oluştur (7 gün geçerli)
        const token = jwt.sign(
            { id: result.insertId, fullname, email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Hesap oluşturuldu.',
            token,
            user: { id: result.insertId, fullname, email }
        });

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;

    // Boş alan kontrolü
    if (!email || !password) {
        return res.status(400).json({ message: 'Tüm alanları doldurun.' });
    }

    try {
        // Kullanıcıyı email ile bul
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email veya şifre hatalı.' });
        }

        const user = rows[0];

        // Şifreyi karşılaştır
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email veya şifre hatalı.' });
        }

        // JWT token oluştur
        const token = jwt.sign(
            { id: user.id, fullname: user.fullname, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Giriş başarılı.',
            token,
            user: { id: user.id, fullname: user.fullname, email: user.email }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

module.exports = { register, login };
