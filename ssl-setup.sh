#!/bin/bash

# SSL Sertifikası Kurulum Scripti
# Kullanım: ./ssl-setup.sh your-domain.com

set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Kullanım: ./ssl-setup.sh your-domain.com"
    exit 1
fi

echo "🔒 SSL Sertifikası kurulumu başlatılıyor..."

# Certbot kurulumu
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# SSL sertifikası oluştur
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN

# Otomatik yenileme testi
sudo certbot renew --dry-run

echo "✅ SSL sertifikası başarıyla kuruldu!"
echo "🔗 https://$DOMAIN adresinden erişebilirsiniz"
