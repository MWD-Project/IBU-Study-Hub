/* ============================================================
   IBU Study Hub - main.js
   Backend API ile bağlantılı jQuery kodu
   ============================================================ */

const API = 'http://localhost:3000/api'; // Backend adresi

$(document).ready(function () {

    /* ==================== YARDIMCI FONKSİYONLAR ==================== */

    // Token'ı localStorage'a kaydeder (login/register sonrası)
    function saveToken(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    // Kaydedilmiş token'ı getirir
    function getToken() {
        return localStorage.getItem('token');
    }

    // Kaydedilmiş kullanıcı bilgisini getirir
    function getUser() {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    }

    // Tarih formatlar: "2 days ago" yerine Türkçe
    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60)          return 'Az önce';
        if (diff < 3600)        return Math.floor(diff / 60) + ' dakika önce';
        if (diff < 86400)       return Math.floor(diff / 3600) + ' saat önce';
        if (diff < 604800)      return Math.floor(diff / 86400) + ' gün önce';
        return Math.floor(diff / 604800) + ' hafta önce';
    }

    // Materyal türüne göre badge HTML'i döner
    function badgeHTML(type) {
        const map = {
            notes: '<span class="badge badge-notes">Notes</span>',
            exam:  '<span class="badge badge-exam">Past Exam</span>',
            slides:'<span class="badge badge-slides">Slides</span>',
            book:  '<span class="badge badge-book">Resource</span>'
        };
        return map[type] || '<span class="badge">Other</span>';
    }

    // Materyal verisinden kart HTML'i üretir
    function buildCard(material) {
        return `
            <div class="card" data-type="${material.type}">
                ${badgeHTML(material.type)}
                <h3>${material.title}</h3>
                <p>${material.course_code}${material.professor ? ' · ' + material.professor : ''}</p>
                <div class="card-footer">
                    <span>${material.uploader}</span>
                    <span>${timeAgo(material.created_at)}</span>
                </div>
            </div>
        `;
    }


    /* ==================== LOGIN FORMU ==================== */

    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        const email    = $('#email').val().trim();
        const password = $('#password').val();

        if (!email || !password) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }

        $.ajax({
            url: API + '/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function (res) {
                saveToken(res.token, res.user);
                window.location.href = 'dashboard.html';
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.message || 'Giriş başarısız.';
                alert(msg);
            }
        });
    });


    /* ==================== REGISTER FORMU ==================== */

    $('#registerForm').on('submit', function (e) {
        e.preventDefault();

        const fullname        = $('#fullname').val().trim();
        const email           = $('#email').val().trim();
        const password        = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();

        if (!fullname || !email || !password || !confirmPassword) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Şifreler eşleşmiyor.');
            return;
        }

        $.ajax({
            url: API + '/auth/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ fullname, email, password }),
            success: function (res) {
                saveToken(res.token, res.user);
                window.location.href = 'dashboard.html';
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.message || 'Kayıt başarısız.';
                alert(msg);
            }
        });
    });


    /* ==================== UPLOAD FORMU ==================== */

    $('#uploadForm').on('submit', function (e) {
        e.preventDefault();

        const title       = $('#title').val().trim();
        const courseCode  = $('#courseCode').val().trim();
        const professor   = $('#professor').val().trim();
        const type        = $('#type').val();
        const description = $('#description').val().trim();
        const fileInput   = $('#file')[0];

        if (!title || !courseCode || !type || fileInput.files.length === 0) {
            alert('Lütfen zorunlu alanları doldurun ve bir dosya seçin.');
            return;
        }

        // FormData ile hem dosya hem metin gönderilir
        const formData = new FormData();
        formData.append('title', title);
        formData.append('courseCode', courseCode);
        formData.append('professor', professor);
        formData.append('type', type);
        formData.append('description', description);
        formData.append('file', fileInput.files[0]);

        $.ajax({
            url: API + '/resources/upload',
            method: 'POST',
            headers: { Authorization: 'Bearer ' + getToken() },
            data: formData,
            processData: false,   // FormData'yı jQuery işlemesin
            contentType: false,   // Content-Type browser belirlesin
            success: function () {
                alert('Materyal başarıyla yüklendi!');
                window.location.href = 'resources.html';
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.message || 'Yükleme başarısız.';
                alert(msg);
            }
        });
    });


    /* ==================== RESOURCES SAYFASI ==================== */

    // Sayfa resources.html ise kartları API'dan yükle
    if ($('#resourcesGrid').length) {
        loadResources();

        // Arama kutusu
        let searchTimer;
        $('#searchInput').on('keyup', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(loadResources, 400); // 400ms bekler
        });

        // Tür filtresi
        $('#filterType').on('change', loadResources);
    }

    function loadResources() {
        const search = $('#searchInput').val().trim();
        const type   = $('#filterType').val();

        const params = {};
        if (search) params.search = search;
        if (type && type !== 'all') params.type = type;

        $.ajax({
            url: API + '/resources',
            method: 'GET',
            data: params,
            success: function (materials) {
                const grid = $('#resourcesGrid');
                grid.empty();

                if (materials.length === 0) {
                    grid.html('<p style="color:#888; padding:20px;">Sonuç bulunamadı.</p>');
                    return;
                }

                materials.forEach(function (m) {
                    grid.append(buildCard(m));
                });
            },
            error: function () {
                alert('Materyaller yüklenemedi.');
            }
        });
    }


    /* ==================== DASHBOARD ==================== */

    if ($('.dashboard-header').length) {
        const user = getUser();

        // Kullanıcı adını göster
        if (user) {
            $('.dashboard-header h1 span').text(user.fullname);
        }

        // Dashboard verilerini API'dan yükle
        $.ajax({
            url: API + '/resources/dashboard',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + getToken() },
            success: function (data) {
                // İstatistik sayılarını güncelle
                $('.stat-total').text(data.totalMaterials);
                $('.stat-mine').text(data.myUploads);

                // Son materyalleri göster
                const grid = $('#recentGrid');
                if (grid.length) {
                    grid.empty();
                    data.recentMaterials.forEach(function (m) {
                        grid.append(buildCard(m));
                    });
                }
            },
            error: function () {
                console.log('Dashboard verisi yüklenemedi.');
            }
        });
    }


    /* ==================== LOGOUT ==================== */

    $('.btn-logout').on('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

});
