# 🔄 Gerçek Zamanlı Veri Akışı Kurulum Rehberi

## 📋 Mevcut Durum

Veritabanında veri var ancak gerçek zamanlı olarak güncellenmiyor. Reports sayfasında "Veri Bulunamadı" mesajı görünüyor.

## 🚀 Gerçek Zamanlı Veri Akışı Çözümleri

### 1. Supabase Real-time Subscriptions

#### Server.js'de Real-time Subscription Ekle

```javascript
// Supabase real-time subscription
const subscription = supabase
  .channel('production-updates')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'productions' 
    }, 
    (payload) => {
      console.log('Production data changed:', payload);
      // WebSocket ile tüm client'lara bildir
      broadcastUpdate('production-updated', payload);
    }
  )
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'production_states' 
    }, 
    (payload) => {
      console.log('Production state changed:', payload);
      broadcastUpdate('production-state-updated', payload);
    }
  )
  .subscribe();
```

### 2. WebSocket Real-time Updates

#### Server.js'de WebSocket Server Ekle

```javascript
const WebSocket = require('ws');

// WebSocket server oluştur
const wss = new WebSocket.Server({ port: 8080 });

// Client bağlantıları
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Tüm client'lara mesaj gönder
function broadcastUpdate(type, data) {
  const message = JSON.stringify({ type, data });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
```

### 3. Client-side Real-time Updates

#### reports.js'de Real-time Listener Ekle

```javascript
// WebSocket bağlantısı
let ws = null;

function connectWebSocket() {
  ws = new WebSocket('ws://192.168.1.250:8080');
  
  ws.onopen = () => {
    console.log('WebSocket connected');
  };
  
  ws.onmessage = (event) => {
    const { type, data } = JSON.parse(event.data);
    handleRealtimeUpdate(type, data);
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected, reconnecting...');
    setTimeout(connectWebSocket, 5000);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Real-time güncellemeleri işle
function handleRealtimeUpdate(type, data) {
  switch(type) {
    case 'production-updated':
      console.log('Production updated:', data);
      loadAdvancedStats();
      break;
    case 'production-state-updated':
      console.log('Production state updated:', data);
      loadRealtimeData();
      break;
    default:
      console.log('Unknown update type:', type);
  }
}

// Sayfa yüklendiğinde WebSocket'e bağlan
document.addEventListener('DOMContentLoaded', () => {
  connectWebSocket();
});
```

### 4. Polling-based Real-time Updates

#### reports.js'de Polling Ekle

```javascript
// Polling interval (5 saniyede bir)
const POLLING_INTERVAL = 5000;
let pollingInterval = null;

function startPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  pollingInterval = setInterval(() => {
    console.log('Polling for updates...');
    loadRealtimeData();
    loadAdvancedStats();
  }, POLLING_INTERVAL);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// Sayfa yüklendiğinde polling başlat
document.addEventListener('DOMContentLoaded', () => {
  startPolling();
});

// Sayfa kapatıldığında polling durdur
window.addEventListener('beforeunload', () => {
  stopPolling();
});
```

## 🔧 Hızlı Çözüm: Polling-based Updates

### 1. reports.js'de Polling Ekle

```javascript
// Sayfa yüklendiğinde otomatik polling başlat
document.addEventListener('DOMContentLoaded', () => {
  // İlk veri yükleme
  loadAllData();
  
  // Her 10 saniyede bir güncelle
  setInterval(() => {
    console.log('🔄 Veri güncelleniyor...');
    loadAllData();
  }, 10000);
});

// Tüm verileri yükle
async function loadAllData() {
  try {
    await Promise.all([
      loadDashboardStats(),
      loadAdvancedStats(),
      loadRealtimeData(),
      loadOperatorPerformance(),
      loadStockAlerts()
    ]);
    
    // Grafikleri güncelle
    createProductionTrendChart();
    createCustomerProductionChart();
    
    console.log('✅ Tüm veriler güncellendi');
  } catch (error) {
    console.error('❌ Veri yükleme hatası:', error);
  }
}
```

### 2. Server.js'de Caching Ekle

```javascript
// Cache için
const cache = {
  statistics: null,
  realtime: null,
  advancedStats: null,
  lastUpdate: null
};

// Cache süresi (5 dakika)
const CACHE_DURATION = 5 * 60 * 1000;

// Cache kontrolü
function isCacheValid() {
  return cache.lastUpdate && (Date.now() - cache.lastUpdate) < CACHE_DURATION;
}

// Statistics endpoint'inde cache kullan
app.get('/api/dashboard/statistics', async (req, res) => {
  try {
    if (isCacheValid() && cache.statistics) {
      return res.json(cache.statistics);
    }
    
    // Veritabanından veri çek
    const [productionsResult, qualityResult, notificationsResult] = await Promise.all([
      supabase.from('productions').select('id, status, created_at'),
      supabase.from('quality_checks').select('id, result, check_time'),
      supabase.from('notifications').select('id, status, priority, created_at')
    ]);
    
    // Cache'i güncelle
    cache.statistics = {
      productions: {
        total: productionsResult.data?.length || 0,
        completed: productionsResult.data?.filter(p => p.status === 'completed').length || 0,
        in_progress: productionsResult.data?.filter(p => p.status === 'in_progress').length || 0
      },
      quality: {
        total_checks: qualityResult.data?.length || 0,
        passed: qualityResult.data?.filter(q => q.result === 'passed').length || 0,
        failed: qualityResult.data?.filter(q => q.result === 'failed').length || 0
      }
    };
    
    cache.lastUpdate = Date.now();
    res.json(cache.statistics);
  } catch (error) {
    console.error('Statistics API error:', error);
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
});
```

## 🚀 Uygulama Adımları

### 1. Polling-based Çözüm (Hızlı)

```bash
# 1. reports.js dosyasını güncelle
# 2. Server.js'de cache ekle
# 3. PM2'yi yeniden başlat
pm2 restart all
```

### 2. WebSocket Çözümü (Gelişmiş)

```bash
# 1. WebSocket server ekle
# 2. Client-side WebSocket bağlantısı
# 3. Real-time subscription'lar
# 4. PM2'yi yeniden başlat
pm2 restart all
```

## 📊 Beklenen Sonuç

### Polling-based:
- ✅ Her 10 saniyede veri güncellenir
- ✅ Reports sayfası otomatik yenilenir
- ✅ Grafikler güncel verileri gösterir

### WebSocket-based:
- ✅ Anlık veri güncellemeleri
- ✅ Gerçek zamanlı grafik güncellemeleri
- ✅ Daha az sunucu yükü

## 🔍 Test

```bash
# 1. Reports sayfasını aç
http://192.168.1.250/reports.html

# 2. Console'u aç (F12)
# 3. "Veri güncelleniyor..." mesajlarını kontrol et
# 4. Verilerin otomatik güncellendiğini gör
```

---

**🎯 Durum**: Gerçek zamanlı veri akışı kurulmalı! Polling-based çözüm hızlı, WebSocket çözümü daha gelişmiş.

