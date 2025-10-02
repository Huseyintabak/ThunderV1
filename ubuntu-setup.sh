#!/bin/bash
# ThunderV1 Ubuntu Sunucu Kurulum Scripti

echo "🚀 ThunderV1 Ubuntu Kurulum Başlatılıyor..."
echo "=========================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Hata kontrolü fonksiyonu
check_error() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Hata: $1${NC}"
        exit 1
    fi
}

# Başarı mesajı fonksiyonu
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Uyarı mesajı fonksiyonu
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Bilgi mesajı fonksiyonu
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Sistem güncellemesi
info "Sistem güncelleniyor..."
sudo apt update && sudo apt upgrade -y
check_error "Sistem güncellemesi başarısız"
success "Sistem güncellendi"

# Gerekli paketlerin kurulumu
info "Gerekli paketler kuruluyor..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
check_error "Paket kurulumu başarısız"
success "Paketler kuruldu"

# Node.js kurulumu
info "Node.js kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
check_error "Node.js kurulumu başarısız"
success "Node.js kuruldu: $(node --version)"

# PM2 kurulumu
info "PM2 kuruluyor..."
sudo npm install -g pm2
check_error "PM2 kurulumu başarısız"
success "PM2 kuruldu"

# Proje dizini oluştur
info "Proje dizini oluşturuluyor..."
sudo mkdir -p /opt/thunder-production
sudo chown $USER:$USER /opt/thunder-production
cd /opt/thunder-production
check_error "Proje dizini oluşturulamadı"

# Proje klonla
info "Proje klonlanıyor..."
git clone https://github.com/Huseyintabak/ThunderV1.git .
check_error "Proje klonlanamadı"
success "Proje klonlandı"

# Bağımlılıkları kur
info "Bağımlılıklar kuruluyor..."
npm install
check_error "Bağımlılık kurulumu başarısız"
success "Bağımlılıklar kuruldu"

# .env dosyası oluştur
info "Environment dosyası oluşturuluyor..."

# Güçlü şifreler oluştur
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your_super_secure_jwt_secret_key_here_$(date +%s)")
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your_super_secure_session_secret_key_here_$(date +%s)")

cat > .env << EOF
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
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

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
EOF

success ".env dosyası oluşturuldu"

# PM2 başlat
info "PM2 ile uygulama başlatılıyor..."
pm2 start ecosystem.config.js
check_error "PM2 başlatılamadı"

# PM2 startup konfigürasyonu
pm2 startup
warning "PM2 startup komutunu çalıştırın (yukarıdaki çıktıdaki komutu)"

pm2 save
success "PM2 başlatıldı"

# Nginx konfigürasyonu
info "Nginx konfigürasyonu oluşturuluyor..."
sudo tee /etc/nginx/sites-available/thunderv1 > /dev/null << 'EOF'
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
EOF

# Site'ı etkinleştir
sudo ln -s /etc/nginx/sites-available/thunderv1 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx konfigürasyonunu test et
sudo nginx -t
check_error "Nginx konfigürasyonu hatalı"

# Nginx'i yeniden başlat
sudo systemctl restart nginx
sudo systemctl enable nginx
success "Nginx konfigürasyonu tamamlandı"

# Firewall konfigürasyonu
info "Firewall konfigürasyonu..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
success "Firewall konfigürasyonu tamamlandı"

# Port kontrolü
info "Port 3000 kontrol ediliyor..."
if lsof -i :3000 &> /dev/null; then
    success "Port 3000 kullanımda (PM2 çalışıyor)"
else
    warning "Port 3000 kullanılmıyor"
fi

# Uygulama testi
info "Uygulama test ediliyor..."
sleep 5
if curl -s http://localhost:3000 > /dev/null; then
    success "Uygulama başarıyla çalışıyor"
else
    warning "Uygulama test edilemedi, logları kontrol edin"
fi

echo ""
echo "=========================================="
success "🎉 Kurulum başarıyla tamamlandı!"
echo "=========================================="
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
echo "   pm2 logs"
echo ""
info "📁 Proje dizini: /opt/thunder-production"
echo "📝 Log dizini: /opt/thunder-production/logs"
echo ""
warning "⚠️  PM2 startup komutunu çalıştırmayı unutmayın!"
echo ""

