# ThunderV1 - Üretim Yönetim Sistemi v1.5.0

## Proje Açıklaması

ThunderV1, hammadde ve üretim yönetimi için geliştirilmiş kapsamlı bir web uygulamasıdır. Sistem, hammaddelerden yarı mamul ürünler ve yarı mamullerden nihai ürünler üretme süreçlerini yönetir.

## 🚀 V1.5.0 Yenilikleri
- ✅ **Barkod Yönetimi**: Hammadde, yarı mamul ve nihai ürünlerde barkod desteği
- ✅ **CSV Import/Export**: Toplu veri yükleme ve dışa aktarma
- ✅ **Stok Yönetimi**: Gelişmiş stok takip ve raporlama
- ✅ **Üretim Yönetimi**: Aktif üretim takibi ve kontrolü
- ✅ **Dashboard**: Modern anasayfa ve hızlı erişim

## Özellikler

### 🏭 Üretim Yönetimi
- **Hammadde → Yarı Mamul Üretimi**: Hammaddelerden yarı mamul ürünler üretme
- **Yarı Mamul → Nihai Ürün Üretimi**: Yarı mamullerden nihai ürünler üretme
- **Malzeme Hesaplama**: Üretim için gerekli malzemelerin otomatik hesaplanması
- **Stok Kontrolü**: Üretim öncesi stok yeterliliği kontrolü

### 📱 Barkod Okutma Sistemi
- **Otomatik Barkod Okutma**: 8+ karakter yazıldığında otomatik okutma
- **Barkod Doğrulama**: Ürün barkodlarının doğrulanması
- **Gerçek Zamanlı Takip**: Üretim ilerlemesinin anlık takibi
- **Hata Yönetimi**: Hatalı barkod okutmalarının yönetimi

### 📊 Üretim Geçmişi
- **Detaylı Kayıt**: Tüm üretim süreçlerinin kaydedilmesi
- **İstatistik Kartları**: Toplam üretim, tamamlanan, devam eden, maliyet
- **Filtreleme**: Ürün, tip, durum bazında filtreleme
- **Arama**: Ürün adı ve kodu ile arama
- **Detaylı Görüntüleme**: Üretim detayları ve barkod geçmişi

### 🗄️ Veri Yönetimi
- **Hammadde Yönetimi**: Hammadde ekleme, düzenleme, silme
- **Yarı Mamul Yönetimi**: Yarı mamul ürün yönetimi
- **Nihai Ürün Yönetimi**: Nihai ürün yönetimi
- **Ürün Ağacı**: Ürünler arası ilişki yönetimi
- **Maliyet Hesaplama**: BOM (Bill of Materials) maliyet hesaplama

## Teknoloji Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Supabase**: Veritabanı ve API servisi

### Frontend
- **HTML5**: Markup dili
- **CSS3**: Styling
- **JavaScript (ES6+)**: Client-side logic
- **Bootstrap 5**: CSS framework
- **Font Awesome**: Icon library

### Veritabanı
- **PostgreSQL**: Ana veritabanı (Supabase)
- **Tablo Yapısı**:
  - `hammaddeler`: Hammadde bilgileri
  - `yarimamuller`: Yarı mamul ürün bilgileri
  - `nihai_urunler`: Nihai ürün bilgileri
  - `urun_agaci`: Ürün ağacı (BOM) ilişkileri
  - `work_orders`: İş emirleri

## Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn
- Supabase hesabı

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/yourusername/ThunderV1.git
cd ThunderV1
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment değişkenlerini ayarlayın**
```bash
cp config.js.example config.js
# config.js dosyasını düzenleyin
```

4. **Uygulamayı başlatın**
```bash
npm start
```

5. **Tarayıcıda açın**
```
http://localhost:3000
```

## Kullanım

### 1. Hammadde Yönetimi
- Ana sayfada "Hammaddeler" sekmesine gidin
- Yeni hammadde ekleyin veya mevcut hammaddeleri düzenleyin

### 2. Ürün Ağacı Oluşturma
- "Ürün Ağacı" sekmesinde ürünler arası ilişkileri tanımlayın
- Hangi hammaddelerden hangi yarı mamullerin üretileceğini belirleyin

### 3. Üretim Başlatma
- "Üretim Yönetimi" sayfasına gidin
- Üretim tipini seçin (Hammadde → Yarı Mamul veya Yarı Mamul → Nihai Ürün)
- Ürün ve miktar seçin
- Malzeme kontrolü yapın
- Barkod okutma sistemi ile üretimi başlatın

### 4. Barkod Okutma
- Barkod okuyucu ile veya manuel olarak barkod girin
- Sistem otomatik olarak doğrulama yapar
- Üretim ilerlemesi gerçek zamanlı güncellenir

### 5. Üretim Takibi
- "Üretim Geçmişi" bölümünde tüm üretimleri görüntüleyin
- Filtreleme ve arama ile istediğiniz üretimleri bulun
- Detaylı görüntüleme ile üretim bilgilerini inceleyin

## API Endpoints

### Hammaddeler
- `GET /api/hammaddeler` - Tüm hammaddeleri getir
- `POST /api/hammaddeler` - Yeni hammadde ekle
- `PUT /api/hammaddeler/:id` - Hammadde güncelle
- `DELETE /api/hammaddeler/:id` - Hammadde sil

### Yarı Mamuller
- `GET /api/yarimamuller` - Tüm yarı mamulleri getir
- `POST /api/yarimamuller` - Yeni yarı mamul ekle
- `PUT /api/yarimamuller/:id` - Yarı mamul güncelle
- `DELETE /api/yarimamuller/:id` - Yarı mamul sil

### Nihai Ürünler
- `GET /api/nihai_urunler` - Tüm nihai ürünleri getir
- `POST /api/nihai_urunler` - Yeni nihai ürün ekle
- `PUT /api/nihai_urunler/:id` - Nihai ürün güncelle
- `DELETE /api/nihai_urunler/:id` - Nihai ürün sil

### Ürün Ağacı
- `GET /api/urun_agaci` - Ürün ağacını getir
- `POST /api/urun_agaci` - Yeni ürün ağacı ilişkisi ekle
- `PUT /api/urun_agaci/:id` - Ürün ağacı ilişkisini güncelle
- `DELETE /api/urun_agaci/:id` - Ürün ağacı ilişkisini sil

### Maliyet Hesaplama
- `POST /api/calculate-bom-cost` - BOM maliyet hesaplama

## Veritabanı Şeması

### Hammaddeler Tablosu
```sql
CREATE TABLE hammaddeler (
    id SERIAL PRIMARY KEY,
    kod VARCHAR(50) UNIQUE NOT NULL,
    ad VARCHAR(255) NOT NULL,
    miktar DECIMAL(10,2) DEFAULT 0,
    birim VARCHAR(20) NOT NULL,
    birim_fiyat DECIMAL(10,2) DEFAULT 0,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Yarı Mamuller Tablosu
```sql
CREATE TABLE yarimamuller (
    id SERIAL PRIMARY KEY,
    kod VARCHAR(50) UNIQUE NOT NULL,
    ad VARCHAR(255) NOT NULL,
    miktar DECIMAL(10,2) DEFAULT 0,
    birim VARCHAR(20) NOT NULL,
    birim_maliyet DECIMAL(10,2) DEFAULT 0,
    barkod VARCHAR(100),
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Nihai Ürünler Tablosu
```sql
CREATE TABLE nihai_urunler (
    id SERIAL PRIMARY KEY,
    kod VARCHAR(50) UNIQUE NOT NULL,
    ad VARCHAR(255) NOT NULL,
    miktar DECIMAL(10,2) DEFAULT 0,
    birim VARCHAR(20) NOT NULL,
    birim_maliyet DECIMAL(10,2) DEFAULT 0,
    barkod VARCHAR(100),
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Ürün Ağacı Tablosu
```sql
CREATE TABLE urun_agaci (
    id SERIAL PRIMARY KEY,
    ana_urun_id INTEGER NOT NULL,
    ana_urun_tipi VARCHAR(20) NOT NULL,
    alt_urun_id INTEGER NOT NULL,
    alt_urun_tipi VARCHAR(20) NOT NULL,
    gerekli_miktar DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Geliştirme

### Proje Yapısı
```
ThunderV1/
├── public/
│   ├── index.html          # Ana sayfa
│   ├── production.html     # Üretim yönetimi sayfası
│   ├── script.js          # Ana JavaScript dosyası
│   ├── production.js      # Üretim yönetimi JavaScript
│   └── styles.css         # CSS stilleri
├── server.js              # Express server
├── config.js              # Konfigürasyon
├── package.json           # NPM bağımlılıkları
└── README.md              # Bu dosya
```

### Katkıda Bulunma
1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## Versiyon Geçmişi

### v1.0.0 (2024-12-19)
- İlk sürüm
- Hammadde yönetimi
- Yarı mamul yönetimi
- Nihai ürün yönetimi
- Ürün ağacı yönetimi
- Üretim yönetimi
- Barkod okutma sistemi
- Üretim geçmişi takibi
- Filtreleme ve arama
- İstatistik kartları

## İletişim

Proje hakkında sorularınız için issue açabilir veya iletişime geçebilirsiniz.

---

**ThunderV1** - Hammadde ve Üretim Yönetim Sistemi