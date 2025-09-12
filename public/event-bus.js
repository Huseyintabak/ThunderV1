/**
 * ThunderV1 - Event Bus System
 * Faz 0: Tab'lar arası iletişim sistemi
 */

class EventBus {
    constructor() {
        this.events = {};
        this.setupDefaultEvents();
    }
    
    setupDefaultEvents() {
        // Üretim süreci event'leri
        this.events['production-started'] = [];
        this.events['production-paused'] = [];
        this.events['production-resumed'] = [];
        this.events['production-completed'] = [];
        this.events['production-cancelled'] = [];
        
        // Aşama event'leri
        this.events['stage-started'] = [];
        this.events['stage-completed'] = [];
        this.events['stage-skipped'] = [];
        
        // Kalite kontrol event'leri
        this.events['quality-check-started'] = [];
        this.events['quality-check-completed'] = [];
        this.events['quality-check-failed'] = [];
        
        // Plan event'leri
        this.events['plan-created'] = [];
        this.events['plan-approved'] = [];
        this.events['plan-rejected'] = [];
        
        // Tab event'leri
        this.events['tab-changed'] = [];
        this.events['tab-enabled'] = [];
        this.events['tab-disabled'] = [];
        
        // State event'leri
        this.events['state-updated'] = [];
        this.events['workflow-changed'] = [];
        
        // Bildirim event'leri
        this.events['notification-added'] = [];
        this.events['notification-removed'] = [];
    }
    
    // Event listener ekle
    on(event, callback, priority = 0) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        this.events[event].push({
            callback,
            priority,
            id: Date.now() + Math.random()
        });
        
        // Priority'ye göre sırala (yüksek priority önce çalışır)
        this.events[event].sort((a, b) => b.priority - a.priority);
    }
    
    // Event listener kaldır
    off(event, callback) {
        if (!this.events[event]) return;
        
        this.events[event] = this.events[event].filter(
            listener => listener.callback !== callback
        );
    }
    
    // Event emit et
    emit(event, data = null) {
        if (!this.events[event]) {
            console.warn(`Event '${event}' not found`);
            return;
        }
        
        console.log(`EventBus: Emitting '${event}'`, data);
        
        this.events[event].forEach(listener => {
            try {
                listener.callback(data);
            } catch (error) {
                console.error(`EventBus: Error in listener for '${event}':`, error);
            }
        });
    }
    
    // Event'i bir kez dinle
    once(event, callback, priority = 0) {
        const onceCallback = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };
        
        this.on(event, onceCallback, priority);
    }
    
    // Tüm event'leri temizle
    clear() {
        this.events = {};
        this.setupDefaultEvents();
    }
    
    // Event listener sayısını al
    getListenerCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }
    
    // Tüm event'leri listele
    getEvents() {
        return Object.keys(this.events);
    }
}

// Global Event Bus instance
const eventBus = new EventBus();

// Global erişim için window'a ekle
window.eventBus = eventBus;

// Production süreci event handler'ları
class ProductionEventHandlers {
    constructor() {
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        // Üretim başlatıldığında
        eventBus.on('production-started', (production) => {
            console.log('Production started:', production);
            this.handleProductionStarted(production);
        });
        
        // Üretim duraklatıldığında
        eventBus.on('production-paused', (production) => {
            console.log('Production paused:', production);
            this.handleProductionPaused(production);
        });
        
        // Üretim devam ettirildiğinde
        eventBus.on('production-resumed', (production) => {
            console.log('Production resumed:', production);
            this.handleProductionResumed(production);
        });
        
        // Üretim tamamlandığında
        eventBus.on('production-completed', (production) => {
            console.log('Production completed:', production);
            this.handleProductionCompleted(production);
        });
        
        // Aşama tamamlandığında
        eventBus.on('stage-completed', (stage) => {
            console.log('Stage completed:', stage);
            this.handleStageCompleted(stage);
        });
        
        // Kalite kontrol tamamlandığında
        eventBus.on('quality-check-completed', (check) => {
            console.log('Quality check completed:', check);
            this.handleQualityCheckCompleted(check);
        });
        
        // Plan onaylandığında
        eventBus.on('plan-approved', (plan) => {
            console.log('Plan approved:', plan);
            this.handlePlanApproved(plan);
        });
    }
    
    handleProductionStarted(production) {
        // State'i güncelle
        if (window.stateManager) {
            window.stateManager.updateState('activeProduction', production);
            window.stateManager.updateState('workflowStatus', 'producing');
            window.stateManager.addNotification('Üretim başlatıldı', 'success');
        }
        
        // Tab'ları güncelle
        this.updateTabsForProduction();
        
        // Aktif üretimler listesini yenile
        if (typeof loadActiveProductions === 'function') {
            loadActiveProductions();
        }
    }
    
    handleProductionPaused(production) {
        if (window.stateManager) {
            window.stateManager.addNotification('Üretim duraklatıldı', 'warning');
        }
        
        // Aktif üretimler listesini yenile
        if (typeof loadActiveProductions === 'function') {
            loadActiveProductions();
        }
    }
    
    handleProductionResumed(production) {
        if (window.stateManager) {
            window.stateManager.addNotification('Üretim devam ettirildi', 'info');
        }
        
        // Aktif üretimler listesini yenile
        if (typeof loadActiveProductions === 'function') {
            loadActiveProductions();
        }
    }
    
    handleProductionCompleted(production) {
        if (window.stateManager) {
            window.stateManager.updateState('activeProduction', null);
            window.stateManager.updateState('workflowStatus', 'completed');
            window.stateManager.addNotification('Üretim tamamlandı', 'success');
        }
        
        // Geçmişe taşı
        if (typeof loadProductionHistory === 'function') {
            loadProductionHistory();
        }
        
        // Aktif üretimler listesini yenile
        if (typeof loadActiveProductions === 'function') {
            loadActiveProductions();
        }
    }
    
    handleStageCompleted(stage) {
        if (window.stateManager) {
            window.stateManager.addNotification(`Aşama tamamlandı: ${stage.stage_name}`, 'info');
        }
        
        // Kalite kontrol gerekli mi kontrol et
        if (stage.quality_check_required) {
            this.enableQualityControl(stage);
        } else {
            this.moveToNextStage(stage);
        }
    }
    
    handleQualityCheckCompleted(check) {
        if (window.stateManager) {
            window.stateManager.addNotification('Kalite kontrol tamamlandı', 'success');
        }
        
        // Sonraki aşamaya geç
        this.moveToNextStage(check);
    }
    
    handlePlanApproved(plan) {
        if (window.stateManager) {
            window.stateManager.updateState('currentPlan', plan);
            window.stateManager.updateState('workflowStatus', 'planning');
            window.stateManager.addNotification('Plan onaylandı', 'success');
        }
        
        // Üretim başlatma tab'ını aktif et
        this.enableProductionStart(plan);
    }
    
    updateTabsForProduction() {
        if (window.stateManager) {
            // Üretim aşamaları tab'ını aktif et
            window.stateManager.state.tabStates['production-stages'].enabled = true;
            window.stateManager.state.tabStates['production-stages'].status = 'active';
            
            // Kalite kontrol tab'ını hazırla
            window.stateManager.state.tabStates['quality-control'].enabled = true;
            window.stateManager.state.tabStates['quality-control'].status = 'idle';
            
            window.stateManager.updateTabStates();
        }
    }
    
    enableQualityControl(stage) {
        if (window.stateManager) {
            window.stateManager.state.tabStates['quality-control'].enabled = true;
            window.stateManager.state.tabStates['quality-control'].status = 'active';
            window.stateManager.updateState('workflowStatus', 'quality_check');
            window.stateManager.updateTabStates();
        }
    }
    
    moveToNextStage(stage) {
        // Sonraki aşamayı başlat
        if (typeof startNextStage === 'function') {
            startNextStage(stage.production_id);
        }
    }
    
    enableProductionStart(plan) {
        if (window.stateManager) {
            window.stateManager.state.tabStates['production-start'].enabled = true;
            window.stateManager.state.tabStates['production-start'].status = 'active';
            window.stateManager.updateTabStates();
        }
    }
}

// Event handler'ları başlat
const productionEventHandlers = new ProductionEventHandlers();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, ProductionEventHandlers };
}
