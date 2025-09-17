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
        try {
            console.log('Real-time Updates sistemi başlatılıyor...');
            this.setupVisibilityChangeListener();
            this.setupNetworkStatusListener();
            this.setupErrorHandling();
            console.log('Real-time Updates sistemi başlatıldı');
        } catch (error) {
            console.error('Real-time Updates başlatma hatası:', error);
        }
    }

    // Görünürlük değişikliğini dinle (sayfa aktif/pasif)
    setupVisibilityChangeListener() {
        try {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseUpdates();
                    console.log('Sayfa pasif - güncellemeler duraklatıldı');
                } else {
                    this.resumeUpdates();
                    console.log('Sayfa aktif - güncellemeler devam ettirildi');
                }
            });
        } catch (error) {
            console.warn('Visibility change listener kurulamadı:', error);
        }
    }

    // Ağ durumunu dinle
    setupNetworkStatusListener() {
        try {
            window.addEventListener('online', () => {
                console.log('Ağ bağlantısı kuruldu - güncellemeler devam ettirildi');
                this.resumeUpdates();
            });

            window.addEventListener('offline', () => {
                console.log('Ağ bağlantısı kesildi - güncellemeler duraklatıldı');
                this.pauseUpdates();
            });
        } catch (error) {
            console.warn('Network status listener kurulamadı:', error);
        }
    }

    // Hata yönetimi
    setupErrorHandling() {
        try {
            window.addEventListener('error', (event) => {
                // Null hataları kontrol et
                if (event && event.error && event.error !== null) {
                    console.error('Real-time Updates hatası:', event.error);
                    this.handleError(event.error);
                } else {
                    console.warn('Null error event - sessizce geçiliyor');
                }
            });
            
            // Unhandled promise rejection'ları yakala
            window.addEventListener('unhandledrejection', (event) => {
                if (event && event.reason && event.reason !== null) {
                    console.error('Real-time Updates promise hatası:', event.reason);
                    this.handleError(event.reason);
                } else {
                    console.warn('Null promise rejection - sessizce geçiliyor');
                }
            });
        } catch (error) {
            console.warn('Error handling listener kurulamadı:', error);
        }
    }

    // Güncellemeleri başlat
    startUpdates() {
        if (this.isActive) {
            console.log('Güncellemeler zaten aktif');
            return;
        }

        try {
            this.isActive = true;
            console.log('Real-time güncellemeler başlatıldı');

            // Her veri türü için güncelleme interval'ı oluştur
            Object.entries(this.dataTypes).forEach(([dataType, config]) => {
                try {
                    this.startDataTypeUpdate(dataType, config);
                } catch (error) {
                    console.warn(`${dataType} güncelleme başlatılamadı:`, error);
                }
            });

            // Genel sistem durumu güncellemesi
            try {
                this.startSystemStatusUpdate();
            } catch (error) {
                console.warn('Sistem durumu güncellemesi başlatılamadı:', error);
            }
        } catch (error) {
            console.error('Real-time updates başlatma hatası:', error);
            this.isActive = false;
        }
    }

    // Belirli veri türü için güncelleme başlat
    startDataTypeUpdate(dataType, config) {
        try {
            const intervalId = setInterval(async () => {
                try {
                    await this.updateDataType(dataType, config);
                } catch (error) {
                    // Network hatalarını sessizce geç
                    if (error.name === 'AbortError' || 
                        error.message.includes('fetch') || 
                        error.message.includes('Load failed') ||
                        error.message.includes('Failed to fetch')) {
                        console.warn(`${dataType} güncellenirken network hatası:`, error.message);
                        return;
                    }
                    
                    // Kritik hataları kullanıcıya göster
                    if (this.shouldShowErrorToUser(error)) {
                        console.error(`${dataType} güncellenirken kritik hata:`, error);
                        if (window.stateManager) {
                            const errorMessage = `${dataType} güncelleme hatası - Sistem yöneticisine bildirin`;
                            window.stateManager.addNotification(errorMessage, 'error');
                        }
                    } else {
                        console.warn(`${dataType} güncellenirken geçici hata:`, error.message);
                    }
                }
            }, config.frequency);

            this.updateIntervals.set(dataType, intervalId);
            console.log(`${dataType} güncellemeleri başlatıldı (${config.frequency}ms)`);
        } catch (error) {
            console.warn(`${dataType} güncelleme başlatılamadı:`, error);
        }
    }

    // Veri türünü güncelle
    async updateDataType(dataType, config) {
        try {
            // Endpoint kontrolü
            if (!config.endpoint) {
                console.warn(`${dataType} için endpoint tanımlı değil`);
                return;
            }

            const response = await fetch(config.endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Timeout ekle
                signal: AbortSignal.timeout(10000) // 10 saniye timeout
            });
            
            if (!response.ok) {
                // 404 hatalarını sessizce geç
                if (response.status === 404) {
                    console.warn(`${dataType} endpoint bulunamadı: ${config.endpoint}`);
                    return;
                }
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
            // Timeout ve network hatalarını sessizce geç
            if (error.name === 'AbortError' || 
                error.message.includes('fetch') || 
                error.message.includes('Load failed') ||
                error.message.includes('Failed to fetch')) {
                console.warn(`${dataType} güncelleme timeout: ${config.endpoint}`);
                return;
            }
            
            // Kritik hataları kullanıcıya göster
            if (this.shouldShowErrorToUser(error)) {
                console.error(`${dataType} güncelleme hatası:`, error);
                if (window.stateManager) {
                    const errorMessage = `${dataType} güncelleme hatası - Sistem yöneticisine bildirin`;
                    window.stateManager.addNotification(errorMessage, 'error');
                }
            }
            
            // Hata fırlatma yerine sadece log
            console.warn(`${dataType} güncelleme hatası, devam ediliyor:`, error.message);
        }
    }

    // Sistem durumu güncellemesi
    startSystemStatusUpdate() {
        const intervalId = setInterval(() => {
            try {
                this.updateSystemStatus();
            } catch (error) {
                console.error('Sistem durumu güncelleme hatası:', error);
                // Sistem durumu hatalarını kullanıcıya göster
                if (this.shouldShowErrorToUser(error) && window.stateManager) {
                    window.stateManager.addNotification('Sistem durumu güncelleme hatası - Sistem yöneticisine bildirin', 'error');
                }
            }
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
        
        // Null hataları kontrol et
        if (!error) {
            console.warn('Null error object - sessizce geçiliyor');
            return;
        }
        
        // Kritik hataları kullanıcıya göster
        if (this.shouldShowErrorToUser(error)) {
            if (window.stateManager) {
                const errorMessage = this.getUserFriendlyErrorMessage(error);
                window.stateManager.addNotification(errorMessage, 'error');
            }
        }
    }
    
    // Hata türüne göre kullanıcıya gösterilip gösterilmeyeceğini belirle
    shouldShowErrorToUser(error) {
        // Null hataları kontrol et
        if (!error) {
            return false;
        }
        
        // Geçici network hatalarını kullanıcıya gösterme
        if (error.message && (
            error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('HTTP 404') ||
            error.message.includes('HTTP 500') ||
            error.message.includes('AbortError')
        )) {
            return false;
        }
        
        // JavaScript syntax hataları, kritik sistem hataları göster
        if (error.name === 'SyntaxError' || 
            error.name === 'ReferenceError' || 
            error.name === 'TypeError') {
            return true;
        }
        
        // Diğer beklenmeyen hataları göster
        return true;
    }
    
    // Kullanıcı dostu hata mesajı oluştur
    getUserFriendlyErrorMessage(error) {
        // Null hataları kontrol et
        if (!error) {
            return 'Bilinmeyen sistem hatası - Sistem yöneticisine bildirin';
        }
        
        if (error.name === 'SyntaxError') {
            return 'JavaScript syntax hatası - Sistem yöneticisine bildirin';
        }
        
        if (error.name === 'ReferenceError') {
            return 'JavaScript referans hatası - Sistem yöneticisine bildirin';
        }
        
        if (error.name === 'TypeError') {
            return 'JavaScript tip hatası - Sistem yöneticisine bildirin';
        }
        
        if (error.message && error.message.includes('Cannot declare')) {
            return 'Değişken tanımlama hatası - Sistem yöneticisine bildirin';
        }
        
        // Genel hata mesajı
        return `Sistem hatası: ${error.name || 'Bilinmeyen'} - Sistem yöneticisine bildirin`;
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
