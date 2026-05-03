/* ============================================================
   IBU Study Hub - main.js
   Backend API ile bağlantılı jQuery kodu
   ============================================================ */

const API = 'http://localhost:3000/api'; /* Backend sunucusunun adresi - tüm istekler buraya gider */

$(document).ready(function () { /* Sayfa tamamen yüklenince çalışmaya başlar */

    /* ==================== YARDIMCI FONKSİYONLAR ==================== */

    /* Token ve kullanıcı bilgisini tarayıcı hafızasına kaydeder */
    function saveToken(token, user) {
        localStorage.setItem('token', token); /* JWT token'ı saklar - her API isteğinde kullanılır */
        localStorage.setItem('user', JSON.stringify(user)); /* Kullanıcı objesini metin olarak saklar */
    }

    /* Kaydedilmiş token'ı tarayıcı hafızasından okur */
    function getToken() {
        return localStorage.getItem('token');
    }

    /* Kaydedilmiş kullanıcı bilgisini tarayıcı hafızasından okur ve objeye çevirir */
    function getUser() {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    }

    /* Tarih verisini "2 gün önce" gibi okunabilir formata çevirir */
    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60)     return 'Az önce';
        if (diff < 3600)   return Math.floor(diff / 60) + ' dakika önce';
        if (diff < 86400)  return Math.floor(diff / 3600) + ' saat önce';
        if (diff < 604800) return Math.floor(diff / 86400) + ' gün önce';
        return Math.floor(diff / 604800) + ' hafta önce';
    }

    /* Materyal türüne göre renkli etiket HTML kodu döner */
    function badgeHTML(type) {
        const map = {
            notes: '<span class="badge badge-notes">Notes</span>',
            exam:  '<span class="badge badge-exam">Past Exam</span>',
            slides:'<span class="badge badge-slides">Slides</span>',
            book:  '<span class="badge badge-book">Resource</span>'
        };
        return map[type] || '<span class="badge">Other</span>';
    }

    /* Materyal verisinden kart HTML yapısını üretir */
    function buildCard(material) {
        return `
            <div class="card" data-type="${material.type}" onclick="viewPublicMaterial(${material.id})" style="cursor:pointer;">
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
                if (res.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
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
        const email           = $('#regEmail').val().trim();
        const university      = $('#university').val();
        const password        = $('#regPassword').val();
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
            data: JSON.stringify({ fullname, email, password, university }),
            success: function (res) {
                saveToken(res.token, res.user);
                if (res.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
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
            processData: false,
            contentType: false,
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

    if ($('#resourcesGrid').length) {
        /* URL'den ?type=notes gibi parametre gelirse filtreyi otomatik ayarla */
        const urlParams = new URLSearchParams(window.location.search);
        const typeFromURL = urlParams.get('type');
        if (typeFromURL) {
            $('#filterType').val(typeFromURL);
        }
        loadResources();

        /* Arama kutusu - 400ms bekledikten sonra arar */
        let searchTimer;
        $('#searchInput').on('keyup', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(loadResources, 400);
        });

        /* Tür filtresi değişince yeniden yükler */
        $('#filterType').on('change', loadResources);
    }

    /* Backend'den materyal listesini çeker ve ekrana yazar */
    function loadResources() {
        const search = $('#searchInput').val().trim();
        const type   = $('#filterType').val();
        const user   = getUser();

        const params = {};
        if (search) params.search = search;
        if (type && type !== 'all') params.type = type;
        if (user && user.university) params.university = user.university;

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

        /* Arka plan slideshow - üniversiteye göre */
        if (user && $('#bgSlideshow').length) {
            const uniFolder = {
                'IBU': 'ibu',
                'Bilkent': 'bilkent',
                'Bogazici': 'bogazici'
            };
            const folder = uniFolder[user.university] || 'ibu';
            let currentImage = 1;
            const totalImages = 4;

            function changeBackground() {
                const imgPath = '/frontend/images/' + folder + '/' + currentImage + '.jpg';
                $('#bgSlideshow').css('background-image', 'url(' + imgPath + ')');
                currentImage = currentImage % totalImages + 1;
            }

            $('body').addClass('has-bg');
            changeBackground();
            setInterval(changeBackground, 5000);
        }

        /* Başlıktaki kullanıcı adı ve üniversite */
        if (user) {
            $('.dashboard-header h1 span').text(user.fullname);

            const uniNames = {
                'IBU': 'International Balkan University',
                'Bilkent': 'Bilkent University',
                'Bogazici': 'Boğaziçi University'
            };
            const uniFullName = uniNames[user.university] || 'your campus';
            $('#universityLabel').text("Here's what's new on " + uniFullName + " today.");
        }

        /* Dashboard verileri backend'den çekilir */
        $.ajax({
            url: API + '/resources/dashboard',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + getToken() },
            success: function (data) {
                $('.stat-total').text(data.totalMaterials);
                $('.stat-mine').text(data.myUploads);
                $('.stat-notes').text(data.totalNotes);
                $('.stat-exams').text(data.totalExams);

                const grid = $('#recentGrid');
                if (grid.length) {
                    grid.empty();
                    if (data.recentMaterials.length === 0) {
                        grid.html('<p style="color:#888;">Henüz materyal yüklenmemiş.</p>');
                    } else {
                        data.recentMaterials.forEach(function (m) {
                            grid.append(buildCard(m));
                        });
                    }
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


    /* ==================== ADMIN PANELİ ==================== */

    if ($('#usersTableBody').length) {

        /* Kullanıcı listesi */
        $.ajax({
            url: API + '/admin/users',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + getToken() },
            success: function (users) {
                $('#totalUsers').text(users.length);
                var html = '';
                $.each(users, function (i, user) {
                    var roleLabel = user.role === 'admin'
                        ? '<span style="color:#16a34a;font-weight:600;">Admin</span>'
                        : '<span style="color:#888;">User</span>';

                    var roleBtn = user.role === 'admin'
                        ? '<button class="btn-role" onclick="changeRole(' + user.id + ', \'user\')">Make User</button>'
                        : '<button class="btn-role" onclick="changeRole(' + user.id + ', \'admin\')">Make Admin</button>';

                    html += '<tr>';
                    html += '<td>' + user.id + '</td>';
                    html += '<td>' + user.fullname + '</td>';
                    html += '<td>' + user.email + '</td>';
                    html += '<td>' + roleLabel + '</td>';
                    html += '<td>' + new Date(user.created_at).toLocaleDateString('tr-TR') + '</td>';
                    html += '<td>' + roleBtn + ' <button class="btn-delete" onclick="deleteUser(' + user.id + ')">Delete</button></td>';
                    html += '</tr>';
                });
                $('#usersTableBody').html(html);
            },
            error: function () {
                $('#usersTableBody').html('<tr><td colspan="6">Could not load users.</td></tr>');
            }
        });

        /* Materyal listesi */
        $.ajax({
            url: API + '/admin/materials',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + getToken() },
            success: function (materials) {
                $('#totalMaterials').text(materials.length);

                var notes = materials.filter(function (m) { return m.type === 'notes'; }).length;
                var exams = materials.filter(function (m) { return m.type === 'exam'; }).length;
                $('#totalNotes').text(notes);
                $('#totalExams').text(exams);

                var html = '';
                $.each(materials, function (i, material) {
                    html += '<tr>';
                    html += '<td>' + material.id + '</td>';
                    html += '<td>' + material.title + '</td>';
                    html += '<td>' + material.course_code + '</td>';
                    html += '<td>' + badgeHTML(material.type) + '</td>';
                    html += '<td>' + (material.fullname || 'Unknown') + '</td>';
                    html += '<td>';
                    html += '<button class="btn-view" onclick="viewMaterial(' + material.id + ')">View</button> ';
                    html += '<button class="btn-delete" onclick="deleteMaterial(' + material.id + ')">Delete</button>';
                    html += '</td>';
                    html += '</tr>';
                });
                $('#materialsTableBody').html(html);
            },
            error: function () {
                $('#materialsTableBody').html('<tr><td colspan="6">Could not load materials.</td></tr>');
            }
        });
    }

});

/* ==================== ADMIN GLOBAL FONKSİYONLAR ==================== */

/* Kullanıcı silme */
function deleteUser(id) {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    $.ajax({
        url: 'http://localhost:3000/api/admin/users/' + id,
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
        success: function () {
            alert('Kullanıcı silindi!');
            location.reload();
        },
        error: function () { alert('Kullanıcı silinemedi.'); }
    });
}

/* Materyal silme */
function deleteMaterial(id) {
    if (!confirm('Bu materyali silmek istediğinizden emin misiniz?')) return;
    $.ajax({
        url: 'http://localhost:3000/api/admin/materials/' + id,
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
        success: function () {
            alert('Materyal silindi!');
            location.reload();
        },
        error: function () { alert('Materyal silinemedi.'); }
    });
}

/* Kullanıcı rolünü değiştirme */
function changeRole(id, newRole) {
    var msg = newRole === 'admin'
        ? 'Bu kullanıcıyı admin yapmak istediğinizden emin misiniz?'
        : 'Bu kullanıcının admin yetkisini almak istediğinizden emin misiniz?';
    if (!confirm(msg)) return;
    $.ajax({
        url: 'http://localhost:3000/api/admin/users/' + id + '/role',
        method: 'PATCH',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
        data: JSON.stringify({ role: newRole }),
        success: function () {
            alert('Rol güncellendi!');
            location.reload();
        },
        error: function () { alert('Rol güncellenemedi.'); }
    });
}

/* Admin panelinden materyal detayı - basit modal */
function viewMaterial(id) {
    $.ajax({
        url: 'http://localhost:3000/api/admin/materials/' + id,
        method: 'GET',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
        success: function (m) {
            var html = '<div id="materialModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;">';
            html += '<div style="background:#fff;border-radius:12px;padding:32px;max-width:500px;width:90%;position:relative;">';
            html += '<button onclick="document.getElementById(\'materialModal\').remove()" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:20px;cursor:pointer;">✕</button>';
            html += '<h2 style="margin-bottom:16px;color:#1a1a1a;">' + m.title + '</h2>';
            html += '<p style="margin:8px 0;"><strong>Ders Kodu:</strong> ' + m.course_code + '</p>';
            html += '<p style="margin:8px 0;"><strong>Tür:</strong> ' + m.type + '</p>';
            html += '<p style="margin:8px 0;"><strong>Hoca:</strong> ' + (m.professor || '-') + '</p>';
            html += '<p style="margin:8px 0;"><strong>Yükleyen:</strong> ' + (m.uploader || 'Unknown') + '</p>';
            html += '<p style="margin:8px 0;"><strong>Açıklama:</strong> ' + (m.description || '-') + '</p>';
            html += '<p style="margin:8px 0;"><strong>Tarih:</strong> ' + new Date(m.created_at).toLocaleDateString('tr-TR') + '</p>';
            html += '<a href="' + m.file_url + '" target="_blank" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">📄 Dosyayı Aç</a>';
            html += '</div></div>';
            $('body').append(html);
        },
        error: function () { alert('Materyal detayı yüklenemedi.'); }
    });
}

/* ==================== MATERYAL DETAY MODALI - YENİ GÜZEL TASARIM ==================== */
function viewPublicMaterial(id) {
    $.ajax({
        url: 'http://localhost:3000/api/resources',
        method: 'GET',
        success: function (materials) {
            var m = materials.find(function(x) { return x.id === id; });
            if (!m) { alert('Materyal bulunamadı.'); return; }

            /* Türe göre renk paleti - header ve buton renkleri için */
            var typeColors = {
                notes:  { bg: '#dcfce7', color: '#166534', accent: '#16a34a', label: '📝 Notes' },
                exam:   { bg: '#fef3c7', color: '#92400e', accent: '#f59e0b', label: '📄 Past Exam' },
                slides: { bg: '#dbeafe', color: '#1e40af', accent: '#3b82f6', label: '📊 Slides' },
                book:   { bg: '#fce7f3', color: '#9d174d', accent: '#ec4899', label: '📚 Resource' }
            };
            var t = typeColors[m.type] || typeColors.notes;

            /* Modal container - blur arka plan */
            var html = '<div id="materialModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;backdrop-filter:blur(4px);">';
            html += '<div style="background:#fff;border-radius:20px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3);">';

            /* Renkli gradient header - türe göre */
            html += '<div style="background:linear-gradient(135deg,' + t.accent + ' 0%,' + t.color + ' 100%);padding:30px 32px;color:#fff;border-radius:20px 20px 0 0;position:relative;">';
            html += '<button onclick="document.getElementById(\'materialModal\').remove()" style="position:absolute;top:16px;right:20px;background:rgba(255,255,255,0.2);border:none;font-size:18px;cursor:pointer;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;">✕</button>';
            html += '<div style="display:inline-block;background:rgba(255,255,255,0.25);padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:10px;">' + t.label + '</div>';
            html += '<h2 style="margin:0;font-size:26px;font-weight:700;">' + m.title + '</h2>';
            html += '<p style="margin:8px 0 0;opacity:0.9;font-size:14px;">' + m.course_code + (m.professor ? ' · ' + m.professor : '') + '</p>';
            html += '</div>';

            /* İçerik alanı */
            html += '<div style="padding:28px 32px;">';

            /* Bilgi kutuları - 2 sütunlu grid */
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">';
            html += '<div style="padding:12px;background:#f9fafb;border-radius:10px;"><div style="font-size:12px;color:#888;margin-bottom:4px;">👤 Yükleyen</div><strong style="color:#1a1a1a;">' + m.uploader + '</strong></div>';
            if (m.uploader_email) {
                html += '<div style="padding:12px;background:#f9fafb;border-radius:10px;"><div style="font-size:12px;color:#888;margin-bottom:4px;">✉️ İletişim</div><a href="mailto:' + m.uploader_email + '" style="color:' + t.accent + ';text-decoration:none;font-weight:600;font-size:14px;">' + m.uploader_email + '</a></div>';
            }
            html += '</div>';

            /* Açıklama kutusu - varsa */
            if (m.description) {
                html += '<div style="padding:14px;background:#f9fafb;border-radius:10px;margin-bottom:20px;"><div style="font-size:12px;color:#888;margin-bottom:6px;">📋 Açıklama</div><p style="margin:0;color:#333;">' + m.description + '</p></div>';
            }

            /* Dosyayı aç butonu - büyük ve gradient */
            html += '<a href="' + m.file_url + '" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,' + t.accent + ' 0%,' + t.color + ' 100%);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">📄 Dosyayı Aç</a>';

            /* ==================== YORUMLAR BÖLÜMÜ ==================== */
            html += '<div style="margin-top:28px;padding-top:24px;border-top:2px solid #f0f0f0;">';
            html += '<h3 style="margin:0 0 16px;font-size:18px;">💬 Yorumlar</h3>';
            html += '<div id="commentsList" style="margin-bottom:16px;"><p style="color:#888;">Yorumlar yükleniyor...</p></div>';

            /* Yorum yazma formu - sadece login olmuş kullanıcılar için */
            if (localStorage.getItem('token')) {
                html += '<textarea id="newCommentInput" placeholder="Yorumunuzu yazın..." style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:10px;resize:vertical;min-height:70px;font-family:inherit;font-size:14px;box-sizing:border-box;transition:border-color 0.2s;" onfocus="this.style.borderColor=\'' + t.accent + '\'" onblur="this.style.borderColor=\'#e5e7eb\'"></textarea>';
                html += '<button onclick="addComment(' + id + ')" style="margin-top:10px;padding:12px 24px;background:' + t.accent + ';color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;">Yorum Gönder</button>';
            } else {
                html += '<p style="color:#888;padding:12px;background:#f9fafb;border-radius:8px;">Yorum yapmak için giriş yapın.</p>';
            }

            html += '</div></div></div></div>';
            $('body').append(html);

            /* Modal açılınca yorumları yükle */
            loadComments(id);
        },
        error: function () { alert('Materyal yüklenemedi.'); }
    });
}

/* Bir materyalin yorumlarını backend'den çeker ve modal'a yazar */
function loadComments(materialId) {
    $.ajax({
        url: 'http://localhost:3000/api/comments/' + materialId,
        method: 'GET',
        success: function (comments) {
            var list = $('#commentsList');
            if (comments.length === 0) {
                list.html('<p style="color:#888;">Henüz yorum yok. İlk yorumu sen yap!</p>');
                return;
            }
            var html = '';
            var currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            comments.forEach(function (c) {
                /* Yorum sahibi veya admin ise sil butonu gösterilir */
                var canDelete = currentUser.id === c.user_id || currentUser.role === 'admin';
                html += '<div style="padding:12px;background:#f9fafb;border-radius:8px;margin-bottom:8px;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
                html += '<strong style="color:#16a34a;">' + c.fullname + '</strong>';
                html += '<span style="font-size:12px;color:#888;">' + new Date(c.created_at).toLocaleString('tr-TR') + '</span>';
                html += '</div>';
                html += '<p style="margin:0;color:#333;">' + c.content + '</p>';
                if (canDelete) {
                    html += '<button onclick="deleteComment(' + c.id + ', ' + materialId + ')" style="margin-top:6px;padding:4px 10px;background:#fee;color:#c00;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Sil</button>';
                }
                html += '</div>';
            });
            list.html(html);
        },
        error: function () {
            $('#commentsList').html('<p style="color:#c00;">Yorumlar yüklenemedi.</p>');
        }
    });
}

/* Yeni yorum ekler - backend'e POST isteği atar */
function addComment(materialId) {
    var content = $('#newCommentInput').val().trim();
    if (!content) { alert('Yorum boş olamaz.'); return; }
    $.ajax({
        url: 'http://localhost:3000/api/comments/' + materialId,
        method: 'POST',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
        data: JSON.stringify({ content: content }),
        success: function () {
            $('#newCommentInput').val('');
            loadComments(materialId);
        },
        error: function () { alert('Yorum gönderilemedi.'); }
    });
}

/* Yorum siler - sadece yorum sahibi veya admin */
function deleteComment(commentId, materialId) {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    $.ajax({
        url: 'http://localhost:3000/api/comments/' + commentId,
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
        success: function () {
            loadComments(materialId);
        },
        error: function () { alert('Yorum silinemedi.'); }
    });
}