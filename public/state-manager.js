/**
 * ThunderV1 - Global State Management System
 * Faz 0: Entegre İş Süreci Yönetimi
 */

// Global Production State
const ProductionState = {
    // Mevcut durumlar
    currentPlan: null,
    activeProduction: null,
    currentStage: null,
    qualityChecks: [],
    notifications: [],
    workflowStatus: 'idle', // 'idle', 'planning', 'producing', 'quality_check', 'completed'
    
    // Tab durumları
    tabStates: {
        'production-planning': { enabled: true, status: 'idle', nextTab: 'production-start', requiredData: ['plan_approved'] },
        'production-start': { enabled: false, status: 'disabled', nextTab: 'production-stages', requiredData: ['plan_approved'] },
        'production-stages': { enabled: false, status: 'disabled', nextTab: 'quality-control', requiredData: ['production_active'] },
        'quality-control': { enabled: false, status: 'disabled', nextTab: 'active-productions', requiredData: ['stage_completed'] },
        'active-productions': { enabled: true, status: 'active', nextTab: 'production-history', requiredData: ['production_active'] },
        'production-history': { enabled: true, status: 'idle', nextTab: null, requiredData: [] }
    },
    
    // Cache
    cache: new Map(),
    
    // Event listeners
    listeners: new Map()
};

// State Manager Class
class StateManager {
    constructor() {
        this.state = ProductionState;
        this.setupDefaultState();
        this.setupEventListeners();
    }
    
    setupDefaultState() {
        // Başlangıç durumunu ayarla
        this.state.workflowStatus = 'idle';
        this.updateTabStates();
    }
    
    setupEventListeners() {
        // DOM yüklendiğinde state'i güncelle
        document.addEventListener('DOMContentLoaded', () => {
            this.updateAllStates();
        });
    }
    
    // State güncelleme
    updateState(key, value) {
        if (this.state.hasOwnProperty(key)) {
            this.state[key] = value;
            this.notifyListeners(key, value);
            this.updateTabStates();
        }
    }
    
    // State okuma
    getState(key) {
        return this.state[key];
    }
    
    // Tüm state'i güncelle
    updateAllStates() {
        this.updateTabStates();
        this.updateWorkflowStatus();
        this.updateNotifications();
    }
    
    // Tab durumlarını güncelle
    updateTabStates() {
        Object.keys(this.state.tabStates).forEach(tabId => {
            const tabState = this.state.tabStates[tabId];
            const element = document.getElementById(tabId);
            
            if (element) {
                // CSS sınıflarını güncelle
                element.classList.remove('disabled', 'enabled', 'active', 'completed');
                
                if (tabState.enabled) {
                    element.classList.add('enabled');
                    if (tabState.status === 'active') {
                        element.classList.add('active');
                    }
                } else {
                    element.classList.add('disabled');
                }
                
                // Tab içeriğini güncelle
                this.updateTabContent(tabId, tabState);
            }
        });
    }
    
    // Tab içeriğini güncelle
    updateTabContent(tabId, tabState) {
        const tabElement = document.getElementById(tabId);
        if (!tabElement) return;
        
        // Durum göstergesi ekle
        let statusIndicator = tabElement.querySelector('.status-indicator');
        if (!statusIndicator) {
            statusIndicator = document.createElement('span');
            statusIndicator.className = 'status-indicator badge ms-2';
            tabElement.appendChild(statusIndicator);
        }
        
        // Durum rengini ayarla
        statusIndicator.className = `status-indicator badge ms-2 bg-${this.getStatusColor(tabState.status)}`;
        statusIndicator.textContent = this.getStatusText(tabState.status);
    }
    
    // Durum rengi
    getStatusColor(status) {
        const colors = {
            'idle': 'secondary',
            'active': 'success',
            'disabled': 'danger',
            'completed': 'info',
            'warning': 'warning'
        };
        return colors[status] || 'secondary';
    }
    
    // Durum metni
    getStatusText(status) {
        const texts = {
            'idle': 'Beklemede',
            'active': 'Aktif',
            'disabled': 'Devre Dışı',
            'completed': 'Tamamlandı',
            'warning': 'Uyarı'
        };
        return texts[status] || status;
    }
    
    // Workflow durumunu güncelle
    updateWorkflowStatus() {
        const workflowElement = document.getElementById('workflow-status');
        if (workflowElement) {
            workflowElement.textContent = this.getWorkflowStatusText(this.state.workflowStatus);
            workflowElement.className = `badge bg-${this.getStatusColor(this.state.workflowStatus)}`;
        }
    }
    
    // Workflow durum metni
    getWorkflowStatusText(status) {
        const texts = {
            'idle': 'Hazır',
            'planning': 'Planlama',
            'producing': 'Üretimde',
            'quality_check': 'Kalite Kontrol',
            'completed': 'Tamamlandı'
        };
        return texts[status] || status;
    }
    
    // Bildirimleri güncelle
    updateNotifications() {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) return;
        
        notificationContainer.innerHTML = '';
        
        this.state.notifications.forEach((notification, index) => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `alert alert-${notification.type} alert-dismissible fade show`;
            notificationElement.innerHTML = `
                ${notification.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            notificationContainer.appendChild(notificationElement);
        });
    }
    
    // Bildirim ekle
    addNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        
        this.state.notifications.push(notification);
        this.updateNotifications();
        
        // 5 saniye sonra otomatik kaldır
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 5000);
    }
    
    // Bildirim kaldır
    removeNotification(id) {
        this.state.notifications = this.state.notifications.filter(n => n.id !== id);
        this.updateNotifications();
    }
    
    // Event listener ekle
    addListener(key, callback) {
        if (!this.state.listeners.has(key)) {
            this.state.listeners.set(key, []);
        }
        this.state.listeners.get(key).push(callback);
    }
    
    // Event listener'ları bildir
    notifyListeners(key, value) {
        if (this.state.listeners.has(key)) {
            this.state.listeners.get(key).forEach(callback => {
                callback(value);
            });
        }
    }
    
    // Cache yönetimi
    setCache(key, value, ttl = 300000) { // 5 dakika default TTL
        this.state.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    }
    
    getCache(key) {
        const cached = this.state.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > cached.ttl) {
            this.state.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }
    
    // State'i sıfırla
    resetState() {
        this.state.currentPlan = null;
        this.state.activeProduction = null;
        this.state.currentStage = null;
        this.state.qualityChecks = [];
        this.state.notifications = [];
        this.state.workflowStatus = 'idle';
        this.updateAllStates();
    }
    
    // Debug için state'i yazdır
    debugState() {
        console.log('Current Production State:', this.state);
    }
}

// Global State Manager instance
const stateManager = new StateManager();

// Global erişim için window'a ekle
window.stateManager = stateManager;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StateManager, ProductionState };
}
