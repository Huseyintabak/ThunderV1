#!/bin/bash

# ThunderV1 Production Deployment Script
# Bu script Ubuntu sunucuda otomatik deployment için kullanılır

set -e  # Hata durumunda scripti durdur

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log fonksiyonu
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Başlık
echo -e "${BLUE}"
echo "=========================================="
echo "🚀 ThunderV1 Production Deployment Script"
echo "=========================================="
echo -e "${NC}"

# Root kontrolü
if [[ $EUID -eq 0 ]]; then
   error "Bu script root olarak çalıştırılmamalı. Normal kullanıcı olarak çalıştırın."
fi

# Sistem güncellemesi
log "Sistem güncelleniyor..."
sudo apt update && sudo apt upgrade -y

# Gerekli paketlerin kurulumu
log "Gerekli paketler kuruluyor..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx htop unzip

# Node.js kurulumu
if ! command -v node &> /dev/null; then
    log "Node.js kuruluyor..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    info "Node.js zaten kurulu: $(node --version)"
fi

# PM2 kurulumu
if ! command -v pm2 &> /dev/null; then
    log "PM2 kuruluyor..."
    sudo npm install -g pm2
else
    info "PM2 zaten kurulu: $(pm2 --version)"
fi

# Proje dizini oluşturma
PROJECT_DIR="/opt/thunder-production"
log "Proje dizini oluşturuluyor: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
fi

cd $PROJECT_DIR

# Git repository kontrolü
if [ ! -d ".git" ]; then
    log "Git repository klonlanıyor..."
    git clone https://github.com/Huseyintabak/ThunderV1.git .
else
    log "Git repository güncelleniyor..."
    git pull origin main
fi

# NPM paketlerini kurma
log "NPM paketleri kuruluyor..."
npm install --production

# Environment dosyası kontrolü
if [ ! -f ".env" ]; then
    warning "Environment dosyası bulunamadı!"
    if [ -f "production.env.example" ]; then
        log "Örnek environment dosyası kopyalanıyor..."
        cp production.env.example .env
        warning "Lütfen .env dosyasını düzenleyin ve gerekli değerleri girin!"
        warning "Özellikle SUPABASE_URL, SUPABASE_ANON_KEY ve SUPABASE_SERVICE_ROLE_KEY değerlerini güncelleyin!"
        echo ""
        echo "Örnek:"
        echo "nano .env"
        echo ""
        read -p "Environment dosyasını düzenledikten sonra Enter'a basın..."
    else
        error "production.env.example dosyası bulunamadı!"
    fi
fi

# PM2 konfigürasyonu
log "PM2 konfigürasyonu yapılıyor..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
    pm2 save
    log "PM2 startup konfigürasyonu yapılıyor..."
    sudo pm2 startup
    log "PM2 startup komutu çalıştırıldı. Sistem yeniden başlatıldığında uygulama otomatik başlayacak."
else
    warning "ecosystem.config.js bulunamadı, basit PM2 konfigürasyonu kullanılıyor..."
    pm2 start server.js --name thunder-production --env production
    pm2 save
    log "PM2 startup konfigürasyonu yapılıyor..."
    sudo pm2 startup
    log "PM2 startup komutu çalıştırıldı. Sistem yeniden başlatıldığında uygulama otomatik başlayacak."
fi

# Nginx konfigürasyonu
log "Nginx konfigürasyonu yapılıyor..."
if [ -f "nginx-thunderv1.conf" ]; then
    sudo cp nginx-thunderv1.conf /etc/nginx/sites-available/thunderv1
    sudo ln -sf /etc/nginx/sites-available/thunderv1 /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
else
    warning "nginx-thunderv1.conf bulunamadı!"
fi

# Nginx konfigürasyon testi
log "Nginx konfigürasyonu test ediliyor..."
if sudo nginx -t; then
    log "Nginx konfigürasyonu başarılı!"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
else
    error "Nginx konfigürasyon hatası!"
fi

# Firewall konfigürasyonu
log "Firewall konfigürasyonu yapılıyor..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000

# Log dizini oluşturma
log "Log dizinleri oluşturuluyor..."
sudo mkdir -p /var/log/thunder-production
sudo chown $USER:$USER /var/log/thunder-production

# SSL sertifikası kurulumu
echo ""
info "SSL sertifikası kurulumu için domain adınızı girin:"
read -p "Domain (örn: yourdomain.com): " DOMAIN

if [ ! -z "$DOMAIN" ]; then
    log "SSL sertifikası kuruluyor: $DOMAIN"
    
    # Nginx konfigürasyonunda domain güncelleme
    sudo sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/thunderv1
    
    # SSL sertifikası alma
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Nginx yeniden başlatma
    sudo systemctl restart nginx
    
    log "SSL sertifikası başarıyla kuruldu!"
else
    warning "Domain girilmedi, SSL sertifikası kurulmadı!"
fi

# Sistem durumu kontrolü
log "Sistem durumu kontrol ediliyor..."
echo ""
echo "=== PM2 Durumu ==="
pm2 status

echo ""
echo "=== Nginx Durumu ==="
sudo systemctl status nginx --no-pager -l

echo ""
echo "=== Firewall Durumu ==="
sudo ufw status

echo ""
echo "=== Disk Kullanımı ==="
df -h

echo ""
echo "=== Bellek Kullanımı ==="
free -h

# Başarı mesajı
echo ""
echo -e "${GREEN}"
echo "=========================================="
echo "✅ Deployment Başarıyla Tamamlandı!"
echo "=========================================="
echo -e "${NC}"

echo ""
info "Önemli Bilgiler:"
echo "• Proje dizini: $PROJECT_DIR"
echo "• PM2 durumu: pm2 status"
echo "• PM2 logları: pm2 logs"
echo "• Nginx durumu: sudo systemctl status nginx"
echo "• Nginx logları: sudo tail -f /var/log/nginx/error.log"

if [ ! -z "$DOMAIN" ]; then
    echo "• Web sitesi: https://$DOMAIN"
else
    echo "• Web sitesi: http://$(curl -s ifconfig.me):3000"
fi

echo ""
warning "Sonraki Adımlar:"
echo "1. .env dosyasını kontrol edin ve gerekli değerleri girin"
echo "2. Supabase konfigürasyonunu yapın"
echo "3. SSL sertifikası kurulumunu tamamlayın (eğer yapılmadıysa)"
echo "4. Backup stratejisi oluşturun"
echo "5. Monitoring araçları kurun"

echo ""
info "Destek için:"
echo "• GitHub: https://github.com/Huseyintabak/ThunderV1"
echo "• Dokümantasyon: PRODUCTION_DEPLOYMENT_GUIDE.md"

echo ""
log "Deployment tamamlandı! 🎉"