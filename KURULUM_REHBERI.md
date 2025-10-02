# 🚀 ThunderV1 Kurulum Rehberi v1.6.6

## 📋 Genel Bakış

Bu rehber, ThunderV1 üretim yönetim sistemini GitHub'dan alıp yerel ortamda kurmak için gerekli tüm adımları içerir.

## 🎯 Sistem Gereksinimleri

### Minimum Gereksinimler
- **OS**: macOS, Windows, Linux
- **Node.js**: v18+ (LTS önerilir)
- **NPM**: v8+
- **Git**: Proje klonlama için
- **RAM**: 2GB (4GB önerilir)
- **Disk**: 1GB boş alan

### Önerilen Gereksinimler
- **OS**: macOS 12+, Windows 10+, Ubuntu 20.04+
- **Node.js**: v20 LTS
- **NPM**: v10+
- **RAM**: 8GB
- **Disk**: 5GB SSD

## 🔧 Kurulum Adımları

### 1. Sistem Hazırlığı

#### macOS için:
```bash
# Homebrew kurulumu (eğer yoksa)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js kurulumu
brew install node

# Git kurulumu (eğer yoksa)
brew install git
```

#### Windows için:
```bash
# Node.js'i https://nodejs.org adresinden indirin
# Git'i https://git-scm.com adresinden indirin
```

#### Linux (Ubuntu/Debian) için:
```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Node.js 20.x kurulumu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git kurulumu
sudo apt install git -y
```

### 2. Proje İndirme

```bash
# Proje dizinine git
cd ~/Desktop

# GitHub'dan projeyi klonla
git clone https://github.com/Huseyintabak/ThunderV1.git
cd ThunderV1

# Proje durumunu kontrol et
git status
```

### 3. Bağımlılıkları Kurma

```bash
# NPM versiyonunu kontrol et
npm --version

# Bağımlılıkları kur
npm install

# Kurulumu doğrula
npm list --depth=0
```

### 4. Environment Variables Ayarlama

```bash
# .env dosyası oluştur
touch .env

# .env dosyasını düzenle
nano .env
```

**`.env` dosyası içeriği:**
```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=3000
NODE_ENV=development
HOST=0.0.0.0

# ===========================================
# SUPABASE CONFIGURATION (Gerçek Değerler)
# ===========================================
SUPABASE_URL=https://beynxlogttkrrkejvftz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleW54bG9ndHRrcnJrZWp2ZnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODk5MDcsImV4cCI6MjA3MzA2NTkwN30.04vv-EjQd92MtrprRAtpeEtEYQRjizMmC8I9e885miE

# Supabase Service Role Key (Supabase Dashboard'dan alın)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
# Güçlü şifreler oluşturun
JWT_SECRET=your_super_secure_jwt_secret_key_here_2024
SESSION_SECRET=your_super_secure_session_secret_key_here_2024

# ===========================================
# DATABASE CONFIGURATION (Opsiyonel)
# ===========================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thunder_production
DB_USER=thunder_user
DB_PASSWORD=your_secure_db_password

# ===========================================
# FEATURE FLAGS
# ===========================================
ENABLE_REAL_TIME=true
ENABLE_NOTIFICATIONS=true
ENABLE_AUDIT_LOG=true
DEBUG=false
```

### 5. Supabase Service Role Key Alma

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. **Projenizi seçin**: `beynxlogttkrrkejvftz`
3. **Settings → API** bölümüne gidin
4. **service_role** key'ini kopyalayın
5. **.env dosyasında** `SUPABASE_SERVICE_ROLE_KEY` değerini güncelleyin

### 6. Güvenlik Anahtarları Oluşturma

```bash
# Terminal'de güçlü şifreler oluştur
openssl rand -base64 32
openssl rand -base64 32

# Bu çıktıları .env dosyasında JWT_SECRET ve SESSION_SECRET olarak kullanın
```

### 7. Veritabanı Kurulumu

```bash
# Supabase setup scriptini çalıştır
node setup_supabase.js

# Veya manuel olarak SQL scriptlerini çalıştır
# Supabase Dashboard → SQL Editor'da şu dosyaları sırayla çalıştır:
# 1. setup_complete_database_fixed.sql
# 2. create_production_planning_tables.sql
# 3. create_production_stages_tables.sql
# 4. create_quality_control_tables.sql
# 5. create_notification_system_tables.sql
# 6. create_reporting_analytics_tables.sql
```

### 8. Uygulamayı Başlatma

```bash
# Development modunda başlat
npm run dev

# Veya production modunda başlat
npm start

# Uygulama http://localhost:3000 adresinde çalışacak
```

### 9. Tarayıcıda Test Etme

```bash
# macOS'ta tarayıcıda aç
open http://localhost:3000

# Windows'ta
start http://localhost:3000

# Linux'ta
xdg-open http://localhost:3000
```

## 🛠️ Hızlı Kurulum Scripti

Otomatik kurulum için aşağıdaki scripti kullanabilirsiniz:

```bash
#!/bin/bash
# quick-setup.sh

echo "🚀 ThunderV1 Kurulum Başlatılıyor..."

# Proje dizinine git
cd ~/Desktop/ThunderV1

# Bağımlılıkları kur
echo "📦 Bağımlılıklar kuruluyor..."
npm install

# .env dosyası oluştur
echo "⚙️ Environment dosyası oluşturuluyor..."
cat > .env << EOF
PORT=3000
NODE_ENV=development
HOST=0.0.0.0
SUPABASE_URL=https://beynxlogttkrrkejvftz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleW54bG9ndHRrcnJrZWp2ZnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODk5MDcsImV4cCI6MjA3MzA2NTkwN30.04vv-EjQd92MtrprRAtpeEtEYQRjizMmC8I9e885miE
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENABLE_REAL_TIME=true
ENABLE_NOTIFICATIONS=true
ENABLE_AUDIT_LOG=true
DEBUG=false
EOF

echo "✅ Kurulum tamamlandı!"
echo "🔧 .env dosyasını düzenleyip SUPABASE_SERVICE_ROLE_KEY değerini ekleyin"
echo "🚀 'npm start' komutu ile uygulamayı başlatın"
```

## 🔍 Kurulum Doğrulama

### 1. Sistem Kontrolleri

```bash
# Node.js versiyonu
node --version

# NPM versiyonu
npm --version

# Git versiyonu
git --version

# Proje bağımlılıkları
npm list --depth=0
```

### 2. Uygulama Kontrolleri

```bash
# Port kullanımını kontrol et
lsof -i :3000

# Uygulama loglarını kontrol et
npm start

# Tarayıcıda test et
curl http://localhost:3000
```

## 🛠️ Sorun Giderme

### Yaygın Sorunlar

**1. Port 3000 kullanımda:**
```bash
# Port kullanımını kontrol et
lsof -i :3000

# Process'i sonlandır
kill -9 PID

# Veya farklı port kullan
PORT=3001 npm start
```

**2. NPM install hatası:**
```bash
# Cache temizle
npm cache clean --force

# node_modules sil ve yeniden kur
rm -rf node_modules package-lock.json
npm install
```

**3. Supabase bağlantı hatası:**
```bash
# Environment variables kontrol et
cat .env

# Supabase URL'ini test et
curl -X GET "https://beynxlogttkrrkejvftz.supabase.co/rest/v1/"
```

**4. Veritabanı tabloları eksik:**
```bash
# SQL scriptlerini manuel çalıştır
# Supabase Dashboard → SQL Editor'da:
# setup_complete_database_fixed.sql dosyasını çalıştır
```

**5. Permission hatası (macOS/Linux):**
```bash
# Dosya izinlerini düzelt
chmod +x *.sh
sudo chown -R $USER:$USER .
```

## 📊 Sistem Özellikleri

### Ana Modüller
- 🏭 **Üretim Yönetimi**: Hammadde → Yarı Mamul → Nihai Ürün
- 📱 **Barkod Sistemi**: Otomatik barkod okutma ve doğrulama
- 👥 **Operatör Paneli**: Gerçek zamanlı operatör takibi
- 📊 **Raporlama**: Kapsamlı üretim raporları
- 🔔 **Bildirim Sistemi**: Real-time uyarılar
- 📈 **Dashboard**: Modern anasayfa ve KPI'lar

### Teknoloji Stack
- **Backend**: Node.js + Express.js
- **Frontend**: HTML5 + CSS3 + JavaScript ES6+
- **Veritabanı**: PostgreSQL (Supabase)
- **Real-time**: WebSocket
- **UI Framework**: Bootstrap 5

## 🚀 Sonraki Adımlar

1. **Supabase Service Role Key** ekleyin
2. **Veritabanı tablolarını** oluşturun
3. **Uygulamayı başlatın** ve test edin
4. **Operatörleri ekleyin** ve sistemi kullanmaya başlayın

## 📞 Destek

- **GitHub Issues**: https://github.com/Huseyintabak/ThunderV1/issues
- **Documentation**: README.md ve bu rehber
- **Logs**: Terminal çıktısı veya `npm start` logları

---

**🎯 ThunderV1 v1.6.6 - Üretim Yönetim Sistemi**

*Bu rehber ile sisteminiz yerel ortamda çalışmaya hazır!*
