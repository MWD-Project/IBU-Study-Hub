-- IBU Study Hub - Veritabanı Kurulum Scripti
-- MySQL'de çalıştır: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS ibu_study_hub;
USE ibu_study_hub;

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    fullname    VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materyaller tablosu
CREATE TABLE IF NOT EXISTS materials (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    title           VARCHAR(200) NOT NULL,
    course_code     VARCHAR(20)  NOT NULL,
    professor       VARCHAR(100),
    type            ENUM('notes', 'exam', 'slides', 'book') NOT NULL,
    description     TEXT,
    file_url        VARCHAR(500) NOT NULL,   -- Cloudinary URL
    file_public_id  VARCHAR(300) NOT NULL,   -- Cloudinary silmek için ID
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Hızlı arama için index
CREATE INDEX idx_materials_type       ON materials(type);
CREATE INDEX idx_materials_course     ON materials(course_code);
CREATE INDEX idx_materials_created    ON materials(created_at);
