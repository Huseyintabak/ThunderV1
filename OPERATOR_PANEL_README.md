# Operatör Paneli - ThunderV1

## Genel Bakış

Operatör Paneli, üretim operatörlerinin kendilerine atanan işleri görüntüleyebileceği ve yönetebileceği özel bir arayüzdür. Her operatör sadece kendine atanan işleri görebilir ve işlem yapabilir.

## Özellikler

### 🔐 Güvenli Giriş Sistemi
- Ayrı login sayfası (`operator-login.html`)
- Operatör bilgileri localStorage'da saklanır
- Otomatik yönlendirme sistemi
- Güvenli çıkış işlemi

### 👤 Operatör Yönetimi
- Operatör seçimi ve bilgi görüntüleme
- Departman, seviye ve lokasyon bilgileri
- Kapasite takibi
- Giriş zamanı kaydı

### 📋 İş Yönetimi
- **Planlanan İşler**: Operatöre atanan üretim planları
- **Aktif Üretimler**: Devam eden üretim süreçleri
- **Ürün Detayları**: Sipariş ve ürün bilgileri
- **Filtreleme**: Sadece kendine atanan işler görünür

### 🔄 Real-time Güncellemeler
- WebSocket bağlantısı
- Anlık veri güncellemeleri
- Operatör durumu takibi

## Kullanım

### 1. Operatör Girişi
1. `http://localhost:3000/operator-login.html` adresine gidin
2. Operatör seçin (dropdown'dan)
3. Şifre girin (varsayılan: `123456`)
4. "Giriş Yap" butonuna tıklayın

### 2. Operatör Paneli
- Giriş yaptıktan sonra otomatik olarak operatör paneline yönlendirilirsiniz
- Sadece size atanan işleri görebilirsiniz
- Çıkış yapmak için sağ üstteki "Çıkış" butonunu kullanın

### 3. Ana Sayfadan Erişim
- Ana sayfada "Operatör Paneli" kartına tıklayın
- Veya üst menüden "Operatör Paneli" linkini kullanın

## Teknik Detaylar

### Dosya Yapısı
```
public/
├── operator-login.html      # Operatör giriş sayfası
├── operator-panel.html      # Operatör paneli ana sayfası
├── operator-panel.js        # Operatör paneli JavaScript
└── styles.css              # Ortak stiller
```

### API Endpoints
- `GET /api/operators` - Operatör listesi
- `GET /api/production-plans` - Üretim planları
- `GET /api/active-productions` - Aktif üretimler
- `GET /api/orders` - Siparişler

### Veri Saklama
- Operatör bilgileri: `localStorage.currentOperator`
- Oturum yönetimi: JavaScript ile
- Real-time bağlantı: WebSocket

## Güvenlik

### Mevcut Durum
- Basit şifre kontrolü (123456)
- localStorage tabanlı oturum
- Operatör filtreleme

### Geliştirilmesi Gerekenler
- Şifre hash'leme
- JWT token sistemi
- Veritabanı tabanlı kimlik doğrulama
- Rol tabanlı yetkilendirme

## Sorun Giderme

### Operatör Paneline Erişemiyorum
1. `operator-login.html` sayfasından giriş yapın
2. Doğru şifreyi kullandığınızdan emin olun (123456)
3. Browser'ı yenileyin (Ctrl+F5)

### İşler Görünmüyor
1. Operatöre iş atandığından emin olun
2. Console'da hata mesajlarını kontrol edin (F12)
3. API bağlantısını kontrol edin

### Çıkış Yapamıyorum
1. "Çıkış" butonuna tıklayın
2. Onay mesajında "Tamam" deyin
3. Otomatik olarak login sayfasına yönlendirileceksiniz

## Geliştirme Notları

### Yapılan İyileştirmeler
- ✅ Ayrı login sayfası oluşturuldu
- ✅ localStorage tabanlı oturum yönetimi
- ✅ Operatör filtreleme sistemi
- ✅ Güvenli çıkış işlemi
- ✅ Real-time güncellemeler
- ✅ Responsive tasarım

### Gelecek Geliştirmeler
- 🔄 Gelişmiş güvenlik sistemi
- 🔄 Operatör performans takibi
- 🔄 Bildirim sistemi
- 🔄 Mobil uygulama desteği
- 🔄 Çoklu dil desteği

## İletişim

Sorularınız için: [GitHub Issues](https://github.com/username/thunder-v1/issues)

---

**ThunderV1 - Üretim Yönetim Sistemi**  
Versiyon: 1.6.2  
Son Güncelleme: 2025-09-22

