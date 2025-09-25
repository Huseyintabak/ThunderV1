#!/bin/bash

# ThunderV1 SSL Certificate Setup Script
# Bu script Let's Encrypt SSL sertifikası kurmak için kullanılır

set -e

# Renkli output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Domain parametresi kontrolü
if [ -z "$1" ]; then
    error "Kullanım: $0 <domain> [email]"
    echo "Örnek: $0 yourdomain.com admin@yourdomain.com"
fi

DOMAIN=$1
EMAIL=${2:-admin@$DOMAIN}

echo -e "${BLUE}"
echo "=========================================="
echo "🔒 SSL Certificate Setup Script"
echo "=========================================="
echo -e "${NC}"

log "Domain: $DOMAIN"
log "Email: $EMAIL"

# Certbot kurulumu
log "Certbot kuruluyor..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Nginx durumu kontrolü
log "Nginx durumu kontrol ediliyor..."
if ! sudo systemctl is-active --quiet nginx; then
    log "Nginx başlatılıyor..."
    sudo systemctl start nginx
fi

# Domain DNS kontrolü
log "Domain DNS kontrolü yapılıyor..."
DOMAIN_IP=$(dig +short $DOMAIN)
SERVER_IP=$(curl -s ifconfig.me)

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    warning "Domain IP ($DOMAIN_IP) sunucu IP ($SERVER_IP) ile eşleşmiyor!"
    warning "DNS kayıtlarını kontrol edin ve domain'in sunucu IP'sine yönlendirildiğinden emin olun."
    read -p "Devam etmek istiyor musunuz? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Nginx konfigürasyonu güncelleme
log "Nginx konfigürasyonu güncelleniyor..."
if [ -f "/etc/nginx/sites-available/thunderv1" ]; then
    sudo sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/thunderv1
    sudo sed -i "s/www.yourdomain.com/www.$DOMAIN/g" /etc/nginx/sites-available/thunderv1
    
    # Nginx konfigürasyon testi
    if sudo nginx -t; then
        log "Nginx konfigürasyonu başarılı!"
        sudo systemctl reload nginx
    else
        error "Nginx konfigürasyon hatası!"
    fi
else
    warning "Nginx konfigürasyon dosyası bulunamadı: /etc/nginx/sites-available/thunderv1"
fi

# SSL sertifikası alma
log "SSL sertifikası alınıyor..."
sudo certbot --nginx \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect

# SSL sertifikası kontrolü
log "SSL sertifikası kontrol ediliyor..."
if sudo certbot certificates | grep -q "$DOMAIN"; then
    log "SSL sertifikası başarıyla kuruldu!"
    
    # Sertifika detayları
    echo ""
    info "Sertifika Detayları:"
    sudo certbot certificates | grep -A 10 "$DOMAIN"
    
    # Otomatik yenileme kontrolü
    log "Otomatik yenileme test ediliyor..."
    if sudo certbot renew --dry-run; then
        log "Otomatik yenileme başarılı!"
    else
        warning "Otomatik yenileme testi başarısız!"
    fi
    
else
    error "SSL sertifikası kurulumu başarısız!"
fi

# Nginx yeniden başlatma
log "Nginx yeniden başlatılıyor..."
sudo systemctl restart nginx

# SSL test
log "SSL bağlantısı test ediliyor..."
if curl -s -I https://$DOMAIN | grep -q "200 OK"; then
    log "SSL bağlantısı başarılı!"
else
    warning "SSL bağlantısı test edilemedi!"
fi

# Güvenlik başlıkları kontrolü
log "Güvenlik başlıkları kontrol ediliyor..."
SSL_TEST=$(curl -s -I https://$DOMAIN)

if echo "$SSL_TEST" | grep -q "Strict-Transport-Security"; then
    log "HSTS başlığı aktif!"
else
    warning "HSTS başlığı bulunamadı!"
fi

# Başarı mesajı
echo ""
echo -e "${GREEN}"
echo "=========================================="
echo "✅ SSL Certificate Setup Tamamlandı!"
echo "=========================================="
echo -e "${NC}"

echo ""
info "SSL Sertifikası Bilgileri:"
echo "• Domain: https://$DOMAIN"
echo "• WWW: https://www.$DOMAIN"
echo "• Sertifika yolu: /etc/letsencrypt/live/$DOMAIN/"
echo "• Otomatik yenileme: Aktif"

echo ""
info "Test Komutları:"
echo "• SSL test: curl -I https://$DOMAIN"
echo "• Sertifika durumu: sudo certbot certificates"
echo "• Yenileme testi: sudo certbot renew --dry-run"

echo ""
warning "Önemli Notlar:"
echo "• Sertifika 90 günde bir otomatik yenilenir"
echo "• Yenileme logları: sudo tail -f /var/log/letsencrypt/letsencrypt.log"
echo "• Manuel yenileme: sudo certbot renew"

echo ""
log "SSL kurulumu tamamlandı! 🔒"