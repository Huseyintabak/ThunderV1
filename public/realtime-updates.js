// Faz 0: Real-time Updates Sistemi
// Otomatik veri yenileme, WebSocket entegrasyonu ve canlı güncellemeler

class RealTimeUpdates {
    constructor() {
        this.updateIntervals = new Map();
        this.isActive = false;
        this.updateFrequency = 30000; // 30 saniye
        this.retryAttempts = 3;
        this.retryDelay = 5000; // 5 saniye
        
        // Güncellenecek veri türleri
        this.dataTypes = {
            'active-productions': {
                endpoint: '/api/productions/active',
                handler: 'updateActiveProductions',
                frequency: 10000 // 10 saniye
            },
            'production-history': {
                endpoint: '/api/productions/history',
                handler: 'updateProductionHistory',
                frequency: 60000 // 1 dakika
            },
            'production-stages': {
                endpoint: '/api/production-stages/templates',
                handler: 'updateStageTemplates',
                frequency: 120000 // 2 dakika
            },
            'quality-checkpoints': {
                endpoint: '/api/quality/checkpoints',
                handler: 'updateQualityCheckpoints',
                frequency: 120000 // 2 dakika
            },
            'production-plans': {
                endpoint: '/api/production-plans',
                handler: 'updateProductionPlans',
                frequency: 300000 // 5 dakika
            }
        };
        
        this.initialize();
    }

    // Sistemi başlat
    initialize() {
        console.log('Real-time Updates sistemi başlatılıyor...');
        this.setupVisibilityChangeListener();
        this.setupNetworkStatusListener();
        this.setupErrorHandling();
    }

    // Görünürlük değişikliğini dinle (sayfa aktif/pasif)
    setupVisibilityChangeListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
                console.log('Sayfa pasif - güncellemeler duraklatıldı');
            } else {
                this.resumeUpdates();
                console.log('Sayfa aktif - güncellemeler devam ettirildi');
            }
        });
    }

    // Ağ durumunu dinle
    setupNetworkStatusListener() {
        window.addEventListener('online', () => {
            console.log('Ağ bağlantısı kuruldu - güncellemeler devam ettirildi');
            this.resumeUpdates();
        });

        window.addEventListener('offline', () => {
            console.log('Ağ bağlantısı kesildi - güncellemeler duraklatıldı');
            this.pauseUpdates();
        });
    }

    // Hata yönetimi
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Real-time Updates hatası:', event.error);
            this.handleError(event.error);
        });
    }

    // Güncellemeleri başlat
    startUpdates() {
        if (this.isActive) {
            console.log('Güncellemeler zaten aktif');
            return;
        }

        this.isActive = true;
        console.log('Real-time güncellemeler başlatıldı');

        // Her veri türü için güncelleme interval'ı oluştur
        Object.entries(this.dataTypes).forEach(([dataType, config]) => {
            this.startDataTypeUpdate(dataType, config);
        });

        // Genel sistem durumu güncellemesi
        this.startSystemStatusUpdate();
    }

    // Belirli veri türü için güncelleme başlat
    startDataTypeUpdate(dataType, config) {
        const intervalId = setInterval(async () => {
            try {
                await this.updateDataType(dataType, config);
            } catch (error) {
                console.error(`${dataType} güncellenirken hata:`, error);
                this.handleUpdateError(dataType, error);
            }
        }, config.frequency);

        this.updateIntervals.set(dataType, intervalId);
        console.log(`${dataType} güncellemeleri başlatıldı (${config.frequency}ms)`);
    }

    // Veri türünü güncelle
    async updateDataType(dataType, config) {
        try {
            const response = await fetch(config.endpoint);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Event Bus'a güncelleme bildir
            if (window.eventBus) {
                window.eventBus.emit('data-updated', {
                    dataType: dataType,
                    data: data,
                    timestamp: new Date()
                });
            }

            // Özel handler'ı çağır
            if (typeof window[config.handler] === 'function') {
                window[config.handler](data);
            }

            console.log(`${dataType} başarıyla güncellendi`);
        } catch (error) {
            throw error;
        }
    }

    // Sistem durumu güncellemesi
    startSystemStatusUpdate() {
        const intervalId = setInterval(() => {
            this.updateSystemStatus();
        }, 5000); // 5 saniyede bir

        this.updateIntervals.set('system-status', intervalId);
    }

    // Sistem durumunu güncelle
    updateSystemStatus() {
        const status = {
            isOnline: navigator.onLine,
            lastUpdate: new Date(),
            activeIntervals: this.updateIntervals.size,
            memoryUsage: this.getMemoryUsage()
        };

        // State Manager'ı güncelle
        if (window.stateManager) {
            window.stateManager.updateState('systemStatus', status);
        }

        // Event Bus'a bildir
        if (window.eventBus) {
            window.eventBus.emit('system-status-updated', status);
        }
    }

    // Bellek kullanımını al
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }

    // Güncellemeleri duraklat
    pauseUpdates() {
        if (!this.isActive) return;

        this.updateIntervals.forEach((intervalId, dataType) => {
            clearInterval(intervalId);
            console.log(`${dataType} güncellemeleri duraklatıldı`);
        });

        this.updateIntervals.clear();
        this.isActive = false;
    }

    // Güncellemeleri devam ettir
    resumeUpdates() {
        if (this.isActive) return;

        this.startUpdates();
    }

    // Güncellemeleri durdur
    stopUpdates() {
        this.pauseUpdates();
        console.log('Real-time güncellemeler durduruldu');
    }

    // Hata yönetimi
    handleError(error) {
        console.error('Real-time Updates sistem hatası:', error);
        
        // State Manager'a hata bildir
        if (window.stateManager) {
            window.stateManager.addNotification('Güncelleme sistemi hatası', 'error');
        }
    }

    // Güncelleme hatası yönetimi
    handleUpdateError(dataType, error) {
        console.error(`${dataType} güncelleme hatası:`, error);
        
        // Retry mekanizması
        setTimeout(() => {
            if (this.isActive) {
                console.log(`${dataType} için retry yapılıyor...`);
                this.retryUpdate(dataType);
            }
        }, this.retryDelay);
    }

    // Güncelleme retry
    async retryUpdate(dataType) {
        const config = this.dataTypes[dataType];
        if (!config) return;

        try {
            await this.updateDataType(dataType, config);
            console.log(`${dataType} retry başarılı`);
        } catch (error) {
            console.error(`${dataType} retry başarısız:`, error);
        }
    }

    // Manuel güncelleme tetikle
    async triggerManualUpdate(dataType) {
        if (!dataType) {
            // Tüm veri türlerini güncelle
            const promises = Object.entries(this.dataTypes).map(([type, config]) => 
                this.updateDataType(type, config)
            );
            await Promise.all(promises);
        } else {
            const config = this.dataTypes[dataType];
            if (config) {
                await this.updateDataType(dataType, config);
            }
        }
    }

    // Güncelleme sıklığını değiştir
    setUpdateFrequency(dataType, frequency) {
        if (this.dataTypes[dataType]) {
            this.dataTypes[dataType].frequency = frequency;
            
            // Eğer aktif ise yeniden başlat
            if (this.isActive) {
                this.pauseUpdates();
                this.resumeUpdates();
            }
        }
    }

    // Sistem durumunu al
    getSystemStatus() {
        return {
            isActive: this.isActive,
            activeIntervals: this.updateIntervals.size,
            dataTypes: Object.keys(this.dataTypes),
            memoryUsage: this.getMemoryUsage(),
            lastUpdate: new Date()
        };
    }
}

// Global Real-time Updates instance'ı oluştur
const realTimeUpdates = new RealTimeUpdates();

// Window objesine ekle
if (typeof window !== 'undefined') {
    window.realTimeUpdates = realTimeUpdates;
}

// Sayfa yüklendiğinde otomatik başlat
document.addEventListener('DOMContentLoaded', () => {
    // Kısa bir gecikme ile başlat (diğer sistemlerin yüklenmesini bekle)
    setTimeout(() => {
        realTimeUpdates.startUpdates();
    }, 2000);
});

console.log('Real-time Updates sistemi yüklendi');
