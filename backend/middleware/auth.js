const jwt = require('jsonwebtoken');

// Korumalı route'lara erişim için token doğrulama
module.exports = (req, res, next) => {
    // Header'dan token'ı alır: "Bearer <token>"
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Giriş yapmanız gerekiyor.' });
    }

    try {
        // Token'ı çözer ve kullanıcı bilgilerini req.user'a ekler
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next(); // Bir sonraki middleware/controller'a geç
    } catch (err) {
        return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
    }
};
