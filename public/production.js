// Üretim Yönetimi JavaScript
// Faz 0: State Management ve Event Bus entegrasyonu

// Bildirimleri geçici olarak kapat
function showNotification(message, type = 'info') {
    console.log('🔕 Bildirim kapatıldı:', message, type);
    return;
}

// Global değişkenler
let hammaddeler = [];
let yarimamuller = [];
// let nihaiUrunler = []; // production.html'de tanımlanmış, duplicate variable hatası önlemek için kaldırıldı
let urunAgaci = [];
let activeProductions = [];
let productionHistory = [];
let currentProductionId = null;
let currentOrderId = null; // Sipariş düzenleme için

// Faz 7: Aşama takip sistemi değişkenleri
let stageTemplates = [];
let realtimeStages = [];
let stagePerformance = {};
let realtimeInterval = null;
let flowchartData = [];

// Operatör takibi değişkenleri
let operators = [];
let operatorProductions = [];
let operatorPerformance = {};
let operatorRealtimeInterval = null;
let previousOperators = [];
let previousOperatorProductions = [];

// Faz 0: State Manager kontrolü - window.stateManager kullanılıyor

// State Manager, Event Bus, Workflow Engine ve Real-time Updates'ı başlat
function initializeStateManagement() {
    if (typeof window.stateManager !== 'undefined') {
        console.log('State Manager initialized');
    } else {
        console.warn('State Manager not found');
    }
    
    if (typeof window.eventBus !== 'undefined') {
        console.log('Event Bus initialized');
    } else {
        console.warn('Event Bus not found');
    }
    
    if (typeof window.workflowEngine !== 'undefined') {
        console.log('Workflow Engine initialized');
        setupWorkflowEventListeners();
    } else {
        console.warn('Workflow Engine not found');
    }
    
    // Real-time Updates kontrolü - script yüklenme sırasına bağlı olabilir
    if (typeof window.realTimeUpdates !== 'undefined') {
        console.log('Real-time Updates initialized');
        setupRealTimeEventListeners();
    } else {
        // Script henüz yüklenmemiş olabilir, kısa bir süre sonra tekrar dene
        setTimeout(() => {
            if (typeof window.realTimeUpdates !== 'undefined') {
                console.log('Real-time Updates initialized (delayed)');
                setupRealTimeEventListeners();
            } else {
                console.log('Real-time Updates not available - continuing without real-time features');
            }
        }, 1000);
    }
}

// Faz 3: Üretim Planlama değişkenleri
let productionPlans = [];
let resources = [];
let orders = [];
let planningStatistics = {};

// Barkod okutma sistemi değişkenleri
let currentProduction = null;
let currentProductionType = null;
let scannedBarcodes = [];
let productionStats = {
    target: 0,
    produced: 0,
    success: 0,
    error: 0
};

// Polling ile veri güncelleme
let pollingInterval = null;

// Polling başlat
function startPolling() {
    console.log('🔄 Polling başlatılıyor...');
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    pollingInterval = setInterval(() => {
        // Siparişleri ve üretim planlarını periyodik olarak yenile
        loadOrders();
        loadProductionPlans();
    }, 5000); // 5 saniyede bir güncelle
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Faz 0: State Management'ı başlat
    initializeStateManagement();
    
    // Polling başlat
    startPolling();
    
    loadAllData();
    setupEventListeners();
    
    // Tab event listener'ları
    setupTabEventListeners();
    
    // Müşteri listesini yükle
    loadCustomers();
    
    // Sipariş Yönetimi tab'ı için direkt yükleme (varsayılan aktif tab)
    // Sayfa yüklendi - Sipariş Yönetimi verileri yükleniyor
    loadOrders();
    loadPlanningStatistics();
});

// Tüm verileri yükle
async function loadAllData() {
    try {
        await Promise.all([
            loadHammaddeler(),
            loadYarimamuller(),
            loadNihaiUrunler(),
            loadUrunAgaci(),
            loadProductionHistory()
        ]);
        
        updateProductSelects();
        
        // Autocomplete sistemini kur (veriler yüklendikten sonra)
        setupProductionProductAutocomplete();
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        alert('Veriler yüklenirken hata oluştu', 'error');
    }
}

// Tab event listener'larını kur
function setupTabEventListeners() {
    console.log('Tab event listener\'ları kuruluyor...');
    
    // Üretim Planlama tab
    const planningTab = document.getElementById('production-planning-tab');
    if (planningTab) {
        planningTab.addEventListener('shown.bs.tab', function() {
            console.log('Üretim Planlama tab\'ı açıldı');
            loadProductionPlans();
            loadResources();
            loadOrders();
            loadPlanningStatistics();
        });
    }
    
    
    
    // Üretim Aşamaları tab
    const stagesTab = document.getElementById('production-stages-tab');
    if (stagesTab) {
        stagesTab.addEventListener('shown.bs.tab', function() {
            // Üretim Aşamaları tab'ı açıldı
            // Tüm aşama verilerini yükle
            console.log('📊 Tüm aşama verilerini yüklüyor...');
            loadStageTemplates();
            loadStagePerformance();
            // loadRealtimeStages(); // Kaldırıldı
            // loadStageAnalytics(); // Kaldırıldı
            // loadEfficiencyReport(); // Kaldırıldı
        });
    } else {
        console.error('❌ production-stages-tab element bulunamadı!');
    }
    
    // Kalite Kontrol tab
    const qualityTab = document.getElementById('quality-control-tab');
    if (qualityTab) {
        // qualityTab.addEventListener('shown.bs.tab', function() {
        //     console.log('Kalite Kontrol tab\'ı açıldı');
        //     loadQualityCheckpoints();
        //     loadQualityStandards();
        //     loadQualityStatistics();
        // }); // KALDIRILDI: Kalite kontrol özelliği kaldırıldı
    }
    
    // Üretim Geçmişi tab
    const historyTab = document.getElementById('production-history-tab');
    if (historyTab) {
        historyTab.addEventListener('shown.bs.tab', function() {
            console.log('Üretim Geçmişi tab\'ı açıldı');
            loadProductionHistory();
        });
    }
    
    // Sayfa yüklendiğinde otomatik olarak aktif tab verilerini yükle
    setTimeout(() => {
        console.log('Otomatik veri yükleme başlatılıyor...');
        const activeTab = document.querySelector('.nav-link.active');
        if (activeTab) {
            if (activeTab.id === 'production-planning-tab') {
            console.log('Üretim Planlama tab\'ı aktif, veriler yükleniyor...');
            loadProductionPlans();
            loadResources();
            loadOrders();
            loadPlanningStatistics();
            } else if (activeTab.id === 'production-stages-tab') {
                console.log('Üretim Aşamaları tab\'ı aktif, veriler yükleniyor...');
                loadStageTemplates();
                loadStagePerformance();
                // loadRealtimeStages(); // Kaldırıldı
                // loadStageAnalytics(); // Kaldırıldı
                // loadEfficiencyReport(); // Kaldırıldı
            }
        }
    }, 1000);
}


// Production modal autocomplete sistemi kurulumu
function setupProductionProductAutocomplete() {
    const input = document.getElementById('production-product-autocomplete');
    const results = document.getElementById('production-autocomplete-results');
    const hiddenInput = document.getElementById('production-product');
    
    // Elementlerin varlığını kontrol et
    if (!input || !results || !hiddenInput) {
        console.error('Production autocomplete elementleri bulunamadı');
        return;
    }
    
    console.log('Production autocomplete sistemi kuruluyor...');
    
    let selectedIndex = -1;
    let filteredProducts = [];
    
    // Input event listener
    input.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length < 3) {
            results.style.display = 'none';
            hiddenInput.value = '';
            return;
        }
        
        // Tüm ürünleri birleştir (hammadde, yarı mamul, nihai)
        const allProducts = [
            ...hammaddeler.filter(h => h.aktif).map(h => ({...h, type: 'hammadde'})),
            ...yarimamuller.filter(y => y.aktif).map(y => ({...y, type: 'yarimamul'})),
            ...(window.nihaiUrunler || []).filter(n => n.aktif).map(n => ({...n, type: 'nihai'}))
        ];
        
        // Ürünleri filtrele
        filteredProducts = allProducts.filter(product => 
            product.kod.toLowerCase().startsWith(query.toLowerCase()) ||
            product.kod.toLowerCase().includes(query.toLowerCase()) ||
            product.ad.toLowerCase().includes(query.toLowerCase())
        ).sort((a, b) => {
            const aStartsWith = a.kod.toLowerCase().startsWith(query.toLowerCase());
            const bStartsWith = b.kod.toLowerCase().startsWith(query.toLowerCase());
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return a.kod.localeCompare(b.kod);
        });
        
        updateProductionAutocompleteResults(filteredProducts);
        results.style.display = 'block';
        selectedIndex = -1;
    });
    
    // Klavye navigasyonu
    input.addEventListener('keydown', function(e) {
        if (results.style.display === 'none') return;
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, filteredProducts.length - 1);
                updateProductionSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateProductionSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
                    selectProductionProduct(filteredProducts[selectedIndex]);
                }
                break;
            case 'Escape':
                results.style.display = 'none';
                selectedIndex = -1;
                break;
        }
    });
    
    // Dışarı tıklandığında kapat
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.style.display = 'none';
            selectedIndex = -1;
        }
    });
    
    // Sonuç item'larına tıklama
    results.addEventListener('click', function(e) {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
            const index = parseInt(item.dataset.index);
            if (index >= 0 && index < filteredProducts.length) {
                selectProductionProduct(filteredProducts[index]);
            }
        }
    });
    
    // Autocomplete sonuçlarını güncelle
    function updateProductionAutocompleteResults(products) {
        if (products.length === 0) {
            results.innerHTML = '<div class="autocomplete-no-results">Ürün bulunamadı</div>';
            return;
        }
        
        results.innerHTML = products.slice(0, 10).map((product, index) => `
            <div class="autocomplete-item" data-index="${index}">
                <div>
                    <strong>${product.kod}</strong>
                    <span class="badge bg-${product.type === 'hammadde' ? 'secondary' : product.type === 'yarimamul' ? 'warning' : 'primary'} ms-2">${product.type}</span><br>
                    <small>${product.ad}</small>
                </div>
                <div>
                    <small>${product.miktar || 0} ${product.birim}</small>
                </div>
            </div>
        `).join('');
    }
    
    // Seçim güncelleme
    function updateProductionSelection() {
        const items = results.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === selectedIndex);
        });
    }
    
    // Ürün seçimi
    function selectProductionProduct(product) {
        input.value = `${product.kod} - ${product.ad}`;
        hiddenInput.value = product.id;
        results.style.display = 'none';
        selectedIndex = -1;
        
        // Üretim tipini belirle
        currentProductionType = product.type;
        
        // Malzeme kontrolünü tetikle
        checkMaterialsForProduction();
    }
}

// Faz 0: Workflow event listener'larını ayarla
function setupWorkflowEventListeners() {
    if (!window.eventBus || !window.workflowEngine) {
        return;
    }

    // Workflow başlatıldığında
    window.eventBus.on('workflow-started', (data) => {
        console.log('Workflow başlatıldı:', data);
        updateWorkflowStatus(data.workflowId);
    });

    // Adım tamamlandığında
    window.eventBus.on('step-completed', (data) => {
        console.log('Adım tamamlandı:', data);
        updateWorkflowStatus(data.workflowId);
    });

    // Workflow tamamlandığında
    window.eventBus.on('workflow-completed', (data) => {
        console.log('Workflow tamamlandı:', data);
        updateWorkflowStatus(data.workflowId);
        showWorkflowCompletionNotification(data.workflowId);
    });

    // Workflow duraklatıldığında
    window.eventBus.on('workflow-paused', (data) => {
        console.log('Workflow duraklatıldı:', data);
        updateWorkflowStatus(data.workflowId);
    });

    // Workflow devam ettirildiğinde
    window.eventBus.on('workflow-resumed', (data) => {
        console.log('Workflow devam ettirildi:', data);
        updateWorkflowStatus(data.workflowId);
    });
}

// Workflow durumunu güncelle
function updateWorkflowStatus(workflowId) {
    if (!window.workflowEngine) return;

    const status = window.workflowEngine.getWorkflowStatus(workflowId);
    if (!status) return;

    // Navbar'daki workflow status'u güncelle
    const statusElement = document.getElementById('workflow-status');
    if (statusElement) {
        statusElement.textContent = status.name;
        statusElement.className = `badge ${getWorkflowStatusClass(status.status)}`;
    }

    // State Manager'ı güncelle
    if (window.stateManager) {
        window.stateManager.updateState('currentWorkflow', status);
    }
}

// Workflow durumuna göre CSS class'ı al
function getWorkflowStatusClass(status) {
    switch(status) {
        case 'idle': return 'bg-secondary';
        case 'running': return 'bg-success';
        case 'paused': return 'bg-warning';
        case 'completed': return 'bg-info';
        case 'error': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

// Workflow tamamlama bildirimi göster
function showWorkflowCompletionNotification(workflowId) {
    if (window.stateManager) {
        window.stateManager.addNotification(`Workflow '${workflowId}' tamamlandı!`, 'success');
    }
}

// Faz 0: Real-time event listener'larını ayarla
function setupRealTimeEventListeners() {
    if (!window.eventBus || !window.realTimeUpdates) {
        return;
    }

    // Veri güncellendiğinde
    window.eventBus.on('data-updated', (data) => {
        console.log('Veri güncellendi:', data.dataType);
        handleDataUpdate(data.dataType, data.data);
    });

    // Sistem durumu güncellendiğinde
    window.eventBus.on('system-status-updated', (status) => {
        updateSystemStatusDisplay(status);
    });

    console.log('Real-time event listeners kuruldu');
}

// Veri güncellemesini işle
function handleDataUpdate(dataType, data) {
    switch(dataType) {
        case 'active-productions':
            activeProductions = data;
            // displayActiveProductions(); // Artık kullanılmıyor - yeni tasarımda planlanan üretimler kullanılıyor
            break;
        case 'production-history':
            productionHistory = data;
            displayProductionHistory();
            break;
        case 'production-stages':
            // Stage templates güncellendi
            if (typeof loadStageTemplates === 'function') {
                loadStageTemplates();
            }
            break;
        case 'quality-checkpoints':
            // Quality checkpoints güncellendi - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
            // if (typeof loadQualityCheckpoints === 'function') {
            //     loadQualityCheckpoints();
            // }
            break;
        case 'production-plans':
            productionPlans = data;
            if (typeof loadProductionPlans === 'function') {
                loadProductionPlans();
            }
            break;
    }
}

// Sistem durumu görüntüsünü güncelle
function updateSystemStatusDisplay(status) {
    // Navbar'da sistem durumu göstergesi
    const statusElement = document.getElementById('workflow-status');
    if (statusElement && !statusElement.textContent.includes('Workflow')) {
        const statusText = status.isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
        const statusClass = status.isOnline ? 'bg-success' : 'bg-danger';
        statusElement.textContent = statusText;
        statusElement.className = `badge ${statusClass}`;
    }
}

// Bu fonksiyon kaldırıldı - çakışma önlemek için
// function setupTabEventListeners() {
//     // Tab değişim event'lerini dinle
//     const tabElements = document.querySelectorAll('[data-bs-toggle="tab"]');
//     
//     tabElements.forEach(tabElement => {
//         tabElement.addEventListener('shown.bs.tab', function(event) {
//             const targetTab = event.target.getAttribute('data-bs-target');
//             const tabId = event.target.id;
//             
//             console.log('Tab changed to:', tabId, targetTab);
//             
//             // State Manager'ı güncelle
//             if (window.stateManager) {
//                 window.stateManager.updateState('activeTab', tabId);
//             }
//             
//             // Event Bus'a bildir
//             if (window.eventBus) {
//                 window.eventBus.emit('tab-changed', {
//                     tabId: tabId,
//                     targetTab: targetTab,
//                     timestamp: new Date()
//                 });
//             }
//             
//             // Tab'a özel veri yükleme
//             loadTabData(tabId);
//         });
//     });
// }

// Tab'a özel veri yükleme - Üretim proses sırasına göre
function loadTabData(tabId) {
    switch(tabId) {
        case 'production-planning-tab':
            if (typeof loadProductionPlans === 'function') {
                loadProductionPlans();
                loadResources();
                loadOrders();
                loadPlanningStatistics();
            }
            break;
        case 'production-stages-tab':
            // Üretim Aşamaları tab verileri yükleniyor
            if (typeof loadStageTemplates === 'function') {
                loadStageTemplates();
                loadStagePerformance();
                // loadRealtimeStages(); // Kaldırıldı
                // loadStageAnalytics(); // Kaldırıldı
                // loadEfficiencyReport(); // Kaldırıldı
            }
            break;
        case 'quality-control-tab':
            // KALDIRILDI: Kalite kontrol özelliği kaldırıldı
            // if (typeof loadQualityCheckpoints === 'function') {
            //     loadQualityCheckpoints();
            //     loadQualityStandards();
            //     loadQualityStatistics();
            // }
            break;
        case 'production-history-tab':
            if (typeof loadProductionHistory === 'function') {
                loadProductionHistory();
            }
            break;
    }
}

// Event listener'ları ayarla
function setupEventListeners() {
    // Faz 0: Tab değişim event'lerini ekle
    setupTabEventListeners();
    
    // Yarı mamul üretim formu
    document.getElementById('yarimamul-production-form-element').addEventListener('submit', handleYarimamulProduction);
    
    // Nihai ürün üretim formu
    document.getElementById('nihai-production-form-element').addEventListener('submit', handleNihaiProduction);
    
    // Yarı mamul ürün seçimi değiştiğinde
    document.getElementById('yarimamul-product').addEventListener('change', function() {
        if (this.value) {
            calculateYarimamulMaterials();
        }
    });
    
    // Nihai ürün seçimi değiştiğinde
    document.getElementById('nihai-product').addEventListener('change', function() {
        if (this.value) {
            calculateNihaiMaterials();
        }
    });
    
    
    // Barkod okutma sistemi event listener'ları
    document.getElementById('production-product').addEventListener('change', function() {
        if (this.value) {
            checkMaterialsForProduction();
        }
    });
    
    // Tab değişim event'leri - Üretim proses sırasına göre
    document.getElementById('production-planning-tab').addEventListener('shown.bs.tab', function() {
        loadProductionPlans();
        loadResources();
        loadOrders();
        loadPlanningStatistics();
    });
    
    
    
    // Operatör Takibi tab'ı için event listener
    document.getElementById('production-stages-tab').addEventListener('shown.bs.tab', function() {
        // Operatör Takibi tab'ı aktif oldu
        loadOperatorStatus();
    });
    
    // document.getElementById('quality-control-tab').addEventListener('shown.bs.tab', function() {
    //     loadQualityCheckpoints();
    //     loadQualityStandards();
    //     loadQualityStatistics();
    // }); // KALDIRILDI: Kalite kontrol özelliği kaldırıldı
    
    document.getElementById('production-history-tab').addEventListener('shown.bs.tab', function() {
        loadProductionHistory();
    });
    
    document.getElementById('production-quantity').addEventListener('input', function() {
        if (this.value && document.getElementById('production-product').value) {
            checkMaterialsForProduction();
        }
    });
    
    // Barkod input enter tuşu ve otomatik okutma
    const barcodeInput = document.getElementById('barcode-input');
    if (barcodeInput) {
        barcodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            scanBarcode();
        }
    });
    }
    
    // Barkod input değişiklik takibi (otomatik okutma)
    if (barcodeInput) {
        barcodeInput.addEventListener('input', function(e) {
        const barcode = e.target.value.trim();
        
        // Eğer barkod yeterince uzunsa (genellikle barkodlar 8+ karakter) otomatik okut
        if (barcode.length >= 8) {
            // Kısa bir gecikme ile otomatik okut (kullanıcı yazmayı bitirsin)
            clearTimeout(window.barcodeTimeout);
            window.barcodeTimeout = setTimeout(() => {
                scanBarcode();
            }, 500); // 500ms gecikme
        }
    });
    }
    
    // Filtreleme event listener'ları
    const searchElement = document.getElementById('production-search');
    if (searchElement) {
        searchElement.addEventListener('input', filterProductionHistory);
    }
    
    const typeFilterElement = document.getElementById('production-type-filter');
    if (typeFilterElement) {
        typeFilterElement.addEventListener('change', filterProductionHistory);
    }
    
    const statusFilterElement = document.getElementById('production-status-filter');
    if (statusFilterElement) {
        statusFilterElement.addEventListener('change', filterProductionHistory);
    }
}

// Hammaddeleri yükle
async function loadHammaddeler() {
    try {
        const response = await fetch('/api/hammaddeler');
        if (response.ok) {
            hammaddeler = await response.json();
        }
    } catch (error) {
        console.error('Hammaddeler yüklenemedi:', error);
    }
}

// Yarı mamulleri yükle
async function loadYarimamuller() {
    try {
        const response = await fetch('/api/yarimamuller');
        if (response.ok) {
            yarimamuller = await response.json();
        }
    } catch (error) {
        console.error('Yarı mamuller yüklenemedi:', error);
    }
}

// Nihai ürünleri yükle
async function loadNihaiUrunler() {
    try {
        const response = await fetch('/api/nihai_urunler');
        if (response.ok) {
            window.nihaiUrunler = await response.json();
        }
    } catch (error) {
        console.error('Nihai ürünler yüklenemedi:', error);
    }
}

// Ürün ağacını yükle
async function loadUrunAgaci() {
    try {
        const response = await fetch('/api/urun_agaci');
        if (response.ok) {
            urunAgaci = await response.json();
        }
    } catch (error) {
        console.error('Ürün ağacı yüklenemedi:', error);
    }
}


// Aktif üretimleri göster (artık kullanılmıyor - yeni tasarımda planlanan üretimler kullanılıyor)
function displayActiveProductions() {
    // Bu fonksiyon artık kullanılmıyor - yeni tasarımda planlanan üretimler kullanılıyor
    console.log('displayActiveProductions çağrıldı ama artık kullanılmıyor');
}

// Üretim geçmişini yükle
async function loadProductionHistory() {
    try {
        console.log('🔄 Tamamlanan üretimler yükleniyor...');
        const response = await fetch('/api/completed-productions');
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Tamamlanan üretimler yüklendi:', data);
            productionHistory = data;
            displayCompletedProductions();
        } else {
            console.error('❌ Tamamlanan üretimler yüklenemedi:', data.error);
            productionHistory = [];
            displayCompletedProductions();
        }
    } catch (error) {
        console.error('❌ Üretim geçmişi yüklenemedi:', error);
        productionHistory = [];
        displayCompletedProductions();
    }
}

// Global değişken - seçili üretim
let selectedProduction = null;

// Üretim detaylarını görüntüle
function viewProductionDetails(productionId) {
    selectedProduction = activeProductions.find(p => p.id === productionId);
    if (!selectedProduction) {
        alert('Üretim bulunamadı', 'error');
        return;
    }
    
    const progressPercentage = Math.round(((selectedProduction.uretilen_miktar || 0) / (selectedProduction.hedef_miktar || 1)) * 100);
    const remaining = (selectedProduction.hedef_miktar || 0) - (selectedProduction.uretilen_miktar || 0);
    
    const content = `
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Üretim Bilgileri</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Ürün Adı:</strong> ${selectedProduction.urun_adi || 'Bilinmiyor'}</p>
                        <p><strong>Ürün Kodu:</strong> ${selectedProduction.urun_kodu || 'N/A'}</p>
                        <p><strong>Üretim ID:</strong> ${selectedProduction.id}</p>
                        <p><strong>Ürün Tipi:</strong> ${selectedProduction.product_type || 'N/A'}</p>
                        <p><strong>Oluşturan:</strong> ${selectedProduction.created_by || 'N/A'}</p>
                        <p><strong>Başlangıç:</strong> ${selectedProduction.start_time ? new Date(selectedProduction.start_time).toLocaleString('tr-TR') : 'Bilinmiyor'}</p>
                        ${selectedProduction.end_time ? `<p><strong>Bitiş:</strong> ${new Date(selectedProduction.end_time).toLocaleString('tr-TR')}</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>İlerleme Durumu</h6>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-6">
                                <div class="text-center">
                                    <h4 class="text-primary">${selectedProduction.hedef_miktar || 0}</h4>
                                    <small class="text-muted">Hedef Miktar</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="text-center">
                                    <h4 class="text-success">${selectedProduction.uretilen_miktar || 0}</h4>
                                    <small class="text-muted">Üretilen</small>
                                </div>
                            </div>
                        </div>
                        <div class="progress mb-3" style="height: 25px;">
                            <div class="progress-bar ${progressPercentage === 100 ? 'bg-success' : progressPercentage > 50 ? 'bg-info' : 'bg-warning'}" 
                                 role="progressbar" 
                                 style="width: ${progressPercentage}%">
                                ${progressPercentage}%
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-6">
                                <div class="text-center">
                                    <h5 class="text-warning">${remaining}</h5>
                                    <small class="text-muted">Kalan</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="text-center">
                                    <span class="badge bg-${selectedProduction.durum === 'tamamlandi' ? 'success' : selectedProduction.durum === 'devam_ediyor' ? 'warning' : 'secondary'} fs-6">
                                        ${selectedProduction.durum === 'tamamlandi' ? 'Tamamlandı' : 
                                          selectedProduction.durum === 'devam_ediyor' ? 'Devam Ediyor' : 
                                          selectedProduction.durum || 'Bilinmiyor'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-sticky-note me-2"></i>Notlar</h6>
                    </div>
                    <div class="card-body">
                        <p>${selectedProduction.notes || 'Not bulunmuyor'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('productionDetailContent').innerHTML = content;
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('productionDetailModal'));
    modal.show();
}

// Üretime devam et
async function continueProduction(productionId) {
    const production = activeProductions.find(p => p.id === productionId);
    if (!production) {
        alert('Üretim bulunamadı', 'error');
        return;
    }
    
    if (production.status === 'active') {
        alert('Bu üretim zaten aktif durumda', 'info');
        return;
    }
    
    try {
        const response = await fetch(`/api/productions/${productionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'active'
            })
        });
        
        if (response.ok) {
            alert('Üretim başarıyla devam ettirildi', 'success');
            
            // Modal'ları kapat
            const detailModal = bootstrap.Modal.getInstance(document.getElementById('productionDetailModal'));
            if (detailModal) {
                detailModal.hide();
            }
            
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editProductionModal'));
            if (editModal) {
                editModal.hide();
            }
            
            // Modal backdrop'ları temizle
            document.body.classList.remove('modal-open');
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Üretim durumunu güncelle
            const production = activeProductions.find(p => p.id === productionId);
            if (production) {
                production.status = 'active';
            }
            
            // UI'yi güncelle
            displayActiveProductions();
            
            console.log('Üretim devam ettirildi, durum:', production?.status);
        } else {
            const error = await response.json();
            alert(error.error || 'Üretim devam ettirilemedi', 'error');
        }
    } catch (error) {
        console.error('Üretim devam ettirme hatası:', error);
        alert('Üretim devam ettirilemedi', 'error');
    }
}

// Üretimi duraklat
async function pauseProduction(productionId) {
    const production = activeProductions.find(p => p.id === productionId);
    if (!production) {
        alert('Üretim bulunamadı', 'error');
        return;
    }
    
    if (production.status === 'paused') {
        alert('Bu üretim zaten duraklatılmış durumda', 'info');
        return;
    }
    
    if (production.status === 'completed') {
        alert('Tamamlanmış üretim duraklatılamaz', 'error');
        return;
    }
    
    if (production.status === 'cancelled') {
        alert('İptal edilmiş üretim duraklatılamaz', 'error');
        return;
    }
    
    if (!confirm(`"${production.urun_adi}" üretimini duraklatmak istediğinizden emin misiniz?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/productions/${productionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'paused'
            })
        });
        
        if (response.ok) {
            alert('Üretim başarıyla duraklatıldı', 'success');
            
            // Modal'ları kapat
            const detailModal = bootstrap.Modal.getInstance(document.getElementById('productionDetailModal'));
            if (detailModal) {
                detailModal.hide();
            }
            
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editProductionModal'));
            if (editModal) {
                editModal.hide();
            }
            
            // Modal backdrop'ları temizle
            document.body.classList.remove('modal-open');
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Üretim durumunu güncelle
            const production = activeProductions.find(p => p.id === productionId);
            if (production) {
                production.status = 'paused';
            }
            
            // UI'yi güncelle
            displayActiveProductions();
            
            console.log('Üretim duraklatıldı, durum:', production?.status);
        } else {
            const error = await response.json();
            alert(error.error || 'Üretim duraklatılamadı', 'error');
        }
    } catch (error) {
        console.error('Üretim duraklatma hatası:', error);
        alert('Üretim duraklatılamadı', 'error');
    }
}

// Üretimi durdur
async function stopProduction(productionId) {
    const production = activeProductions.find(p => p.id === productionId);
    if (!production) {
        alert('Üretim bulunamadı', 'error');
        return;
    }
    
    if (production.status === 'completed') {
        alert('Bu üretim zaten tamamlanmış', 'info');
        return;
    }
    
    if (production.status === 'cancelled') {
        alert('Bu üretim zaten iptal edilmiş', 'info');
        return;
    }
    
    if (!confirm(`"${production.urun_adi}" üretimini durdurmak istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/productions/${productionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'cancelled',
                end_time: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            alert('Üretim başarıyla durduruldu', 'success');
            
            // Modal'ları kapat
            const detailModal = bootstrap.Modal.getInstance(document.getElementById('productionDetailModal'));
            if (detailModal) {
                detailModal.hide();
            }
            
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editProductionModal'));
            if (editModal) {
                editModal.hide();
            }
            
            // Modal backdrop'ları temizle
            document.body.classList.remove('modal-open');
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Durdurulan üretimi listeden çıkar
            activeProductions = activeProductions.filter(p => p.id !== productionId);
            
            // UI'yi güncelle
            displayActiveProductions();
            
            // Aktif üretim sayısını güncelle
            const countElement = document.getElementById('active-productions-count');
            if (countElement) {
                countElement.textContent = activeProductions.length;
            }
            
            console.log('Üretim durduruldu, aktif üretim sayısı:', activeProductions.length);
        } else {
            const error = await response.json();
            alert(error.error || 'Üretim durdurulamadı', 'error');
        }
    } catch (error) {
        console.error('Üretim durdurma hatası:', error);
        alert('Üretim durdurulamadı', 'error');
    }
}

// Üretim düzenleme modalını aç
function editProduction() {
    if (!selectedProduction) {
        alert('Seçili üretim bulunamadı', 'error');
        return;
    }
    
    // Form alanlarını doldur
    document.getElementById('edit-product-name').value = selectedProduction.urun_adi || '';
    document.getElementById('edit-product-code').value = selectedProduction.urun_kodu || '';
    document.getElementById('edit-target-quantity').value = selectedProduction.hedef_miktar || 0;
    document.getElementById('edit-produced-quantity').value = selectedProduction.uretilen_miktar || 0;
    document.getElementById('edit-production-status').value = selectedProduction.status || 'active';
    document.getElementById('edit-production-priority').value = selectedProduction.priority || 'normal';
    document.getElementById('edit-production-notes').value = selectedProduction.notes || '';
    
    // Detay modalını kapat, düzenleme modalını aç
    bootstrap.Modal.getInstance(document.getElementById('productionDetailModal')).hide();
    
    const editModal = new bootstrap.Modal(document.getElementById('editProductionModal'));
    editModal.show();
}

// Üretim değişikliklerini kaydet
async function saveProductionChanges() {
    if (!selectedProduction) {
        alert('Seçili üretim bulunamadı', 'error');
        return;
    }
    
    const formData = {
        target_quantity: parseInt(document.getElementById('edit-target-quantity').value),
        quantity: parseInt(document.getElementById('edit-produced-quantity').value),
        status: document.getElementById('edit-production-status').value,
        priority: document.getElementById('edit-production-priority').value,
        notes: document.getElementById('edit-production-notes').value
    };
    
    // Validation
    if (formData.target_quantity < 1) {
        alert('Hedef miktar en az 1 olmalıdır', 'error');
        return;
    }
    
    if (formData.quantity < 0) {
        alert('Üretilen miktar negatif olamaz', 'error');
        return;
    }
    
    if (formData.quantity > formData.target_quantity) {
        alert('Üretilen miktar hedef miktardan fazla olamaz', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/productions/${selectedProduction.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert('Üretim başarıyla güncellendi', 'success');
            
            // Düzenleme modalını kapat
            bootstrap.Modal.getInstance(document.getElementById('editProductionModal')).hide();
            
            // Aktif üretimleri yenile
            await loadActiveProductions();
        } else {
            const error = await response.json();
            alert(error.error || 'Üretim güncellenemedi', 'error');
        }
    } catch (error) {
        console.error('Üretim güncelleme hatası:', error);
        alert('Üretim güncellenemedi', 'error');
    }
}

// Üretimi iptal et
async function cancelProduction() {
    if (!selectedProduction) {
        alert('Seçili üretim bulunamadı', 'error');
        return;
    }
    
    if (!confirm(`"${selectedProduction.urun_adi}" üretimini iptal etmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/productions/${selectedProduction.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'cancelled',
                end_time: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            alert('Üretim başarıyla iptal edildi', 'success');
            
            // Modal'ları kapat
            const detailModal = bootstrap.Modal.getInstance(document.getElementById('productionDetailModal'));
            if (detailModal) {
                detailModal.hide();
            }
            
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editProductionModal'));
            if (editModal) {
                editModal.hide();
            }
            
            // Modal backdrop'ları temizle
            document.body.classList.remove('modal-open');
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Aktif üretimleri yenile
            await loadActiveProductions();
        } else {
            const error = await response.json();
            alert(error.error || 'Üretim iptal edilemedi', 'error');
        }
    } catch (error) {
        console.error('Üretim iptal etme hatası:', error);
        alert('Üretim iptal edilemedi', 'error');
    }
}

// Ürün seçeneklerini güncelle
function updateProductSelects() {
    const yarimamulSelect = document.getElementById('yarimamul-product');
    const nihaiSelect = document.getElementById('nihai-product');
    
    // Yarı mamul seçeneklerini güncelle
    yarimamulSelect.innerHTML = '<option value="">Seçiniz...</option>';
    yarimamuller.forEach(yarimamul => {
        if (yarimamul.aktif) {
            const option = document.createElement('option');
            option.value = yarimamul.id;
            option.textContent = `${yarimamul.kod} - ${yarimamul.ad}`;
            yarimamulSelect.appendChild(option);
        }
    });
    
    // Nihai ürün seçeneklerini güncelle
    nihaiSelect.innerHTML = '<option value="">Seçiniz...</option>';
    (window.nihaiUrunler || []).forEach(nihai => {
        if (nihai.aktif) {
            const option = document.createElement('option');
            option.value = nihai.id;
            option.textContent = `${nihai.kod} - ${nihai.ad}`;
            nihaiSelect.appendChild(option);
        }
    });
}

// Üretim formunu göster
function showProductionForm(type) {
    // Önce tüm formları gizle
    document.querySelectorAll('.production-form').forEach(form => {
        form.style.display = 'none';
    });
    
    // Seçilen formu göster
    document.getElementById(`${type}-production-form`).style.display = 'block';
    
    // Formu sayfanın üstüne kaydır
    document.getElementById(`${type}-production-form`).scrollIntoView({ behavior: 'smooth' });
}

// Üretim formunu gizle
function hideProductionForm() {
    document.querySelectorAll('.production-form').forEach(form => {
        form.style.display = 'none';
    });
}

// Yarı mamul malzeme hesaplama
function calculateYarimamulMaterials() {
    const productId = parseInt(document.getElementById('yarimamul-product').value);
    const quantity = parseFloat(document.getElementById('yarimamul-quantity').value) || 0;
    
    if (!productId || quantity <= 0) {
        clearYarimamulMaterials();
        return;
    }
    
    // Ürün ağacından gerekli malzemeleri bul
    const requiredMaterials = urunAgaci.filter(item => 
        item.ana_urun_id === productId && item.ana_urun_tipi === 'yarimamul'
    );
    
    const materialsList = document.getElementById('yarimamul-materials-list');
    materialsList.innerHTML = '';
    
    let totalCost = 0;
    let hasInsufficientStock = false;
    
    requiredMaterials.forEach(material => {
        const hammadde = hammaddeler.find(h => h.id === material.alt_urun_id);
        if (hammadde) {
            const requiredQty = material.gerekli_miktar * quantity;
            const availableQty = hammadde.miktar || 0;
            const missingQty = Math.max(0, requiredQty - availableQty);
            const unitPrice = hammadde.birim_fiyat || 0;
            const totalPrice = requiredQty * unitPrice;
            
            totalCost += totalPrice;
            
            if (missingQty > 0) {
                hasInsufficientStock = true;
            }
            
        const row = document.createElement('tr');
            row.className = missingQty > 0 ? 'table-danger' : 'table-success';
        row.innerHTML = `
                <td>
                    <strong>${hammadde.kod}</strong><br>
                    <small class="text-muted">${hammadde.ad}</small>
                </td>
                <td class="text-center">
                    <span class="badge bg-primary">${requiredQty.toFixed(2)} ${hammadde.birim}</span>
                </td>
                <td class="text-center">
                    <span class="badge ${availableQty >= requiredQty ? 'bg-success' : 'bg-warning'}">
                        ${availableQty.toFixed(2)} ${hammadde.birim}
                    </span>
                </td>
                <td class="text-center">
                    ${missingQty > 0 ? 
                        `<span class="badge bg-danger">Eksik: ${missingQty.toFixed(2)} ${hammadde.birim}</span>` : 
                        `<span class="badge bg-success">Yeterli</span>`
                    }
                </td>
                <td class="text-end">₺${unitPrice.toFixed(2)}</td>
                <td class="text-end">₺${totalPrice.toFixed(2)}</td>
            `;
            materialsList.appendChild(row);
        }
    });
    
    document.getElementById('yarimamul-total-cost').textContent = `₺${totalCost.toFixed(2)}`;
    
    // Stok durumu uyarısı
    const costAlert = document.getElementById('yarimamul-total-cost').parentElement;
    if (hasInsufficientStock) {
        costAlert.className = 'alert alert-danger';
        costAlert.innerHTML = `
            <strong><i class="fas fa-exclamation-triangle me-2"></i>Stok Yetersiz!</strong> 
            Bazı hammaddeler yetersiz. Üretim başlatılamaz.
            <br><strong>Toplam Maliyet:</strong> <span id="yarimamul-total-cost">₺${totalCost.toFixed(2)}</span>
        `;
    } else {
        costAlert.className = 'alert alert-success';
        costAlert.innerHTML = `
            <strong><i class="fas fa-check-circle me-2"></i>Stok Yeterli!</strong> 
            Tüm hammaddeler mevcut. Üretim başlatılabilir.
            <br><strong>Toplam Maliyet:</strong> <span id="yarimamul-total-cost">₺${totalCost.toFixed(2)}</span>
        `;
    }
}

// Nihai ürün malzeme hesaplama
function calculateNihaiMaterials() {
    const productId = parseInt(document.getElementById('nihai-product').value);
    const quantity = parseFloat(document.getElementById('nihai-quantity').value) || 0;
    
    if (!productId || quantity <= 0) {
        clearNihaiMaterials();
                return;
    }
    
    // Ürün ağacından gerekli malzemeleri bul
    const requiredMaterials = urunAgaci.filter(item => 
        item.ana_urun_id === productId && item.ana_urun_tipi === 'nihai'
    );
    
    const materialsList = document.getElementById('nihai-materials-list');
    materialsList.innerHTML = '';
    
    let totalCost = 0;
    let hasInsufficientStock = false;
    
    requiredMaterials.forEach(material => {
        const yarimamul = yarimamuller.find(y => y.id === material.alt_urun_id);
    if (yarimamul) {
            const requiredQty = material.gerekli_miktar * quantity;
            const availableQty = yarimamul.miktar || 0;
            const missingQty = Math.max(0, requiredQty - availableQty);
            const unitPrice = yarimamul.birim_maliyet || 0;
            const totalPrice = requiredQty * unitPrice;
            
            totalCost += totalPrice;
            
            if (missingQty > 0) {
                hasInsufficientStock = true;
            }
            
        const row = document.createElement('tr');
            row.className = missingQty > 0 ? 'table-danger' : 'table-success';
        row.innerHTML = `
                <td>
                    <strong>${yarimamul.kod}</strong><br>
                    <small class="text-muted">${yarimamul.ad}</small>
            </td>
                <td class="text-center">
                    <span class="badge bg-primary">${requiredQty.toFixed(2)} ${yarimamul.birim}</span>
                </td>
                <td class="text-center">
                    <span class="badge ${availableQty >= requiredQty ? 'bg-success' : 'bg-warning'}">
                        ${availableQty.toFixed(2)} ${yarimamul.birim}
                    </span>
                </td>
                <td class="text-center">
                    ${missingQty > 0 ? 
                        `<span class="badge bg-danger">Eksik: ${missingQty.toFixed(2)} ${yarimamul.birim}</span>` : 
                        `<span class="badge bg-success">Yeterli</span>`
                    }
                </td>
                <td class="text-end">₺${unitPrice.toFixed(2)}</td>
                <td class="text-end">₺${totalPrice.toFixed(2)}</td>
            `;
            materialsList.appendChild(row);
        }
    });
    
    document.getElementById('nihai-total-cost').textContent = `₺${totalCost.toFixed(2)}`;
    
    // Stok durumu uyarısı
    const costAlert = document.getElementById('nihai-total-cost').parentElement;
    if (hasInsufficientStock) {
        costAlert.className = 'alert alert-danger';
        costAlert.innerHTML = `
            <strong><i class="fas fa-exclamation-triangle me-2"></i>Stok Yetersiz!</strong> 
            Bazı yarı mamuller yetersiz. Üretim başlatılamaz.
            <br><strong>Toplam Maliyet:</strong> <span id="nihai-total-cost">₺${totalCost.toFixed(2)}</span>
        `;
        } else {
        costAlert.className = 'alert alert-success';
        costAlert.innerHTML = `
            <strong><i class="fas fa-check-circle me-2"></i>Stok Yeterli!</strong> 
            Tüm yarı mamuller mevcut. Üretim başlatılabilir.
            <br><strong>Toplam Maliyet:</strong> <span id="nihai-total-cost">₺${totalCost.toFixed(2)}</span>
        `;
    }
}

// Yarı mamul malzemeleri temizle
function clearYarimamulMaterials() {
    document.getElementById('yarimamul-materials-list').innerHTML = '';
    document.getElementById('yarimamul-total-cost').textContent = '₺0.00';
    // Alert'i de temizle
    const costAlert = document.getElementById('yarimamul-total-cost').parentElement;
    costAlert.className = 'alert alert-info';
    costAlert.innerHTML = `
        <strong>Toplam Maliyet:</strong> <span id="yarimamul-total-cost">₺0.00</span>
    `;
}

// Nihai ürün malzemeleri temizle
function clearNihaiMaterials() {
    document.getElementById('nihai-materials-list').innerHTML = '';
    document.getElementById('nihai-total-cost').textContent = '₺0.00';
    // Alert'i de temizle
    const costAlert = document.getElementById('nihai-total-cost').parentElement;
    costAlert.className = 'alert alert-info';
    costAlert.innerHTML = `
        <strong>Toplam Maliyet:</strong> <span id="nihai-total-cost">₺0.00</span>
    `;
    
}

// Yarı mamul stok kontrolü
function checkYarimamulStock(productId, quantity) {
    const requiredMaterials = urunAgaci.filter(item => 
        item.ana_urun_id === productId && item.ana_urun_tipi === 'yarimamul'
    );
    
    let sufficient = true;
    let missingItems = [];
    
    requiredMaterials.forEach(material => {
        const hammadde = hammaddeler.find(h => h.id === material.alt_urun_id);
        if (hammadde) {
            const requiredQty = material.gerekli_miktar * quantity;
            const availableQty = hammadde.miktar || 0;
            
            if (availableQty < requiredQty) {
                sufficient = false;
                const missingQty = requiredQty - availableQty;
                missingItems.push(`• ${hammadde.kod} - ${hammadde.ad}: Eksik ${missingQty.toFixed(2)} ${hammadde.birim}`);
            }
        }
    });
    
    return { sufficient, missingItems };
}

// Nihai ürün stok kontrolü
function checkNihaiStock(productId, quantity) {
    const requiredMaterials = urunAgaci.filter(item => 
        item.ana_urun_id === productId && item.ana_urun_tipi === 'nihai'
    );
    
    let sufficient = true;
    let missingItems = [];
    
    requiredMaterials.forEach(material => {
        const yarimamul = yarimamuller.find(y => y.id === material.alt_urun_id);
        if (yarimamul) {
            const requiredQty = material.gerekli_miktar * quantity;
            const availableQty = yarimamul.miktar || 0;
            
            if (availableQty < requiredQty) {
                sufficient = false;
                const missingQty = requiredQty - availableQty;
                missingItems.push(`• ${yarimamul.kod} - ${yarimamul.ad}: Eksik ${missingQty.toFixed(2)} ${yarimamul.birim}`);
            }
        }
    });
    
    return { sufficient, missingItems };
}

// Nihai ürün malzemeleri temizle
function clearNihaiMaterials() {
    document.getElementById('nihai-materials-list').innerHTML = '';
    document.getElementById('nihai-total-cost').textContent = '₺0.00';
}

// Yarı mamul üretim işlemi
async function handleYarimamulProduction(event) {
    event.preventDefault();
    
    const productId = parseInt(document.getElementById('yarimamul-product').value);
    const quantity = parseFloat(document.getElementById('yarimamul-quantity').value);
    
    if (!productId || quantity <= 0) {
        alert('Lütfen geçerli bir ürün ve miktar seçin', 'warning');
        return;
    }
    
    // Stok kontrolü yap
    const stockCheck = checkYarimamulStock(productId, quantity);
    if (!stockCheck.sufficient) {
        alert(`Stok yetersiz! Eksik malzemeler:\n${stockCheck.missingItems.join('\n')}`, 'error');
        return;
    }
    
    try {
        // Üretim işlemini başlat
        const production = {
            type: 'yarimamul',
            productId: productId,
            quantity: quantity,
            startTime: new Date().toISOString(),
            status: 'active'
        };
        
        // Aktif üretimlere ekle
        activeProductions.push(production);
        
        // UI'yi güncelle
        displayActiveProductions();
        
        // Formu temizle
        document.getElementById('yarimamul-production-form-element').reset();
        clearYarimamulMaterials();
        
        alert('Yarı mamul üretimi başlatıldı!', 'success');
        
        // Simüle edilmiş üretim süreci (gerçek uygulamada backend'de olacak)
        setTimeout(() => {
            completeProduction(production);
        }, 5000);
        
    } catch (error) {
        console.error('Yarı mamul üretim hatası:', error);
        alert('Üretim başlatılırken hata oluştu', 'error');
    }
}

// Nihai ürün üretim işlemi
async function handleNihaiProduction(event) {
    event.preventDefault();
    
    const productId = parseInt(document.getElementById('nihai-product').value);
    const quantity = parseFloat(document.getElementById('nihai-quantity').value);
    
    if (!productId || quantity <= 0) {
        alert('Lütfen geçerli bir ürün ve miktar seçin', 'warning');
        return;
    }
    
    // Stok kontrolü yap
    const stockCheck = checkNihaiStock(productId, quantity);
    if (!stockCheck.sufficient) {
        alert(`Stok yetersiz! Eksik malzemeler:\n${stockCheck.missingItems.join('\n')}`, 'error');
        return;
    }
    
    try {
        // Üretim işlemini başlat
        const production = {
            type: 'nihai',
            productId: productId,
            quantity: quantity,
            startTime: new Date().toISOString(),
            status: 'active'
        };
        
        // Aktif üretimlere ekle
        activeProductions.push(production);
        
        // UI'yi güncelle
        displayActiveProductions();
        
        // Formu temizle
        document.getElementById('nihai-production-form-element').reset();
        clearNihaiMaterials();
        
        alert('Nihai ürün üretimi başlatıldı!', 'success');
        
        // Simüle edilmiş üretim süreci (gerçek uygulamada backend'de olacak)
        setTimeout(() => {
            completeProduction(production);
        }, 8000);
        
    } catch (error) {
        console.error('Nihai ürün üretim hatası:', error);
        alert('Üretim başlatılırken hata oluştu', 'error');
    }
}

// Üretimi tamamla
function completeProduction(production) {
    // Aktif üretimlerden kaldır
    const index = activeProductions.findIndex(p => p === production);
    if (index > -1) {
        activeProductions.splice(index, 1);
    }
    
    // Geçmişe ekle
    production.status = 'completed';
    production.endTime = new Date().toISOString();
    productionHistory.unshift(production);
    
    // UI'yi güncelle
    displayActiveProductions();
    displayProductionHistory();
    
    alert('Üretim tamamlandı!', 'success');
}

// Bu fonksiyon silindi - yukarıda daha iyi versiyonu var

// Üretim kartı oluştur
function createProductionCard(production) {
    const card = document.createElement('div');
    card.className = 'card mb-3';
    
    const product = production.type === 'yarimamul' 
        ? yarimamuller.find(y => y.id === production.productId)
        : (window.nihaiUrunler || []).find(n => n.id === production.productId);
    
    const startTime = new Date(production.startTime).toLocaleString('tr-TR');
    
    card.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="card-title">
                        <i class="fas fa-${production.type === 'yarimamul' ? 'hammer' : 'cube'} me-2"></i>
                        ${product ? product.ad : 'Bilinmeyen Ürün'}
                    </h6>
                    <p class="card-text text-muted mb-2">
                        <small>Miktar: ${production.quantity} ${product ? product.birim : ''}</small><br>
                        <small>Başlangıç: ${startTime}</small>
                    </p>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 75%"></div>
                    </div>
                    </div>
                <div class="ms-3">
                    <span class="badge bg-warning">Üretimde</span>
                    </div>
                </div>
            </div>
        `;
        
    return card;
}

// Tamamlanan üretimleri göster
function displayCompletedProductions() {
    const container = document.getElementById('production-history-container');
    if (!container) {
        console.error('Production history container bulunamadı');
        return;
    }
    
    // Hem tamamlanan hem de aktif üretimleri birleştir
    const allProductions = [...(productionHistory || []), ...(operatorProductions || [])];
    
    if (allProductions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-history fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Henüz üretim bulunmuyor</h5>
                <p class="text-muted">Operatörler üretimleri başlattığında burada görünecek</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-industry me-2"></i>Üretim Geçmişi
                            <span class="badge bg-primary ms-2">${allProductions.length}</span>
                        </h6>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th><i class="fas fa-calendar me-1"></i>Tarih</th>
                                        <th><i class="fas fa-box me-1"></i>Ürün</th>
                                        <th><i class="fas fa-hashtag me-1"></i>Sipariş</th>
                                        <th><i class="fas fa-user me-1"></i>Operatör</th>
                                        <th><i class="fas fa-cubes me-1"></i>Miktar</th>
                                        <th><i class="fas fa-clock me-1"></i>Süre</th>
                                        <th><i class="fas fa-info-circle me-1"></i>Durum</th>
                                        <th><i class="fas fa-cog me-1"></i>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;
    
    allProductions.forEach((production, index) => {
        const startTime = new Date(production.start_time).toLocaleString('tr-TR');
        const completedTime = production.completed_at ? new Date(production.completed_at).toLocaleString('tr-TR') : '-';
        
        // Süre hesaplama
        const duration = production.completed_at ? 
            Math.round((new Date(production.completed_at) - new Date(production.start_time)) / 1000 / 60) : 0;
        
        const durationText = duration > 60 ? 
            `${Math.floor(duration / 60)}s ${duration % 60}dk` : 
            `${duration}dk`;
        
        // Sipariş bilgileri
        const orderNumber = production.order ? production.order.order_number : 'Bilinmiyor';
        const customerName = production.order ? production.order.customer_name : 'Bilinmiyor';
        
        // Operatör bilgileri
        const operatorName = production.operator_name || 'Sistem';
        
        html += `
            <tr>
                <td>
                    <div class="fw-bold">${startTime}</div>
                    <small class="text-muted">${completedTime}</small>
                </td>
                <td>
                    <div class="fw-bold">${production.product_name || 'Bilinmeyen Ürün'}</div>
                    <small class="text-muted">${production.product_code || ''}</small>
                </td>
                <td>
                    <div class="fw-bold">${orderNumber}</div>
                    <small class="text-muted">${customerName}</small>
                </td>
                <td>
                    <span class="badge bg-info">${operatorName}</span>
                </td>
                <td>
                    <div class="fw-bold">${production.produced_quantity || 0} / ${production.target_quantity || 0}</div>
                    <div class="progress" style="height: 4px;">
                        <div class="progress-bar bg-success" style="width: 100%"></div>
                    </div>
                </td>
                <td>
                    <span class="badge bg-secondary">${durationText}</span>
                </td>
                <td>
                    <span class="badge ${getStatusInfo(production.status).class}">
                        ${getStatusInfo(production.status).text}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewProductionDetails(${production.id})" title="Detayları Görüntüle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="viewProductionHistory(${production.id})" title="Geçmişi Görüntüle">
                            <i class="fas fa-history"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Üretim geçmişini göster (eski fonksiyon - geriye uyumluluk için)
function displayProductionHistory() {
    displayCompletedProductions();
}

// Üretim detaylarını görüntüle
function viewProductionDetails(productionId) {
    const production = productionHistory.find(p => p.id === productionId);
    if (!production) {
        showAlert('Üretim bulunamadı', 'error');
        return;
    }
    
    const startTime = new Date(production.start_time).toLocaleString('tr-TR');
    const completedTime = production.completed_at ? new Date(production.completed_at).toLocaleString('tr-TR') : '-';
    const duration = production.completed_at ? 
        Math.round((new Date(production.completed_at) - new Date(production.start_time)) / 1000 / 60) : 0;
    
    const content = `
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Üretim Bilgileri</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Ürün:</strong> ${production.product_name || 'Bilinmiyor'}</p>
                        <p><strong>Ürün Kodu:</strong> ${production.product_code || 'Bilinmiyor'}</p>
                        <p><strong>Hedef Miktar:</strong> ${production.target_quantity || 0}</p>
                        <p><strong>Üretilen Miktar:</strong> ${production.produced_quantity || 0}</p>
                        <p><strong>Operatör:</strong> ${production.operator_name || 'Sistem'}</p>
                        <p><strong>Başlangıç:</strong> ${startTime}</p>
                        <p><strong>Tamamlanma:</strong> ${completedTime}</p>
                        <p><strong>Süre:</strong> ${duration} dakika</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-shopping-cart me-2"></i>Sipariş Bilgileri</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Sipariş No:</strong> ${production.order ? production.order.order_number : 'Bilinmiyor'}</p>
                        <p><strong>Müşteri:</strong> ${production.order ? production.order.customer_name : 'Bilinmiyor'}</p>
                        <p><strong>Sipariş Tarihi:</strong> ${production.order ? new Date(production.order.order_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</p>
                        <p><strong>Teslimat Tarihi:</strong> ${production.order ? new Date(production.order.delivery_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</p>
                        <p><strong>Öncelik:</strong> ${production.order ? production.order.priority : 'Bilinmiyor'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showModal('Üretim Detayları', content, 'lg');
}

// Üretim geçmişini görüntüle
async function viewProductionHistory(productionId) {
    try {
        const response = await fetch(`/api/production-history/${productionId}`);
        const history = await response.json();
        
        if (response.ok) {
            let content = `
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-history me-2"></i>Üretim Geçmişi</h6>
                    </div>
                    <div class="card-body">
            `;
            
            if (history && history.length > 0) {
                content += `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>İşlem</th>
                                    <th>Miktar</th>
                                    <th>Operatör</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                history.forEach(record => {
                    const timestamp = new Date(record.timestamp).toLocaleString('tr-TR');
                    content += `
                        <tr>
                            <td>${timestamp}</td>
                            <td>${record.action || record.barcode || 'Üretim'}</td>
                            <td>${record.quantity || 0}</td>
                            <td>${record.operator_name || 'Sistem'}</td>
                        </tr>
                    `;
                });
                
                content += `
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                content += `
                    <div class="text-center py-4">
                        <i class="fas fa-history fa-2x text-muted mb-2"></i>
                        <p class="text-muted">Bu üretim için geçmiş kaydı bulunmuyor</p>
                    </div>
                `;
            }
            
            content += `
                    </div>
                </div>
            `;
            
            showModal('Üretim Geçmişi', content, 'lg');
        } else {
            showAlert('Üretim geçmişi yüklenemedi', 'error');
        }
    } catch (error) {
        console.error('Üretim geçmişi yükleme hatası:', error);
        showAlert('Üretim geçmişi yüklenemedi', 'error');
    }
}

// Modal gösterme fonksiyonu
function showModal(title, content, size = 'lg') {
    const modalHtml = `
        <div class="modal fade" id="dynamicModal" tabindex="-1" aria-labelledby="dynamicModalLabel" aria-hidden="true" style="z-index: 9998 !important;">
            <div class="modal-dialog modal-${size}" style="z-index: 9999 !important;">
                <div class="modal-content" style="z-index: 10000 !important;">
                    <div class="modal-header">
                        <h5 class="modal-title" id="dynamicModalLabel">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eski modal'ı kaldır
    const existingModal = document.getElementById('dynamicModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Yeni modal'ı ekle
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
    modal.show();
}

// Alert gösterme fonksiyonu
function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" style="z-index: 10001 !important;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Alert container'ı bul veya oluştur
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '10000';
        document.body.appendChild(alertContainer);
    }
    
    // Alert'i ekle
    alertContainer.insertAdjacentHTML('beforeend', alertHtml);
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        const alert = alertContainer.lastElementChild;
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

// Üretim istatistiklerini güncelle
function updateProductionStatistics() {
    const totalProductions = productionHistory.length;
    const completedProductions = productionHistory.filter(p => p.status === 'completed').length;
    const activeProductions = productionHistory.filter(p => p.status === 'active').length;
    
    // Toplam maliyet hesaplama
    let totalCost = 0;
    productionHistory.forEach(production => {
        const product = production.type === 'yarimamul' 
            ? yarimamuller.find(y => y.id === production.productId)
            : (window.nihaiUrunler || []).find(n => n.id === production.productId);
        
        if (product) {
            const unitCost = product.birim_maliyet || product.birim_fiyat || 0;
            totalCost += production.quantity * unitCost;
        }
    });
    
    // UI'yi güncelle
    const totalProductionsElement = document.getElementById('total-productions');
    if (totalProductionsElement) {
        totalProductionsElement.textContent = totalProductions;
    }
    
    const completedProductionsElement = document.getElementById('completed-productions');
    if (completedProductionsElement) {
        completedProductionsElement.textContent = completedProductions;
    }
    
    const activeProductionsCountElement = document.getElementById('active-productions-count');
    if (activeProductionsCountElement) {
        activeProductionsCountElement.textContent = activeProductions;
    }
    
}

// Üretim detaylarını görüntüle
function viewProductionDetails(productionIndex) {
    const production = productionHistory[productionIndex];
    if (!production) {
        alert('Üretim bulunamadı', 'error');
        return;
    }
    
    const product = production.type === 'yarimamul' 
        ? yarimamuller.find(y => y.id === production.productId)
        : (window.nihaiUrunler || []).find(n => n.id === production.productId);
    
    const startTime = new Date(production.startTime).toLocaleString('tr-TR');
    const endTime = production.endTime ? new Date(production.endTime).toLocaleString('tr-TR') : 'Devam Ediyor';
    const duration = production.endTime ? 
        Math.round((new Date(production.endTime) - new Date(production.startTime)) / 1000 / 60) : 0;
    
    const unitCost = product ? (product.birim_maliyet || product.birim_fiyat || 0) : 0;
    const totalCost = production.quantity * unitCost;
    
    const details = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="fas fa-info-circle me-2"></i>Üretim Bilgileri</h6>
                <table class="table table-sm">
                    <tr><td><strong>Ürün:</strong></td><td>${product ? product.ad : 'Bilinmeyen'}</td></tr>
                    <tr><td><strong>Kod:</strong></td><td>${product ? product.kod : '-'}</td></tr>
                    <tr><td><strong>Tip:</strong></td><td>${production.type === 'yarimamul' ? 'Yarı Mamul' : 'Nihai Ürün'}</td></tr>
                    <tr><td><strong>Üretilen Miktar:</strong></td><td>${production.quantity} ${product ? product.birim : ''}</td></tr>
                    ${production.targetQuantity ? 
                        `<tr><td><strong>Hedef Miktar:</strong></td><td>${production.targetQuantity} ${product ? product.birim : ''}</td></tr>` : ''
                    }
                    <tr><td><strong>Başlangıç:</strong></td><td>${startTime}</td></tr>
                    <tr><td><strong>Bitiş:</strong></td><td>${endTime}</td></tr>
                    <tr><td><strong>Süre:</strong></td><td>${duration} dakika</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-chart-line me-2"></i>Maliyet Bilgileri</h6>
                <table class="table table-sm">
                    <tr><td><strong>Birim Maliyet:</strong></td><td>₺${unitCost.toFixed(2)}</td></tr>
                    <tr><td><strong>Toplam Maliyet:</strong></td><td>₺${totalCost.toFixed(2)}</td></tr>
                    <tr><td><strong>Durum:</strong></td><td>
                        <span class="badge ${getStatusInfo(production.status).class}">
                            ${getStatusInfo(production.status).text}
                        </span>
                    </td></tr>
                    ${production.successRate ? 
                        `<tr><td><strong>Başarı Oranı:</strong></td><td>${production.successRate.toFixed(1)}%</td></tr>` : ''
                    }
                </table>
            </div>
        </div>
        ${production.scannedBarcodes && production.scannedBarcodes.length > 0 ? `
            <div class="mt-3">
                <h6><i class="fas fa-barcode me-2"></i>Barkod İstatistikleri</h6>
                <div class="row">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white text-center">
                            <div class="card-body">
                                <h5>${production.scannedBarcodes.length}</h5>
                                <small>Toplam Okutma</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white text-center">
                            <div class="card-body">
                                <h5>${production.scannedBarcodes.filter(b => b.success).length}</h5>
                                <small>Başarılı</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-danger text-white text-center">
                            <div class="card-body">
                                <h5>${production.scannedBarcodes.filter(b => !b.success).length}</h5>
                                <small>Hatalı</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white text-center">
                            <div class="card-body">
                                <h5>${((production.scannedBarcodes.filter(b => b.success).length / production.scannedBarcodes.length) * 100).toFixed(1)}%</h5>
                                <small>Başarı Oranı</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
    
    showDetailedAlert('Üretim Detayları', details, 'info');
}

// Barkod geçmişini görüntüle
function viewBarcodeHistory(productionIndex) {
    const production = productionHistory[productionIndex];
    if (!production || !production.scannedBarcodes || production.scannedBarcodes.length === 0) {
        alert('Barkod geçmişi bulunamadı', 'warning');
        return;
    }
    
    const barcodeTable = production.scannedBarcodes.map((barcode, index) => `
        <tr class="${barcode.success ? 'table-success' : 'table-danger'}">
            <td>${index + 1}</td>
            <td><code>${barcode.barcode}</code></td>
            <td>
                <span class="badge bg-${barcode.success ? 'success' : 'danger'}">
                    ${barcode.success ? 'Başarılı' : 'Hatalı'}
                </span>
            </td>
            <td>${new Date(barcode.timestamp).toLocaleString('tr-TR')}</td>
        </tr>
    `).join('');
    
    const details = `
        <div class="table-responsive">
            <table class="table table-sm table-hover">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Barkod</th>
                        <th>Durum</th>
                        <th>Zaman</th>
                    </tr>
                </thead>
                <tbody>
                    ${barcodeTable}
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <div class="row text-center">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h5>${production.scannedBarcodes.length}</h5>
                            <small>Toplam Okutma</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h5>${production.scannedBarcodes.filter(b => b.success).length}</h5>
                            <small>Başarılı</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h5>${production.scannedBarcodes.filter(b => !b.success).length}</h5>
                            <small>Hatalı</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showDetailedAlert('Barkod Geçmişi', details, 'info');
}

// Detaylı alert göster
function showDetailedAlert(title, content, type) {
    const alertModal = document.getElementById('alertModal');
    const alertTitle = document.getElementById('alertModalTitle');
    const alertBody = document.getElementById('alertModalBody');
    const alertHeader = document.getElementById('alertModalHeader');
    
    alertTitle.textContent = title;
    alertBody.innerHTML = content;
    
    // Header rengini ayarla
    alertHeader.className = `modal-header ${type === 'error' ? 'bg-danger' : type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning' : 'bg-info'} text-white`;
    
    const modal = new bootstrap.Modal(alertModal);
    modal.show();
}

// Aktif üretimleri yenile
function refreshActiveProductions() {
    alert('Aktif üretimler yenilendi', 'success');
}

// Üretim geçmişini yenile
function refreshProductionHistory() {
    loadProductionHistory();
    alert('Üretim geçmişi yenilendi', 'success');
}

// Üretim geçmişini temizle
function clearProductionHistory() {
    if (confirm('Üretim geçmişini temizlemek istediğinizden emin misiniz?')) {
        productionHistory = [];
        displayProductionHistory();
        alert('Üretim geçmişi temizlendi', 'success');
    }
}

// Üretim geçmişini filtrele
function filterProductionHistory() {
    const searchTerm = document.getElementById('production-search').value.toLowerCase();
    const typeFilter = document.getElementById('production-type-filter').value;
    const statusFilter = document.getElementById('production-status-filter').value;
    
    const filteredHistory = productionHistory.filter(production => {
        const product = production.type === 'yarimamul' 
            ? yarimamuller.find(y => y.id === production.productId)
            : (window.nihaiUrunler || []).find(n => n.id === production.productId);
        
        // Arama filtresi
        const matchesSearch = !searchTerm || 
            (product && (product.ad.toLowerCase().includes(searchTerm) || 
                        product.kod.toLowerCase().includes(searchTerm)));
        
        // Tip filtresi
        const matchesType = !typeFilter || production.type === typeFilter;
        
        // Durum filtresi
        const matchesStatus = !statusFilter || production.status === statusFilter;
        
        return matchesSearch && matchesType && matchesStatus;
    });
    
    displayFilteredProductionHistory(filteredHistory);
}

// Filtrelenmiş üretim geçmişini göster
function displayFilteredProductionHistory(filteredHistory) {
    const container = document.getElementById('production-history-list');
    container.innerHTML = '';
    
    if (filteredHistory.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x mb-2"></i><br>
                    Filtre kriterlerine uygun üretim bulunamadı
                </td>
            </tr>
        `;
        return;
    }
    
    filteredHistory.forEach((production, index) => {
        const product = production.type === 'yarimamul' 
            ? yarimamuller.find(y => y.id === production.productId)
            : (window.nihaiUrunler || []).find(n => n.id === production.productId);
        
        const startTime = new Date(production.startTime).toLocaleString('tr-TR');
        const endTime = production.endTime ? new Date(production.endTime).toLocaleString('tr-TR') : '-';
        
        // Süre hesaplama
        const duration = production.endTime ? 
            Math.round((new Date(production.endTime) - new Date(production.startTime)) / 1000 / 60) : 0;
        
        // Başarı oranı
        const successRate = production.successRate ? production.successRate.toFixed(1) : '100.0';
        
        // Maliyet hesaplama (basit)
        const unitCost = product ? (product.birim_maliyet || product.birim_fiyat || 0) : 0;
        const totalCost = production.quantity * unitCost;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="fw-bold">${startTime}</div>
                <small class="text-muted">${endTime}</small>
            </td>
            <td>
                <div class="fw-bold">${product ? product.ad : 'Bilinmeyen Ürün'}</div>
                <small class="text-muted">${product ? product.kod : ''}</small>
            </td>
            <td>
                <div class="fw-bold">${production.quantity} ${product ? product.birim : ''}</div>
                ${production.targetQuantity ? 
                    `<small class="text-muted">Hedef: ${production.targetQuantity}</small>` : ''
                }
            </td>
            <td>
                <span class="badge bg-${production.type === 'yarimamul' ? 'primary' : 'success'}">
                    ${production.type === 'yarimamul' ? 'Yarı Mamul' : 'Nihai Ürün'}
                </span>
            </td>
            <td>
                <span class="badge ${getStatusInfo(production.status).class}">
                    ${getStatusInfo(production.status).text}
                </span>
                ${production.status === 'completed' ? 
                    `<div class="mt-1"><small class="text-muted">${duration} dk</small></div>` : ''
                }
            </td>
            <td>
                <div class="fw-bold">₺${totalCost.toFixed(2)}</div>
                <small class="text-muted">₺${unitCost.toFixed(2)}/adet</small>
            </td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn btn-outline-info btn-sm" onclick="viewProductionDetails(${productionHistory.indexOf(production)})" title="Detayları Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${production.scannedBarcodes && production.scannedBarcodes.length > 0 ? 
                        `<button class="btn btn-outline-success btn-sm" onclick="viewBarcodeHistory(${productionHistory.indexOf(production)})" title="Barkod Geçmişi">
                            <i class="fas fa-barcode"></i>
                        </button>` : ''
                    }
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}

// Filtreleri temizle
function clearFilters() {
    document.getElementById('production-search').value = '';
    document.getElementById('production-type-filter').value = '';
    document.getElementById('production-status-filter').value = '';
    displayProductionHistory();
}

// Barkod okutma sistemi fonksiyonları

// Üretim başlatma (barkod sistemi ile)
function startProductionWithBarcode(type) {
    currentProductionType = type;
    
    // Ürün seçeneklerini güncelle
    updateProductionProductSelect(type);
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('productionSelectionModal'));
    modal.show();
}

// ===== ÜRETİM BAŞLAT TAB'ı FONKSİYONLARI =====

// Onaylanmış planları yükle
async function loadApprovedPlans() {
    try {
        const response = await fetch('/api/production-plans/approved');
        const plans = await response.json();
        
        const tbody = document.getElementById('approved-plans-list');
        
        if (plans.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        <i class="fas fa-info-circle me-2"></i>Onaylanmış plan bulunmuyor
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = plans.map(plan => `
            <tr>
                <td>
                    <strong>${plan.plan_name}</strong>
                    <br><small class="text-muted">${plan.plan_type}</small>
                </td>
                <td>
                    <span class="badge bg-secondary">${plan.total_orders || 0} Sipariş</span>
                </td>
                <td>
                    <span class="badge bg-primary">${plan.total_quantity || 0} Adet</span>
                </td>
                <td>
                    <span class="badge bg-info">${plan.assigned_operator || 'Atanmamış'}</span>
                </td>
                <td>${new Date(plan.start_date).toLocaleDateString('tr-TR')}</td>
                <td>${new Date(plan.end_date).toLocaleDateString('tr-TR')}</td>
                <td>
                    <span class="badge bg-${getStatusColor(plan.status)}">${getStatusText(plan.status)}</span>
                </td>
                <td>
                    ${plan.status === 'approved' ? 
                        `<button class="btn btn-success btn-sm me-1" onclick="startProductionFromPlan(${plan.id})" title="Üretimi Başlat">
                            <i class="fas fa-play"></i>
                        </button>` : 
                        `<button class="btn btn-warning btn-sm me-1" onclick="viewActiveProduction(${plan.id})" title="Aktif Üretimi Görüntüle">
                            <i class="fas fa-eye"></i>
                        </button>`
                    }
                    <button class="btn btn-info btn-sm" onclick="showPlanDetails(${plan.id})" title="Plan Detayları">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Onaylanmış planlar yüklenemedi:', error);
        alert('Onaylanmış planlar yüklenemedi', 'error');
    }
}

// Plandan üretim başlat
async function startProductionFromPlan(planId) {
    try {
        const response = await fetch(`/api/production-plans/${planId}/start-production`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_type: 'nihai',
                product_id: 1,
                planned_quantity: 1,
                assigned_operator: 'Thunder Serisi Operatör'
            })
        });
        
        if (response.ok) {
            const production = await response.json();
            alert('Üretim başarıyla başlatıldı!', 'success');
            loadApprovedPlans(); // Planları yenile
            updateStatusPanel(); // Durum panelini güncelle
        } else {
            const error = await response.json();
            alert('Üretim başlatılamadı: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Üretim başlatma hatası:', error);
        alert('Üretim başlatılamadı', 'error');
    }
}

// Plan detaylarını göster
async function showPlanDetails(planId) {
    try {
        // Plan detaylarını yükle
        const response = await fetch(`/api/production-plans/${planId}`);
        if (!response.ok) throw new Error('Plan detayları yüklenemedi');
        
        const plan = await response.json();
        
        // Aşamaları yükle
        const stagesResponse = await fetch(`/api/production-stages?plan_id=${planId}`);
        const stages = stagesResponse.ok ? await stagesResponse.json() : [];
        
        // Modal oluştur
        showPlanDetailsModal(plan, stages);
        
    } catch (error) {
        console.error('Plan detay yükleme hatası:', error);
        alert('Plan detayları yüklenemedi: ' + error.message, 'error');
    }
}

// Plan detay modal'ını göster
function showPlanDetailsModal(plan, stages) {
    const modalHtml = `
        <div class="modal fade" id="planDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-clipboard-list me-2"></i>Plan Detayları: ${plan.plan_name}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6><i class="fas fa-info-circle me-2"></i>Plan Bilgileri</h6>
                                    </div>
                                    <div class="card-body">
                                        <p><strong>Plan Adı:</strong> ${plan.plan_name}</p>
                                        <p><strong>Plan Tipi:</strong> ${getPlanTypeText(plan.plan_type)}</p>
                                        <p><strong>Durum:</strong> <span class="badge bg-${getStatusColor(plan.status)}">${getStatusText(plan.status)}</span></p>
                                        <p><strong>Başlangıç:</strong> ${new Date(plan.start_date).toLocaleDateString('tr-TR')}</p>
                                        <p><strong>Bitiş:</strong> ${new Date(plan.end_date).toLocaleDateString('tr-TR')}</p>
                                        <p><strong>Oluşturan:</strong> ${plan.created_by || 'Bilinmiyor'}</p>
                                        ${plan.notes ? `<p><strong>Notlar:</strong> ${plan.notes}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6><i class="fas fa-chart-pie me-2"></i>İlerleme Durumu</h6>
                                    </div>
                                    <div class="card-body">
                                        ${generateProgressInfo(stages)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <div class="card">
                                <div class="card-header">
                                    <h6><i class="fas fa-tasks me-2"></i>Üretim Aşamaları</h6>
                                </div>
                                <div class="card-body">
                                    ${generateStagesList(stages)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                        ${plan.status === 'approved' ? '<button type="button" class="btn btn-primary" onclick="startProductionFromPlan(' + plan.id + ')">Üretimi Başlat</button>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Modal'ı DOM'a ekle
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('planDetailsModal'));
    modal.show();
    
    // Modal kapandığında DOM'dan kaldır
    document.getElementById('planDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// İlerleme bilgilerini oluştur
function generateProgressInfo(stages) {
    if (!stages || stages.length === 0) {
        return '<p class="text-muted">Henüz aşama oluşturulmamış</p>';
    }
    
    const total = stages.length;
    const completed = stages.filter(s => s.status === 'completed').length;
    const inProgress = stages.filter(s => s.status === 'in_progress').length;
    const pending = stages.filter(s => s.status === 'pending').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return `
        <div class="progress mb-3" style="height: 25px;">
            <div class="progress-bar" role="progressbar" style="width: ${progress}%">${progress}%</div>
        </div>
        <div class="row text-center">
            <div class="col-4">
                <div class="text-success">
                    <i class="fas fa-check-circle fa-2x"></i>
                    <div><strong>${completed}</strong></div>
                    <small>Tamamlandı</small>
                </div>
            </div>
            <div class="col-4">
                <div class="text-warning">
                    <i class="fas fa-play-circle fa-2x"></i>
                    <div><strong>${inProgress}</strong></div>
                    <small>Devam Ediyor</small>
                </div>
            </div>
            <div class="col-4">
                <div class="text-muted">
                    <i class="fas fa-clock fa-2x"></i>
                    <div><strong>${pending}</strong></div>
                    <small>Bekliyor</small>
                </div>
            </div>
        </div>
    `;
}

// Aşama listesini oluştur
function generateStagesList(stages) {
    if (!stages || stages.length === 0) {
        return '<p class="text-muted">Henüz aşama oluşturulmamış</p>';
    }
    
    let html = '<div class="timeline">';
    
    stages.sort((a, b) => a.stage_order - b.stage_order).forEach((stage, index) => {
        const isLast = index === stages.length - 1;
        const statusIcon = getStageStatusIcon(stage.status);
        const statusColor = getStageStatusColor(stage.status);
        
        html += `
            <div class="timeline-item">
                <div class="timeline-marker ${statusColor}">
                    <i class="${statusIcon}"></i>
                </div>
                <div class="timeline-content">
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="card-title">${stage.stage_name}</h6>
                                    <p class="card-text text-muted">
                                        <i class="fas fa-sort-numeric-up me-1"></i>Sıra: ${stage.stage_order} |
                                        <i class="fas fa-clock me-1"></i>Süre: ${stage.estimated_duration}dk |
                                        <i class="fas fa-user me-1"></i>Operatör: ${stage.operator || 'Atanmamış'}
                                    </p>
                                    ${stage.notes ? `<p class="card-text"><small>${stage.notes}</small></p>` : ''}
                                </div>
                                <div>
                                    <span class="badge bg-${statusColor}">${getStageStatusText(stage.status)}</span>
                                    ${stage.quality_check_required ? '<span class="badge bg-warning ms-1">Kalite Kontrol</span>' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ${!isLast ? '<div class="timeline-line"></div>' : ''}
            </div>
        `;
    });
    
    html += '</div>';
    
    // CSS ekle
    html += `
        <style>
            .timeline {
                position: relative;
                padding-left: 30px;
            }
            .timeline-item {
                position: relative;
                margin-bottom: 20px;
            }
            .timeline-marker {
                position: absolute;
                left: -35px;
                top: 10px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
            }
            .timeline-marker.success { background-color: #28a745; }
            .timeline-marker.warning { background-color: #ffc107; }
            .timeline-marker.secondary { background-color: #6c757d; }
            .timeline-line {
                position: absolute;
                left: -20px;
                top: 40px;
                width: 2px;
                height: 20px;
                background-color: #dee2e6;
            }
        </style>
    `;
    
    return html;
}

// Yardımcı fonksiyonlar
function getPlanTypeText(type) {
    const types = {
        'hammadde': 'Hammadde',
        'yarimamul': 'Yarı Mamul',
        'nihai': 'Nihai Ürün'
    };
    return types[type] || type;
}

function getStatusColor(status) {
    const colors = {
        'draft': 'secondary',
        'pending': 'warning',
        'approved': 'success',
        'active': 'primary',
        'in_progress': 'warning',
        'in_production': 'info',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'draft': 'Taslak',
        'pending': 'Bekleyen',
        'approved': 'Onaylanmış',
        'active': 'Aktif',
        'in_progress': 'İşleniyor',
        'in_production': 'Üretimde',
        'processing': 'İşleniyor',
        'completed': 'Tamamlandı',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal Edildi',
        'paused': 'Duraklatıldı',
        'inactive': 'Pasif',
        'confirmed': 'Onaylandı',
        'shipped': 'Sevk Edildi'
    };
    return texts[status] || status;
}

function getStageStatusIcon(status) {
    const icons = {
        'pending': 'fas fa-clock',
        'in_progress': 'fas fa-play',
        'completed': 'fas fa-check',
        'paused': 'fas fa-pause',
        'cancelled': 'fas fa-times'
    };
    return icons[status] || 'fas fa-question';
}

function getStageStatusColor(status) {
    const colors = {
        'pending': 'secondary',
        'in_progress': 'warning',
        'completed': 'success',
        'paused': 'info',
        'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

function getStageStatusText(status) {
    const texts = {
        'pending': 'Bekleyen',
        'in_progress': 'İşleniyor',
        'processing': 'İşleniyor',
        'completed': 'Tamamlandı',
        'delivered': 'Teslim Edildi',
        'paused': 'Duraklatıldı',
        'cancelled': 'İptal Edildi'
    };
    return texts[status] || status;
}

// Aktif üretimi görüntüle
function viewActiveProduction(planId) {
    alert('Aktif üretimler artık Üretim Başlat tab\'ında yönetiliyor', 'info');
}

// Durum panelini güncelle
async function updateStatusPanel() {
    try {
        const response = await fetch('/api/active-productions');
        const productions = await response.json();
        
        // Aktif üretim sayısı
        const activeCount = productions.filter(p => p.status === 'active').length;
        document.getElementById('active-productions-count').textContent = activeCount;
        
        // Çalışan operatör sayısı
        const activeOperators = new Set(productions.filter(p => p.status === 'active').map(p => p.assigned_operator));
        document.getElementById('active-operators-count').textContent = activeOperators.size;
        
        // Kalite geçiş oranı (şimdilik sabit)
        document.getElementById('quality-pass-rate').textContent = '95%';
        
        // Ortalama süre (şimdilik sabit)
        document.getElementById('avg-production-time').textContent = '2h';
        
    } catch (error) {
        console.error('Durum paneli güncellenemedi:', error);
    }
}

// Operatörleri yükle
async function loadOperators() {
    try {
        const response = await fetch('/api/operators');
        const operators = await response.json();
        
        const select = document.getElementById('operator-select');
        select.innerHTML = '<option value="">Operatör Seçiniz...</option>';
        
        operators.forEach(operator => {
            const option = document.createElement('option');
            option.value = operator.name;
            option.textContent = `${operator.name} - ${operator.department}`;
            select.appendChild(option);
        });
        
        // Operatör seçimi değiştiğinde
        select.addEventListener('change', function() {
            if (this.value) {
                showOperatorStatus(this.value);
            } else {
                document.getElementById('operator-status').innerHTML = '';
                document.getElementById('operator-workload').innerHTML = '';
            }
        });
        
    } catch (error) {
        console.error('Operatörler yüklenemedi:', error);
    }
}

// Operatör durumunu göster
async function showOperatorStatus(operatorName) {
    try {
        const response = await fetch('/api/active-productions');
        const productions = await response.json();
        
        const operatorProductions = productions.filter(p => p.assigned_operator === operatorName);
        const activeProductions = operatorProductions.filter(p => p.status === 'active');
        
        const statusDiv = document.getElementById('operator-status');
        const workloadDiv = document.getElementById('operator-workload');
        
        // Operatör durumu
        statusDiv.innerHTML = `
            <div class="alert alert-${activeProductions.length > 0 ? 'success' : 'info'} mb-0">
                <i class="fas fa-user me-2"></i>
                <strong>${operatorName}</strong>
                <br>
                <small>${activeProductions.length} aktif üretim</small>
            </div>
        `;
        
        // İş yükü
        workloadDiv.innerHTML = `
            <div class="progress mb-2">
                <div class="progress-bar" style="width: ${Math.min(activeProductions.length * 25, 100)}%"></div>
            </div>
            <small class="text-muted">
                ${activeProductions.length} aktif üretim / ${operatorProductions.length} toplam üretim
            </small>
        `;
        
    } catch (error) {
        console.error('Operatör durumu yüklenemedi:', error);
    }
}

// Bu fonksiyon kaldırıldı - ana getStatusText fonksiyonu kullanılacak

// Durum rengi döndür
function getStatusColor(status) {
    const colorMap = {
        'draft': 'secondary',
        'approved': 'success',
        'active': 'primary',
        'in_progress': 'warning',
        'in_production': 'info',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return colorMap[status] || 'secondary';
}



// Plan durumu metni
function getPlanStatusText(status) {
    const statusMap = {
        'draft': 'Taslak',
        'approved': 'Onaylanmış',
        'active': 'Aktif',
        'in_progress': 'İşleniyor',
        'processing': 'İşleniyor',
        'completed': 'Tamamlandı',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal Edildi',
        'paused': 'Duraklatıldı',
        'inactive': 'Pasif'
    };
    return statusMap[status] || status;
}

// Plan durumu rengi
function getPlanStatusColor(status) {
    const colorMap = {
        'draft': 'secondary',
        'approved': 'success',
        'active': 'warning',
        'completed': 'primary',
        'cancelled': 'danger'
    };
    return colorMap[status] || 'secondary';
}






// Üretim durumu metni döndür
function getProductionStatusText(status) {
    const statusMap = {
        'active': 'Aktif',
        'paused': 'Duraklatıldı',
        'in_progress': 'İşleniyor',
        'processing': 'İşleniyor',
        'completed': 'Tamamlandı',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal Edildi',
        'inactive': 'Pasif'
    };
    return statusMap[status] || status;
}

// Üretim durumu rengi döndür
function getProductionStatusColor(status) {
    const colorMap = {
        'active': 'success',
        'paused': 'warning',
        'completed': 'primary',
        'cancelled': 'danger'
    };
    return colorMap[status] || 'secondary';
}

// Üretimi durdur
async function pauseProduction(productionId) {
    try {
        const response = await fetch(`/api/active-productions/${productionId}/pause`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            alert('Üretim durduruldu', 'success');
            updateStatusPanel();
        } else {
            const error = await response.json();
            alert('Üretim durdurulamadı: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Üretim durdurma hatası:', error);
        alert('Üretim durdurulamadı', 'error');
    }
}

// Üretimi devam ettir
async function resumeProduction(productionId) {
    try {
        const response = await fetch(`/api/active-productions/${productionId}/resume`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            alert('Üretim devam ettirildi', 'success');
            updateStatusPanel();
        } else {
            const error = await response.json();
            alert('Üretim devam ettirilemedi: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Üretim devam ettirme hatası:', error);
        alert('Üretim devam ettirilemedi', 'error');
    }
}

// Üretim detaylarını görüntüle
function viewProductionDetails(productionId) {
    alert('Üretim detayları gösterilecek (geliştirilecek)', 'info');
}

// Üretimi iptal et
async function cancelProduction(productionId) {
    if (confirm('Bu üretimi iptal etmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/active-productions/${productionId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Üretim iptal edildi', 'success');
                updateStatusPanel();
            } else {
                const error = await response.json();
                alert('Üretim iptal edilemedi: ' + error.error, 'error');
            }
        } catch (error) {
            console.error('Üretim iptal hatası:', error);
            alert('Üretim iptal edilemedi', 'error');
        }
    }
}

// Üretim ürün seçeneklerini güncelle
function updateProductionProductSelect(type) {
    const select = document.getElementById('production-product');
    select.innerHTML = '<option value="">Seçiniz...</option>';
    
    if (type === 'yarimamul') {
        yarimamuller.forEach(yarimamul => {
            if (yarimamul.aktif) {
                const option = document.createElement('option');
                option.value = yarimamul.id;
                option.textContent = `${yarimamul.kod} - ${yarimamul.ad}`;
                option.dataset.barcode = yarimamul.barkod || '';
                select.appendChild(option);
            }
        });
    } else if (type === 'nihai') {
        (window.nihaiUrunler || []).forEach(nihai => {
            if (nihai.aktif) {
                const option = document.createElement('option');
                option.value = nihai.id;
                option.textContent = `${nihai.kod} - ${nihai.ad}`;
                option.dataset.barcode = nihai.barkod || '';
                select.appendChild(option);
            }
        });
    }
}

// Malzeme kontrolü
function checkMaterialsForProduction() {
    const productId = parseInt(document.getElementById('production-product').value);
    const quantity = parseInt(document.getElementById('production-quantity').value);
    
    if (!productId || !quantity) {
        document.getElementById('material-check-section').style.display = 'none';
        document.getElementById('start-production-btn').disabled = true;
        return;
    }
    
    document.getElementById('material-check-section').style.display = 'block';
    
    let stockCheck;
    if (currentProductionType === 'yarimamul') {
        stockCheck = checkYarimamulStock(productId, quantity);
    } else {
        stockCheck = checkNihaiStock(productId, quantity);
    }
    
    const resultDiv = document.getElementById('material-check-result');
    
    if (stockCheck.sufficient) {
        resultDiv.className = 'alert alert-success';
        resultDiv.innerHTML = `
            <strong><i class="fas fa-check-circle me-2"></i>Stok Yeterli!</strong> 
            Tüm malzemeler mevcut. Üretim başlatılabilir.
        `;
        document.getElementById('start-production-btn').disabled = false;
    } else {
        resultDiv.className = 'alert alert-danger';
        resultDiv.innerHTML = `
            <strong><i class="fas fa-exclamation-triangle me-2"></i>Stok Yetersiz!</strong> 
            Bazı malzemeler yetersiz. Üretim başlatılamaz.
            <br><br><strong>Eksik Malzemeler:</strong><br>
            ${stockCheck.missingItems.join('<br>')}
        `;
        document.getElementById('start-production-btn').disabled = true;
    }
}

// Üretimi başlat (ESKİ FONKSİYON - DEVRE DIŞI)
function startProductionOld() {
    const productId = parseInt(document.getElementById('production-product').value);
    const quantity = parseInt(document.getElementById('production-quantity').value);
    
    if (!productId || !quantity) {
        alert('Lütfen ürün ve miktar seçin', 'warning');
        return;
    }
    
    // Ürün bilgilerini al
    let product;
    if (currentProductionType === 'yarimamul') {
        product = yarimamuller.find(y => y.id === productId);
    } else {
        product = (window.nihaiUrunler || []).find(n => n.id === productId);
    }
    
    if (!product) {
        alert('Ürün bulunamadı', 'error');
        return;
    }
    
    // Üretim bilgilerini ayarla
    currentProduction = {
        type: currentProductionType,
        productId: productId,
        product: product,
        quantity: quantity,
        startTime: new Date().toISOString()
    };
    
    // Faz 0: State Manager'ı güncelle
    if (window.stateManager) {
        window.stateManager.updateState('activeProduction', currentProduction);
        window.stateManager.updateState('workflowStatus', 'producing');
        window.stateManager.addNotification('Üretim başlatıldı', 'success');
    }
    
    // Faz 0: Event Bus'a bildir
    if (window.eventBus) {
        window.eventBus.emit('production-started', currentProduction);
    }
    
    // Faz 0: Workflow Engine ile üretim workflow'unu başlat
    if (window.workflowEngine) {
        try {
            window.workflowEngine.startWorkflow('production-start', {
                product: currentProduction.product,
                quantity: currentProduction.quantity,
                type: currentProduction.type
            });
        } catch (error) {
            console.error('Workflow başlatılamadı:', error);
        }
    }
    
    // İstatistikleri sıfırla
    productionStats = {
        target: quantity,
        produced: 0,
        success: 0,
        error: 0
    };
    
    scannedBarcodes = [];
    
    // Barkod modal'ını göster
    const selectionModal = bootstrap.Modal.getInstance(document.getElementById('productionSelectionModal'));
    selectionModal.hide();
    
    // Barkod modal'ını başlat
    initializeBarcodeModal();
    
    const barcodeModal = new bootstrap.Modal(document.getElementById('barcodeModal'));
    barcodeModal.show();
}

// Barkod modal'ını başlat
function initializeBarcodeModal() {
    // Ürün bilgilerini göster
    document.getElementById('target-product-name').textContent = currentProduction.product.ad;
    document.getElementById('target-product-code').textContent = currentProduction.product.kod;
    document.getElementById('target-quantity').textContent = currentProduction.quantity;
    document.getElementById('remaining-quantity').textContent = currentProduction.quantity;
    
    // İstatistikleri güncelle
    updateProductionStats();
    
    // Barkod input'unu temizle ve odakla
    document.getElementById('barcode-input').value = '';
    document.getElementById('barcode-input').focus();
    
    // Son okutulan barkodu temizle
    document.getElementById('last-scanned').innerHTML = 'Henüz barkod okutulmadı';
}

// Duplicate scanBarcode fonksiyonu kaldırıldı - çakışma önlendi

// Barkod doğrulama
function validateBarcode(barcode) {
    if (!currentProduction || !currentProduction.product) {
        return false;
    }
    
    const expectedBarcode = currentProduction.product.barkod;
    
    // Eğer ürünün barkodu tanımlanmamışsa, her barkodu kabul et
    if (!expectedBarcode) {
        return true;
    }
    
    // Barkod eşleşmesi kontrolü
    return barcode === expectedBarcode;
}

// Barkod sonucu göster
function showBarcodeResult(message, type) {
    const resultDiv = document.getElementById('barcode-result');
    resultDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // 3 saniye sonra otomatik kapat
    setTimeout(() => {
        const alert = resultDiv.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 3000);
}

// Üretim istatistiklerini güncelle
function updateProductionStats() {
    document.getElementById('produced-count').textContent = productionStats.produced;
    document.getElementById('success-count').textContent = productionStats.success;
    document.getElementById('error-count').textContent = productionStats.error;
    document.getElementById('remaining-quantity').textContent = productionStats.target;
    
    // Progress bar güncelle
    const progress = (productionStats.success / currentProduction.quantity) * 100;
    const progressBar = document.getElementById('production-progress');
    const progressText = document.getElementById('progress-text');
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
    
    // Progress bar rengini güncelle
    if (progress === 100) {
        progressBar.className = 'progress-bar bg-success progress-bar-striped';
    } else if (progress > 50) {
        progressBar.className = 'progress-bar bg-warning progress-bar-striped progress-bar-animated';
    } else {
        progressBar.className = 'progress-bar bg-primary progress-bar-striped progress-bar-animated';
    }
}

// Üretimi tamamla
function completeProduction() {
    if (!currentProduction) {
        alert('Aktif üretim bulunamadı', 'error');
        return;
    }
    
    // Üretim tamamlama onayı
    if (!confirm(`${currentProduction.product.ad} üretimini tamamlamak istediğinizden emin misiniz?\n\nÜretilen: ${productionStats.success} adet\nHedef: ${currentProduction.quantity} adet`)) {
        return;
    }
    
    try {
        // Üretim kaydını oluştur
        const production = {
            type: currentProduction.type,
            productId: currentProduction.productId,
            quantity: productionStats.success,
            targetQuantity: currentProduction.quantity,
            startTime: currentProduction.startTime,
            endTime: new Date().toISOString(),
            status: 'completed',
            scannedBarcodes: scannedBarcodes,
            successRate: (productionStats.success / currentProduction.quantity) * 100
        };
        
        // Geçmişe ekle
        productionHistory.unshift(production);
        
        // UI'yi güncelle
        displayProductionHistory();
        
        // Modal'ı kapat
        const barcodeModal = bootstrap.Modal.getInstance(document.getElementById('barcodeModal'));
        barcodeModal.hide();
        
        // Başarı mesajı
        alert(`Üretim tamamlandı! ${productionStats.success} adet ${currentProduction.product.ad} üretildi.`, 'success');
        
        // Verileri sıfırla
        currentProduction = null;
        currentProductionType = null;
        scannedBarcodes = [];
        productionStats = { target: 0, produced: 0, success: 0, error: 0 };
        
    } catch (error) {
        console.error('Üretim tamamlama hatası:', error);
        alert('Üretim tamamlanırken hata oluştu', 'error');
    }
}

// Alert göster
function alert(message, type) {
    const alertModal = document.getElementById('alertModal');
    const alertTitle = document.getElementById('alertModalTitle');
    const alertBody = document.getElementById('alertModalBody');
    const alertHeader = document.getElementById('alertModalHeader');
    
    alertTitle.textContent = type === 'error' ? 'Hata' : type === 'success' ? 'Başarılı' : type === 'warning' ? 'Uyarı' : 'Bilgi';
    alertBody.textContent = message;
    
    // Header rengini ayarla
    alertHeader.className = `modal-header ${type === 'error' ? 'bg-danger' : type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning' : 'bg-info'} text-white`;
    
    const modal = new bootstrap.Modal(alertModal);
    modal.show();
    
    // Modal'ı otomatik kapat (success mesajları için)
    if (type === 'success') {
        setTimeout(() => {
            modal.hide();
        }, 2000); // 2 saniye sonra kapat
    }
}

// ========================================
// PERFORMANS OPTİMİZASYONU - FAZ 5
// ========================================

// Retry mekanizması
async function retryRequest(requestFunction, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFunction();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            console.warn(`İstek başarısız (${i + 1}/${maxRetries}):`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}

// Request timeout
function fetchWithTimeout(url, options = {}, timeout = 10000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('İstek zaman aşımına uğradı')), timeout)
        )
    ]);
}

// ========================================
// YENİ API FONKSİYONLARI - FAZ 4
// ========================================

// Üretim oluşturma
async function createProduction(productionData) {
    try {
        const response = await fetch('/api/productions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productionData)
        });
        
        if (!response.ok) throw new Error('Üretim oluşturulamadı');
        return await response.json();
    } catch (error) {
        console.error('Production creation error:', error);
        throw error;
    }
}

// Aktif üretimleri getir
async function getActiveProductions() {
    return await retryRequest(async () => {
        const response = await fetchWithTimeout('/api/productions/active');
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Çok fazla istek. Lütfen bekleyin.');
            }
            throw new Error(`HTTP ${response.status}: Aktif üretimler alınamadı`);
        }
        return await response.json();
    });
}

// Üretim geçmişini getir
async function getProductionHistory() {
    try {
        const response = await fetch('/api/productions/history');
        if (!response.ok) throw new Error('Üretim geçmişi alınamadı');
        return await response.json();
    } catch (error) {
        console.error('Production history fetch error:', error);
        throw error;
    }
}

// Üretim güncelleme
async function updateProduction(productionId, updates) {
    try {
        const response = await fetch(`/api/productions/${productionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates)
        });
        
        if (!response.ok) throw new Error('Üretim güncellenemedi');
        return await response.json();
    } catch (error) {
        console.error('Production update error:', error);
        throw error;
    }
}

// Üretim tamamlama
async function completeProduction(productionId, notes) {
    try {
        const response = await fetch(`/api/productions/${productionId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notes })
        });
        
        if (!response.ok) throw new Error('Üretim tamamlanamadı');
        return await response.json();
    } catch (error) {
        console.error('Production completion error:', error);
        throw error;
    }
}

// Barkod okutma
async function scanBarcodeAPI(productionId, barcode, operator) {
    try {
        const response = await fetch('/api/barcodes/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                production_id: productionId,
                barcode: barcode,
                operator: operator
            })
        });
        
        if (!response.ok) throw new Error('Barkod okutulamadı');
        return await response.json();
    } catch (error) {
        console.error('Barcode scan error:', error);
        throw error;
    }
}

// Barkod geçmişi
async function getBarcodeHistory(productionId) {
    try {
        const response = await fetch(`/api/barcodes/history/${productionId}`);
        if (!response.ok) throw new Error('Barkod geçmişi alınamadı');
        return await response.json();
    } catch (error) {
        console.error('Barcode history fetch error:', error);
        throw error;
    }
}

// Barkod doğrulama
async function validateBarcode(barcode, productId, productType) {
    try {
        const response = await fetch('/api/barcodes/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                barcode: barcode,
                product_id: productId,
                product_type: productType
            })
        });
        
        if (!response.ok) throw new Error('Barkod doğrulanamadı');
        return await response.json();
    } catch (error) {
        console.error('Barcode validation error:', error);
        throw error;
    }
}

// Üretim özeti raporu
async function getProductionSummary(startDate, endDate) {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const response = await fetch(`/api/reports/production-summary?${params}`);
        if (!response.ok) throw new Error('Rapor alınamadı');
        return await response.json();
    } catch (error) {
        console.error('Production summary error:', error);
        throw error;
    }
}

// Malzeme kullanım raporu
async function getMaterialUsageReport(period = 'month') {
    try {
        const response = await fetch(`/api/reports/material-usage?period=${period}`);
        if (!response.ok) throw new Error('Malzeme raporu alınamadı');
        return await response.json();
    } catch (error) {
        console.error('Material usage report error:', error);
        throw error;
    }
}

// Verimlilik raporu
async function getEfficiencyReport(productionId) {
    try {
        const response = await fetch(`/api/reports/efficiency?production_id=${productionId}`);
        if (!response.ok) throw new Error('Verimlilik raporu alınamadı');
        return await response.json();
    } catch (error) {
        console.error('Efficiency report error:', error);
        throw error;
    }
}

// ========================================
// YENİ UI FONKSİYONLARI - FAZ 4
// ========================================


// Üretim özeti göster
async function showProductionSummary() {
    try {
        const summary = await getProductionSummary();
        console.log('Üretim özeti:', summary);
        
        // Özet bilgilerini göster
        const summaryText = `
            Toplam Üretim: ${summary.total_productions}
            Tamamlanan: ${summary.completed}
            Aktif: ${summary.active}
            İptal Edilen: ${summary.cancelled}
            Toplam Miktar: ${summary.total_quantity}
            Hedef Miktar: ${summary.total_target}
            Verimlilik: %${summary.efficiency}
        `;
        
        alert(summaryText, 'info');
        return summary;
    } catch (error) {
        console.error('Üretim özeti alınamadı:', error);
        alert('Üretim özeti alınamadı: ' + error.message, 'error');
        return null;
    }
}

// Verimlilik raporu göster
async function showEfficiencyReport(productionId) {
    try {
        const report = await getEfficiencyReport(productionId);
        console.log('Verimlilik raporu:', report);
        
        // Rapor bilgilerini göster
        const reportText = `
            Üretim ID: ${report.production_id}
            Toplam Tarama: ${report.total_scans}
            Başarılı Tarama: ${report.successful_scans}
            Başarısız Tarama: ${report.failed_scans}
            Verimlilik: %${report.efficiency}
            Tamamlanma Oranı: %${report.completion_percentage}
            Üretim Hızı: ${report.production_rate} adet/dakika
        `;
        
        alert(reportText, 'info');
        return report;
    } catch (error) {
        console.error('Verimlilik raporu alınamadı:', error);
        alert('Verimlilik raporu alınamadı: ' + error.message, 'error');
        return null;
    }
}

// ========================================
// ÜRETİM AŞAMALARI YÖNETİMİ - FAZ 1
// ========================================

// Aşama şablonlarını yükle
async function loadStageTemplates() {
    try {
        console.log('🔄 Loading stage templates...');
        const response = await fetch('/api/operators');
        if (!response.ok) throw new Error('Operatörler yüklenemedi');
        
        const operators = await response.json();
        console.log('✅ Operators loaded:', operators.length, 'operators');
        console.log('📋 Operators data:', operators);
        displayStageTemplates(operators);
        return operators;
    } catch (error) {
        console.error('❌ Stage templates load error:', error);
        alert('Aşama şablonları yüklenemedi: ' + error.message, 'error');
        return [];
    }
}

// Operatör listesini göster
function displayStageTemplates(operators) {
    console.log('🎨 Displaying operators:', operators);
    const container = document.getElementById('operators-list-container');
    if (!container) {
        console.error('❌ Operators list container not found!');
        return;
    }
    console.log('✅ Container found, rendering operators...');
    
    // Yükleme mesajını temizle
    console.log('🧹 Clearing loading message...');
    container.innerHTML = '';
    
    if (operators.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-users fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Operatör bulunmuyor</h5>
                <p class="text-muted">Sistemde henüz operatör kaydı bulunmuyor.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
        html += `
                <div class="row">
        `;
        
    operators.forEach(operator => {
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <div class="avatar bg-primary text-white rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                <i class="fas fa-user"></i>
                        </div>
                            <div>
                                <h6 class="mb-1">${operator.name}</h6>
                                <small class="text-muted">${operator.department}</small>
                            </div>
                            </div>
                        <div class="row text-center">
                            <div class="col-6">
                                <div class="badge ${operator.is_active ? 'bg-success' : 'bg-secondary'} fs-6">
                                    ${operator.is_active ? 'Aktif' : 'Pasif'}
                            </div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Seviye: ${operator.skill_level || 'N/A'}</small>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-outline-primary w-100" onclick="viewOperatorDetails('${operator.id}')">
                                <i class="fas fa-eye me-1"></i>Detaylar
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
        `;
    
    container.innerHTML = html;
}

// Yeni aşama şablonu modal'ını göster
function showAddStageTemplateModal() {
    const modal = new bootstrap.Modal(document.getElementById('addStageTemplateModal'));
    modal.show();
}

// Aşama şablonu ekle
async function addStageTemplate() {
    try {
        const form = document.getElementById('addStageTemplateForm');
        const formData = new FormData(form);
        
        const templateData = {
            product_type: document.getElementById('template-product-type').value,
            stage_name: document.getElementById('template-stage-name').value,
            stage_order: parseInt(document.getElementById('template-stage-order').value),
            estimated_duration: parseInt(document.getElementById('template-duration').value) || null,
            required_skills: document.getElementById('template-skills').value
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0),
            quality_check_required: document.getElementById('template-quality-check').checked,
            is_mandatory: document.getElementById('template-mandatory').checked
        };
        
        const response = await fetch('/api/production-stages/templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(templateData)
        });
        
        if (!response.ok) throw new Error('Aşama şablonu eklenemedi');
        
        const newTemplate = await response.json();
        alert('Aşama şablonu başarıyla eklendi!', 'success');
        
        // Modal'ı kapat ve formu temizle
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStageTemplateModal'));
        modal.hide();
        form.reset();
        
        // Şablonları yenile
        await loadStageTemplates();
        
        return newTemplate;
    } catch (error) {
        console.error('Add stage template error:', error);
        alert('Aşama şablonu eklenemedi: ' + error.message, 'error');
    }
}

// Üretim aşamalarını yükle
async function loadProductionStages(productionId) {
    try {
        const response = await fetch(`/api/productions/${productionId}/stages`);
        if (!response.ok) throw new Error('Üretim aşamaları yüklenemedi');
        
        const stages = await response.json();
        displayProductionStages(stages);
        return stages;
    } catch (error) {
        console.error('Production stages load error:', error);
        alert('Üretim aşamaları yüklenemedi: ' + error.message, 'error');
        return [];
    }
}

// Üretim aşamalarını göster
function displayProductionStages(stages) {
    const container = document.getElementById('stages-timeline');
    if (!container) return;
    
    if (stages.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-list-ol fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Aşama bulunmuyor</h5>
                <p class="text-muted">Bu üretim için henüz aşama tanımlanmamış.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    stages.forEach((stage, index) => {
        const statusClass = stage.status;
        const statusText = {
            'pending': 'Bekleyen',
            'active': 'Aktif',
            'in_progress': 'İşleniyor',
            'processing': 'İşleniyor',
            'completed': 'Tamamlandı',
            'delivered': 'Teslim Edildi',
            'skipped': 'Atlandı',
            'paused': 'Duraklatıldı',
            'cancelled': 'İptal Edildi'
        }[stage.status] || stage.status;
        
        const statusColor = {
            'pending': 'secondary',
            'active': 'primary',
            'completed': 'success',
            'skipped': 'warning'
        }[stage.status] || 'secondary';
        
        html += `
            <div class="stage-item ${statusClass}">
                <div class="stage-header">
                    <div class="d-flex align-items-center">
                        <div class="stage-order">${stage.stage_order}</div>
                        <h5 class="stage-title">${stage.stage_name}</h5>
                    </div>
                    <div class="stage-status">
                        <span class="badge bg-${statusColor}">${statusText}</span>
                    </div>
                </div>
                
                <div class="stage-details">
                    <div class="stage-detail-item">
                        <i class="fas fa-user"></i>
                        Operatör: ${stage.operator || 'Belirtilmemiş'}
                    </div>
                    <div class="stage-detail-item">
                        <i class="fas fa-clock"></i>
                        Başlangıç: ${stage.start_time ? new Date(stage.start_time).toLocaleString('tr-TR') : 'Belirtilmemiş'}
                    </div>
                    <div class="stage-detail-item">
                        <i class="fas fa-flag-checkered"></i>
                        Bitiş: ${stage.end_time ? new Date(stage.end_time).toLocaleString('tr-TR') : 'Devam ediyor'}
                    </div>
                    <div class="stage-detail-item">
                        <i class="fas fa-check-circle"></i>
                        Kalite: ${stage.quality_check_required ? 'Gerekli' : 'Gerekli Değil'}
                    </div>
                </div>
                
                ${stage.notes ? `
                    <div class="mt-3">
                        <strong>Notlar:</strong>
                        <p class="text-muted mb-0">${stage.notes}</p>
                    </div>
                ` : ''}
                
                <div class="stage-actions">
                    ${stage.status === 'pending' ? `
                        <button class="btn btn-primary btn-sm" onclick="startStage(${stage.id})">
                            <i class="fas fa-play me-1"></i>Başlat
                        </button>
                    ` : ''}
                    ${stage.status === 'active' ? `
                        <button class="btn btn-success btn-sm" onclick="completeStage(${stage.id})">
                            <i class="fas fa-check me-1"></i>Tamamla
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="pauseStage(${stage.id})">
                            <i class="fas fa-pause me-1"></i>Duraklat
                        </button>
                    ` : ''}
                    ${stage.status === 'completed' ? `
                        <button class="btn btn-info btn-sm" onclick="viewStageDetails(${stage.id})">
                            <i class="fas fa-eye me-1"></i>Detaylar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Aşama başlat
async function startStage(stageId) {
    try {
        const response = await fetch(`/api/productions/${currentProductionId}/stages/${stageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'active',
                start_time: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error('Aşama başlatılamadı');
        
        alert('Aşama başarıyla başlatıldı!', 'success');
        await loadProductionStages(currentProductionId);
    } catch (error) {
        console.error('Start stage error:', error);
        alert('Aşama başlatılamadı: ' + error.message, 'error');
    }
}

// Aşama tamamla
async function completeStage(stageId) {
    try {
        const response = await fetch(`/api/productions/${currentProductionId}/stages/${stageId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                notes: ''
            })
        });
        
        if (!response.ok) throw new Error('Aşama tamamlanamadı');
        
        alert('Aşama başarıyla tamamlandı!', 'success');
        await loadProductionStages(currentProductionId);
    } catch (error) {
        console.error('Complete stage error:', error);
        alert('Aşama tamamlanamadı: ' + error.message, 'error');
    }
}

// Global değişkenler (zaten yukarıda tanımlanmış)

// Üretim aşamaları modal'ını göster
function showProductionStagesModal(productionId) {
    currentProductionId = productionId;
    document.getElementById('stages-production-id').textContent = productionId;
    
    const modal = new bootstrap.Modal(document.getElementById('productionStagesModal'));
    modal.show();
    
    // Aşamaları yükle
    loadProductionStages(productionId);
}

// Tab değiştiğinde aşama şablonlarını yükle
// Tab event listener'ları ana DOMContentLoaded'da tanımlandı

// ========================================
// ==================== FAZ 3: ÜRETİM PLANLAMA VE ZAMANLAMA SİSTEMİ ====================

// Üretim planları yükleme
async function loadProductionPlans() {
    try {
        const response = await fetch('/api/production-plans');
        const data = await response.json();
        
        if (response.ok) {
            productionPlans = data;
            displayProductionPlans(productionPlans);
        } else {
            console.error('Üretim planları yüklenemedi:', data.error);
            alert('Üretim planları yüklenemedi: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Üretim planları fetch error:', error);
        alert('Üretim planları yüklenirken hata oluştu', 'error');
    }
}

// Üretim planlarını görüntüleme
function displayProductionPlans(plans) {
    const container = document.getElementById('production-plans-container');
    
    if (!plans || plans.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Henüz üretim planı bulunmuyor</h5>
                <p class="text-muted">Yeni bir üretim planı oluşturmak için "Yeni Plan" butonuna tıklayın.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = plans.map(plan => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h6 class="card-title mb-1">${plan.plan_name}</h6>
                        <p class="card-text text-muted mb-2">
                            <i class="fas fa-calendar me-1"></i>
                            ${new Date(plan.start_date).toLocaleDateString('tr-TR')} - 
                            ${new Date(plan.end_date).toLocaleDateString('tr-TR')}
                        </p>
                        <div class="d-flex gap-2">
                            <span class="badge bg-${getStatusColor(plan.status)}">${getStatusText(plan.status)}</span>
                            <span class="badge bg-info">${plan.plan_type}</span>
                            <span class="badge bg-secondary">${plan.total_quantity || 0} Adet</span>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewPlanDetails(${plan.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="generateWorkOrder(${plan.id})" title="İş Emri Oluştur">
                                <i class="fas fa-file-alt"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="editPlan(${plan.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deletePlan(${plan.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Kaynakları yükleme
async function loadResources() {
    try {
        console.log('Kaynaklar yükleniyor...');
        const response = await fetch('/api/resources');
        const data = await response.json();
        
        console.log('Kaynak API yanıtı:', data);
        
        if (response.ok) {
            resources = data;
            await displayResources(resources);
            console.log('Kaynaklar başarıyla yüklendi:', resources.length);
        } else {
            console.error('Kaynaklar yüklenemedi:', data.error);
            alert('Kaynaklar yüklenemedi: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Kaynaklar fetch error:', error);
        alert('Kaynaklar yüklenirken hata oluştu', 'error');
    }
}

// Operatör kullanım bilgilerini hesapla
async function calculateOperatorUsage() {
    try {
        console.log('Operatör kullanım bilgileri hesaplanıyor...');
        const response = await fetch('/api/operator-usage');
        const data = await response.json();
        
        if (response.ok) {
            console.log('Operatör kullanım bilgileri:', data);
            console.log('Operatör sayısı:', Object.keys(data).length);
            Object.entries(data).forEach(([operator, usage]) => {
                console.log(`Operatör: ${operator}`, usage);
            });
            return data;
        } else {
            console.error('Operatör kullanım bilgileri alınamadı:', data.error);
            return {};
        }
    } catch (error) {
        console.error('Operatör kullanım bilgileri fetch error:', error);
        return {};
    }
}

// Operatör detaylarını görüntüle
function viewOperatorDetails(operatorName) {
    alert('Operatör: ' + operatorName + '\n\nDetaylı bilgiler yakında eklenecek.');
}

// Kaynakları görüntüleme
async function displayResources(resources) {
    const container = document.getElementById('resources-container');
    
    if (!resources || resources.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-cogs fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Henüz kaynak bulunmuyor</h5>
                <p class="text-muted">Yeni kaynak eklemek için "Yeni Kaynak" butonuna tıklayın.</p>
            </div>
        `;
        return;
    }
    
    // Operatör kullanım bilgilerini hesapla
    let operatorUsage = {};
    try {
        operatorUsage = await calculateOperatorUsage();
        console.log('Operatör kullanım bilgisi:', operatorUsage);
    } catch (error) {
        console.error('Operatör kullanım hesaplama hatası:', error);
        operatorUsage = {};
    }
    
    // Kaynakları türlerine göre grupla
    const groupedResources = resources.reduce((acc, resource) => {
        if (!acc[resource.resource_type]) {
            acc[resource.resource_type] = [];
        }
        acc[resource.resource_type].push(resource);
        return acc;
    }, {});
    
    // HTML oluştur
    let html = '';
    
    // Operatör kullanım bilgileri bölümü - mevcut tasarımla uyumlu
    if (Object.keys(operatorUsage).length > 0) {
        html += '<div class="mb-4">';
        html += '<h6 class="text-capitalize mb-3">';
        html += '<i class="fas fa-users me-2"></i>Operatör Kapasite Kullanımı';
        html += '</h6>';
        html += '<div class="row">';
        
        Object.entries(operatorUsage).forEach(([operatorName, usage]) => {
            // Güvenli değer kontrolü
            const usedCapacity = usage.used_capacity || 0;
            const remainingCapacity = usage.remaining_capacity || 0;
            const usagePercentage = Math.round(usage.usage_percentage || 0);
            const activeProductions = usage.active_productions || 0;
            const activeStages = usage.active_stages || 0;
            
            const progressBarClass = usagePercentage > 80 ? 'bg-danger' : usagePercentage > 60 ? 'bg-warning' : 'bg-success';
            
            html += '<div class="col-md-6 col-lg-4 mb-3">';
            html += '<div class="card h-100">';
            html += '<div class="card-body">';
            html += '<h6 class="card-title">';
            html += '<i class="fas fa-user me-2"></i>' + operatorName;
            html += '</h6>';
            html += '<p class="card-text small text-muted">';
            html += '<i class="fas fa-clock me-1"></i>Kapasite: 8 saat<br>';
            html += '<i class="fas fa-chart-pie me-1"></i>Kullanım: ' + usagePercentage + '%<br>';
            html += '<i class="fas fa-tasks me-1"></i>Aktif Üretimler: ' + activeProductions + '<br>';
            html += '<i class="fas fa-cogs me-1"></i>Aktif Aşamalar: ' + activeStages;
            html += '</p>';
            html += '<div class="mb-2">';
            html += '<div class="d-flex justify-content-between mb-1">';
            html += '<small class="text-muted">Kullanım</small>';
            html += '<small class="text-muted">' + usedCapacity.toFixed(1) + 'h / 8h</small>';
            html += '</div>';
            html += '<div class="progress" style="height: 6px;">';
            html += '<div class="progress-bar ' + progressBarClass + '" role="progressbar" style="width: ' + usagePercentage + '%"></div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="d-flex gap-2">';
            html += '<button class="btn btn-sm btn-outline-primary" onclick="viewOperatorDetails(\'' + operatorName + '\')">';
            html += '<i class="fas fa-eye me-1"></i>Detaylar';
            html += '</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
    }
    
    // Kaynak türleri bölümü
    Object.entries(groupedResources).forEach(([type, typeResources]) => {
        const typeIcon = getResourceIcon(type);
        const typeName = getResourceTypeText(type);
        
        html += '<div class="mb-4">';
        html += '<h6 class="text-capitalize mb-3">';
        html += '<i class="fas fa-' + typeIcon + ' me-2"></i>';
        html += typeName + ' (' + typeResources.length + ')';
        html += '</h6>';
        html += '<div class="row">';
        
        typeResources.forEach(resource => {
            const usage = operatorUsage[resource.id] || 0;
            const resourceIcon = getResourceIcon(type);
            
            html += '<div class="col-md-6 col-lg-4 mb-3">';
            html += '<div class="card h-100">';
            html += '<div class="card-body">';
            html += '<h6 class="card-title">';
            html += '<i class="fas fa-' + resourceIcon + ' me-2"></i>';
            html += resource.resource_name;
            html += '</h6>';
            html += '<p class="card-text small text-muted">';
            html += '<i class="fas fa-map-marker-alt me-1"></i>' + resource.location + '<br>';
            html += '<i class="fas fa-clock me-1"></i>' + resource.capacity + ' saat<br>';
            html += '<i class="fas fa-lira-sign me-1"></i>₺' + resource.cost_per_hour + '/saat<br>';
            html += '<i class="fas fa-user me-1"></i>Kullanım: ' + usage + '/' + resource.capacity + ' saat';
            html += '</p>';
            html += '<div class="d-flex gap-2">';
            html += '<button class="btn btn-sm btn-outline-primary" onclick="editResource(' + resource.id + ')">';
            html += '<i class="fas fa-edit me-1"></i>Düzenle';
            html += '</button>';
            html += '<button class="btn btn-sm btn-outline-danger" onclick="deleteResource(' + resource.id + ')">';
            html += '<i class="fas fa-trash me-1"></i>Sil';
            html += '</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// Çalışma günü kontrolü için yardımcı fonksiyon
function isWorkingDay(date) {
  const dayOfWeek = date.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
  // Pazartesi-Cuma arası çalışma günleri (1-5)
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

// Siparişleri yükleme
window.loadOrders = async function loadOrders() {
    try {
        console.log('Siparişler yükleniyor...');
        
        // Sadece orders tablosundan veri çek
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        console.log('Orders API yanıtı:', data);
        
        if (response.ok) {
            orders = data;
        } else {
            console.error('Siparişler yüklenemedi:', data.error);
            orders = [];
        }
        displayOrders(orders);
        console.log('Tüm siparişler başarıyla yüklendi:', orders.length);
        
    } catch (error) {
        console.error('Siparişler fetch error:', error);
        alert('Siparişler yüklenirken hata oluştu', 'error');
    }
}

// İstatistikleri güncelle - API'den veri çek
async function updateOrderStatistics(orders = null) {
    try {
        // Eğer orders parametresi verilmişse eski yöntemi kullan
        if (orders) {
            const totalOrders = orders.length;
            const pendingOrders = orders.filter(order => order.status === 'pending').length;
            const processingOrders = orders.filter(order => order.status === 'processing').length;
            const completedOrders = orders.filter(order => order.status === 'completed').length;
            
            updateOrderStatisticsElements(totalOrders, pendingOrders, processingOrders, completedOrders);
            return;
        }
        
        // Sadece orders tablosundan istatistikleri çek
        const response = await fetch('/api/orders');
        const ordersData = await response.json();
        
        if (response.ok && ordersData) {
            // İstatistikleri hesapla
            const totalOrders = ordersData.length;
            const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
            const processingOrders = ordersData.filter(order => order.status === 'processing').length;
            const completedOrders = ordersData.filter(order => order.status === 'completed').length;
            
            updateOrderStatisticsElements(totalOrders, pendingOrders, processingOrders, completedOrders);
        } else {
            updateOrderStatisticsElements(0, 0, 0, 0);
        }
        
    } catch (error) {
        console.error('Sipariş istatistikleri yüklenirken hata:', error);
        // Hata durumunda varsayılan değerler
        updateOrderStatisticsElements(0, 0, 0, 0);
    }
}

// İstatistik elementlerini güncelle
function updateOrderStatisticsElements(total, pending, processing, completed) {
    const totalElement = document.getElementById('total-orders');
    const pendingElement = document.getElementById('pending-orders');
    const processingElement = document.getElementById('processing-orders');
    const completedElement = document.getElementById('completed-orders');
    
    if (totalElement) totalElement.textContent = total;
    if (pendingElement) pendingElement.textContent = pending;
    if (processingElement) processingElement.textContent = processing;
    if (completedElement) completedElement.textContent = completed;
}

// Durum mesajlarını Türkçeleştir
function translateStatus(status) {
    const statusTranslations = {
        'pending': 'Bekleyen',
        'draft': 'Taslak',
        'approved': 'Onaylanmış',
        'in_production': 'Üretimde',
        'in_progress': 'İşleniyor',
        'processing': 'İşleniyor',
        'completed': 'Tamamlandı',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal Edildi',
        'paused': 'Duraklatıldı',
        'active': 'Aktif',
        'inactive': 'Pasif'
    };
    
    return statusTranslations[status] || status;
}

// Durum rengini belirle
function getStatusColor(status) {
    const statusColors = {
        'pending': 'warning',
        'draft': 'secondary',
        'approved': 'info',
        'in_production': 'primary',
        'in_progress': 'info',
        'processing': 'info',
        'completed': 'success',
        'delivered': 'success',
        'cancelled': 'danger',
        'paused': 'warning',
        'active': 'success',
        'inactive': 'secondary'
    };
    
    return statusColors[status] || 'secondary';
}

// Sipariş detaylarını görüntüleme
function viewOrder(orderId) {
    console.log('Sipariş detayları görüntüleniyor:', orderId);
    
    // Siparişi bul
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        alert('Sipariş bulunamadı!', 'error');
        return;
    }
    
    // Modal başlığını güncelle
    document.getElementById('orderDetailsModalLabel').innerHTML = 
        `<i class="fas fa-file-alt me-2"></i>Sipariş Detayları - ${order.order_number}`;
    
    // Sipariş detaylarını oluştur
    const orderDetails = createOrderDetailsHTML(order);
    document.getElementById('orderDetailsModalBody').innerHTML = orderDetails;
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
}

// Sipariş detayları HTML oluşturma
function createOrderDetailsHTML(order) {
    const statusBadge = getStatusBadge(order.status);
    const priorityBadge = getPriorityBadge(order.priority);
    const createdDate = new Date(order.created_at).toLocaleDateString('tr-TR');
    const updatedDate = new Date(order.updated_at).toLocaleDateString('tr-TR');
    
    return `
        <div class="row">
            <!-- Sol: Temel Bilgiler -->
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Temel Bilgiler</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Sipariş No:</strong></td>
                                <td>${order.order_number}</td>
                            </tr>
                            <tr>
                                <td><strong>Müşteri:</strong></td>
                                <td>${order.customer_name}</td>
                            </tr>
                            <tr>
                                <td><strong>Sipariş Tarihi:</strong></td>
                                <td>${new Date(order.order_date).toLocaleDateString('tr-TR')}</td>
                            </tr>
                            <tr>
                                <td><strong>Teslim Tarihi:</strong></td>
                                <td>${new Date(order.delivery_date).toLocaleDateString('tr-TR')}</td>
                            </tr>
                            <tr>
                                <td><strong>Öncelik:</strong></td>
                                <td>${priorityBadge}</td>
                            </tr>
                            <tr>
                                <td><strong>Durum:</strong></td>
                                <td>${statusBadge}</td>
                            </tr>
                            <tr>
                                <td><strong>Toplam Miktar:</strong></td>
                                <td><span class="badge bg-primary">${order.quantity || 0}</span></td>
                            </tr>
                            <tr>
                                <td><strong>Toplam Tutar:</strong></td>
                                <td><strong class="text-success">₺${order.total_amount || 0}</strong></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Sağ: Ek Bilgiler -->
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0"><i class="fas fa-cog me-2"></i>Ek Bilgiler</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Atanan Operatör:</strong></td>
                                <td>${order.assigned_operator || 'Atanmamış'}</td>
                            </tr>
                            <tr>
                                <td><strong>Referans No:</strong></td>
                                <td>${order.reference_number || 'Yok'}</td>
                            </tr>
                            <tr>
                                <td><strong>Oluşturulma:</strong></td>
                                <td>${createdDate}</td>
                            </tr>
                            <tr>
                                <td><strong>Son Güncelleme:</strong></td>
                                <td>${updatedDate}</td>
                            </tr>
                        </table>
                        
                        ${order.notes ? `
                            <div class="mt-3">
                                <strong>Notlar:</strong>
                                <div class="alert alert-light mt-2">
                                    <small>${order.notes}</small>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Ürün Detayları -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0"><i class="fas fa-boxes me-2"></i>Ürün Detayları</h6>
                    </div>
                    <div class="card-body">
                        ${createProductDetailsTable(order.product_details)}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- İşlem Geçmişi -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0"><i class="fas fa-history me-2"></i>İşlem Geçmişi</h6>
                    </div>
                    <div class="card-body">
                        ${createOrderHistory(order)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Ürün detayları tablosu oluşturma
function createProductDetailsTable(productDetails) {
    // product_details string ise parse et
    let products = [];
    if (typeof productDetails === 'string') {
        try {
            products = JSON.parse(productDetails);
        } catch (e) {
            console.error('❌ Ürün detayları parse edilemedi:', e);
            return '<p class="text-muted">Ürün detayları parse edilemedi.</p>';
        }
    } else if (Array.isArray(productDetails)) {
        products = productDetails;
    } else {
        return '<p class="text-muted">Geçersiz ürün detayları formatı.</p>';
    }
    
    if (!products || products.length === 0) {
        return '<p class="text-muted">Ürün detayları bulunamadı.</p>';
    }
    
    return `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-light">
                    <tr>
                        <th>Ürün Kodu</th>
                        <th>Ürün Adı</th>
                        <th>Miktar</th>
                        <th>Birim Fiyat</th>
                        <th>Toplam</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td><code>${product.product_code || product.code || 'N/A'}</code></td>
                            <td>${product.product_name || product.name || 'N/A'}</td>
                            <td><span class="badge bg-info">${product.quantity || 0}</span></td>
                            <td>₺${product.unit_price || 0}</td>
                            <td><strong>₺${(product.quantity || 0) * (product.unit_price || 0)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Sipariş işlem geçmişi oluşturma
function createOrderHistory(order) {
    const history = [
        {
            date: order.created_at,
            action: 'Sipariş Oluşturuldu',
            description: 'Sipariş sisteme eklendi',
            status: 'created'
        }
    ];
    
    if (order.status === 'approved') {
        history.push({
            date: order.updated_at,
            action: 'Sipariş Onaylandı',
            description: 'Sipariş onaylandı ve üretim planı oluşturuldu',
            status: 'approved'
        });
    }
    
    return `
        <div class="timeline">
            ${history.map(item => `
                <div class="timeline-item">
                    <div class="timeline-marker bg-${item.status === 'created' ? 'primary' : 'success'}"></div>
                    <div class="timeline-content">
                        <h6 class="timeline-title">${item.action}</h6>
                        <p class="timeline-description">${item.description}</p>
                        <small class="text-muted">${new Date(item.date).toLocaleString('tr-TR')}</small>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Durum badge'i oluşturma
function getStatusBadge(status) {
    const statusMap = {
        'pending': { class: 'warning', text: 'Bekleyen' },
        'draft': { class: 'secondary', text: 'Taslak' },
        'approved': { class: 'success', text: 'Onaylanmış' },
        'processing': { class: 'info', text: 'İşleniyor' },
        'in_progress': { class: 'info', text: 'İşleniyor' },
        'in_production': { class: 'primary', text: 'Üretimde' },
        'completed': { class: 'success', text: 'Tamamlandı' },
        'delivered': { class: 'success', text: 'Teslim Edildi' },
        'cancelled': { class: 'danger', text: 'İptal Edildi' },
        'paused': { class: 'warning', text: 'Duraklatıldı' },
        'active': { class: 'success', text: 'Aktif' },
        'inactive': { class: 'secondary', text: 'Pasif' }
    };
    
    const statusInfo = statusMap[status] || { class: 'secondary', text: status };
    return `<span class="badge bg-${statusInfo.class}">${statusInfo.text}</span>`;
}

// Öncelik badge'i oluşturma
function getPriorityBadge(priority) {
    const priorityMap = {
        1: { class: 'success', text: 'Düşük' },
        2: { class: 'info', text: 'Orta' },
        3: { class: 'warning', text: 'Yüksek' },
        4: { class: 'danger', text: 'Kritik' }
    };
    
    const priorityInfo = priorityMap[priority] || { class: 'secondary', text: 'Bilinmiyor' };
    return `<span class="badge bg-${priorityInfo.class}">${priorityInfo.text}</span>`;
}

// Sipariş detaylarından düzenleme
function editOrderFromDetails() {
    // Modal'ı kapat
    const detailsModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
    detailsModal.hide();
    
    // Düzenleme modal'ını aç
    setTimeout(() => {
        showAddOrderModal();
    }, 300);
}

// İş Emri Oluşturma Fonksiyonu
async function generateWorkOrder(planId) {
    try {
        console.log('İş emri oluşturuluyor, Plan ID:', planId);
        
        // Plan detaylarını getir
        const response = await fetch(`/api/production-plans/${planId}`);
        const plan = await response.json();
        
        if (!response.ok) {
            throw new Error(plan.error || 'Plan detayları alınamadı');
        }
        
        // Sipariş detaylarını getir
        const orderResponse = await fetch(`/api/orders/${plan.order_id}`);
        const order = orderResponse.ok ? await orderResponse.json() : null;
        
        console.log('🔍 Order Response Status:', orderResponse.status);
        console.log('🔍 Order Response OK:', orderResponse.ok);
        console.log('🔍 Order Data:', order);
        
        // Debug: Sadece gerekli bilgileri konsola yazdır
        console.log('🔍 Order product_details type:', typeof order?.product_details);
        console.log('🔍 Order product_details length:', order?.product_details?.length);
        
        // İş emri HTML'ini oluştur
        const workOrderHTML = createWorkOrderHTML(plan, order);
        
        // Önce yeni pencerede açmayı dene
        try {
            const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            
            if (printWindow && !printWindow.closed) {
                printWindow.document.write(workOrderHTML);
                printWindow.document.close();
                
                // Yazdırma işlemini başlat
                setTimeout(() => {
                    printWindow.print();
                }, 1000);
                return;
            }
        } catch (popupError) {
            console.warn('Popup açılamadı, modal kullanılacak:', popupError);
        }
        
        // Popup açılamazsa modal göster
        showWorkOrderModal(workOrderHTML);
        
    } catch (error) {
        console.error('İş emri oluşturma hatası:', error);
        alert('İş emri oluşturulamadı: ' + error.message, 'error');
    }
}

// İş Emri Modal Gösterme
function showWorkOrderModal(workOrderHTML) {
    // Modal HTML'ini oluştur
    const modalHTML = `
        <div class="modal fade" id="workOrderModal" tabindex="-1" aria-labelledby="workOrderModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="workOrderModalLabel">
                            <i class="fas fa-file-alt me-2"></i>İş Emri
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex justify-content-between mb-3">
                            <button class="btn btn-primary" onclick="printWorkOrder()">
                                <i class="fas fa-print me-2"></i>Yazdır
                            </button>
                            <button class="btn btn-success" onclick="downloadWorkOrder()">
                                <i class="fas fa-download me-2"></i>İndir
                            </button>
                        </div>
                        <div id="workOrderContent" style="border: 1px solid #ddd; padding: 20px; background: white;">
                            ${workOrderHTML}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eski modal varsa kaldır
    const existingModal = document.getElementById('workOrderModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Yeni modal ekle
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('workOrderModal'));
    modal.show();
    
    // Modal kapatıldığında temizle
    document.getElementById('workOrderModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// İş Emri Yazdırma
function printWorkOrder() {
    const content = document.getElementById('workOrderContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>İş Emri</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>${content}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// İş Emri İndirme
function downloadWorkOrder() {
    const content = document.getElementById('workOrderContent').innerHTML;
    const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
            <title>İş Emri</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
            </style>
        </head>
        <body>${content}</body>
        </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `is-emri-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// İş Emri HTML Oluşturma
function createWorkOrderHTML(plan, order) {
    const currentDate = new Date().toLocaleDateString('tr-TR');
    const customerName = order ? order.customer_name : 'Bilinmiyor';
    
    // Plan ürünlerini listele
    let productsList = '';
    
    console.log('🔍 createWorkOrderHTML - Plan product_details:', plan.product_details);
    console.log('🔍 createWorkOrderHTML - Order product_details:', order ? order.product_details : 'Order yok');
    console.log('🔍 createWorkOrderHTML - Plan notes:', plan.notes);
    
    // Önce plan.product_details kontrol et
    if (plan.product_details && Array.isArray(plan.product_details)) {
        productsList = plan.product_details.map(product => 
            `<tr>
                <td>${product.product_code || product.code || 'N/A'}</td>
                <td>${product.quantity || 0}</td>
                <td>${product.unit || 'Adet'}</td>
            </tr>`
        ).join('');
    } 
    // Eğer plan.product_details yoksa, order.product_details kontrol et
    else if (order && order.product_details) {
        let products = [];
        
        // Eğer string ise parse et
        if (typeof order.product_details === 'string') {
            try {
                products = JSON.parse(order.product_details);
                console.log('🔍 Parsed products:', products);
            } catch (error) {
                console.error('❌ Product details parse edilemedi:', error);
                products = [];
            }
        } else if (Array.isArray(order.product_details)) {
            products = order.product_details;
        }
        
        if (products && products.length > 0) {
            productsList = products.map(product => 
                `<tr>
                    <td>${product.product_code || product.code || 'N/A'}</td>
                    <td>${product.quantity || 0}</td>
                    <td>${product.unit || 'Adet'}</td>
                </tr>`
            ).join('');
        } else {
            productsList = '<tr><td colspan="3" class="text-center">Ürün detayları parse edilemedi</td></tr>';
        }
    }
    // Eğer hiçbiri yoksa, plan.notes alanından sipariş bilgilerini çıkar
    else if (plan.notes && plan.notes.includes('[SEÇİLEN SİPARİŞLER:')) {
        try {
            const parts = plan.notes.split('[SEÇİLEN SİPARİŞLER:');
            if (parts[1]) {
                const jsonPart = parts[1].replace(']', '').trim();
                const selectedOrders = JSON.parse(jsonPart);
                
                // Her sipariş için ürün detaylarını çıkar
                productsList = selectedOrders.map(order => {
                    if (order.product_details && Array.isArray(order.product_details)) {
                        return order.product_details.map(product => 
                            `<tr>
                                <td>${product.product_code || product.code || 'N/A'}</td>
                                <td>${product.quantity || 0}</td>
                                <td>${product.unit || 'Adet'}</td>
                            </tr>`
                        ).join('');
                    } else {
                        return `<tr>
                            <td>${order.product_code || order.code || 'N/A'}</td>
                            <td>${order.quantity || 0}</td>
                            <td>${order.unit || 'Adet'}</td>
                        </tr>`;
                    }
                }).join('');
            } else {
                productsList = '<tr><td colspan="3" class="text-center">Ürün bilgisi bulunamadı</td></tr>';
            }
        } catch (error) {
            console.error('Sipariş bilgileri parse edilemedi:', error);
            productsList = '<tr><td colspan="3" class="text-center">Ürün bilgisi bulunamadı</td></tr>';
        }
    }
    // Son çare olarak plan adını kullan
    else if (plan.plan_name) {
        productsList = `<tr>
            <td>PLAN-${plan.id}</td>
            <td>${plan.total_quantity || 1}</td>
            <td>Adet</td>
        </tr>`;
    } else {
        productsList = '<tr><td colspan="3" class="text-center">Ürün bilgisi bulunamadı</td></tr>';
    }
    
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>İş Emri - ${plan.plan_name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin: 0;
            font-size: 28px;
        }
        .header h2 {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 18px;
            font-weight: normal;
        }
        .info-section {
            margin-bottom: 30px;
        }
        .info-row {
            display: flex;
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            width: 150px;
        }
        .info-value {
            flex: 1;
        }
        .info-value.description {
            max-width: 500px;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        .products-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .products-table th,
        .products-table td {
            border: 1px solid #333;
            padding: 12px;
            text-align: left;
        }
        .products-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 200px;
            text-align: center;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            height: 40px;
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>İŞ EMRİ</h1>
        <h2>WORK ORDER</h2>
    </div>
    
    <div class="info-section">
        <div class="info-row">
            <div class="info-label">İş Emri No:</div>
            <div class="info-value">${plan.plan_name || 'PLAN-' + plan.id}</div>
        </div>
        <div class="info-row">
            <div class="info-label">İş Emri Tarihi:</div>
            <div class="info-value">${currentDate}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Müşteri Adı:</div>
            <div class="info-value">${customerName}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Plan Başlangıç:</div>
            <div class="info-value">${new Date(plan.start_date).toLocaleDateString('tr-TR')}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Plan Bitiş:</div>
            <div class="info-value">${new Date(plan.end_date).toLocaleDateString('tr-TR')}</div>
        </div>
        ${order && order.notes ? `
        <div class="info-row">
            <div class="info-label">Açıklama:</div>
            <div class="info-value description">${order.notes}</div>
        </div>
        ` : ''}
    </div>
    
    <div class="info-section">
        <h3>Üretilecek Ürünler</h3>
        <table class="products-table">
            <thead>
                <tr>
                    <th>Ürün Kodu</th>
                    <th>Miktar</th>
                    <th>Birim</th>
                </tr>
            </thead>
            <tbody>
                ${productsList}
            </tbody>
        </table>
    </div>
    
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div>Planlayan</div>
            <div style="font-size: 12px; color: #666;">İmza & Tarih</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div>Üretim Sorumlusu</div>
            <div style="font-size: 12px; color: #666;">İmza & Tarih</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div>Operatör</div>
            <div style="font-size: 12px; color: #666;">İmza & Tarih</div>
        </div>
    </div>
    
    <div class="footer">
        <p>Bu iş emri otomatik olarak oluşturulmuştur. - ${currentDate}</p>
    </div>
</body>
</html>`;
}

// renderPlansView fonksiyonu - Basit placeholder
window.renderPlansView = function(plans) {
    console.log('renderPlansView çağrıldı:', plans);
    const container = document.getElementById('production-plans-container');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Üretim Planları</h5>
                <p class="text-muted">${plans ? plans.length : 0} plan bulundu</p>
            </div>
        `;
    }
};

// Siparişleri görüntüleme
function displayOrders(orders) {
    const activeContainer = document.getElementById('active-orders-container');
    const completedContainer = document.getElementById('completed-orders-container');
    
    // Siparişleri en son eklenen en üstte olacak şekilde sırala
    if (orders && orders.length > 0) {
        orders.sort((a, b) => {
            const dateA = new Date(a.created_at || a.order_date || 0);
            const dateB = new Date(b.created_at || b.order_date || 0);
            return dateB - dateA; // En yeni tarih en üstte
        });
    }
    
    // İstatistikleri güncelle
    updateOrderStatistics(orders);
    
    if (!orders || orders.length === 0) {
        activeContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-cogs fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Henüz üretimde olan sipariş bulunmuyor</h5>
                <p class="text-muted">Yeni sipariş eklemek için "Yeni Sipariş" butonuna tıklayın.</p>
            </div>
        `;
        completedContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-check-circle fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Henüz tamamlanan sipariş bulunmuyor</h5>
                <p class="text-muted">Tamamlanan siparişler burada görünecek.</p>
            </div>
        `;
        return;
    }
    
    // Siparişleri durumlarına göre ayır
    const activeOrders = orders.filter(order => 
        order.status === 'pending' || order.status === 'processing' || order.status === 'approved'
    );
    const completedOrders = orders.filter(order => 
        order.status === 'completed'
    );
    
    // Üretimde olan siparişleri göster
    displayOrderSection(activeContainer, activeOrders, 'Üretimde olan sipariş bulunmuyor');
    
    // Tamamlanan siparişleri göster
    displayOrderSection(completedContainer, completedOrders, 'Tamamlanan sipariş bulunmuyor');
}

// Sipariş bölümünü görüntüleme
function displayOrderSection(container, orders, emptyMessage) {
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">${emptyMessage}</h5>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Sipariş No</th>
                        <th>Müşteri</th>
                        <th>Ürün</th>
                        <th>Miktar</th>
                        <th>Teslim Tarihi</th>
                        <th>Öncelik</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => {
                        // Ürün detaylarını hesapla
                        let productCount = 0;
                        let totalQuantity = 0;
                        let productNames = [];
                        
                        if (order.product_details && Array.isArray(order.product_details)) {
                            productCount = order.product_details.length;
                            totalQuantity = order.product_details.reduce((sum, product) => sum + (parseInt(product.quantity) || 0), 0);
                            productNames = order.product_details.slice(0, 2).map(p => p.product_name || p.name || 'Ürün').join(', ');
                            if (order.product_details.length > 2) {
                                productNames += ` +${order.product_details.length - 2} daha`;
                            }
                        } else {
                            productCount = 0;
                            totalQuantity = 0;
                            productNames = 'Ürün yok';
                        }
                        
                        return `
                        <tr>
                            <td><strong>${order.order_number}</strong></td>
                            <td>${order.customer_name}</td>
                            <td>
                                <div class="small">
                                    <strong>${productCount} ürün</strong><br>
                                    <span class="text-muted">${productNames}</span>
                                </div>
                            </td>
                            <td>
                                <span class="badge bg-primary">${totalQuantity}</span>
                            </td>
                            <td>
                                ${new Date(order.delivery_date).toLocaleDateString('tr-TR')}
                                ${!isWorkingDay(new Date(order.delivery_date)) ? 
                                    `<br><small class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>Çalışma günü dışı</small>` : 
                                    `<br><small class="text-success"><i class="fas fa-check-circle me-1"></i>Çalışma günü</small>`
                                }
                            </td>
                            <td>
                                <span class="badge bg-${getPriorityColor(order.priority)}">
                                    ${order.priority}
                                </span>
                            </td>
                            <td>
                                <span class="badge bg-${getStatusColor(order.status)}">
                                    ${getStatusText(order.status)}
                                </span>
                            </td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="viewOrder(${order.id})" title="Görüntüle">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${order.status === 'pending' ? `
                                        <button class="btn btn-outline-success" onclick="approveOrder(${order.id})" title="Onayla">
                                            <i class="fas fa-check"></i>
                                        </button>
                                    ` : ''}
                                    <button class="btn btn-outline-warning" onclick="editOrder(${order.id})" title="Düzenle">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="deleteOrder(${order.id})" title="Sil">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Planlama istatistiklerini yükleme
async function loadPlanningStatistics() {
    try {
        const response = await fetch('/api/production-planning/statistics');
        const data = await response.json();
        
        if (response.ok) {
            planningStatistics = data;
            updatePlanningStatistics(planningStatistics);
        } else {
            console.error('Planlama istatistikleri yüklenemedi:', data.error);
        }
    } catch (error) {
        console.error('Planlama istatistikleri fetch error:', error);
    }
}

// Planlama istatistiklerini güncelleme
function updatePlanningStatistics(stats) {
    document.getElementById('total-plans').textContent = stats.total_plans || 0;
    document.getElementById('active-plans').textContent = stats.active_plans || 0;
    document.getElementById('total-orders').textContent = stats.total_orders || 0;
    // total-value güncellemesi kaldırıldı - HTML'den de kaldırıldı
}

// Yardımcı fonksiyonlar
function getStatusColor(status) {
    const colors = {
        'draft': 'secondary',
        'active': 'success',
        'completed': 'primary',
        'cancelled': 'danger',
        'pending': 'warning',
        'confirmed': 'info',
        'in_production': 'primary',
        'shipped': 'success'
    };
    return colors[status] || 'secondary';
}

// Bu fonksiyon kaldırıldı - ana getStatusText fonksiyonu kullanılacak

function getResourceIcon(type) {
    const icons = {
        'machine': 'cog',
        'operator': 'user',
        'material': 'box'
    };
    return icons[type] || 'cog';
}

function getResourceTypeText(type) {
    const texts = {
        'machine': 'Makineler',
        'operator': 'Operatörler',
        'material': 'Malzemeler'
    };
    return texts[type] || type;
}

// Aşama şablonu düzenleme
function editStageTemplate(templateId) {
    // Debug: templateId kontrolü
    console.log('Edit template ID:', templateId, 'Type:', typeof templateId);
    
    if (!templateId || templateId === 'undefined' || templateId === 'null') {
        alert('Geçersiz aşama şablonu ID\'si', 'error');
        return;
    }
    
    // Şablon bilgilerini yükle ve düzenleme modal'ını aç
    loadStageTemplateForEdit(templateId);
}

// Aşama şablonu düzenleme için veri yükle
async function loadStageTemplateForEdit(templateId) {
    try {
        console.log('Loading template for edit:', templateId);
        
        const response = await fetch(`/api/production-stages/templates/${templateId}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const template = await response.json();
        console.log('Template loaded:', template);
        
        // Düzenleme modal'ını aç
        showEditStageTemplateModal(template);
        
    } catch (error) {
        console.error('Load template for edit error:', error);
        alert('Şablon bilgileri yüklenemedi: ' + error.message, 'error');
    }
}

// Düzenleme modal'ını göster
function showEditStageTemplateModal(template) {
    // Basit düzenleme modal'ı oluştur
    const modalHtml = `
        <div class="modal fade" id="editStageTemplateModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Aşama Şablonu Düzenle</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editStageTemplateForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Aşama Adı</label>
                                        <input type="text" class="form-control" id="editStageName" value="${template.stage_name}" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Ürün Tipi</label>
                                        <select class="form-select" id="editProductType" required>
                                            <option value="hammadde" ${template.product_type === 'hammadde' ? 'selected' : ''}>Hammadde</option>
                                            <option value="yarimamul" ${template.product_type === 'yarimamul' ? 'selected' : ''}>Yarı Mamul</option>
                                            <option value="nihai" ${template.product_type === 'nihai' ? 'selected' : ''}>Nihai Ürün</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Sıra Numarası</label>
                                        <input type="number" class="form-control" id="editStageOrder" value="${template.stage_order}" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Tahmini Süre (dakika)</label>
                                        <input type="number" class="form-control" id="editEstimatedDuration" value="${template.estimated_duration}" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Gerekli Beceriler (virgülle ayırın)</label>
                                        <input type="text" class="form-control" id="editRequiredSkills" value="${template.required_skills.join(', ')}" placeholder="operatör, teknisyen">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="editQualityCheckRequired" ${template.quality_check_required ? 'checked' : ''}>
                                            <label class="form-check-label">Kalite Kontrol Gerekli</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="editIsMandatory" ${template.is_mandatory ? 'checked' : ''}>
                                            <label class="form-check-label">Zorunlu Aşama</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-primary" onclick="updateStageTemplate('${template.id}')">Güncelle</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Modal'ı DOM'a ekle
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('editStageTemplateModal'));
    modal.show();
    
    // Modal kapandığında DOM'dan kaldır
    document.getElementById('editStageTemplateModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Aşama şablonu güncelle
async function updateStageTemplate(templateId) {
    try {
        const formData = {
            stage_name: document.getElementById('editStageName').value,
            product_type: document.getElementById('editProductType').value,
            stage_order: parseInt(document.getElementById('editStageOrder').value),
            estimated_duration: parseInt(document.getElementById('editEstimatedDuration').value),
            required_skills: document.getElementById('editRequiredSkills').value.split(',').map(s => s.trim()).filter(s => s),
            // quality_check_required: document.getElementById('editQualityCheckRequired').checked, // KALDIRILDI: Kalite kontrol özelliği kaldırıldı
            is_mandatory: document.getElementById('editIsMandatory').checked
        };
        
        const response = await fetch(`/api/production-stages/templates/${templateId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(result.message || 'Aşama şablonu başarıyla güncellendi', 'success');
            
            // Modal'ı kapat
            const modal = bootstrap.Modal.getInstance(document.getElementById('editStageTemplateModal'));
            modal.hide();
            
            // Listeyi yenile
            loadStageTemplates();
        } else {
            const error = await response.json();
            alert('Aşama şablonu güncellenemedi: ' + (error.error || error.message || 'Bilinmeyen hata'), 'error');
        }
        
    } catch (error) {
        console.error('Update stage template error:', error);
        alert('Aşama şablonu güncellenemedi: ' + error.message, 'error');
    }
}

// Aşama şablonu silme
async function deleteStageTemplate(templateId) {
    // Debug: templateId kontrolü
    console.log('Delete template ID:', templateId, 'Type:', typeof templateId);
    
    if (!templateId || templateId === 'undefined' || templateId === 'null') {
        alert('Geçersiz aşama şablonu ID\'si', 'error');
        return;
    }
    
    if (!confirm('Bu aşama şablonunu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    // Loading state başlat
    const container = document.getElementById('stage-templates-container');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Siliniyor...</span>
                </div>
                <p class="mt-2 text-muted">Aşama şablonu siliniyor...</p>
            </div>
        `;
    }
    
    try {
        const response = await fetch(`/api/production-stages/templates/${templateId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Stage template deleted successfully:', templateId);
            
            // Başarı mesajı göster
            alert(result.message || 'Aşama şablonu başarıyla silindi', 'success');
            
            // Şablonları yeniden yükle
            await loadStageTemplates();
            
        } else {
            const error = await response.json();
            console.error('Delete stage template error:', error);
            alert('Aşama şablonu silinemedi: ' + (error.error || error.message || 'Bilinmeyen hata'), 'error');
            
            // Hata durumunda da şablonları yeniden yükle
            await loadStageTemplates();
        }
    } catch (error) {
        console.error('Delete stage template error:', error);
        alert('Aşama şablonu silinemedi: ' + error.message, 'error');
        
        // Hata durumunda da şablonları yeniden yükle
        await loadStageTemplates();
    }
}

function getPriorityColor(priority) {
    const colors = {
        1: 'danger',
        2: 'warning',
        3: 'info',
        4: 'primary',
        5: 'secondary'
    };
    return colors[priority] || 'secondary';
}

// Modal fonksiyonları
function showAddPlanModal() {
    alert('Yeni plan ekleme modalı yakında eklenecek', 'info');
}

function showSchedulingModal() {
    alert('Zamanlama modalı yakında eklenecek', 'info');
}

function viewPlanDetails(planId) {
    alert('Plan detayları yakında eklenecek', 'info');
}

function editPlan(planId) {
    alert('Plan düzenleme yakında eklenecek', 'info');
}

function deletePlan(planId) {
    if (confirm('Bu planı silmek istediğinizden emin misiniz?')) {
        alert('Plan silme işlemi yakında eklenecek', 'info');
    }
}

function editResource(resourceId) {
    alert('Kaynak düzenleme yakında eklenecek', 'info');
}

function deleteResource(resourceId) {
    if (confirm('Bu kaynağı silmek istediğinizden emin misiniz?')) {
        alert('Kaynak silme işlemi yakında eklenecek', 'info');
    }
}

// Sipariş onaylama
async function approveOrder(orderId) {
    try {
        console.log('Sipariş onaylanıyor:', orderId);
        
        const response = await fetch(`/api/orders/${orderId}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Sipariş onaylanamadı');
        }
        
        const result = await response.json();
        console.log('Sipariş onaylandı:', result);
        
        // Siparişleri yenile
        await loadOrders();
        
        alert('Sipariş başarıyla onaylandı!', 'success');
        
    } catch (error) {
        console.error('Sipariş onaylama hatası:', error);
        alert('Sipariş onaylanamadı: ' + error.message, 'error');
    }
}

// Sipariş düzenleme
function editOrder(orderId) {
    console.log('Sipariş düzenleniyor:', orderId);
    
    // Siparişi bul
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        alert('Sipariş bulunamadı!', 'error');
        return;
    }
    
    // Form alanlarını doldur
    document.getElementById('customer-name').value = order.customer_name || '';
    document.getElementById('order-date').value = order.order_date || '';
    document.getElementById('delivery-date').value = order.delivery_date || '';
    document.getElementById('priority').value = order.priority || 1;
    document.getElementById('total-quantity').value = order.quantity || 0;
    document.getElementById('product-name').value = order.product_details ? JSON.stringify(order.product_details) : '';
    document.getElementById('notes').value = order.notes || '';
    document.getElementById('assigned-operator').value = order.assigned_operator || '';
    
    // Durum radio butonlarını ayarla
    if (order.status === 'pending') {
        document.getElementById('status-draft').checked = true;
    } else if (order.status === 'approved') {
        document.getElementById('status-active').checked = true;
    }
    
    // Modal başlığını güncelle
    document.getElementById('orderModalTitle').innerHTML = 
        '<i class="fas fa-edit me-2"></i>Sipariş Düzenle';
    
    // Güncelleme modunu ayarla
    currentOrderId = orderId;
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

// Sipariş silme
async function deleteOrder(orderId) {
    if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
        try {
            console.log('Sipariş siliniyor:', orderId);
            
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Sipariş silinemedi');
            }
            
            const result = await response.json();
            console.log('Sipariş silindi:', result);
            
            // Siparişleri yenile
            await loadOrders();
            
            alert('Sipariş başarıyla silindi!', 'success');
            
        } catch (error) {
            console.error('Sipariş silme hatası:', error);
            alert('Sipariş silinemedi: ' + error.message, 'error');
        }
    }
}

// Sipariş kaydetme fonksiyonu
async function saveOrder() {
    try {
        // Form verilerini topla
        const formData = {
            customer_name: document.getElementById('customer-name').value,
            order_date: document.getElementById('order-date').value,
            delivery_date: document.getElementById('delivery-date').value,
            priority: parseInt(document.getElementById('priority').value),
            quantity: parseInt(document.getElementById('total-quantity').value) || 0,
            product_details: document.getElementById('product-name').value,
            notes: document.getElementById('notes').value, // Sadece kullanıcının girdiği notlar
            assigned_operator: document.getElementById('assigned-operator').value,
            status: document.querySelector('input[name="status"]:checked').value
        };
        
        // Güncelleme modu kontrolü
        const isUpdate = currentOrderId !== null;
        
        // Validasyon
        if (!formData.customer_name || !formData.order_date || !formData.delivery_date || !formData.priority || !formData.assigned_operator) {
            alert('Lütfen tüm zorunlu alanları doldurun (Operatör seçimi zorunludur)', 'warning');
            return;
        }
        
        if (formData.quantity <= 0) {
            alert('Lütfen geçerli bir miktar girin', 'warning');
            return;
        }
        
        // API'ye gönder
        const url = isUpdate ? `/api/orders/${currentOrderId}` : '/api/orders';
        const method = isUpdate ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Sipariş kaydedilemedi');
        }
        
        const result = await response.json();
        console.log('Sipariş kaydedildi:', result);
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        modal.hide();
        
        // Formu temizle
        document.getElementById('orderForm').reset();
        document.getElementById('status-draft').checked = true;
        
        // Güncelleme modunu sıfırla
        currentOrderId = null;
        
        // Modal başlığını sıfırla
        document.getElementById('orderModalTitle').innerHTML = 
            '<i class="fas fa-plus me-2"></i>Yeni Sipariş Ekle';
        
        // Siparişleri yenile
        await loadOrders();
        
        // Başarı mesajı
        const statusText = formData.status === 'approved' ? 'Aktif' : 'Taslak';
        const actionText = isUpdate ? 'güncellendi' : 'kaydedildi';
        alert(`Sipariş başarıyla ${actionText} (${statusText})`, 'success');
        
    } catch (error) {
        console.error('Sipariş kaydetme hatası:', error);
        alert('Sipariş kaydedilemedi: ' + error.message, 'error');
    }
}

// KALİTE KONTROL SİSTEMİ - FAZ 2
// ========================================

// Kalite kontrol noktalarını yükle - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// async function loadQualityCheckpoints() {
//     try {
//         const response = await fetch('/api/quality/checkpoints');
//         if (!response.ok) throw new Error('Kalite kontrol noktaları yüklenemedi');
//         
//         const checkpoints = await response.json();
//         displayQualityCheckpoints(checkpoints);
//         return checkpoints;
//     } catch (error) {
//         console.error('Quality checkpoints load error:', error);
//         alert('Kalite kontrol noktaları yüklenemedi: ' + error.message, 'error');
//         return [];
//     }
// }

// Kalite kontrol noktalarını göster - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// function displayQualityCheckpoints(checkpoints) {
//     const container = document.getElementById('quality-checkpoints-container');
//     if (!container) return;
//     
//     if (checkpoints.length === 0) {
//         container.innerHTML = `
//             <div class="text-center py-4">
//                 <i class="fas fa-list-check fa-3x text-muted mb-3"></i>
//                 <h5 class="text-muted">Kalite kontrol noktası bulunmuyor</h5>
//                 <p class="text-muted">Yeni kontrol noktası eklemek için "Yeni Kontrol Noktası" butonunu kullanın.</p>
//             </div>
//         `;
//         return;
//     }
//     
//     // Ürün tipine göre grupla
//     const groupedCheckpoints = checkpoints.reduce((acc, checkpoint) => {
//         if (!acc[checkpoint.product_type]) {
//             acc[checkpoint.product_type] = [];
//         }
//         acc[checkpoint.product_type].push(checkpoint);
//         return acc;
//     }, {});
//     
//     let html = '';
//     Object.keys(groupedCheckpoints).forEach(productType => {
//         const typeCheckpoints = groupedCheckpoints[productType];
//         const typeName = {
//             'hammadde': 'Hammadde',
//             'yarimamul': 'Yarı Mamul',
//             'nihai': 'Nihai Ürün'
//         }[productType] || productType;
//         
//         html += `
//             <div class="mb-4">
//                 <h6 class="text-primary mb-3">
//                     <i class="fas fa-cube me-2"></i>${typeName} Kontrol Noktaları
//                 </h6>
//                 <div class="row">
//         `;
//         
//         typeCheckpoints.forEach(checkpoint => {
//             const typeIcon = {
//                 'visual': 'fas fa-eye',
//                 'measurement': 'fas fa-ruler',
//                 'test': 'fas fa-flask',
//                 'inspection': 'fas fa-search'
//             }[checkpoint.checkpoint_type] || 'fas fa-check-circle';
//             
//             const typeColor = {
//                 'visual': 'primary',
//                 'measurement': 'info',
//                 'test': 'success',
//                 'inspection': 'warning'
//             }[checkpoint.checkpoint_type] || 'secondary';
//             
//             html += `
//                 <div class="col-md-6 col-lg-4 mb-3">
//                     <div class="card h-100">
//                         <div class="card-header d-flex justify-content-between align-items-center">
//                             <h6 class="mb-0">
//                                 <i class="${typeIcon} me-2 text-${typeColor}"></i>
//                                 ${checkpoint.name}
//                             </h6>
//                             <span class="badge bg-${typeColor}">${checkpoint.checkpoint_type}</span>
//                         </div>
//                         <div class="card-body">
//                             <p class="card-text">${checkpoint.description || 'Açıklama yok'}</p>
//                             <div class="row text-center">
//                                 <div class="col-6">
//                                     <small class="text-muted">Sıklık</small>
//                                     <div class="fw-bold">${checkpoint.frequency}</div>
//                                 </div>
//                                 <div class="col-6">
//                                     <small class="text-muted">Zorunlu</small>
//                                     <div class="fw-bold">${checkpoint.is_mandatory ? 'Evet' : 'Hayır'}</div>
//                                 </div>
//                             </div>
//                         </div>
//                         <div class="card-footer">
//                             <div class="btn-group w-100" role="group">
//                                 <button class="btn btn-outline-primary btn-sm" onclick="performQualityCheck(${checkpoint.id})">
//                                     <i class="fas fa-play me-1"></i>Kontrol Et
//                                 </button>
//                                 <button class="btn btn-outline-secondary btn-sm" onclick="editQualityCheckpoint(${checkpoint.id})">
//                                     <i class="fas fa-edit me-1"></i>Düzenle
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             `;
//         });
//         
//         html += `
//                 </div>
//             </div>
//         `;
//     });
//     
//     container.innerHTML = html;
// }

// Kalite standartlarını yükle - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// async function loadQualityStandards() {
//     try {
//         const response = await fetch('/api/quality/standards');
//         if (!response.ok) throw new Error('Kalite standartları yüklenemedi');
//         
//         const standards = await response.json();
//         displayQualityStandards(standards);
//         return standards;
//     } catch (error) {
//         console.error('Quality standards load error:', error);
//         alert('Kalite standartları yüklenemedi: ' + error.message, 'error');
//         return [];
//     }
// }

// Kalite standartlarını göster - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// function displayQualityStandards(standards) {
//     const container = document.getElementById('quality-standards-container');
//     if (!container) return;
//     
//     if (standards.length === 0) {
//         container.innerHTML = `
//             <div class="text-center py-4">
//                 <i class="fas fa-award fa-3x text-muted mb-3"></i>
//                 <h5 class="text-muted">Kalite standardı bulunmuyor</h5>
//                 <p class="text-muted">Henüz kalite standardı tanımlanmamış.</p>
//             </div>
//         `;
//         return;
//     }
//     
//     let html = '';
//     standards.forEach(standard => {
//         const typeIcon = {
//             'internal': 'fas fa-building',
//             'external': 'fas fa-globe',
//             'iso': 'fas fa-certificate',
//             'customer': 'fas fa-user-tie'
//         }[standard.standard_type] || 'fas fa-award';
//         
//         const typeColor = {
//             'internal': 'primary',
//             'external': 'info',
//             'iso': 'success',
//             'customer': 'warning'
//         }[standard.standard_type] || 'secondary';
//         
//         html += `
//             <div class="col-md-6 col-lg-4 mb-3">
//                 <div class="card h-100">
//                     <div class="card-header d-flex justify-content-between align-items-center">
//                         <h6 class="mb-0">
//                             <i class="${typeIcon} me-2 text-${typeColor}"></i>
//                             ${standard.name}
//                         </h6>
//                         <span class="badge bg-${typeColor}">${standard.standard_type}</span>
//                     </div>
//                     <div class="card-body">
//                         <p class="card-text">${standard.description || 'Açıklama yok'}</p>
//                         <div class="row text-center">
//                             <div class="col-6">
//                                 <small class="text-muted">Ürün Tipi</small>
//                                 <div class="fw-bold">${standard.product_type}</div>
//                             </div>
//                             <div class="col-6">
//                                 <small class="text-muted">Durum</small>
//                                 <div class="fw-bold">
//                                     <span class="badge bg-${standard.is_active ? 'success' : 'secondary'}">
//                                         ${standard.is_active ? 'Aktif' : 'Pasif'}
//                                     </span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;
//     });
//     
//     container.innerHTML = `<div class="row">${html}</div>`;
// }

// Kalite istatistiklerini yükle - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// async function loadQualityStatistics() {
//     try {
//         const response = await fetch('/api/quality/statistics');
//         if (!response.ok) throw new Error('Kalite istatistikleri yüklenemedi');
//         
//         const stats = await response.json();
//         updateQualityStatistics(stats);
//         return stats;
//     } catch (error) {
//         console.error('Quality statistics load error:', error);
//         alert('Kalite istatistikleri yüklenemedi: ' + error.message, 'error');
//     }
// }

// Kalite istatistiklerini güncelle - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// function updateQualityStatistics(stats) {
//     document.getElementById('quality-pass-rate').textContent = stats.pass_rate + '%';
//     document.getElementById('quality-fail-rate').textContent = stats.fail_rate + '%';
//     document.getElementById('quality-warning-rate').textContent = 
//         stats.total_checks > 0 ? ((stats.warning_checks / stats.total_checks * 100).toFixed(1) + '%') : '0%';
//     document.getElementById('quality-score').textContent = stats.quality_score;
// }

// Yeni kontrol noktası modal'ını göster - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// function showAddCheckpointModal() {
//     const modal = new bootstrap.Modal(document.getElementById('addCheckpointModal'));
//     modal.show();
// }

// Kalite kontrol noktası ekle - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// async function addQualityCheckpoint() {
//     try {
//         const checkpointData = {
//             name: document.getElementById('checkpoint-name').value,
//             description: document.getElementById('checkpoint-description').value,
//             product_type: document.getElementById('checkpoint-product-type').value,
//             checkpoint_type: document.getElementById('checkpoint-type').value,
//             frequency: document.getElementById('checkpoint-frequency').value,
//             is_mandatory: document.getElementById('checkpoint-mandatory').checked
//         };
//         
//         const response = await fetch('/api/quality/checkpoints', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(checkpointData)
//         });
//         
//         if (!response.ok) throw new Error('Kalite kontrol noktası eklenemedi');
//         
//         const newCheckpoint = await response.json();
//         alert('Kalite kontrol noktası başarıyla eklendi!', 'success');
//         
//         // Modal'ı kapat ve formu temizle
//         const modal = bootstrap.Modal.getInstance(document.getElementById('addCheckpointModal'));
//         modal.hide();
//         document.getElementById('addCheckpointForm').reset();
//         
//         // Kontrol noktalarını yenile
//         await loadQualityCheckpoints();
//         
//         return newCheckpoint;
//     } catch (error) {
//         console.error('Add quality checkpoint error:', error);
//         alert('Kalite kontrol noktası eklenemedi: ' + error.message, 'error');
//     }
// }

// Kalite kontrolü gerçekleştir - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// async function performQualityCheck(checkpointId) {
//     try {
//         // Checkpoint bilgilerini API'den al
//         const response = await fetch('/api/quality/checkpoints');
//         if (!response.ok) throw new Error('Kontrol noktaları yüklenemedi');
//         
//         const checkpoints = await response.json();
//         const checkpoint = checkpoints.find(cp => cp.id === checkpointId);
//         
//         if (!checkpoint) {
//             alert('Kontrol noktası bulunamadı!', 'error');
//             return;
//         }
//         
//         // Operatör listesini yükle
//         await loadOperators();
//         
//         // Modal'ı doldur
//         document.getElementById('check-checkpoint-id').value = checkpointId;
//         document.getElementById('checkpoint-name-display').textContent = checkpoint.name;
//         document.getElementById('checkpoint-description-display').textContent = checkpoint.description || 'Açıklama yok';
//         
//         // Ölçüm alanlarını göster/gizle
//         const measurementFields = document.getElementById('measurement-fields');
//         if (checkpoint.checkpoint_type === 'measurement') {
//             measurementFields.style.display = 'block';
//         } else {
//             measurementFields.style.display = 'none';
//         }
//         
//         // Modal'ı göster
//         const modal = new bootstrap.Modal(document.getElementById('qualityCheckModal'));
//         modal.show();
//         
//     } catch (error) {
//         console.error('Perform quality check error:', error);
//         alert('Kontrol noktası yüklenemedi: ' + error.message, 'error');
//     }
// }

// Operatör listesini yükle - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// async function loadOperators() {
//     try {
//         const response = await fetch('/api/operators');
//         if (!response.ok) throw new Error('Operatör listesi yüklenemedi');
//         
//         const operators = await response.json();
//         const operatorSelect = document.getElementById('check-operator');
//         
//         // Mevcut seçenekleri temizle (ilk seçenek hariç)
//         operatorSelect.innerHTML = '<option value="">Operatör seçiniz...</option>';
//         
//         // Operatörleri ekle
//         operators.forEach(operator => {
//             const option = document.createElement('option');
//             option.value = operator;
//             option.textContent = operator;
//             operatorSelect.appendChild(option);
//         });
//         
//         // Varsayılan olarak "Kalite Kontrol" seç
//         operatorSelect.value = 'Kalite Kontrol';
//         
//     } catch (error) {
//         console.error('Load operators error:', error);
//         // Hata durumunda varsayılan operatörleri ekle
//         const operatorSelect = document.getElementById('check-operator');
//         const defaultOperators = ['Sistem', 'Admin', 'Kalite Kontrol', 'Operatör 1', 'Operatör 2'];
//         
//         operatorSelect.innerHTML = '<option value="">Operatör seçiniz...</option>';
//         defaultOperators.forEach(operator => {
//             const option = document.createElement('option');
//             option.value = operator;
//             option.textContent = operator;
//             operatorSelect.appendChild(option);
//         });
//     }
// }

// Kalite kontrolü gönder - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// async function submitQualityCheck() {
//     try {
//         const checkData = {
//             checkpoint_id: parseInt(document.getElementById('check-checkpoint-id').value),
//             operator: document.getElementById('check-operator').value,
//             result: document.getElementById('check-result').value,
//             measured_value: document.getElementById('check-measured-value').value || null,
//             expected_value: document.getElementById('check-expected-value').value || null,
//             tolerance: document.getElementById('check-tolerance').value || null,
//             notes: document.getElementById('check-notes').value
//         };
//         
//         if (!checkData.operator || !checkData.result) {
//             alert('Operatör ve sonuç alanları zorunludur!', 'error');
//             return;
//         }
//         
//         const response = await fetch('/api/quality/checks', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(checkData)
//         });
//         
//         if (!response.ok) throw new Error('Kalite kontrolü kaydedilemedi');
//         
//         const result = await response.json();
//         alert('Kalite kontrolü başarıyla kaydedildi!', 'success');
//         
//         // Modal'ı kapat ve formu temizle
//         const modal = bootstrap.Modal.getInstance(document.getElementById('qualityCheckModal'));
//         modal.hide();
//         document.getElementById('qualityCheckForm').reset();
//         
//         // İstatistikleri yenile
//         await loadQualityStatistics();
//         
//     } catch (error) {
//         console.error('Submit quality check error:', error);
//         alert('Kalite kontrolü kaydedilemedi: ' + error.message, 'error');
//     }
// }

// Kalite standardı modal'ını göster - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// function showAddStandardModal() {
//     const modal = new bootstrap.Modal(document.getElementById('addStandardModal'));
//     modal.show();
// }

// Kalite standardı ekle - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// async function addQualityStandard() {
//     try {
//         const standardData = {
//             name: document.getElementById('standard-name').value,
//             description: document.getElementById('standard-description').value,
//             product_type: document.getElementById('standard-product-type').value,
//             standard_type: document.getElementById('standard-type').value,
//             is_active: document.getElementById('standard-active').checked
//         };
//         
//         if (!standardData.name || !standardData.product_type || !standardData.standard_type) {
//             alert('Zorunlu alanları doldurun!', 'error');
//             return;
//         }
//         
//         const response = await fetch('/api/quality/standards', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(standardData)
//         });
//         
//         if (!response.ok) throw new Error('Kalite standardı eklenemedi');
//         
//         const newStandard = await response.json();
//         alert('Kalite standardı başarıyla eklendi!', 'success');
//         
//         // Modal'ı kapat ve formu temizle
//         const modal = bootstrap.Modal.getInstance(document.getElementById('addStandardModal'));
//         modal.hide();
//         document.getElementById('addStandardForm').reset();
//         
//         // Standartları yenile
//         await loadQualityStandards();
//         
//     } catch (error) {
//         console.error('Add quality standard error:', error);
//         alert('Kalite standardı eklenemedi: ' + error.message, 'error');
//     }
// }

// Kalite raporlarını göster - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// async function showQualityReports() {
//     try {
//         const response = await fetch('/api/quality/reports');
//         if (!response.ok) throw new Error('Kalite raporları yüklenemedi');
//         
//         const reports = await response.json();
//         displayQualityReports(reports);
//         
//     } catch (error) {
//         console.error('Quality reports error:', error);
//         alert('Kalite raporları yüklenemedi: ' + error.message, 'error');
//     }
// }

// Kalite raporlarını göster - KALDIRILDI: Kalite kontrol özelliği kaldırıldı
// function displayQualityReports(reports) {
//     const modal = new bootstrap.Modal(document.getElementById('qualityReportsModal'));
//     
//     // Modal içeriğini oluştur
//     const modalBody = document.getElementById('qualityReportsModalBody') || document.createElement('div');
//     modalBody.id = 'qualityReportsModalBody';
//     
//     if (reports.length === 0) {
//         modalBody.innerHTML = `
//             <div class="text-center py-4">
//                 <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
//                 <h5 class="text-muted">Kalite raporu bulunmuyor</h5>
//                 <p class="text-muted">Henüz kalite kontrolü yapılmamış.</p>
//             </div>
//         `;
//     } else {
//         let html = `
//             <div class="table-responsive">
//                 <table class="table table-striped">
//                     <thead>
//                         <tr>
//                             <th>Kontrol Noktası</th>
//                             <th>Tip</th>
//                             <th>Operatör</th>
//                             <th>Sonuç</th>
//                             <th>Ölçülen Değer</th>
//                             <th>Beklenen Değer</th>
//                             <th>Tarih</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//         `;
//         
//         reports.forEach(report => {
//             const resultClass = {
//                 'pass': 'success',
//                 'fail': 'danger',
//                 'warning': 'warning'
//             }[report.result] || 'secondary';
//             
//             html += `
//                 <tr>
//                     <td>${report.checkpoint_name}</td>
//                     <td><span class="badge bg-info">${report.checkpoint_type}</span></td>
//                     <td>${report.operator}</td>
//                     <td><span class="badge bg-${resultClass}">${report.result}</span></td>
//                     <td>${report.measured_value || '-'}</td>
//                     <td>${report.expected_value || '-'}</td>
//                     <td>${new Date(report.created_at).toLocaleString('tr-TR')}</td>
//                 </tr>
//             `;
//         });
//         
//         html += `
//                     </tbody>
//                 </table>
//             </div>
//         `;
//         
//         modalBody.innerHTML = html;
//     }
//     
//     // Modal'ı göster
//     modal.show();
// }

// Real-time updates handler fonksiyonları
window.updateActiveProductions = function(data) {
    try {
        console.log('Active productions güncellendi:', data);
        if (data && Array.isArray(data)) {
            window.activeProductions = data;
            // displayActiveProductions(); // Artık kullanılmıyor - yeni tasarımda planlanan üretimler kullanılıyor
        }
    } catch (error) {
        console.error('updateActiveProductions hatası:', error);
        // Kritik hataları kullanıcıya göster
        if (window.stateManager && (error.name === 'SyntaxError' || error.name === 'ReferenceError' || error.name === 'TypeError')) {
            window.stateManager.addNotification('Aktif üretimler güncelleme hatası - Sistem yöneticisine bildirin', 'error');
        }
    }
};

window.updateProductionHistory = function(data) {
    try {
        console.log('Production history güncellendi:', data);
        if (data && Array.isArray(data)) {
            window.productionHistory = data;
            if (typeof displayProductionHistory === 'function') {
                displayProductionHistory();
            }
        }
    } catch (error) {
        console.error('updateProductionHistory hatası:', error);
        // Kritik hataları kullanıcıya göster
        if (window.stateManager && (error.name === 'SyntaxError' || error.name === 'ReferenceError' || error.name === 'TypeError')) {
            window.stateManager.addNotification('Üretim geçmişi güncelleme hatası - Sistem yöneticisine bildirin', 'error');
        }
    }
};

window.updateStageTemplates = function(data) {
    try {
        console.log('Stage templates güncellendi:', data);
        if (data && Array.isArray(data)) {
            window.stageTemplates = data;
        }
    } catch (error) {
        console.error('updateStageTemplates hatası:', error);
    }
};

window.updateQualityCheckpoints = function(data) {
    try {
        console.log('Quality checkpoints güncellendi:', data);
        // KALDIRILDI: Kalite kontrol özelliği kaldırıldı
        // if (data && Array.isArray(data)) {
        //     window.qualityCheckpoints = data;
        // }
    } catch (error) {
        console.error('updateQualityCheckpoints hatası:', error);
    }
};

window.updateProductionPlans = function(data) {
    try {
        console.log('Production plans güncellendi:', data);
        if (data && Array.isArray(data)) {
            window.allPlans = data;
            // Eğer plan görünümü aktifse, güncelle
            if (typeof renderPlansView === 'function') {
                renderPlansView();
            }
        }
    } catch (error) {
        console.error('updateProductionPlans hatası:', error);
        // Kritik hataları kullanıcıya göster
        if (window.stateManager && (error.name === 'SyntaxError' || error.name === 'ReferenceError' || error.name === 'TypeError')) {
            window.stateManager.addNotification('Üretim planları güncelleme hatası - Sistem yöneticisine bildirin', 'error');
        }
    }
};

// ===== FAZ 7: GELİŞMİŞ AŞAMA TAKİP SİSTEMİ =====

// Aşama performansını yükle
window.loadStagePerformance = async function() {
    try {
        const response = await fetch('/api/production-stages/performance');
        const data = await response.json();
        
        stagePerformance = data;
        
        // Operatör istatistiklerini güncelle
        document.getElementById('total-operators-count').textContent = data.total_operators || 0;
        document.getElementById('active-operators-count').textContent = data.active_operators || 0;
        document.getElementById('active-productions-count').textContent = data.active_productions || 0;
        document.getElementById('completed-today-count').textContent = data.completed_today || 0;
        
        // Operatör performansını göster
        const operatorPerformanceSection = document.getElementById('operator-performance-section');
        if (operatorPerformanceSection) {
            operatorPerformanceSection.style.display = 'block';
        }
        
        // Operatör performansını göster (kaldırıldı)
        // if (data.operator_performance) {
        //     renderOperatorPerformance(data.operator_performance);
        // }
        
        // showNotification('Aşama performansı yüklendi', 'success');
    } catch (error) {
        console.error('Aşama performansı yükleme hatası:', error);
        // showNotification('Aşama performansı yüklenemedi', 'error');
    }
};



// Canlı aşamaları güncelle
async function updateRealtimeStages() {
    try {
        const response = await fetch('/api/production-stages/realtime');
        const data = await response.json();
        
        realtimeStages = data;
        renderRealtimeStages(data);
        
        // Canlı göstergesini güncelle
        const indicator = document.getElementById('realtime-indicator');
        if (indicator) {
            indicator.textContent = 'CANLI';
            indicator.className = 'badge bg-success ms-2';
        }
    } catch (error) {
        console.error('Canlı aşama güncelleme hatası:', error);
        const indicator = document.getElementById('realtime-indicator');
        if (indicator) {
            indicator.textContent = 'HATA';
            indicator.className = 'badge bg-danger ms-2';
        }
    }
}

// Canlı aşamaları render et (Kaldırıldı)
function renderRealtimeStages(stages) {
    // Bu fonksiyon artık kullanılmıyor - Canlı Aşama Takibi bölümü kaldırıldı
    return;
}

// Aşama başlat
window.startStage = async function(stageId, operator = 'system') {
    try {
        const response = await fetch(`/api/production-stages/${stageId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operator })
        });
        
        const data = await response.json();
        // showNotification('Aşama başlatıldı', 'success');
        
        // Canlı takibi güncelle
        if (realtimeInterval) {
            updateRealtimeStages();
        }
        
        return data;
    } catch (error) {
        console.error('Aşama başlatma hatası:', error);
        // showNotification('Aşama başlatılamadı', 'error');
    }
};

// Aşama duraklat
window.pauseStage = async function(stageId) {
    try {
        const reason = prompt('Duraklatma nedeni:');
        if (reason === null) return;
        
        const response = await fetch(`/api/production-stages/${stageId}/pause`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: reason })
        });
        
        const data = await response.json();
        // showNotification('Aşama duraklatıldı', 'warning');
        
        // Canlı takibi güncelle
        if (realtimeInterval) {
            updateRealtimeStages();
        }
        
        return data;
    } catch (error) {
        console.error('Aşama duraklatma hatası:', error);
        // showNotification('Aşama duraklatılamadı', 'error');
    }
};

// Aşama devam ettir
window.resumeStage = async function(stageId) {
    try {
        const notes = prompt('Devam notu (opsiyonel):');
        
        const response = await fetch(`/api/production-stages/${stageId}/resume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes })
        });
        
        const data = await response.json();
        // showNotification('Aşama devam ettirildi', 'success');
        
        // Canlı takibi güncelle
        if (realtimeInterval) {
            updateRealtimeStages();
        }
        
        return data;
    } catch (error) {
        console.error('Aşama devam ettirme hatası:', error);
        // showNotification('Aşama devam ettirilemedi', 'error');
    }
};

// Aşama atla
window.skipStage = async function(stageId) {
    try {
        const reason = prompt('Atlama nedeni:');
        if (reason === null) return;
        
        const response = await fetch(`/api/production-stages/${stageId}/skip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        
        const data = await response.json();
        // showNotification('Aşama atlandı', 'info');
        
        // Canlı takibi güncelle
        if (realtimeInterval) {
            updateRealtimeStages();
        }
        
        return data;
    } catch (error) {
        console.error('Aşama atlama hatası:', error);
        // showNotification('Aşama atlanamadı', 'error');
    }
};

// Aşama tamamla
window.completeStage = async function(stageId) {
    try {
        const notes = prompt('Tamamlama notu (opsiyonel):');
        
        const response = await fetch(`/api/production-stages/${stageId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes })
        });
        
        const data = await response.json();
        // showNotification('Aşama tamamlandı', 'success');
        
        // Canlı takibi güncelle
        if (realtimeInterval) {
            updateRealtimeStages();
        }
        
        return data;
    } catch (error) {
        console.error('Aşama tamamlama hatası:', error);
        // showNotification('Aşama tamamlanamadı', 'error');
    }
};

// Canlı takibi durdur
window.stopRealtimeTracking = function() {
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
        realtimeInterval = null;
        // showNotification('Canlı takip durduruldu', 'info');
    }
};

// ===== FAZ 7: AŞAMA RAPORLAMA VE ANALİTİK =====
// (Analitik ve Verimlilik raporları kaldırıldı - operatör takibi için gerekli değil)
    
// Analitik raporu kaldırıldı - operatör takibi için gerekli değil
        
// Analitik raporu kaldırıldı - operatör takibi için gerekli değil
            
// Analitik raporu kaldırıldı - operatör takibi için gerekli değil
        
// Analitik raporu kaldırıldı - operatör takibi için gerekli değil

// Verimlilik raporu kaldırıldı - operatör takibi için gerekli değil

// Verimlilik raporu render fonksiyonu kaldırıldı

// ==================== FLOWCHART FONKSİYONLARI ====================

// Flowchart gösterimi
window.showFlowchart = async function() {
    try {
        // Modal'ı aç
        const modal = new bootstrap.Modal(document.getElementById('flowchartModal'));
        modal.show();
        
        // Biraz bekle ve veri yükle
        setTimeout(async () => {
            await loadFlowchartData();
            populateProductTypes();
        }, 300);
        
        // Flowchart'ı oluştur
        await updateFlowchart();
        
    } catch (error) {
        console.error('Flowchart yükleme hatası:', error);
        showNotification('Flowchart yüklenemedi: ' + error.message, 'error');
    }
};

// Flowchart verilerini yükle
async function loadFlowchartData() {
    try {
        const response = await fetch('/api/production-stages/templates');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        flowchartData = data;
        
    } catch (error) {
        console.error('Flowchart veri yükleme hatası:', error);
        throw error;
    }
}

// Ürün tiplerini doldur
function populateProductTypes() {
    const select = document.getElementById('flowchartProductType');
    select.innerHTML = '<option value="">Tüm Ürün Tipleri</option>';
    
    const productTypes = [...new Set(flowchartData.map(template => template.product_type))];
    
    productTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}

// Flowchart'ı güncelle
window.updateFlowchart = async function() {
    const container = document.getElementById('flowchart-container');
    const productType = document.getElementById('flowchartProductType').value;
    const viewType = document.getElementById('flowchartViewType').value;
    
    // Filtrelenmiş veriler
    let filteredData = flowchartData;
    if (productType) {
        filteredData = flowchartData.filter(template => template.product_type === productType);
    }
    
    // Sıralama
    filteredData.sort((a, b) => a.stage_order - b.stage_order);
    
    container.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Flowchart oluşturuluyor...</div>';
    
    // Sadece basit HTML kullan
    createSimpleFlowchart(filteredData, container);
};


// Flowchart.js kaldırıldı - sadece basit HTML kullanılıyor

// Basit HTML flowchart oluştur
function createSimpleFlowchart(data, container) {
    let html = '<div class="simple-flowchart">';
    
    // Başlık ekle
    html += `
        <div class="flowchart-header">
            <h4><i class="fas fa-project-diagram me-2"></i>Üretim Aşamaları Akışı</h4>
            <p class="text-muted">Aşamalar sırasıyla işlenir ve her aşama tamamlandıktan sonra bir sonrakine geçilir</p>
        </div>
    `;
    
    data.forEach((template, index) => {
        const isLast = index === data.length - 1;
        const isFirst = index === 0;
        
        html += `
            <div class="flowchart-step">
                <div class="step-card ${isFirst ? 'first-step' : ''} ${isLast ? 'last-step' : ''}">
                    <div class="step-header">
                        <h6>${template.stage_name}</h6>
                        <div class="step-badges">
                            <span class="badge bg-primary">Sıra: ${template.stage_order}</span>
                            ${template.quality_check_required ? '<span class="badge bg-warning"><i class="fas fa-check-circle me-1"></i>Kalite Kontrol</span>' : ''}
                            ${template.is_mandatory ? '<span class="badge bg-danger"><i class="fas fa-exclamation-triangle me-1"></i>Zorunlu</span>' : ''}
                        </div>
                    </div>
                    <div class="step-body">
                        <div class="step-info">
                            <p><i class="fas fa-clock"></i> <strong>Süre:</strong> ${template.estimated_duration} dakika</p>
                            ${template.required_skills.length > 0 ? `<p><i class="fas fa-user-cog"></i> <strong>Gerekli Beceriler:</strong> ${template.required_skills.join(', ')}</p>` : ''}
                            <p><i class="fas fa-tag"></i> <strong>Ürün Tipi:</strong> ${getProductTypeText(template.product_type)}</p>
                        </div>
                    </div>
                </div>
                ${!isLast ? '<div class="flowchart-arrow"><i class="fas fa-arrow-down"></i></div>' : ''}
            </div>
        `;
    });
    
    // Bitiş mesajı
    html += `
        <div class="flowchart-footer">
            <div class="completion-message">
                <i class="fas fa-flag-checkered fa-2x text-success mb-2"></i>
                <h5 class="text-success">Tüm Aşamalar Tamamlandı!</h5>
                <p class="text-muted">Ürün üretim süreci başarıyla tamamlandı</p>
            </div>
        </div>
    `;
    
    html += '</div>';
    
    // CSS ekle
    html += `
        <style>
            .simple-flowchart {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 25px;
                padding: 30px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 15px;
                min-height: 500px;
            }
            .flowchart-header {
                text-align: center;
                margin-bottom: 20px;
                padding: 20px;
                background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
                color: white;
                border-radius: 15px;
                box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
            }
            .flowchart-header h4 {
                margin: 0 0 10px 0;
                font-weight: bold;
            }
            .flowchart-step {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .step-card {
                background: linear-gradient(135deg, #e1f5fe 0%, #f8f9fa 100%);
                border: 3px solid #4a90e2;
                border-radius: 15px;
                padding: 25px;
                min-width: 350px;
                max-width: 500px;
                box-shadow: 0 6px 15px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                position: relative;
            }
            .step-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                border-color: #2c5aa0;
            }
            .step-card.first-step {
                background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                border-color: #28a745;
            }
            .step-card.last-step {
                background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                border-color: #ffc107;
            }
            .step-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e9ecef;
            }
            .step-header h6 {
                margin: 0;
                color: #2c3e50;
                font-weight: bold;
                font-size: 1.2rem;
            }
            .step-badges {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            .step-body {
                margin-top: 15px;
            }
            .step-info p {
                margin: 12px 0;
                color: #555;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .step-info i {
                color: #4a90e2;
                width: 16px;
            }
            .flowchart-arrow {
                font-size: 28px;
                color: #4a90e2;
                margin: 15px 0;
                animation: bounce 2s infinite;
            }
            .flowchart-footer {
                text-align: center;
                margin-top: 20px;
            }
            .completion-message {
                padding: 30px;
                background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                border-radius: 15px;
                border: 2px solid #28a745;
            }
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-10px);
                }
                60% {
                    transform: translateY(-5px);
                }
            }
            .badge {
                font-size: 0.8rem;
                padding: 6px 12px;
            }
        </style>
    `;
    
    container.innerHTML = html;
}

// Ürün tipi metnini getir
function getProductTypeText(type) {
    const types = {
        'hammadde': 'Hammadde',
        'yarimamul': 'Yarı Mamul',
        'nihai': 'Nihai Ürün'
    };
    return types[type] || type;
}

// Flowchart'ı dışa aktar
window.exportFlowchart = function() {
    const container = document.getElementById('flowchart-container');
    const svg = container.querySelector('svg');
    
    if (svg) {
        // SVG'yi PNG'ye dönüştür ve indir
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(function(blob) {
                const link = document.createElement('a');
                link.download = 'production-flowchart.png';
                link.href = URL.createObjectURL(blob);
                link.click();
            });
        };
        
        img.src = url;
    } else {
        showNotification('Dışa aktarılacak flowchart bulunamadı', 'warning');
    }
};

// ===== OPERATÖR TAKİBİ FONKSİYONLARI =====

// Operatör durumunu yükle
async function loadOperatorStatus() {
    try {
        console.log('📊 Operatör durumu yükleniyor...');
        
        // Operatörleri yükle
        const operatorsResponse = await fetch('/api/operators');
        if (operatorsResponse.ok) {
            operators = await operatorsResponse.json();
            console.log('👥 Operatörler yüklendi:', operators.length);
        }
        
        // Tüm üretimleri yükle - aktif, tamamlanan ve production-states'ten
        const [statesResponse, activeResponse, completedResponse] = await Promise.all([
            fetch('/api/production-states'),
            fetch('/api/active-productions'),
            fetch('/api/completed-productions')
        ]);
        
        let allProductions = [];
        
        if (statesResponse.ok) {
            const states = await statesResponse.json();
            allProductions = allProductions.concat(states);
            console.log('🏭 Production states yüklendi:', states.length);
        }
        
        if (activeResponse.ok) {
            const active = await activeResponse.json();
            allProductions = allProductions.concat(active);
            console.log('🏭 Active productions yüklendi:', active.length);
        }
        
        if (completedResponse.ok) {
            const completed = await completedResponse.json();
            allProductions = allProductions.concat(completed);
            console.log('🏭 Completed productions yüklendi:', completed.length);
        }
        
        operatorProductions = allProductions;
        console.log('🏭 Toplam üretimler yüklendi:', operatorProductions.length);
        
        // Değişkenlerin yüklendiğinden emin ol
        if (!operators) operators = [];
        if (!operatorProductions) operatorProductions = [];
        
        // Önceki verileri sakla (ilk yükleme için)
        previousOperators = JSON.parse(JSON.stringify(operators));
        previousOperatorProductions = JSON.parse(JSON.stringify(operatorProductions));
        
        console.log('📊 Operatörler:', operators.length, 'Üretimler:', operatorProductions.length);
        
        // İstatistikleri güncelle
        updateOperatorStats();
        
        // Operatör listesini göster
        displayOperatorsList();
        
        // Canlı operatör takibini göster (kaldırıldı)
        // displayRealtimeOperators();
        
        
        // alert('Operatör durumu başarıyla yüklendi', 'success');
        
    } catch (error) {
        console.error('❌ Operatör durumu yükleme hatası:', error);
        // alert('Operatör durumu yüklenemedi', 'error');
    }
}

// Operatör real-time güncelleme
async function updateOperatorRealtime() {
    try {
        console.log('🔄 Operatör real-time güncelleme...');
        
        // Operatörleri yükle
        const operatorsResponse = await fetch('/api/operators');
        let newOperators = [];
        if (operatorsResponse.ok) {
            newOperators = await operatorsResponse.json();
        }
        
        // Tüm üretimleri yükle - aktif, tamamlanan ve production-states'ten
        const [statesResponse, activeResponse, completedResponse] = await Promise.all([
            fetch('/api/production-states'),
            fetch('/api/active-productions'),
            fetch('/api/completed-productions')
        ]);
        
        let newOperatorProductions = [];
        
        if (statesResponse.ok) {
            const states = await statesResponse.json();
            newOperatorProductions = newOperatorProductions.concat(states);
        }
        
        if (activeResponse.ok) {
            const active = await activeResponse.json();
            newOperatorProductions = newOperatorProductions.concat(active);
        }
        
        if (completedResponse.ok) {
            const completed = await completedResponse.json();
            newOperatorProductions = newOperatorProductions.concat(completed);
        }
        
        // Veri değişikliği kontrolü
        const operatorsChanged = JSON.stringify(newOperators) !== JSON.stringify(previousOperators);
        const productionsChanged = JSON.stringify(newOperatorProductions) !== JSON.stringify(previousOperatorProductions);
        
        if (operatorsChanged || productionsChanged) {
            console.log('📊 Veri değişikliği tespit edildi, UI güncelleniyor...');
            
            // Verileri güncelle
            operators = newOperators;
            operatorProductions = newOperatorProductions;
            
            // Önceki verileri sakla
            previousOperators = JSON.parse(JSON.stringify(newOperators));
            previousOperatorProductions = JSON.parse(JSON.stringify(newOperatorProductions));
            
            // İstatistikleri güncelle
            updateOperatorStats();
            
            // Operatör listesini güncelle
            displayOperatorsList();
            
            // Canlı operatör takibini güncelle (kaldırıldı)
            // displayRealtimeOperators();
        } else {
            console.log('📊 Veri değişikliği yok, UI güncellenmiyor');
        }
        
    } catch (error) {
        console.error('❌ Operatör real-time güncelleme hatası:', error);
    }
}

// Operatör istatistiklerini güncelle
function updateOperatorStats() {
    if (!operators) operators = [];
    if (!operatorProductions) operatorProductions = [];
    
    const totalOperators = operators.length;
    const activeOperators = operators.filter(op => op.is_active).length;
    
    // Aktif üretimleri hesapla - operatör panelindeki gibi
    const activeProductions = operatorProductions.filter(p => 
        p.status === 'active' || p.status === 'processing' || p.status === 'in_progress' || p.status === 'planned'
    ).length;
    
    // Bugün tamamlanan üretimleri hesapla - operatör panelindeki gibi
        const today = new Date().toDateString();
    const completedToday = operatorProductions.filter(p => {
        if (p.status !== 'completed' && p.status !== 'finished') return false;
        const completedDate = new Date(p.completed_at || p.updated_at).toDateString();
        return today === completedDate;
    }).length;
    
    // Bugün üretilen toplam miktarı hesapla
    const todayProducedQuantity = operatorProductions.filter(p => {
        const productionDate = new Date(p.created_at || p.start_time || p.updated_at).toDateString();
        return productionDate === today;
    }).reduce((sum, p) => {
        return sum + (parseInt(p.produced_quantity) || 0);
    }, 0);
    
    // Verimlilik hesapla (tamamlanan / toplam üretim)
    const totalProductions = operatorProductions.length;
    const efficiencyRate = totalProductions > 0 ? Math.round((completedToday / totalProductions) * 100) : 0;
    
    document.getElementById('total-operators-count').textContent = totalOperators;
    document.getElementById('active-operators-count').textContent = activeOperators;
    document.getElementById('active-productions-count').textContent = activeProductions;
    document.getElementById('completed-today-count').textContent = completedToday;
    document.getElementById('produced-today-count').textContent = todayProducedQuantity;
    document.getElementById('efficiency-rate').textContent = efficiencyRate + '%';
    
    console.log(`📊 Operatör İstatistikleri: Toplam: ${totalOperators}, Aktif: ${activeOperators}, Aktif Üretim: ${activeProductions}, Bugün Tamamlanan: ${completedToday}, Bugün Üretilen: ${todayProducedQuantity} adet, Verimlilik: ${efficiencyRate}%`);
}

// Operatör listesini göster
function displayOperatorsList() {
    const container = document.getElementById('operators-list-container');
    
    if (!operators || operators.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-users fa-3x text-muted mb-3"></i>
                <p class="text-muted">Henüz operatör bulunmuyor</p>
            </div>
        `;
        return;
    }
    
    const html = operators.map(operator => {
        // Debug: Operatör ve üretim verilerini logla
        console.log(`🔍 Operatör: ${operator.name} (ID: ${operator.id})`);
        console.log(`📊 Toplam üretim sayısı: ${operatorProductions.length}`);
        
        // Operatör adına göre filtrele - daha geniş arama
        const operatorProductionsList = operatorProductions.filter(p => {
            const matches = 
                p.assigned_operator === operator.name || 
                           p.assigned_operator === operator.id ||
                p.operator_id === operator.id ||
                p.assigned_operator === operator.operator_id ||
                (p.assigned_operator && p.assigned_operator.toString().includes(operator.name)) ||
                (p.assigned_operator && p.assigned_operator.toString().includes(operator.id));
            
            return matches;
        });
        
        const activeProductions = operatorProductionsList.filter(p => 
            p.status === 'active' || p.status === 'processing' || p.status === 'in_progress' || p.status === 'planned'
        );
        const completedProductions = operatorProductionsList.filter(p => 
            p.status === 'completed' || p.status === 'finished'
        );
        
        // Bugünkü üretim miktarlarını hesapla
        const today = new Date().toDateString();
        const todayProductions = operatorProductionsList.filter(p => {
            const productionDate = new Date(p.created_at || p.start_time || p.updated_at).toDateString();
            return productionDate === today;
        });
        
        // Bugün üretilen toplam adet sayısı
        const todayProducedQuantity = todayProductions.reduce((sum, p) => {
            return sum + (parseInt(p.produced_quantity) || 0);
        }, 0);
        
        // Bugün tamamlanan toplam adet sayısı
        const todayCompletedQuantity = completedProductions.filter(p => {
            const completedDate = new Date(p.completed_at || p.updated_at).toDateString();
            return completedDate === today;
        }).reduce((sum, p) => {
            return sum + (parseInt(p.produced_quantity) || 0);
        }, 0);
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <div class="d-flex align-items-center">
                                <div class="avatar bg-primary text-white rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div>
                                    <h6 class="mb-1">${operator.name}</h6>
                                    <small class="text-muted">${operator.department}</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="text-center">
                                <div class="badge ${operator.is_active ? 'bg-success' : 'bg-secondary'} fs-6">
                                    ${operator.is_active ? 'Aktif' : 'Pasif'}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="text-center">
                                <h6 class="mb-0 text-warning">${activeProductions.length}</h6>
                                <small class="text-muted">Aktif Üretim</small>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="text-center">
                                <h6 class="mb-0 text-primary">${todayProducedQuantity}</h6>
                                <small class="text-muted">Bugün Üretilen</small>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="text-center">
                                <h6 class="mb-0 text-success">${todayCompletedQuantity}</h6>
                                <small class="text-muted">Bugün Tamamlanan</small>
                            </div>
                        </div>
                        <div class="col-md-1">
                            <div class="text-center">
                                <h6 class="mb-0 text-info">${operator.skill_level || 'N/A'}</h6>
                                <small class="text-muted">Seviye</small>
                            </div>
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewOperatorDetails('${operator.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Status mapping fonksiyonu
function getStatusInfo(status) {
    const statusMap = {
        'planned': { class: 'bg-info', text: 'Planlandı' },
        'active': { class: 'bg-warning', text: 'Aktif' },
        'processing': { class: 'bg-warning', text: 'İşleniyor' },
        'in_progress': { class: 'bg-warning', text: 'Devam Ediyor' },
        'completed': { class: 'bg-success', text: 'Tamamlandı' },
        'finished': { class: 'bg-success', text: 'Tamamlandı' },
        'cancelled': { class: 'bg-danger', text: 'İptal Edildi' },
        'paused': { class: 'bg-secondary', text: 'Duraklatıldı' }
    };
    
    return statusMap[status] || { class: 'bg-secondary', text: 'Bilinmiyor' };
}

// Canlı operatör takibini göster










// Operatör detaylarını görüntüle
async function viewOperatorDetails(operatorId) {
    console.log("🔍 Operatör detayları görüntüleniyor:", operatorId);
    console.log("🔍 Mevcut operatörler:", operators);
    console.log("🔍 Operatör sayısı:", operators ? operators.length : 'undefined');
    
    // Eğer operatörler yüklenmemişse, yükle
    if (!operators || operators.length === 0) {
        console.log("🔄 Operatörler yüklenmemiş, yeniden yükleniyor...");
        await loadOperatorStatus();
    }
    
    // Operatörü bul (string ve number karşılaştırması için)
    const operator = operators.find(op => 
        op.id == operatorId || op.operator_id == operatorId ||
        op.id === parseInt(operatorId) || op.operator_id === parseInt(operatorId)
    );
    if (!operator) {
        console.log("❌ Operatör bulunamadı. ID:", operatorId);
        console.log("❌ Mevcut operatör ID'leri:", operators.map(op => op.id));
        alert("Operatör bulunamadı!");
        return;
    }
    
    // Operatörün üretimlerini bul - daha geniş arama
    const operatorProductionsList = operatorProductions.filter(prod => {
        const matches = 
            prod.operator_id === operatorId || 
            prod.operator_name === operator.name ||
            prod.assigned_operator === operator.name || 
            prod.assigned_operator === operatorId ||
            prod.assigned_operator === operator.operator_id ||
            (prod.assigned_operator && prod.assigned_operator.toString().includes(operator.name)) ||
            (prod.assigned_operator && prod.assigned_operator.toString().includes(operatorId));
        
        return matches;
    });
    
    
    // Bugünkü üretim miktarlarını hesapla
    const today = new Date().toDateString();
    const todayProductions = operatorProductionsList.filter(p => {
        const productionDate = new Date(p.created_at || p.start_time || p.updated_at).toDateString();
        return productionDate === today;
    });
    
    // Bugün üretilen toplam adet sayısı
    const todayProducedQuantity = todayProductions.reduce((sum, p) => {
        return sum + (parseInt(p.produced_quantity) || 0);
    }, 0);
    
    // Bugün tamamlanan toplam adet sayısı
    const completedProductions = operatorProductionsList.filter(p => 
        p.status === 'completed' || p.status === 'finished'
    );
    
    const todayCompletedQuantity = completedProductions.filter(p => {
        const completedDate = new Date(p.completed_at || p.updated_at).toDateString();
        return completedDate === today;
    }).reduce((sum, p) => {
        return sum + (parseInt(p.produced_quantity) || 0);
    }, 0);
    
    // Modal HTML oluştur
    const modalHtml = `
        <div class="modal fade" id="operatorDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user me-2"></i>Operatör Detayları
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Operatör Bilgileri</h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Ad:</strong></td>
                                        <td>${operator.name || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>ID:</strong></td>
                                        <td>${operator.operator_id || operator.id || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Seviye:</strong></td>
                                        <td>${operator.skill_level || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Durum:</strong></td>
                                        <td>
                                            <span class="badge ${operator.is_active ? "bg-success" : "bg-secondary"}">
                                                ${operator.is_active ? "Aktif" : "Pasif"}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6>İstatistikler</h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Aktif Üretim:</strong></td>
                                        <td>${operatorProductionsList.filter(p => p.status === "active").length}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Tamamlanan:</strong></td>
                                        <td>${operatorProductionsList.filter(p => p.status === "completed").length}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Toplam Üretim:</strong></td>
                                        <td>${operatorProductionsList.length}</td>
                                    </tr>
                                    <tr class="table-primary">
                                        <td><strong>Bugün Üretilen:</strong></td>
                                        <td><strong>${todayProducedQuantity} adet</strong></td>
                                    </tr>
                                    <tr class="table-success">
                                        <td><strong>Bugün Tamamlanan:</strong></td>
                                        <td><strong>${todayCompletedQuantity} adet</strong></td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <h6>Üretim Geçmişi</h6>
                            <div class="table-responsive">
                                <table class="table table-sm table-striped">
                                    <thead>
                                        <tr>
                                            <th>Ürün</th>
                                            <th>Durum</th>
                                            <th>Üretilen Miktar</th>
                                            <th>İlerleme</th>
                                            <th>Başlangıç</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${operatorProductionsList.map(prod => `
                                            <tr>
                                                <td>${prod.product_name || "N/A"}</td>
                                                <td>
                                                    <span class="badge ${prod.status === "active" ? "bg-warning" : "bg-success"}">
                                                        ${prod.status === "active" ? "Aktif" : "Tamamlandı"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span class="badge bg-info">
                                                        ${prod.produced_quantity || 0} / ${prod.planned_quantity || 0} adet
                                                    </span>
                                                </td>
                                                <td>
                                                    <div class="progress" style="height: 20px;">
                                                        <div class="progress-bar" style="width: ${prod.progress || 0}%">
                                                            ${prod.progress || 0}%
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>${prod.start_time ? new Date(prod.start_time).toLocaleString("tr-TR") : "N/A"}</td>
                                            </tr>
                                        `).join("")}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eski modal varsa kaldır
    const existingModal = document.getElementById("operatorDetailsModal");
    if (existingModal) {
        existingModal.remove();
    }
    
    // Yeni modal ekle
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    
    // Modalı göster
    const modal = new bootstrap.Modal(document.getElementById("operatorDetailsModal"));
    modal.show();
}

// Üretim planı kaydetme fonksiyonu
async function savePlan() {
    try {
        // Ürün bilgilerini al
        const productType = document.getElementById('product-type').value;
        const selectedProduct = document.getElementById('selected-product').value;
        const productQuantity = document.getElementById('product-quantity').value;
        const productPriority = document.getElementById('product-priority').value;

        const planData = {
            plan_name: document.getElementById('plan-name').value,
            plan_type: document.getElementById('plan-type').value,
            start_date: document.getElementById('start-date').value,
            end_date: document.getElementById('end-date').value,
            status: document.getElementById('plan-status').value || 'draft',
            created_by: document.getElementById('created-by').value || 'Admin',
            assigned_operator: document.getElementById('assigned-operator').value || null,
            operator_notes: document.getElementById('operator-notes').value || null,
            notes: document.getElementById('plan-notes').value || null,
            // Ürün bilgileri
            product_type: productType || null,
            product_id: selectedProduct || null,
            product_quantity: parseInt(productQuantity) || 1,
            product_priority: parseInt(productPriority) || 2
        };

        // Temel validasyon
        if (!planData.plan_name || !planData.plan_type || !planData.start_date || !planData.end_date) {
            showModalAlert('Lütfen tüm zorunlu alanları doldurun!', 'warning');
            return;
        }

        // Ürün seçimi validasyonu
        if (productType && !selectedProduct) {
            showModalAlert('Lütfen bir ürün seçin!', 'warning');
            return;
        }

        console.log('Plan kaydediliyor:', planData);

        const response = await fetch('/api/production-plans', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(planData)
        });

        if (!response.ok) {
            throw new Error('Plan kaydedilemedi');
        }

        const result = await response.json();
        console.log('Plan başarıyla kaydedildi:', result);

        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('planModal'));
        modal.hide();

        // Formu temizle
        document.getElementById('planForm').reset();

        // Sayfayı yenile (eğer plan listesi varsa)
        if (typeof loadPlans === 'function') {
            loadPlans();
        }

        showModalAlert('Plan başarıyla kaydedildi!', 'success');

    } catch (error) {
        console.error('Plan kaydetme hatası:', error);
        showModalAlert('Plan kaydedilemedi: ' + error.message, 'error');
    }
}

// Üretim planı düzenleme fonksiyonu
async function editPlan(planId) {
    try {
        console.log('Plan düzenleniyor:', planId);
        
        // Plan bilgilerini al
        const response = await fetch(`/api/production-plans/${planId}`);
        if (!response.ok) {
            throw new Error('Plan bilgileri yüklenemedi');
        }
        
        const plan = await response.json();
        console.log('Plan bilgileri yüklendi:', plan);
        
        // Operatör listesini yükle
        await loadOperatorOptions();
        
        // Modal'ı doldur
        document.getElementById('plan-name').value = plan.plan_name || '';
        document.getElementById('plan-type').value = plan.plan_type || '';
        document.getElementById('start-date').value = plan.start_date || '';
        document.getElementById('end-date').value = plan.end_date || '';
        document.getElementById('plan-status').value = plan.status || 'draft';
        document.getElementById('created-by').value = plan.created_by || 'Admin';
        document.getElementById('assigned-operator').value = plan.assigned_operator || '';
        document.getElementById('operator-notes').value = plan.operator_notes || '';
        document.getElementById('plan-notes').value = plan.notes || '';
        
        // Modal başlığını güncelle
        document.getElementById('planModalTitle').textContent = 'Üretim Planını Düzenle';
        
        // Kaydet butonunu güncelle
        const saveButton = document.querySelector('#planModal .btn-primary');
        saveButton.setAttribute('onclick', `updatePlan(${planId})`);
        saveButton.innerHTML = '<i class="fas fa-save me-1"></i>Güncelle';
        
        // Modal'ı göster
        const modal = new bootstrap.Modal(document.getElementById('planModal'));
        modal.show();
        
    } catch (error) {
        console.error('Plan düzenleme hatası:', error);
        showModalAlert('Plan düzenlenemedi: ' + error.message, 'error');
    }
}

// Üretim planı güncelleme fonksiyonu
async function updatePlan(planId) {
    try {
        const planData = {
            plan_name: document.getElementById('plan-name').value,
            plan_type: document.getElementById('plan-type').value,
            start_date: document.getElementById('start-date').value,
            end_date: document.getElementById('end-date').value,
            status: document.getElementById('plan-status').value || 'draft',
            created_by: document.getElementById('created-by').value || 'Admin',
            assigned_operator: document.getElementById('assigned-operator').value || null,
            operator_notes: document.getElementById('operator-notes').value || null,
            notes: document.getElementById('plan-notes').value || null
        };

        // Temel validasyon
        if (!planData.plan_name || !planData.plan_type || !planData.start_date || !planData.end_date) {
            showModalAlert('Lütfen tüm zorunlu alanları doldurun!', 'warning');
            return;
        }

        console.log('Plan güncelleniyor:', planId, planData);

        const response = await fetch(`/api/production-plans/${planId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(planData)
        });

        if (!response.ok) {
            throw new Error('Plan güncellenemedi');
        }

        const result = await response.json();
        console.log('Plan başarıyla güncellendi:', result);

        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('planModal'));
        modal.hide();

        // Modal'ı sıfırla
        resetPlanModal();

        // Sayfayı yenile (eğer plan listesi varsa)
        if (typeof loadPlans === 'function') {
            loadPlans();
        }

        showModalAlert('Plan başarıyla güncellendi!', 'success');

    } catch (error) {
        console.error('Plan güncelleme hatası:', error);
        showModalAlert('Plan güncellenemedi: ' + error.message, 'error');
    }
}

// Plan modalını sıfırla
function resetPlanModal() {
    // Modal başlığını sıfırla
    document.getElementById('planModalTitle').textContent = 'Yeni Üretim Planı';
    
    // Kaydet butonunu sıfırla
    const saveButton = document.querySelector('#planModal .btn-primary');
    saveButton.setAttribute('onclick', 'savePlan()');
    saveButton.innerHTML = '<i class="fas fa-save me-1"></i>Kaydet';
    
    // Formu temizle
    document.getElementById('planForm').reset();
}

// Operatör seçeneklerini yükle
async function loadOperatorOptions() {
    try {
        const response = await fetch('/api/operators');
        if (!response.ok) {
            throw new Error('Operatörler yüklenemedi');
        }
        
        const operators = await response.json();
        const operatorSelect = document.getElementById('assigned-operator');
        
        // Mevcut seçenekleri temizle (ilk seçenek hariç)
        operatorSelect.innerHTML = '<option value="">Operatör seçiniz...</option>';
        
        // Operatörleri ekle
        operators.forEach(operator => {
            const option = document.createElement('option');
            option.value = operator.name;
            option.textContent = operator.name;
            operatorSelect.appendChild(option);
        });
        
        console.log('Operatör seçenekleri yüklendi:', operators.length, 'operatör');
        
    } catch (error) {
        console.error('Operatör seçenekleri yükleme hatası:', error);
        // Hata durumunda varsayılan operatörleri kullan
        const operatorSelect = document.getElementById('assigned-operator');
        operatorSelect.innerHTML = `
            <option value="">Operatör seçiniz...</option>
            <option value="Thunder Serisi Operatör">Thunder Serisi Operatör</option>
            <option value="ThunderPRO Serisi Operatör">ThunderPRO Serisi Operatör</option>
        `;
    }
}

// ========================================
// Müşteri Yönetimi Fonksiyonları
// ========================================

let customers = [];

// Müşteri yönetimi modal'ını göster
window.showCustomerManagementModal = async function() {
    const modal = new bootstrap.Modal(document.getElementById('customerManagementModal'));
    modal.show();
    await loadCustomers();
};

// Müşteri ekleme
window.addCustomer = async function() {
    const customerData = {
        name: document.getElementById('customerName').value,
        code: document.getElementById('customerCode').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value,
        notes: document.getElementById('customerNotes').value
    };

    if (!customerData.name) {
        showNotification('Müşteri adı zorunludur!', 'error');
        return;
    }

    try {
        const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
        });

        if (response.ok) {
            showNotification('Müşteri başarıyla eklendi!', 'success');
            document.getElementById('customerForm').reset();
            loadCustomers();
            loadCustomerOptions();
        } else {
            const error = await response.json();
            showNotification('Müşteri eklenemedi: ' + error.error, 'error');
        }
    } catch (error) {
        showNotification('Müşteri eklenemedi: ' + error.message, 'error');
    }
};

// Müşteri listesini yükle
window.loadCustomers = async function() {
    console.log('🔍 loadCustomers çağrıldı...');
    try {
        const response = await fetch('/api/customers');
        console.log('📡 API response:', response.status);
        
        if (response.ok) {
            customers = await response.json();
            console.log('✅ API\'den müşteriler yüklendi:', customers);
            console.log('📊 Müşteri sayısı:', customers.length);
            displayCustomers();
        } else {
            console.warn('⚠️ API başarısız, varsayılan müşteriler kullanılıyor');
            const errorText = await response.text();
            console.error('❌ API hatası:', errorText);
            // Eğer API yoksa varsayılan müşterileri kullan
            customers = [
                { id: 1, name: 'LTSAUTO', code: 'LTS-001', email: 'info@ltsauto.com', phone: '+90 555 123 45 67' },
                { id: 2, name: 'ACME Corp', code: 'ACME-001', email: 'orders@acme.com', phone: '+90 555 234 56 78' },
                { id: 3, name: 'Tech Solutions', code: 'TECH-001', email: 'contact@techsolutions.com', phone: '+90 555 345 67 89' },
                { id: 4, name: 'Industrial Ltd', code: 'IND-001', email: 'sales@industrial.com', phone: '+90 555 456 78 90' },
                { id: 5, name: 'Manufacturing Co', code: 'MFG-001', email: 'orders@manufacturing.com', phone: '+90 555 567 89 01' }
            ];
            console.log('📋 Varsayılan müşteriler yüklendi:', customers);
            displayCustomers();
        }
    } catch (error) {
        console.error('❌ Müşteri yükleme hatası:', error);
        // Varsayılan müşterileri kullan
        customers = [
            { id: 1, name: 'LTSAUTO', code: 'LTS-001', email: 'info@ltsauto.com', phone: '+90 555 123 45 67' },
            { id: 2, name: 'ACME Corp', code: 'ACME-001', email: 'orders@acme.com', phone: '+90 555 234 56 78' },
            { id: 3, name: 'Tech Solutions', code: 'TECH-001', email: 'contact@techsolutions.com', phone: '+90 555 345 67 89' },
            { id: 4, name: 'Industrial Ltd', code: 'IND-001', email: 'sales@industrial.com', phone: '+90 555 456 78 90' },
            { id: 5, name: 'Manufacturing Co', code: 'MFG-001', email: 'orders@manufacturing.com', phone: '+90 555 567 89 01' }
        ];
        console.log('📋 Hata durumunda varsayılan müşteriler yüklendi:', customers);
        displayCustomers();
    }
};

// Müşteri listesini göster
function displayCustomers() {
    console.log('🎯 displayCustomers çağrıldı, customers:', customers);
    const tbody = document.getElementById('customersList');
    console.log('📦 tbody element:', tbody);
    
    if (customers.length === 0) {
        console.log('⚠️ Müşteri listesi boş');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Müşteri bulunamadı</td></tr>';
        return;
    }
    
    console.log('📋 Müşteri listesi render ediliyor, müşteri sayısı:', customers.length);

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.code || 'N/A'}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(${customer.id})" title="Müşteriyi sil">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Müşteri silme
window.deleteCustomer = async function(customerId) {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`/api/customers/${customerId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Müşteri silindi!', 'success');
            loadCustomers();
            loadCustomerOptions();
        } else {
            showNotification('Müşteri silinemedi!', 'error');
        }
    } catch (error) {
        showNotification('Müşteri silinemedi: ' + error.message, 'error');
    }
};

// Müşteri seçeneklerini yükle
function loadCustomerOptions() {
    console.log('🔍 loadCustomerOptions çağrıldı, customers:', customers);
    const select = document.getElementById('selectedCustomer');
    if (!select) {
        console.error('❌ selectedCustomer element bulunamadı');
        return;
    }
    
    select.innerHTML = '<option value="">Müşteri seçiniz...</option>';
    
    if (!customers || customers.length === 0) {
        console.warn('⚠️ Müşteri listesi boş');
        return;
    }
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.name;
        option.textContent = `${customer.name} (${customer.code || 'Kod yok'})`;
        select.appendChild(option);
    });
    
    console.log('✅ Müşteri seçenekleri yüklendi:', customers.length);
}

// HTML içindeki müşteri listesini kullanarak seçenekleri yükle
function loadCustomerOptionsFromHTML() {
    console.log('🔍 loadCustomerOptionsFromHTML çağrıldı, htmlCustomers:', window.htmlCustomers);
    const select = document.getElementById('selectedCustomer');
    if (!select) {
        console.error('❌ selectedCustomer element bulunamadı');
        return;
    }
    
    select.innerHTML = '<option value="">Müşteri seçiniz...</option>';
    
    if (!window.htmlCustomers || window.htmlCustomers.length === 0) {
        console.warn('⚠️ HTML müşteri listesi boş');
        return;
    }
    
    window.htmlCustomers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.name;
        option.textContent = `${customer.name} (${customer.code || 'Kod yok'})`;
        select.appendChild(option);
    });
    
    console.log('✅ HTML müşteri seçenekleri yüklendi:', window.htmlCustomers.length);
}

// CSV template'ini güncelle
window.updateCSVTemplate = function() {
    const selectedCustomer = document.getElementById('selectedCustomer').value;
    const selectedOperator = document.getElementById('selectedOperator').value;
    
    if (selectedCustomer && selectedOperator) {
        showNotification(`${selectedCustomer} müşterisi ve ${selectedOperator} operatörü seçildi. Template indirirken bu bilgiler kullanılacak.`, 'info');
    } else if (selectedCustomer) {
        showNotification(`${selectedCustomer} müşterisi seçildi. Template indirirken bu müşteri kullanılacak.`, 'info');
    } else if (selectedOperator) {
        showNotification(`${selectedOperator} operatörü seçildi. Template indirirken bu operatör kullanılacak.`, 'info');
    }
};

// Sipariş ekleme modal'ını göster
window.showAddOrderModal = async function() {
    console.log('🔍 showAddOrderModal çağrıldı');
    
    // Önce müşteri listesini yükle
    await loadCustomers();
    
    // Müşteri seçeneklerini yükle
    loadOrderCustomerOptions();
    
    // Operatör seçeneklerini yükle
    await loadOperatorsForOrder();
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
};

// Sipariş modal'ı için operatör seçeneklerini yükle
async function loadOperatorsForOrder() {
    try {
        console.log('🔍 Operatör listesi yükleniyor...');
        const response = await fetch('/api/operators');
        const operators = await response.json();
        
        const operatorSelect = document.getElementById('assigned-operator');
        if (operatorSelect) {
            operatorSelect.innerHTML = '<option value="">Operatör seçiniz</option>';
            
            operators.forEach(operator => {
                const option = document.createElement('option');
                option.value = operator.name || operator;
                option.textContent = operator.name || operator;
                // Operatör detaylarını tooltip olarak ekle
                if (operator.skill_level || operator.department) {
                    option.title = `${operator.department || 'Üretim'} - ${operator.skill_level || 'Uzman'}`;
                }
                operatorSelect.appendChild(option);
            });
            
            console.log('✅ Operatör listesi yüklendi:', operators.length, 'operatör');
        }
    } catch (error) {
        console.error('❌ Operatör listesi yüklenemedi:', error);
        // Fallback operatör listesi
        const operatorSelect = document.getElementById('assigned-operator');
        if (operatorSelect) {
            operatorSelect.innerHTML = `
                <option value="">Operatör seçiniz</option>
                <option value="Thunder Serisi Operatör">Thunder Serisi Operatör</option>
                <option value="ThunderPRO Serisi Operatör">ThunderPRO Serisi Operatör</option>
            `;
        }
    }
}

// Sipariş modal'ı için müşteri seçeneklerini yükle
function loadOrderCustomerOptions() {
    console.log('🔍 loadOrderCustomerOptions çağrıldı');
    console.log('🔍 customers array:', customers);
    console.log('🔍 customers length:', customers ? customers.length : 'undefined');
    
    const select = document.getElementById('customer-name');
    if (!select) {
        console.error('❌ customer-name select elementi bulunamadı!');
        return;
    }
    
    console.log('✅ customer-name select elementi bulundu');
    select.innerHTML = '<option value="">Müşteri seçiniz...</option>';
    
    if (!customers || customers.length === 0) {
        console.warn('⚠️ Müşteri listesi boş! customers:', customers);
        select.innerHTML = '<option value="">Müşteri bulunamadı</option>';
        return;
    }
    
    console.log('🔍 Müşteri listesi dolu, seçenekler ekleniyor...');
    customers.forEach((customer, index) => {
        console.log(`🔍 Müşteri ${index + 1}:`, customer);
        const option = document.createElement('option');
        option.value = customer.name;
        option.textContent = `${customer.name} (${customer.code || 'Kod yok'})`;
        select.appendChild(option);
    });
    
    console.log('✅ Müşteri seçenekleri yüklendi:', customers.length, 'müşteri');
    console.log('🔍 Select element options count:', select.options.length);
}

// Plan modal'ında ürün tipine göre ürünleri yükle
window.loadProductsByType = async function() {
    console.log('🔍 production.js loadProductsByType çağrıldı');
    const productType = document.getElementById('product-type').value;
    const productSelect = document.getElementById('selected-product');
    
    console.log('🔍 productType:', productType);
    console.log('🔍 productSelect element:', productSelect);
    
    if (!productType) {
        productSelect.innerHTML = '<option value="">Önce ürün tipi seçiniz</option>';
        productSelect.disabled = true;
        return;
    }
    
    productSelect.innerHTML = '<option value="">Yükleniyor...</option>';
    productSelect.disabled = true;
    
    try {
        let apiEndpoint = '';
        switch(productType) {
            case 'yarimamul':
                apiEndpoint = '/api/yarimamuller';
                break;
            case 'nihai':
                apiEndpoint = '/api/nihai_urunler';
                break;
            default:
                throw new Error('Geçersiz ürün tipi');
        }
        
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
            throw new Error(`API hatası: ${response.status}`);
        }
        
        const products = await response.json();
        console.log(`🔍 ${productType} API'den gelen veriler:`, products);
        
        productSelect.innerHTML = '<option value="">Ürün seçiniz...</option>';
        
        if (!Array.isArray(products) || products.length === 0) {
            console.warn(`⚠️ ${productType} için ürün bulunamadı`);
            productSelect.innerHTML = '<option value="">Ürün bulunamadı</option>';
            productSelect.disabled = true;
            return;
        }
        
        products.forEach((product, index) => {
            console.log(`🔍 Ürün ${index + 1}:`, product);
            const option = document.createElement('option');
            option.value = product.id;
            // Veri yapısına göre doğru alanları kullan
            const productName = product.ad || product.name || product.urun_adi || 'Bilinmeyen Ürün';
            const productCode = product.kod || product.code || 'Kod yok';
            option.textContent = `${productName} (${productCode})`;
            productSelect.appendChild(option);
        });
        
        productSelect.disabled = false;
        console.log(`✅ ${productType} ürünleri yüklendi:`, products.length, 'ürün');
        
    } catch (error) {
        console.error('❌ Ürün yükleme hatası:', error);
        productSelect.innerHTML = '<option value="">Hata: Ürünler yüklenemedi</option>';
        productSelect.disabled = true;
        showNotification('Ürünler yüklenemedi: ' + error.message, 'error');
    }
};

// ========================================
// CSV/Excel Toplu Sipariş Girişi Fonksiyonları
// ========================================

let csvData = [];
let csvHeaders = [];

// CSV Import Modal'ını göster
window.showBulkOrderModal = async function() {
    console.log('🔍 showBulkOrderModal çağrıldı');
    
    // Modal'ı temizle
    clearCSVPreview();
    
    // Önce müşteri listesini yükle (HTML içindeki fonksiyon)
    console.log('🔍 Müşteri listesi yükleniyor...');
    await loadCustomers();
    console.log('🔍 Müşteri listesi yüklendi, htmlCustomers:', window.htmlCustomers);
    
    // Müşteri seçeneklerini yükle (htmlCustomers kullanarak)
    console.log('🔍 Müşteri seçenekleri yükleniyor...');
    loadCustomerOptionsFromHTML();
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('bulkOrderModal'));
    modal.show();
    console.log('✅ Modal gösterildi');
};

// CSV Template indirme
window.downloadCSVTemplate = function() {
    // Seçilen müşteriyi ve operatörü al
    const selectedCustomer = document.getElementById('selectedCustomer').value;
    const selectedOperator = document.getElementById('selectedOperator').value;
    const customerName = selectedCustomer || 'LTSAUTO';
    const operatorName = selectedOperator || 'Operatör 1';
    
    const csvContent = `customer_name,operator,order_date,delivery_date,priority,notes,product_name,product_code,quantity,unit_price
${customerName},${operatorName},2025-09-17,2025-09-22,high,1 Müşteri 1 Sipariş 10 Farklı Kod Toplam 200 Adet,Thunder Serisi Ürün 1,TS-001,20,150.50
${customerName},${operatorName},2025-09-17,2025-09-22,high,1 Müşteri 1 Sipariş 10 Farklı Kod Toplam 200 Adet,Thunder Serisi Ürün 2,TS-002,25,200.75
${customerName},${operatorName},2025-09-17,2025-09-22,high,1 Müşteri 1 Sipariş 10 Farklı Kod Toplam 200 Adet,Thunder Serisi Ürün 3,TS-003,15,175.25
${customerName},${operatorName},2025-09-17,2025-09-22,high,1 Müşteri 1 Sipariş 10 Farklı Kod Toplam 200 Adet,Thunder Serisi Ürün 4,TS-004,30,125.80
${customerName},${operatorName},2025-09-17,2025-09-22,high,1 Müşteri 1 Sipariş 10 Farklı Kod Toplam 200 Adet,Thunder Serisi Ürün 5,TS-005,18,300.00
${customerName},${operatorName},2025-09-17,2025-09-22,high,1 Müşteri 1 Sipariş 10 Farklı Kod Toplam 200 Adet,Thunder Serisi Ürün 6,TS-006,22,250.50
${customerName},${operatorName},2025-09-17,2025-09-22,high,1 Müşteri 1 Sipariş 10 Farklı Kod Toplam 200 Adet,Thunder Serisi Ürün 7,TS-007,28,180.75
${customerName},${operatorName},2025-09-17,2025-09-22,high,1 Müşteri 1 Sipariş 10 Farklı Kod Toplam 200 Adet,Thunder Serisi Ürün 8,TS-008,12,220.25
${customerName},${operatorName},2025-09-17,2025-09-22,high,1 Müşteri 1 Sipariş 10 Farklı Kod Toplam 200 Adet,Thunder Serisi Ürün 9,TS-009,16,275.00
${customerName},${operatorName},2025-09-17,2025-09-22,high,1 Müşteri 1 Sipariş 10 Farklı Kod Toplam 200 Adet,Thunder Serisi Ürün 10,TS-010,14,195.50`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'siparis_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('CSV template indirildi!', 'success');
};

// Dosya seçimi işleme
window.handleFileSelect = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
        parseCSVFile(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        parseExcelFile(file);
    } else {
        showNotification('Desteklenmeyen dosya formatı! Sadece CSV, XLSX ve XLS dosyaları desteklenir.', 'error');
    }
};

// CSV dosyasını parse et
function parseCSVFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
            showNotification('CSV dosyası en az 2 satır içermelidir (header + data)', 'error');
            return;
        }

        // Headers'ı parse et
        csvHeaders = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
        
        // Data rows'ları parse et
        csvData = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
            if (values.length === csvHeaders.length) {
                const row = {};
                csvHeaders.forEach((header, index) => {
                    row[header] = values[index];
                });
                csvData.push(row);
            }
        }

        displayCSVPreview();
    };
    reader.readAsText(file, 'UTF-8');
};

// Excel dosyasını parse et (basit implementasyon)
function parseExcelFile(file) {
    // Excel parsing için SheetJS kütüphanesi gerekli
    // Şimdilik CSV'ye dönüştürme önerisi ver
    showNotification('Excel dosyaları için lütfen CSV formatında kaydedin. Excel\'de "Farklı Kaydet" > "CSV (Virgülle Ayrılmış)" seçin.', 'info');
};

// CSV önizlemesini göster
function displayCSVPreview() {
    if (csvData.length === 0) {
        showNotification('CSV dosyasında veri bulunamadı!', 'error');
        return;
    }

    // Önizleme bölümünü göster
    document.getElementById('csvPreviewSection').style.display = 'block';
    document.getElementById('clearCsvBtn').style.display = 'inline-block';
    document.getElementById('processBulkBtn').style.display = 'inline-block';

    // Satır sayısını güncelle
    document.getElementById('csvRowCount').textContent = `${csvData.length} satır`;

    // Headers'ı göster
    const headersRow = document.getElementById('csvHeaders');
    headersRow.innerHTML = '';
    csvHeaders.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headersRow.appendChild(th);
    });

    // Data rows'ları göster (ilk 10 satır)
    const dataRows = document.getElementById('csvDataRows');
    dataRows.innerHTML = '';
    const previewRows = csvData.slice(0, 10);
    
    previewRows.forEach((row, index) => {
        const tr = document.createElement('tr');
        csvHeaders.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        dataRows.appendChild(tr);
    });

    // Eğer 10'dan fazla satır varsa bilgi ver
    if (csvData.length > 10) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = csvHeaders.length;
        td.className = 'text-center text-muted';
        td.textContent = `... ve ${csvData.length - 10} satır daha`;
        tr.appendChild(td);
        dataRows.appendChild(tr);
    }

    showNotification(`${csvData.length} sipariş yüklendi ve önizleme hazır!`, 'success');
};

// CSV önizlemesini temizle
window.clearCSVPreview = function() {
    csvData = [];
    csvHeaders = [];
    
    document.getElementById('csvPreviewSection').style.display = 'none';
    document.getElementById('csvErrorSection').style.display = 'none';
    document.getElementById('csvSuccessSection').style.display = 'none';
    document.getElementById('clearCsvBtn').style.display = 'none';
    document.getElementById('processBulkBtn').style.display = 'none';
    document.getElementById('csvFileInput').value = '';
    
    document.getElementById('csvHeaders').innerHTML = '';
    document.getElementById('csvDataRows').innerHTML = '';
    document.getElementById('csvRowCount').textContent = '0 satır';
};

// Ürün kodunun veritabanında karşılığını kontrol et
async function validateProductInDatabase(productCode, rowNumber) {
    console.log(`🔍 validateProductInDatabase çağrıldı:`, {productCode, rowNumber});
    
    if (!productCode || productCode === 'N/A') {
        console.log(`❌ Ürün kodu boş:`, productCode);
        return {
            isValid: false,
            errors: [`Satır ${rowNumber}: Ürün kodu boş olamaz`]
        };
    }

    try {
        // Tüm ürünleri veritabanından al
        console.log(`📡 API çağrısı yapılıyor: /api/nihai_urunler`);
        const response = await fetch('/api/nihai_urunler');
        if (!response.ok) {
            console.log(`❌ API hatası:`, response.status);
            return {
                isValid: false,
                errors: [`Satır ${rowNumber}: Ürün veritabanına erişilemedi`]
            };
        }

        const products = await response.json();
        console.log(`📦 ${products.length} ürün alındı`);
        
        // Sadece tam eşleşme ara - esnek arama yok
        const product = products.find(p => p.kod === productCode);
        console.log(`🔍 Aranan kod: "${productCode}"`);
        console.log(`🔍 Bulunan ürün:`, product);

        if (!product) {
            console.log(`❌ Ürün bulunamadı`);
            return {
                isValid: false,
                errors: [`Satır ${rowNumber}: "${productCode}" ürün kodu veritabanında bulunamadı. Veritabanındaki ürün kodları: ${products.slice(0, 5).map(p => p.kod).join(', ')}${products.length > 5 ? '...' : ''}`]
            };
        }

        console.log(`✅ Ürün bulundu:`, product.ad);
        return {
            isValid: true,
            productName: product.ad,
            productCode: product.kod,
            barcode: product.barkod
        };

    } catch (error) {
        console.error('❌ Ürün doğrulama hatası:', error);
        return {
            isValid: false,
            errors: [`Satır ${rowNumber}: Ürün doğrulama hatası - ${error.message}`]
        };
    }
}

// Toplu siparişleri işle
window.processBulkOrders = async function() {
    if (csvData.length === 0) {
        showNotification('İşlenecek veri bulunamadı!', 'error');
        return;
    }

    // Hata ve başarı bölümlerini gizle
    document.getElementById('csvErrorSection').style.display = 'none';
    document.getElementById('csvSuccessSection').style.display = 'none';

    const errors = [];
    const successes = [];
    let processedCount = 0;

    // Tüm ürünleri tek siparişe grupla
    const allProducts = [];
    let orderInfo = null;

    // İlk satırdan sipariş bilgilerini al
    if (csvData.length > 0) {
        orderInfo = csvData[0];
    }

    // Tüm ürünleri topla ve veritabanı kontrolü yap
    for (let index = 0; index < csvData.length; index++) {
        const row = csvData[index];
        const rowNumber = index + 2;
        
        // Veri validasyonu
        const validation = validateOrderRow(row, rowNumber);
        if (!validation.isValid) {
            errors.push(...validation.errors);
            continue;
        }

        // Ürün kodunun veritabanında karşılığını kontrol et
        console.log(`🔍 Satır ${rowNumber} ürün kontrolü:`, row.product_code);
        const productValidation = await validateProductInDatabase(row.product_code, rowNumber);
        console.log(`✅ Satır ${rowNumber} doğrulama sonucu:`, productValidation);
        
        if (!productValidation.isValid) {
            console.log(`❌ Satır ${rowNumber} geçersiz:`, productValidation.errors);
            errors.push(...productValidation.errors);
            continue;
        }

        // Ürün bilgilerini ekle
        allProducts.push({
            product_name: productValidation.productName || row.product_name || 'Ürün',
            product_code: row.product_code || 'N/A',
            quantity: parseInt(row.quantity) || 1,
            unit_price: parseFloat(row.unit_price) || 0
        });
    }

    // Eğer geçerli ürün varsa tek sipariş oluştur
    if (allProducts.length > 0 && orderInfo) {
        try {
            // Toplam tutarı hesapla
            const totalAmount = allProducts.reduce((sum, product) => {
                return sum + (product.quantity * product.unit_price);
            }, 0);

            // Tek sipariş verisi hazırla
            const orderData = {
                customer_name: orderInfo.customer_name || 'Bilinmeyen Müşteri',
                assigned_operator: orderInfo.operator || 'Operatör 1',
                order_date: orderInfo.order_date || new Date().toISOString().split('T')[0],
                delivery_date: orderInfo.delivery_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                priority: orderInfo.priority || 'medium',
                notes: orderInfo.notes || '',
                product_details: allProducts,
                total_amount: totalAmount,
                created_by: 'Toplu Sipariş Sistemi'
            };
            

            // Tek sipariş oluştur
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const result = await response.json();
                successes.push(`Tek sipariş başarıyla oluşturuldu: ${allProducts.length} ürün ile (ID: ${result.id})`);
                processedCount = 1;
            } else {
                const errorData = await response.json();
                errors.push(`API Hatası: ${errorData.error || 'Bilinmeyen hata'}`);
            }

        } catch (error) {
            errors.push(`Toplu sipariş hatası: ${error.message}`);
        }
    }

    // Sonuçları göster
    displayProcessingResults(errors, successes, processedCount);
};

// Siparişleri müşteri adına göre grupla
function groupOrdersByCustomer(csvData) {
    const grouped = {};
    
    csvData.forEach((row, index) => {
        const customerKey = `${row.customer_name}_${row.operator || 'default'}_${row.order_date}_${row.delivery_date}_${row.priority}`;
        
        if (!grouped[customerKey]) {
            grouped[customerKey] = [];
        }
        
        // Satır numarasını ekle (hata raporlama için)
        row.rowNumber = index + 2;
        grouped[customerKey].push(row);
    });
    
    return grouped;
}

// Sipariş satırı validasyonu
function validateOrderRow(row, rowNumber) {
    const errors = [];
    
    // Zorunlu alanlar
    if (!row.customer_name || row.customer_name.trim() === '') {
        errors.push(`Satır ${rowNumber}: Müşteri adı boş olamaz`);
    }
    
    if (!row.product_name || row.product_name.trim() === '') {
        errors.push(`Satır ${rowNumber}: Ürün adı boş olamaz`);
    }
    
    if (!row.quantity || isNaN(parseInt(row.quantity)) || parseInt(row.quantity) <= 0) {
        errors.push(`Satır ${rowNumber}: Geçerli miktar giriniz`);
    }
    
    // Tarih validasyonu
    if (row.order_date && !isValidDate(row.order_date)) {
        errors.push(`Satır ${rowNumber}: Geçersiz sipariş tarihi formatı (YYYY-MM-DD olmalı)`);
    }
    
    if (row.delivery_date && !isValidDate(row.delivery_date)) {
        errors.push(`Satır ${rowNumber}: Geçersiz teslim tarihi formatı (YYYY-MM-DD olmalı)`);
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Tarih validasyonu
function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// İşlem sonuçlarını göster
function displayProcessingResults(errors, successes, processedCount) {
    // Hata raporu
    if (errors.length > 0) {
        document.getElementById('csvErrorSection').style.display = 'block';
        const errorList = document.getElementById('csvErrorList');
        errorList.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>${errors.length} Hata Bulundu</h6>
                <div class="mt-2">
                    ${errors.map(error => `<div class="mb-1">• ${error}</div>`).join('')}
                </div>
            </div>
        `;
    }

    // Başarı raporu
    if (successes.length > 0) {
        document.getElementById('csvSuccessSection').style.display = 'block';
        const successList = document.getElementById('csvSuccessList');
        successList.innerHTML = `
            <div class="alert alert-success">
                <h6><i class="fas fa-check-circle me-2"></i>${processedCount} Sipariş Başarıyla Oluşturuldu!</h6>
                <div class="mt-2">
                    ${successes.slice(0, 5).map(success => `<div class="mb-1">• ${success}</div>`).join('')}
                    ${successes.length > 5 ? `<div class="mb-1 text-muted">... ve ${successes.length - 5} tane daha</div>` : ''}
                </div>
            </div>
        `;
    }

    // Siparişleri yenile
    if (processedCount > 0) {
        setTimeout(() => {
            loadOrders();
        }, 1000);
    }

    showNotification(`İşlem tamamlandı: ${processedCount} başarılı, ${errors.length} hata`, processedCount > 0 ? 'success' : 'error');
}
