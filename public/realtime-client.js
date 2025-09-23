// Real-time WebSocket Client
class RealtimeClient {
    constructor() {
        this.ws = null;
        this.operatorId = null;
        this.operatorName = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1 second
        this.isConnected = false;
        this.eventHandlers = new Map();
        
        this.init();
    }
    
    init() {
        // WebSocket bağlantısını başlat
        this.connect();
        
        // Sayfa kapatılırken bağlantıyı kapat
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
        
        // Visibility change - sayfa görünür olduğunda yeniden bağlan
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isConnected) {
                this.connect();
            }
        });
    }
    
    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            
            console.log('🔌 WebSocket bağlantısı kuruluyor:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket bağlantısı kuruldu');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Operatör bilgileri varsa kayıt ol
                if (this.operatorId && this.operatorName) {
                    this.register();
                }
                
                this.emit('connected');
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('❌ WebSocket mesaj hatası:', error);
                }
            };
            
            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket bağlantısı kapandı:', event.code, event.reason);
                this.isConnected = false;
                this.emit('disconnected', event);
                
                // Otomatik yeniden bağlanma
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`🔄 Yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                    
                    setTimeout(() => {
                        this.connect();
                    }, this.reconnectDelay * this.reconnectAttempts);
                } else {
                    console.error('❌ Maksimum yeniden bağlanma denemesi aşıldı');
                    this.emit('maxReconnectAttemptsReached');
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket hatası:', error);
                this.emit('error', error);
            };
            
        } catch (error) {
            console.error('❌ WebSocket bağlantı hatası:', error);
            this.emit('error', error);
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
    
    register(operatorId, operatorName) {
        this.operatorId = operatorId;
        this.operatorName = operatorName;
        
        if (this.isConnected) {
            this.send({
                type: 'register',
                operatorId: operatorId,
                operatorName: operatorName
            });
        }
    }
    
    send(message) {
        if (this.isConnected && this.ws) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('⚠️ WebSocket bağlantısı yok, mesaj gönderilemedi:', message);
        }
    }
    
    handleMessage(message) {
        // Pong mesajlarını loglamayalım
        if (message.type !== 'pong') {
            console.log('📨 WebSocket mesajı alındı:', message.type);
        }
        
        switch (message.type) {
            case 'welcome':
                this.handleWelcome(message);
                break;
            case 'current_productions':
                this.handleCurrentProductions(message);
                break;
            case 'production_updated':
                this.handleProductionUpdated(message);
                break;
            case 'production_transferred':
                this.handleProductionTransferred(message);
                break;
            case 'history_updated':
                this.handleHistoryUpdated(message);
                break;
            case 'notification':
                this.handleNotification(message);
                break;
            case 'general_notification':
                this.handleGeneralNotification(message);
                break;
            case 'pong':
                // Ping-pong için
                break;
            default:
                console.log('❓ Bilinmeyen mesaj türü:', message.type);
        }
        
        // Genel mesaj eventi
        this.emit('message', message);
    }
    
    handleWelcome(message) {
        console.log('👋 Hoş geldin mesajı:', message.message);
        this.showNotification(message.message, 'success');
    }
    
    handleCurrentProductions(message) {
        console.log('📦 Mevcut üretimler:', message.data);
        this.emit('currentProductions', message.data);
    }
    
    handleProductionUpdated(message) {
        console.log('🔄 Üretim güncellendi:', message.data);
        this.emit('productionUpdated', message.data);
        
        // UI'yi güncelle
        if (typeof window.loadProductDetails === 'function') {
            window.loadProductDetails();
        }
    }
    
    handleProductionTransferred(message) {
        console.log('🔄 Üretim transfer edildi:', message.message);
        this.showNotification(message.message, 'info');
    }
    
    handleHistoryUpdated(message) {
        console.log('📝 Geçmiş güncellendi:', message.data);
        this.emit('historyUpdated', message.data);
    }
    
    handleNotification(message) {
        console.log('🔔 Bildirim:', message.data);
        this.showNotification(message.data.title, message.data.notification_type, message.data.message);
        this.emit('notification', message.data);
    }
    
    handleGeneralNotification(message) {
        console.log('📢 Genel bildirim:', message.data);
        this.showNotification(message.data.title, 'info', message.data.message);
        this.emit('generalNotification', message.data);
    }
    
    showNotification(title, type = 'info', message = '') {
        // Bootstrap toast kullanarak bildirim göster
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div class="toast" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="fas fa-${this.getIconForType(type)} me-2"></i>
                    <strong class="me-auto">${title}</strong>
                    <small class="text-muted">${new Date().toLocaleTimeString('tr-TR')}</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                ${message ? `<div class="toast-body">${message}</div>` : ''}
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        
        toast.show();
        
        // Toast gösterildikten sonra DOM'dan kaldır
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
    
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }
    
    getIconForType(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    // Event listener sistemi
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('❌ Event handler hatası:', error);
                }
            });
        }
    }
    
    // Ping-pong sistemi
    startPing() {
        setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping' });
            }
        }, 30000); // 30 saniyede bir ping
    }
    
    // Bağlantı durumu
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            operatorId: this.operatorId,
            operatorName: this.operatorName,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Global instance oluştur
window.realtimeClient = new RealtimeClient();

// Ping-pong'u başlat
window.realtimeClient.startPing();

console.log('✅ Real-time client initialized');

