const mysql = require('mysql2');

// Bağlantı havuzu oluşturur (tek bağlantıdan daha verimli)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promise tabanlı kullanım için
module.exports = pool.promise();
