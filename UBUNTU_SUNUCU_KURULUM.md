# 🚀 ThunderV1 Ubuntu Sunucu Kurulum Rehberi

## 📋 Sunucu Bilgileri
- **IP Adresi**: 192.168.1.250
- **Kullanıcı**: vipkrom@192.168.1.1
- **OS**: Ubuntu (20.04+ önerilir)

## 🎯 Kurulum Adımları

### 1. Sunucuya Bağlanma

```bash
# SSH ile sunucuya bağlan
ssh vipkrom@192.168.1.250

# Veya eğer farklı port kullanıyorsa
ssh -p 22 vipkrom@192.168.1.250
```

### 2. Sistem Güncelleme

```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Gerekli paketlerin kurulumu
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
```

### 3. Node.js Kurulumu

```bash
# Node.js 20.x kurulumu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Versiyon kontrolü
node --version
npm --version
```

### 4. PM2 Kurulumu

```bash
# PM2 kurulumu
sudo npm install -g pm2

# PM2'yi sistem başlangıcında otomatik başlat
pm2 startup
# Çıktıdaki komutu çalıştır (sudo ile)

# PM2'yi kaydet
pm2 save
```

### 5. Proje İndirme

```bash
# Proje dizinine git
cd /opt
sudo mkdir -p thunder-production
sudo chown $USER:$USER thunder-production
cd thunder-production

# GitHub'dan projeyi klonla
git clone https://github.com/Huseyintabak/ThunderV1.git .

# Bağımlılıkları kur
npm install
```

### 6. Environment Variables Ayarlama

```bash
# .env dosyası oluştur
nano .env
```

**`.env` dosyası içeriği:**
```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=3000
NODE_ENV=production
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

### 7. PM2 Konfigürasyonu

```bash
# PM2 ecosystem dosyasını kullan
pm2 start ecosystem.config.js

# PM2 durumunu kontrol et
pm2 status

# PM2 loglarını görüntüle
pm2 logs
```

### 8. Nginx Konfigürasyonu

```bash
# Nginx konfigürasyon dosyasını oluştur
sudo nano /etc/nginx/sites-available/thunderv1
```

**Nginx konfigürasyonu:**
```nginx
server {
    listen 80;
    server_name 192.168.1.250;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static dosyalar için cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Site'ı etkinleştir
sudo ln -s /etc/nginx/sites-available/thunderv1 /etc/nginx/sites-enabled/

# Default site'ı devre dışı bırak
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx konfigürasyonunu test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 9. Firewall Konfigürasyonu

```bash
# UFW firewall'u etkinleştir
sudo ufw enable

# Gerekli portları aç
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000

# Firewall durumunu kontrol et
sudo ufw status
```

### 10. SSL Sertifikası (Opsiyonel)

```bash
# Let's Encrypt ile SSL sertifikası al
sudo certbot --nginx -d 192.168.1.250

# Otomatik yenileme test et
sudo certbot renew --dry-run
```

## 🔍 Sistem Kontrolleri

### 1. Servis Durumları

```bash
# PM2 durumu
pm2 status

# Nginx durumu
sudo systemctl status nginx

# Port kullanımı
sudo netstat -tlnp | grep :3000
```

### 2. Log Kontrolleri

```bash
# PM2 logları
pm2 logs

# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Sistem logları
sudo journalctl -u nginx -f
```

### 3. Uygulama Testi

```bash
# Yerel test
curl http://localhost:3000

# Dış erişim testi
curl http://192.168.1.250
```

## 🛠️ Sorun Giderme

### Yaygın Sorunlar

**1. Port 3000 kullanımda:**
```bash
# Port kullanımını kontrol et
sudo lsof -i :3000

# Process'i sonlandır
sudo kill -9 PID
```

**2. Nginx 502 hatası:**
```bash
# PM2 durumunu kontrol et
pm2 status

# PM2'yi yeniden başlat
pm2 restart ecosystem.config.js
```

**3. Permission hatası:**
```bash
# Dosya izinlerini düzelt
sudo chown -R $USER:$USER /opt/thunder-production
sudo chmod -R 755 /opt/thunder-production
```

**4. Supabase bağlantı hatası:**
```bash
# Environment variables kontrol et
cat .env

# Supabase URL'ini test et
curl -X GET "https://beynxlogttkrrkejvftz.supabase.co/rest/v1/"
```

## 🚀 Otomatik Kurulum Scripti

```bash
#!/bin/bash
# ubuntu-setup.sh

echo "🚀 ThunderV1 Ubuntu Kurulum Başlatılıyor..."

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Sistem güncellemesi
info "Sistem güncelleniyor..."
sudo apt update && sudo apt upgrade -y
success "Sistem güncellendi"

# Gerekli paketlerin kurulumu
info "Gerekli paketler kuruluyor..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
success "Paketler kuruldu"

# Node.js kurulumu
info "Node.js kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
success "Node.js kuruldu: $(node --version)"

# PM2 kurulumu
info "PM2 kuruluyor..."
sudo npm install -g pm2
success "PM2 kuruldu"

# Proje dizini oluştur
info "Proje dizini oluşturuluyor..."
sudo mkdir -p /opt/thunder-production
sudo chown $USER:$USER /opt/thunder-production
cd /opt/thunder-production

# Proje klonla
info "Proje klonlanıyor..."
git clone https://github.com/Huseyintabak/ThunderV1.git .
success "Proje klonlandı"

# Bağımlılıkları kur
info "Bağımlılıklar kuruluyor..."
npm install
success "Bağımlılıklar kuruldu"

# .env dosyası oluştur
info "Environment dosyası oluşturuluyor..."
cat > .env << EOF
PORT=3000
NODE_ENV=production
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
success ".env dosyası oluşturuldu"

# PM2 başlat
info "PM2 ile uygulama başlatılıyor..."
pm2 start ecosystem.config.js
pm2 startup
pm2 save
success "PM2 başlatıldı"

# Nginx konfigürasyonu
info "Nginx konfigürasyonu oluşturuluyor..."
sudo tee /etc/nginx/sites-available/thunderv1 > /dev/null << EOF
server {
    listen 80;
    server_name 192.168.1.250;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/thunderv1 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
success "Nginx konfigürasyonu tamamlandı"

# Firewall konfigürasyonu
info "Firewall konfigürasyonu..."
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
success "Firewall konfigürasyonu tamamlandı"

echo ""
echo "=================================="
success "🎉 Kurulum başarıyla tamamlandı!"
echo "=================================="
echo ""
info "📋 Yapmanız gerekenler:"
echo "1. Supabase Dashboard'dan SERVICE_ROLE_KEY alın"
echo "2. .env dosyasında SUPABASE_SERVICE_ROLE_KEY değerini güncelleyin"
echo "3. PM2'yi yeniden başlatın: pm2 restart ecosystem.config.js"
echo "4. http://192.168.1.250 adresinde uygulamayı açın"
echo ""
info "🔧 Kontrol komutları:"
echo "   pm2 status"
echo "   sudo systemctl status nginx"
echo "   curl http://192.168.1.250"
echo ""
```

## 📊 Erişim Bilgileri

- **Uygulama URL**: http://192.168.1.250
- **SSH Erişim**: ssh vipkrom@192.168.1.250
- **Proje Dizini**: /opt/thunder-production
- **Log Dizini**: /opt/thunder-production/logs

## 🔧 Bakım Komutları

```bash
# Uygulamayı yeniden başlat
pm2 restart ecosystem.config.js

# Logları görüntüle
pm2 logs

# Nginx'i yeniden başlat
sudo systemctl restart nginx

# Sistem durumunu kontrol et
pm2 status
sudo systemctl status nginx
```

---

**🎯 ThunderV1 Ubuntu Sunucu Kurulumu - Tamamlandı!**

*Sisteminiz http://192.168.1.250 adresinde çalışmaya hazır!*
