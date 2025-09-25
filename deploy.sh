#!/bin/bash

# ThunderV1 Production Deployment Script
# Kullanım: ./deploy.sh

set -e

echo "🚀 ThunderV1 Production Deployment Başlatılıyor..."

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log fonksiyonu
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# 1. Git pull
log "Git repository güncelleniyor..."
git pull origin main || error "Git pull başarısız"

# 2. Dependencies güncelle
log "Dependencies güncelleniyor..."
npm install --production || error "npm install başarısız"

# 3. Log dizini oluştur
log "Log dizini oluşturuluyor..."
mkdir -p logs

# 4. Environment dosyası kontrolü
if [ ! -f .env ]; then
    warning ".env dosyası bulunamadı, production.env.example kopyalanıyor..."
    cp production.env.example .env
    warning "Lütfen .env dosyasını düzenleyin!"
fi

# 5. PM2 ile restart
log "PM2 ile uygulama yeniden başlatılıyor..."
pm2 restart ecosystem.config.js --env production || error "PM2 restart başarısız"

# 6. Health check
log "Health check yapılıyor..."
sleep 5
curl -f http://localhost:3000/api/health || error "Health check başarısız"

# 7. Nginx reload
log "Nginx yeniden yükleniyor..."
sudo nginx -t && sudo systemctl reload nginx || error "Nginx reload başarısız"

# 8. Status kontrolü
log "Deployment tamamlandı! Durum kontrolü:"
pm2 status
pm2 logs thunderv1 --lines 10

echo ""
log "✅ Deployment başarıyla tamamlandı!"
log "🌐 Uygulama: http://your-server-ip"
log "📊 PM2 Monitor: pm2 monit"
log "📋 Loglar: pm2 logs thunderv1"
