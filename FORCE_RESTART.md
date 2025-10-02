# 🔄 Sunucu Zorla Yeniden Başlatma

## Sorun:
- Debug logları koda eklendi ama log'lara gelmiyor
- Eski `server.js` cache'de kalabilir
- PM2 restart yeterli olmayabilir

## Çözüm - Sunucuda Şu Komutları Çalıştır:

```bash
# 1. PM2'yi tamamen durdur
pm2 stop thunder-production

# 2. PM2'yi sil (cache temizler)
pm2 delete thunder-production

# 3. Node modüllerini temizle (opsiyonel ama önerilen)
cd /opt/thunder-production
npm cache clean --force

# 4. PM2'yi yeniden başlat
pm2 start ecosystem.config.js

# 5. PM2 status kontrol
pm2 status

# 6. Log'ları izle
pm2 logs thunder-production --lines 50
```

## Alternatif - Hızlı Restart:

```bash
cd /opt/thunder-production
pm2 restart thunder-production --update-env
pm2 flush thunder-production  # Log cache temizler
pm2 logs thunder-production --lines 50
```

## Test Sonrası:

Yeni bir üretim testi yap ve log'larda şunu arayın:
```
🔍 BOM sorgusu başlatılıyor - Product ID: 1241, Type: nihai
📊 BOM sorgu sonucu - Toplam kayıt: 6
```

Eğer hala eski log formatı görüyorsan (`✅ BOM sorgusu tamamlandı: 0 malzeme`), 
server dosyası güncellenmemiş demektir!

