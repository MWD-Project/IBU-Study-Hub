/* jQuery hazır olduğunda çalışır - tüm kodlar buraya yazılır */
$(document).ready(function () {

    /* ==================== RESOURCES SAYFASI ==================== */

    /* Arama kutusu - her tuşa basınca kartları filtreler */
    $('#searchInput').on('keyup', function () {
        var searchText = $(this).val().toLowerCase(); /* Yazılan metni küçük harfe çevirir */
        var selectedType = $('#filterType').val(); /* Seçili filtre türünü alır */
        filterCards(searchText, selectedType); /* Filtreleme fonksiyonunu çağırır */
    });

    /* Filtre açılır listesi - seçim değişince kartları filtreler */
    $('#filterType').on('change', function () {
        var selectedType = $(this).val(); /* Seçili türü alır */
        var searchText = $('#searchInput').val().toLowerCase(); /* Arama kutusundaki metni alır */
        filterCards(searchText, selectedType); /* Filtreleme fonksiyonunu çağırır */
    });

    /* Kartları hem arama metnine hem de türe göre filtreleyen fonksiyon */
    function filterCards(searchText, selectedType) {
        $('#resourcesGrid .card').each(function () { /* Her kartı tek tek kontrol eder */
            var cardText = $(this).text().toLowerCase(); /* Kartın tüm metnini alır */
            var cardType = $(this).data('type'); /* Kartın data-type değerini alır */

            var matchesSearch = cardText.indexOf(searchText) !== -1; /* Arama metni kartta var mı? */
            var matchesType = selectedType === 'all' || cardType === selectedType; /* Tür uyuşuyor mu? */

            if (matchesSearch && matchesType) {
                $(this).show(); /* İkisi de uyuşuyorsa kartı göster */
            } else {
                $(this).hide(); /* Uyuşmuyorsa kartı gizle */
            }
        });
    }

    /* ==================== LOGIN FORMU ==================== */

    /* Login formu gönderilince çalışır */
    $('#loginForm').on('submit', function (e) {
        e.preventDefault(); /* Sayfanın yenilenmesini engeller */

        var email = $('#email').val(); /* Email inputundaki değeri alır */
        var password = $('#password').val(); /* Şifre inputundaki değeri alır */

        /* Email veya şifre boşsa uyarı verir */
        if (email === '' || password === '') {
            alert('Please fill in all fields.'); /* Uyarı mesajı */
            return; /* Fonksiyonu durdurur */
        }

        /* Başarılı girişte dashboard sayfasına yönlendirir */
        window.location.href = 'dashboard.html'; /* Sayfa yönlendirmesi */
    });

    /* ==================== REGISTER FORMU ==================== */

    /* Register formu gönderilince çalışır */
    $('#registerForm').on('submit', function (e) {
        e.preventDefault(); /* Sayfanın yenilenmesini engeller */

        var fullname = $('#fullname').val(); /* İsim inputundaki değeri alır */
        var email = $('#email').val(); /* Email inputundaki değeri alır */
        var password = $('#password').val(); /* Şifre inputundaki değeri alır */
        var confirmPassword = $('#confirmPassword').val(); /* Şifre tekrar inputundaki değeri alır */

        /* Herhangi bir alan boşsa uyarı verir */
        if (fullname === '' || email === '' || password === '' || confirmPassword === '') {
            alert('Please fill in all fields.'); /* Uyarı mesajı */
            return; /* Fonksiyonu durdurur */
        }

        /* Şifreler uyuşmuyorsa uyarı verir */
        if (password !== confirmPassword) {
            alert('Passwords do not match.'); /* Uyarı mesajı */
            return; /* Fonksiyonu durdurur */
        }

        /* Başarılı kayıtta dashboard sayfasına yönlendirir */
        window.location.href = 'dashboard.html'; /* Sayfa yönlendirmesi */
    });

    /* ==================== UPLOAD FORMU ==================== */

    /* Upload formu gönderilince çalışır */
    $('#uploadForm').on('submit', function (e) {
        e.preventDefault(); /* Sayfanın yenilenmesini engeller */

        var title = $('#title').val(); /* Başlık inputundaki değeri alır */
        var courseCode = $('#courseCode').val(); /* Ders kodu inputundaki değeri alır */
        var type = $('#type').val(); /* Seçili materyal türünü alır */
        var file = $('#file').val(); /* Seçili dosyayı alır */

        /* Zorunlu alanlar boşsa uyarı verir */
        if (title === '' || courseCode === '' || type === '' || file === '') {
            alert('Please fill in all required fields and select a file.'); /* Uyarı mesajı */
            return; /* Fonksiyonu durdurur */
        }

        /* Başarılı yüklemede resources sayfasına yönlendirir */
        alert('Material uploaded successfully!'); /* Başarı mesajı */
        window.location.href = 'resources.html'; /* Sayfa yönlendirmesi */
    });

});