// Üretim Yönetimi JavaScript
// Faz 0: State Management ve Event Bus entegrasyonu

// Global değişkenler
let hammaddeler = [];
let yarimamuller = [];
let nihaiUrunler = [];
let urunAgaci = [];
let activeProductions = [];
let productionHistory = [];
let currentProductionId = null;

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
    
    if (typeof window.realTimeUpdates !== 'undefined') {
        console.log('Real-time Updates initialized');
        setupRealTimeEventListeners();
    } else {
        console.warn('Real-time Updates not found');
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

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Faz 0: State Management'ı başlat
    initializeStateManagement();
    
    loadAllData();
    setupEventListeners();
});

// Tüm verileri yükle
async function loadAllData() {
    try {
        await Promise.all([
            loadHammaddeler(),
            loadYarimamuller(),
            loadNihaiUrunler(),
            loadUrunAgaci(),
            loadActiveProductions(),
            loadProductionHistory()
        ]);
        
        updateProductSelects();
        
        // Autocomplete sistemini kur (veriler yüklendikten sonra)
        setupProductionProductAutocomplete();
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        showAlert('Veriler yüklenirken hata oluştu', 'error');
    }
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
            ...nihaiUrunler.filter(n => n.aktif).map(n => ({...n, type: 'nihai'}))
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
            displayActiveProductions();
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
            // Quality checkpoints güncellendi
            if (typeof loadQualityCheckpoints === 'function') {
                loadQualityCheckpoints();
            }
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

// Faz 0: Tab event listener'larını ayarla
function setupTabEventListeners() {
    // Tab değişim event'lerini dinle
    const tabElements = document.querySelectorAll('[data-bs-toggle="tab"]');
    
    tabElements.forEach(tabElement => {
        tabElement.addEventListener('shown.bs.tab', function(event) {
            const targetTab = event.target.getAttribute('data-bs-target');
            const tabId = event.target.id;
            
            console.log('Tab changed to:', tabId, targetTab);
            
            // State Manager'ı güncelle
            if (window.stateManager) {
                window.stateManager.updateState('activeTab', tabId);
            }
            
            // Event Bus'a bildir
            if (window.eventBus) {
                window.eventBus.emit('tab-changed', {
                    tabId: tabId,
                    targetTab: targetTab,
                    timestamp: new Date()
                });
            }
            
            // Tab'a özel veri yükleme
            loadTabData(tabId);
        });
    });
}

// Tab'a özel veri yükleme
function loadTabData(tabId) {
    switch(tabId) {
        case 'production-start-tab':
            // Üretim başlatma verileri zaten yüklü
            break;
        case 'production-stages-tab':
            if (typeof loadStageTemplates === 'function') {
                loadStageTemplates();
            }
            break;
        case 'active-productions-tab':
            if (typeof loadActiveProductions === 'function') {
                loadActiveProductions();
            }
            break;
        case 'production-planning-tab':
            if (typeof loadProductionPlans === 'function') {
                loadProductionPlans();
            }
            break;
        case 'quality-control-tab':
            if (typeof loadQualityCheckpoints === 'function') {
                loadQualityCheckpoints();
            }
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
    
    // Tab değişim event'leri
    document.getElementById('production-stages-tab').addEventListener('shown.bs.tab', function() {
        loadStageTemplates();
    });
    
    document.getElementById('production-planning-tab').addEventListener('shown.bs.tab', function() {
        loadProductionPlans();
        loadResources();
        loadOrders();
        loadPlanningStatistics();
    });
    
    document.getElementById('quality-control-tab').addEventListener('shown.bs.tab', function() {
        loadQualityCheckpoints();
        loadQualityStandards();
        loadQualityStatistics();
    });
    
    document.getElementById('production-quantity').addEventListener('input', function() {
        if (this.value && document.getElementById('production-product').value) {
            checkMaterialsForProduction();
        }
    });
    
    // Barkod input enter tuşu ve otomatik okutma
    document.getElementById('barcode-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            scanBarcode();
        }
    });
    
    // Barkod input değişiklik takibi (otomatik okutma)
    document.getElementById('barcode-input').addEventListener('input', function(e) {
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
            nihaiUrunler = await response.json();
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

// Aktif üretimleri yükle
async function loadActiveProductions() {
    console.log('loadActiveProductions fonksiyonu çağrıldı');
    try {
        const productions = await getActiveProductions();
        console.log('Aktif üretimler:', productions);

        // Her üretim için ürün bilgilerini al
        const enrichedProductions = await Promise.all(productions.map(async (production) => {
            try {
                let productInfo = null;
                console.log(`Ürün bilgisi alınıyor - ID: ${production.product_id}, Tip: ${production.product_type}`);
                
                if (production.product_type === 'nihai') {
                    const response = await fetch(`/api/nihai_urunler/${production.product_id}`);
                    console.log(`Nihai ürün API response:`, response.status);
                    if (response.ok) {
                        productInfo = await response.json();
                        console.log(`Nihai ürün bilgisi:`, productInfo);
                    }
                } else if (production.product_type === 'yarimamul') {
                    const response = await fetch(`/api/yarimamuller/${production.product_id}`);
                    console.log(`Yarı mamul API response:`, response.status);
                    if (response.ok) {
                        productInfo = await response.json();
                        console.log(`Yarı mamul bilgisi:`, productInfo);
                    }
                } else if (production.product_type === 'hammadde') {
                    const response = await fetch(`/api/hammaddeler/${production.product_id}`);
                    console.log(`Hammadde API response:`, response.status);
                    if (response.ok) {
                        productInfo = await response.json();
                        console.log(`Hammadde bilgisi:`, productInfo);
                    }
                }
                
                const enrichedProduction = {
                    ...production,
                    urun_adi: productInfo?.ad || 'Bilinmeyen Ürün',
                    urun_kodu: productInfo?.kod || 'N/A',
                    hedef_miktar: production.target_quantity || 0,
                    uretilen_miktar: production.quantity || 0,
                    durum: production.status === 'active' ? 'devam_ediyor' : production.status
                };
                
                console.log(`Zenginleştirilmiş üretim:`, enrichedProduction);
                return enrichedProduction;
            } catch (error) {
                console.error(`Ürün bilgisi alınamadı (ID: ${production.product_id}):`, error);
                return {
                    ...production,
                    urun_adi: 'Bilinmeyen Ürün',
                    urun_kodu: 'N/A',
                    hedef_miktar: production.target_quantity || 0,
                    uretilen_miktar: production.quantity || 0,
                    durum: production.status === 'active' ? 'devam_ediyor' : production.status
                };
            }
        }));
        
        activeProductions = enrichedProductions;
        console.log('displayActiveProductions çağrılıyor...');
        displayActiveProductions();
        
        // Aktif üretimleri UI'da göster (isteğe bağlı)
        if (enrichedProductions.length > 0) {
            showAlert(`${enrichedProductions.length} aktif üretim bulundu`, 'info');
        }
        
        return enrichedProductions;
    } catch (error) {
        console.error('Aktif üretimler yüklenemedi:', error);
        showAlert('Aktif üretimler yüklenemedi: ' + error.message, 'error');
        return [];
    }
}

// Aktif üretimleri göster
function displayActiveProductions() {
    console.log('displayActiveProductions çağrıldı');
    console.log('activeProductions:', activeProductions);
    
    try {
        const container = document.getElementById('active-productions-container');
        const noProductions = document.getElementById('no-active-productions');
        const countElement = document.getElementById('active-productions-count');
        
        console.log('Container elementleri:', {
            container: container,
            noProductions: noProductions,
            countElement: countElement
        });
        
        if (!container) {
            console.error('Aktif üretimler container bulunamadı');
            return;
        }
        
        // Sayıyı güncelle (eğer element varsa)
        if (countElement) {
            countElement.textContent = activeProductions.length;
        }
        
        if (activeProductions.length === 0) {
            container.innerHTML = '';
            if (noProductions) {
                noProductions.style.display = 'block';
            }
            return;
        }
        
        if (noProductions) {
            noProductions.style.display = 'none';
        }
        
        // Aktif üretimleri göster - eski HTML formatına uygun
        container.innerHTML = activeProductions.map(production => {
            const progressPercentage = Math.round(((production.uretilen_miktar || 0) / (production.hedef_miktar || 1)) * 100);
            const startDate = production.start_time ? new Date(production.start_time).toLocaleString('tr-TR') : 'Bilinmiyor';
            
            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-box me-2 text-primary"></i>
                                <div>
                                    <h6 class="mb-1">${production.urun_adi || 'Bilinmeyen Ürün'}</h6>
                                    <small class="text-muted">Miktar: ${production.uretilen_miktar || 0}</small>
                                </div>
                            </div>
                            <span class="badge bg-${production.status === 'active' ? 'warning' : production.status === 'paused' ? 'secondary' : production.status === 'completed' ? 'success' : 'danger'}">
                                ${production.status === 'active' ? 'Üretimde' : 
                                  production.status === 'paused' ? 'Duraklatıldı' : 
                                  production.status === 'completed' ? 'Tamamlandı' : 
                                  production.status === 'cancelled' ? 'İptal Edildi' : 'Bilinmiyor'}
                            </span>
                        </div>
                        <div class="mb-2">
                            <small class="text-muted">Başlangıç: ${startDate}</small>
                        </div>
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${progressPercentage}%"
                                 aria-valuenow="${production.uretilen_miktar || 0}"
                                 aria-valuemin="0"
                                 aria-valuemax="${production.hedef_miktar || 1}">
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                Hedef: ${production.hedef_miktar || 0} | Üretilen: ${production.uretilen_miktar || 0}
                            </small>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="viewProductionDetails(${production.id})" title="Detayları Görüntüle">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-outline-success" onclick="continueProduction(${production.id})" title="Üretime Devam Et">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="btn btn-outline-warning" onclick="pauseProduction(${production.id})" title="Duraklat">
                                    <i class="fas fa-pause"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="stopProduction(${production.id})" title="Durdur">
                                    <i class="fas fa-stop"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('displayActiveProductions hatası:', error);
    }
}

// Üretim geçmişini yükle
async function loadProductionHistory() {
    try {
        // Bu fonksiyon backend'de üretim geçmişini getirecek
        // Şimdilik boş array
        productionHistory = [];
        displayProductionHistory();
    } catch (error) {
        console.error('Üretim geçmişi yüklenemedi:', error);
    }
}

// Global değişken - seçili üretim
let selectedProduction = null;

// Üretim detaylarını görüntüle
function viewProductionDetails(productionId) {
    selectedProduction = activeProductions.find(p => p.id === productionId);
    if (!selectedProduction) {
        showAlert('Üretim bulunamadı', 'error');
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
        showAlert('Üretim bulunamadı', 'error');
        return;
    }
    
    if (production.status === 'active') {
        showAlert('Bu üretim zaten aktif durumda', 'info');
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
            showAlert('Üretim başarıyla devam ettirildi', 'success');
            
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
            showAlert(error.error || 'Üretim devam ettirilemedi', 'error');
        }
    } catch (error) {
        console.error('Üretim devam ettirme hatası:', error);
        showAlert('Üretim devam ettirilemedi', 'error');
    }
}

// Üretimi duraklat
async function pauseProduction(productionId) {
    const production = activeProductions.find(p => p.id === productionId);
    if (!production) {
        showAlert('Üretim bulunamadı', 'error');
        return;
    }
    
    if (production.status === 'paused') {
        showAlert('Bu üretim zaten duraklatılmış durumda', 'info');
        return;
    }
    
    if (production.status === 'completed') {
        showAlert('Tamamlanmış üretim duraklatılamaz', 'error');
        return;
    }
    
    if (production.status === 'cancelled') {
        showAlert('İptal edilmiş üretim duraklatılamaz', 'error');
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
            showAlert('Üretim başarıyla duraklatıldı', 'success');
            
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
            showAlert(error.error || 'Üretim duraklatılamadı', 'error');
        }
    } catch (error) {
        console.error('Üretim duraklatma hatası:', error);
        showAlert('Üretim duraklatılamadı', 'error');
    }
}

// Üretimi durdur
async function stopProduction(productionId) {
    const production = activeProductions.find(p => p.id === productionId);
    if (!production) {
        showAlert('Üretim bulunamadı', 'error');
        return;
    }
    
    if (production.status === 'completed') {
        showAlert('Bu üretim zaten tamamlanmış', 'info');
        return;
    }
    
    if (production.status === 'cancelled') {
        showAlert('Bu üretim zaten iptal edilmiş', 'info');
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
            showAlert('Üretim başarıyla durduruldu', 'success');
            
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
            showAlert(error.error || 'Üretim durdurulamadı', 'error');
        }
    } catch (error) {
        console.error('Üretim durdurma hatası:', error);
        showAlert('Üretim durdurulamadı', 'error');
    }
}

// Üretim düzenleme modalını aç
function editProduction() {
    if (!selectedProduction) {
        showAlert('Seçili üretim bulunamadı', 'error');
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
        showAlert('Seçili üretim bulunamadı', 'error');
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
        showAlert('Hedef miktar en az 1 olmalıdır', 'error');
        return;
    }
    
    if (formData.quantity < 0) {
        showAlert('Üretilen miktar negatif olamaz', 'error');
        return;
    }
    
    if (formData.quantity > formData.target_quantity) {
        showAlert('Üretilen miktar hedef miktardan fazla olamaz', 'error');
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
            showAlert('Üretim başarıyla güncellendi', 'success');
            
            // Düzenleme modalını kapat
            bootstrap.Modal.getInstance(document.getElementById('editProductionModal')).hide();
            
            // Aktif üretimleri yenile
            await loadActiveProductions();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Üretim güncellenemedi', 'error');
        }
    } catch (error) {
        console.error('Üretim güncelleme hatası:', error);
        showAlert('Üretim güncellenemedi', 'error');
    }
}

// Üretimi iptal et
async function cancelProduction() {
    if (!selectedProduction) {
        showAlert('Seçili üretim bulunamadı', 'error');
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
            showAlert('Üretim başarıyla iptal edildi', 'success');
            
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
            showAlert(error.error || 'Üretim iptal edilemedi', 'error');
        }
    } catch (error) {
        console.error('Üretim iptal etme hatası:', error);
        showAlert('Üretim iptal edilemedi', 'error');
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
    nihaiUrunler.forEach(nihai => {
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
        showAlert('Lütfen geçerli bir ürün ve miktar seçin', 'warning');
        return;
    }
    
    // Stok kontrolü yap
    const stockCheck = checkYarimamulStock(productId, quantity);
    if (!stockCheck.sufficient) {
        showAlert(`Stok yetersiz! Eksik malzemeler:\n${stockCheck.missingItems.join('\n')}`, 'error');
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
        
        showAlert('Yarı mamul üretimi başlatıldı!', 'success');
        
        // Simüle edilmiş üretim süreci (gerçek uygulamada backend'de olacak)
        setTimeout(() => {
            completeProduction(production);
        }, 5000);
        
    } catch (error) {
        console.error('Yarı mamul üretim hatası:', error);
        showAlert('Üretim başlatılırken hata oluştu', 'error');
    }
}

// Nihai ürün üretim işlemi
async function handleNihaiProduction(event) {
    event.preventDefault();
    
    const productId = parseInt(document.getElementById('nihai-product').value);
    const quantity = parseFloat(document.getElementById('nihai-quantity').value);
    
    if (!productId || quantity <= 0) {
        showAlert('Lütfen geçerli bir ürün ve miktar seçin', 'warning');
        return;
    }
    
    // Stok kontrolü yap
    const stockCheck = checkNihaiStock(productId, quantity);
    if (!stockCheck.sufficient) {
        showAlert(`Stok yetersiz! Eksik malzemeler:\n${stockCheck.missingItems.join('\n')}`, 'error');
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
        
        showAlert('Nihai ürün üretimi başlatıldı!', 'success');
        
        // Simüle edilmiş üretim süreci (gerçek uygulamada backend'de olacak)
        setTimeout(() => {
            completeProduction(production);
        }, 8000);
        
    } catch (error) {
        console.error('Nihai ürün üretim hatası:', error);
        showAlert('Üretim başlatılırken hata oluştu', 'error');
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
    
    showAlert('Üretim tamamlandı!', 'success');
}

// Bu fonksiyon silindi - yukarıda daha iyi versiyonu var

// Üretim kartı oluştur
function createProductionCard(production) {
    const card = document.createElement('div');
    card.className = 'card mb-3';
    
    const product = production.type === 'yarimamul' 
        ? yarimamuller.find(y => y.id === production.productId)
        : nihaiUrunler.find(n => n.id === production.productId);
    
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

// Üretim geçmişini göster
function displayProductionHistory() {
    const container = document.getElementById('production-history-container');
    if (!container) {
        console.error('Production history container bulunamadı');
        return;
    }
    container.innerHTML = '';
    
    if (productionHistory.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-history fa-2x mb-2"></i><br>
                    Henüz üretim geçmişi bulunmuyor
                </td>
            </tr>
        `;
        updateProductionStatistics();
        return;
    }
    
    productionHistory.forEach((production, index) => {
        const product = production.type === 'yarimamul' 
            ? yarimamuller.find(y => y.id === production.productId)
            : nihaiUrunler.find(n => n.id === production.productId);
        
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
                <span class="badge bg-${production.status === 'completed' ? 'success' : 'warning'}">
                    ${production.status === 'completed' ? 'Tamamlandı' : 'Devam Ediyor'}
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
                    <button class="btn btn-outline-info btn-sm" onclick="viewProductionDetails(${index})" title="Detayları Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${production.scannedBarcodes && production.scannedBarcodes.length > 0 ? 
                        `<button class="btn btn-outline-success btn-sm" onclick="viewBarcodeHistory(${index})" title="Barkod Geçmişi">
                            <i class="fas fa-barcode"></i>
                        </button>` : ''
                    }
                </div>
            </td>
        `;
        container.appendChild(row);
    });
    
    // İstatistikleri güncelle
    updateProductionStatistics();
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
            : nihaiUrunler.find(n => n.id === production.productId);
        
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
    
    const totalCostElement = document.getElementById('total-cost');
    if (totalCostElement) {
        totalCostElement.textContent = `₺${totalCost.toFixed(2)}`;
    }
}

// Üretim detaylarını görüntüle
function viewProductionDetails(productionIndex) {
    const production = productionHistory[productionIndex];
    if (!production) {
        showAlert('Üretim bulunamadı', 'error');
        return;
    }
    
    const product = production.type === 'yarimamul' 
        ? yarimamuller.find(y => y.id === production.productId)
        : nihaiUrunler.find(n => n.id === production.productId);
    
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
                        <span class="badge bg-${production.status === 'completed' ? 'success' : 'warning'}">
                            ${production.status === 'completed' ? 'Tamamlandı' : 'Devam Ediyor'}
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
        showAlert('Barkod geçmişi bulunamadı', 'warning');
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
    loadActiveProductions();
    showAlert('Aktif üretimler yenilendi', 'success');
}

// Üretim geçmişini yenile
function refreshProductionHistory() {
    loadProductionHistory();
    showAlert('Üretim geçmişi yenilendi', 'success');
}

// Üretim geçmişini temizle
function clearProductionHistory() {
    if (confirm('Üretim geçmişini temizlemek istediğinizden emin misiniz?')) {
        productionHistory = [];
        displayProductionHistory();
        showAlert('Üretim geçmişi temizlendi', 'success');
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
            : nihaiUrunler.find(n => n.id === production.productId);
        
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
            : nihaiUrunler.find(n => n.id === production.productId);
        
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
                <span class="badge bg-${production.status === 'completed' ? 'success' : 'warning'}">
                    ${production.status === 'completed' ? 'Tamamlandı' : 'Devam Ediyor'}
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
        nihaiUrunler.forEach(nihai => {
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

// Üretimi başlat
function startProduction() {
    const productId = parseInt(document.getElementById('production-product').value);
    const quantity = parseInt(document.getElementById('production-quantity').value);
    
    if (!productId || !quantity) {
        showAlert('Lütfen ürün ve miktar seçin', 'warning');
        return;
    }
    
    // Ürün bilgilerini al
    let product;
    if (currentProductionType === 'yarimamul') {
        product = yarimamuller.find(y => y.id === productId);
    } else {
        product = nihaiUrunler.find(n => n.id === productId);
    }
    
    if (!product) {
        showAlert('Ürün bulunamadı', 'error');
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

// Barkod okutma
function scanBarcode() {
    const barcodeInput = document.getElementById('barcode-input');
    const barcode = barcodeInput.value.trim();
    
    if (!barcode) {
        showBarcodeResult('Lütfen barkod girin', 'warning');
        return;
    }
    
    // Aynı barkodun tekrar okutulmasını engelle (1 saniye içinde)
    const now = Date.now();
    const lastScan = window.lastBarcodeScan || 0;
    const lastBarcode = window.lastScannedBarcode || '';
    
    if (barcode === lastBarcode && (now - lastScan) < 1000) {
        showBarcodeResult('⚠️ Aynı barkod tekrar okutuldu, işlem yapılmadı', 'warning');
        barcodeInput.value = '';
        barcodeInput.focus();
        return;
    }
    
    // Barkod doğrulama
    const isValid = validateBarcode(barcode);
    
    if (isValid) {
        // Başarılı okutma
        productionStats.produced++;
        productionStats.success++;
        productionStats.target = Math.max(0, productionStats.target - 1);
        
        scannedBarcodes.push({
            barcode: barcode,
            timestamp: new Date().toISOString(),
            success: true
        });
        
        showBarcodeResult(`✅ Başarılı! Üretilen: ${productionStats.success}`, 'success');
        updateProductionStats();
        
        // Tamamlama butonunu kontrol et
        if (productionStats.target === 0) {
            document.getElementById('complete-production-btn').disabled = false;
            showBarcodeResult('🎉 Tüm ürünler üretildi! Üretimi tamamlayabilirsiniz.', 'success');
        }
        
        // Başarılı okutma sonrası input'u hemen temizle
        barcodeInput.value = '';
        barcodeInput.focus();
        
    } else {
        // Hatalı barkod
        productionStats.error++;
        
        scannedBarcodes.push({
            barcode: barcode,
            timestamp: new Date().toISOString(),
            success: false
        });
        
        showBarcodeResult(`❌ Hatalı barkod! Beklenen: ${currentProduction.product.barkod || 'Barkod tanımlanmamış'}`, 'danger');
        updateProductionStats();
        
        // Hatalı barkod sonrası input'u temizle
        barcodeInput.value = '';
        barcodeInput.focus();
    }
    
    // Son okutulan barkodu göster
    document.getElementById('last-scanned').innerHTML = `
        <strong>${barcode}</strong><br>
        <small class="text-muted">${new Date().toLocaleTimeString('tr-TR')}</small>
    `;
    
    // Son okutma bilgilerini kaydet
    window.lastBarcodeScan = now;
    window.lastScannedBarcode = barcode;
}

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
        showAlert('Aktif üretim bulunamadı', 'error');
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
        showAlert(`Üretim tamamlandı! ${productionStats.success} adet ${currentProduction.product.ad} üretildi.`, 'success');
        
        // Verileri sıfırla
        currentProduction = null;
        currentProductionType = null;
        scannedBarcodes = [];
        productionStats = { target: 0, produced: 0, success: 0, error: 0 };
        
    } catch (error) {
        console.error('Üretim tamamlama hatası:', error);
        showAlert('Üretim tamamlanırken hata oluştu', 'error');
    }
}

// Alert göster
function showAlert(message, type) {
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
        
        showAlert(summaryText, 'info');
        return summary;
    } catch (error) {
        console.error('Üretim özeti alınamadı:', error);
        showAlert('Üretim özeti alınamadı: ' + error.message, 'error');
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
        
        showAlert(reportText, 'info');
        return report;
    } catch (error) {
        console.error('Verimlilik raporu alınamadı:', error);
        showAlert('Verimlilik raporu alınamadı: ' + error.message, 'error');
        return null;
    }
}

// ========================================
// ÜRETİM AŞAMALARI YÖNETİMİ - FAZ 1
// ========================================

// Aşama şablonlarını yükle
async function loadStageTemplates() {
    try {
        const response = await fetch('/api/production-stages/templates');
        if (!response.ok) throw new Error('Aşama şablonları yüklenemedi');
        
        const templates = await response.json();
        displayStageTemplates(templates);
        return templates;
    } catch (error) {
        console.error('Stage templates load error:', error);
        showAlert('Aşama şablonları yüklenemedi: ' + error.message, 'error');
        return [];
    }
}

// Aşama şablonlarını göster
function displayStageTemplates(templates) {
    const container = document.getElementById('stage-templates-container');
    if (!container) return;
    
    if (templates.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-templates fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Aşama şablonu bulunmuyor</h5>
                <p class="text-muted">Yeni aşama şablonu eklemek için "Yeni Şablon" butonunu kullanın.</p>
            </div>
        `;
        return;
    }
    
    // Ürün tipine göre grupla
    const groupedTemplates = templates.reduce((acc, template) => {
        if (!acc[template.product_type]) {
            acc[template.product_type] = [];
        }
        acc[template.product_type].push(template);
        return acc;
    }, {});
    
    let html = '';
    Object.keys(groupedTemplates).forEach(productType => {
        const typeTemplates = groupedTemplates[productType];
        const typeName = {
            'hammadde': 'Hammadde',
            'yarimamul': 'Yarı Mamul',
            'nihai': 'Nihai Ürün'
        }[productType] || productType;
        
        html += `
            <div class="mb-4">
                <h6 class="text-primary mb-3">
                    <i class="fas fa-cube me-2"></i>${typeName} Aşamaları
                </h6>
                <div class="row">
        `;
        
        typeTemplates.forEach(template => {
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="stage-template-card">
                        <div class="stage-template-header">
                            <h6 class="stage-template-title">${template.stage_name}</h6>
                            <span class="stage-template-type">${typeName}</span>
                        </div>
                        <div class="stage-template-details">
                            <div class="stage-template-detail">
                                <i class="fas fa-sort-numeric-up"></i>
                                Sıra: ${template.stage_order}
                            </div>
                            <div class="stage-template-detail">
                                <i class="fas fa-clock"></i>
                                Süre: ${template.estimated_duration || 'Belirtilmemiş'} dk
                            </div>
                            <div class="stage-template-detail">
                                <i class="fas fa-users"></i>
                                Yetenekler: ${template.required_skills.join(', ') || 'Yok'}
                            </div>
                            <div class="stage-template-detail">
                                <i class="fas fa-check-circle"></i>
                                Kalite: ${template.quality_check_required ? 'Gerekli' : 'Gerekli Değil'}
                            </div>
                            <div class="stage-template-detail">
                                <i class="fas fa-exclamation-triangle"></i>
                                Zorunlu: ${template.is_mandatory ? 'Evet' : 'Hayır'}
                            </div>
                        </div>
                        <div class="stage-template-actions">
                            <button class="btn btn-outline-primary btn-sm" onclick="editStageTemplate(${template.id})">
                                <i class="fas fa-edit me-1"></i>Düzenle
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteStageTemplate(${template.id})">
                                <i class="fas fa-trash me-1"></i>Sil
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
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
        showAlert('Aşama şablonu başarıyla eklendi!', 'success');
        
        // Modal'ı kapat ve formu temizle
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStageTemplateModal'));
        modal.hide();
        form.reset();
        
        // Şablonları yenile
        await loadStageTemplates();
        
        return newTemplate;
    } catch (error) {
        console.error('Add stage template error:', error);
        showAlert('Aşama şablonu eklenemedi: ' + error.message, 'error');
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
        showAlert('Üretim aşamaları yüklenemedi: ' + error.message, 'error');
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
            'pending': 'Bekliyor',
            'active': 'Aktif',
            'completed': 'Tamamlandı',
            'skipped': 'Atlandı'
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
        
        showAlert('Aşama başarıyla başlatıldı!', 'success');
        await loadProductionStages(currentProductionId);
    } catch (error) {
        console.error('Start stage error:', error);
        showAlert('Aşama başlatılamadı: ' + error.message, 'error');
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
        
        showAlert('Aşama başarıyla tamamlandı!', 'success');
        await loadProductionStages(currentProductionId);
    } catch (error) {
        console.error('Complete stage error:', error);
        showAlert('Aşama tamamlanamadı: ' + error.message, 'error');
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
document.addEventListener('DOMContentLoaded', function() {
    const stagesTab = document.getElementById('production-stages-tab');
    if (stagesTab) {
        stagesTab.addEventListener('shown.bs.tab', function() {
            loadStageTemplates();
        });
    }
    
    const qualityTab = document.getElementById('quality-control-tab');
    if (qualityTab) {
        qualityTab.addEventListener('shown.bs.tab', function() {
            loadQualityCheckpoints();
            loadQualityStandards();
            loadQualityStatistics();
        });
    }
});

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
            showAlert('Üretim planları yüklenemedi: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Üretim planları fetch error:', error);
        showAlert('Üretim planları yüklenirken hata oluştu', 'error');
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
                            <span class="badge bg-secondary">${plan.total_orders} Sipariş</span>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewPlanDetails(${plan.id})">
                                <i class="fas fa-eye"></i>
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
        const response = await fetch('/api/resources');
        const data = await response.json();
        
        if (response.ok) {
            resources = data;
            displayResources(resources);
        } else {
            console.error('Kaynaklar yüklenemedi:', data.error);
            showAlert('Kaynaklar yüklenemedi: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Kaynaklar fetch error:', error);
        showAlert('Kaynaklar yüklenirken hata oluştu', 'error');
    }
}

// Kaynakları görüntüleme
function displayResources(resources) {
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
    
    // Kaynakları türlerine göre grupla
    const groupedResources = resources.reduce((acc, resource) => {
        if (!acc[resource.resource_type]) {
            acc[resource.resource_type] = [];
        }
        acc[resource.resource_type].push(resource);
        return acc;
    }, {});
    
    container.innerHTML = Object.entries(groupedResources).map(([type, typeResources]) => `
        <div class="mb-4">
            <h6 class="text-capitalize mb-3">
                <i class="fas fa-${getResourceIcon(type)} me-2"></i>
                ${getResourceTypeText(type)} (${typeResources.length})
            </h6>
            <div class="row">
                ${typeResources.map(resource => `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100">
                            <div class="card-body">
                                <h6 class="card-title">${resource.resource_name}</h6>
                                <p class="card-text">
                                    <small class="text-muted">${resource.resource_code}</small><br>
                                    <strong>Kapasite:</strong> ${resource.capacity}<br>
                                    <strong>Kullanım:</strong> ${resource.current_usage}/${resource.capacity}<br>
                                    <strong>Maliyet:</strong> ₺${resource.cost_per_hour}/saat
                                </p>
                                <div class="progress mb-2" style="height: 6px;">
                                    <div class="progress-bar" style="width: ${(resource.current_usage / resource.capacity) * 100}%"></div>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span class="badge bg-${resource.is_active ? 'success' : 'secondary'}">
                                        ${resource.is_active ? 'Aktif' : 'Pasif'}
                                    </span>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editResource(${resource.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deleteResource(${resource.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Siparişleri yükleme
async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        if (response.ok) {
            orders = data;
            displayOrders(orders);
        } else {
            console.error('Siparişler yüklenemedi:', data.error);
            showAlert('Siparişler yüklenemedi: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Siparişler fetch error:', error);
        showAlert('Siparişler yüklenirken hata oluştu', 'error');
    }
}

// Siparişleri görüntüleme
function displayOrders(orders) {
    const container = document.getElementById('orders-container');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Henüz sipariş bulunmuyor</h5>
                <p class="text-muted">Yeni sipariş eklemek için "Yeni Sipariş" butonuna tıklayın.</p>
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
                        <th>Tutar</th>
                        <th>Teslim Tarihi</th>
                        <th>Öncelik</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td><strong>${order.order_number}</strong></td>
                            <td>${order.customer_name}</td>
                            <td>${order.product_name}</td>
                            <td>${order.quantity}</td>
                            <td>₺${order.total_amount?.toLocaleString('tr-TR') || '0'}</td>
                            <td>${new Date(order.delivery_date).toLocaleDateString('tr-TR')}</td>
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
                                    <button class="btn btn-outline-primary" onclick="viewOrder(${order.id})">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-outline-warning" onclick="editOrder(${order.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="deleteOrder(${order.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
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
    document.getElementById('total-value').textContent = `₺${(stats.total_value || 0).toLocaleString('tr-TR')}`;
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

function getStatusText(status) {
    const texts = {
        'draft': 'Taslak',
        'active': 'Aktif',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal',
        'pending': 'Beklemede',
        'confirmed': 'Onaylandı',
        'in_production': 'Üretimde',
        'shipped': 'Sevk Edildi'
    };
    return texts[status] || status;
}

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
    showAlert('Aşama şablonu düzenleme özelliği yakında eklenecek', 'info');
}

// Aşama şablonu silme
async function deleteStageTemplate(templateId) {
    if (!confirm('Bu aşama şablonunu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/production-stages/templates/${templateId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Aşama şablonu başarıyla silindi', 'success');
            loadStageTemplates();
        } else {
            const error = await response.json();
            showAlert('Aşama şablonu silinemedi: ' + error.message, 'error');
        }
    } catch (error) {
        console.error('Delete stage template error:', error);
        showAlert('Aşama şablonu silinemedi: ' + error.message, 'error');
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
    showAlert('Yeni plan ekleme modalı yakında eklenecek', 'info');
}

function showSchedulingModal() {
    showAlert('Zamanlama modalı yakında eklenecek', 'info');
}

function viewPlanDetails(planId) {
    showAlert('Plan detayları yakında eklenecek', 'info');
}

function editPlan(planId) {
    showAlert('Plan düzenleme yakında eklenecek', 'info');
}

function deletePlan(planId) {
    if (confirm('Bu planı silmek istediğinizden emin misiniz?')) {
        showAlert('Plan silme işlemi yakında eklenecek', 'info');
    }
}

function editResource(resourceId) {
    showAlert('Kaynak düzenleme yakında eklenecek', 'info');
}

function deleteResource(resourceId) {
    if (confirm('Bu kaynağı silmek istediğinizden emin misiniz?')) {
        showAlert('Kaynak silme işlemi yakında eklenecek', 'info');
    }
}

function viewOrder(orderId) {
    showAlert('Sipariş detayları yakında eklenecek', 'info');
}

function editOrder(orderId) {
    showAlert('Sipariş düzenleme yakında eklenecek', 'info');
}

function deleteOrder(orderId) {
    if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
        showAlert('Sipariş silme işlemi yakında eklenecek', 'info');
    }
}

// KALİTE KONTROL SİSTEMİ - FAZ 2
// ========================================

// Kalite kontrol noktalarını yükle
async function loadQualityCheckpoints() {
    try {
        const response = await fetch('/api/quality/checkpoints');
        if (!response.ok) throw new Error('Kalite kontrol noktaları yüklenemedi');
        
        const checkpoints = await response.json();
        displayQualityCheckpoints(checkpoints);
        return checkpoints;
    } catch (error) {
        console.error('Quality checkpoints load error:', error);
        showAlert('Kalite kontrol noktaları yüklenemedi: ' + error.message, 'error');
        return [];
    }
}

// Kalite kontrol noktalarını göster
function displayQualityCheckpoints(checkpoints) {
    const container = document.getElementById('quality-checkpoints-container');
    if (!container) return;
    
    if (checkpoints.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-list-check fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Kalite kontrol noktası bulunmuyor</h5>
                <p class="text-muted">Yeni kontrol noktası eklemek için "Yeni Kontrol Noktası" butonunu kullanın.</p>
            </div>
        `;
        return;
    }
    
    // Ürün tipine göre grupla
    const groupedCheckpoints = checkpoints.reduce((acc, checkpoint) => {
        if (!acc[checkpoint.product_type]) {
            acc[checkpoint.product_type] = [];
        }
        acc[checkpoint.product_type].push(checkpoint);
        return acc;
    }, {});
    
    let html = '';
    Object.keys(groupedCheckpoints).forEach(productType => {
        const typeCheckpoints = groupedCheckpoints[productType];
        const typeName = {
            'hammadde': 'Hammadde',
            'yarimamul': 'Yarı Mamul',
            'nihai': 'Nihai Ürün'
        }[productType] || productType;
        
        html += `
            <div class="mb-4">
                <h6 class="text-primary mb-3">
                    <i class="fas fa-cube me-2"></i>${typeName} Kontrol Noktaları
                </h6>
                <div class="row">
        `;
        
        typeCheckpoints.forEach(checkpoint => {
            const typeIcon = {
                'visual': 'fas fa-eye',
                'measurement': 'fas fa-ruler',
                'test': 'fas fa-flask',
                'inspection': 'fas fa-search'
            }[checkpoint.checkpoint_type] || 'fas fa-check-circle';
            
            const typeColor = {
                'visual': 'primary',
                'measurement': 'info',
                'test': 'success',
                'inspection': 'warning'
            }[checkpoint.checkpoint_type] || 'secondary';
            
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i class="${typeIcon} me-2 text-${typeColor}"></i>
                                ${checkpoint.name}
                            </h6>
                            <span class="badge bg-${typeColor}">${checkpoint.checkpoint_type}</span>
                        </div>
                        <div class="card-body">
                            <p class="card-text">${checkpoint.description || 'Açıklama yok'}</p>
                            <div class="row text-center">
                                <div class="col-6">
                                    <small class="text-muted">Sıklık</small>
                                    <div class="fw-bold">${checkpoint.frequency}</div>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted">Zorunlu</small>
                                    <div class="fw-bold">${checkpoint.is_mandatory ? 'Evet' : 'Hayır'}</div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="btn-group w-100" role="group">
                                <button class="btn btn-outline-primary btn-sm" onclick="performQualityCheck(${checkpoint.id})">
                                    <i class="fas fa-play me-1"></i>Kontrol Et
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="editQualityCheckpoint(${checkpoint.id})">
                                    <i class="fas fa-edit me-1"></i>Düzenle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Kalite standartlarını yükle
async function loadQualityStandards() {
    try {
        const response = await fetch('/api/quality/standards');
        if (!response.ok) throw new Error('Kalite standartları yüklenemedi');
        
        const standards = await response.json();
        displayQualityStandards(standards);
        return standards;
    } catch (error) {
        console.error('Quality standards load error:', error);
        showAlert('Kalite standartları yüklenemedi: ' + error.message, 'error');
        return [];
    }
}

// Kalite standartlarını göster
function displayQualityStandards(standards) {
    const container = document.getElementById('quality-standards-container');
    if (!container) return;
    
    if (standards.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-award fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Kalite standardı bulunmuyor</h5>
                <p class="text-muted">Henüz kalite standardı tanımlanmamış.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    standards.forEach(standard => {
        const typeIcon = {
            'internal': 'fas fa-building',
            'external': 'fas fa-globe',
            'iso': 'fas fa-certificate',
            'customer': 'fas fa-user-tie'
        }[standard.standard_type] || 'fas fa-award';
        
        const typeColor = {
            'internal': 'primary',
            'external': 'info',
            'iso': 'success',
            'customer': 'warning'
        }[standard.standard_type] || 'secondary';
        
        html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            <i class="${typeIcon} me-2 text-${typeColor}"></i>
                            ${standard.name}
                        </h6>
                        <span class="badge bg-${typeColor}">${standard.standard_type}</span>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${standard.description || 'Açıklama yok'}</p>
                        <div class="row text-center">
                            <div class="col-6">
                                <small class="text-muted">Ürün Tipi</small>
                                <div class="fw-bold">${standard.product_type}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Durum</small>
                                <div class="fw-bold">
                                    <span class="badge bg-${standard.is_active ? 'success' : 'secondary'}">
                                        ${standard.is_active ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = `<div class="row">${html}</div>`;
}

// Kalite istatistiklerini yükle
async function loadQualityStatistics() {
    try {
        const response = await fetch('/api/quality/statistics');
        if (!response.ok) throw new Error('Kalite istatistikleri yüklenemedi');
        
        const stats = await response.json();
        updateQualityStatistics(stats);
        return stats;
    } catch (error) {
        console.error('Quality statistics load error:', error);
        showAlert('Kalite istatistikleri yüklenemedi: ' + error.message, 'error');
    }
}

// Kalite istatistiklerini güncelle
function updateQualityStatistics(stats) {
    document.getElementById('quality-pass-rate').textContent = stats.pass_rate + '%';
    document.getElementById('quality-fail-rate').textContent = stats.fail_rate + '%';
    document.getElementById('quality-warning-rate').textContent = 
        stats.total_checks > 0 ? ((stats.warning_checks / stats.total_checks * 100).toFixed(1) + '%') : '0%';
    document.getElementById('quality-score').textContent = stats.quality_score;
}

// Yeni kontrol noktası modal'ını göster
function showAddCheckpointModal() {
    const modal = new bootstrap.Modal(document.getElementById('addCheckpointModal'));
    modal.show();
}

// Kalite kontrol noktası ekle
async function addQualityCheckpoint() {
    try {
        const checkpointData = {
            name: document.getElementById('checkpoint-name').value,
            description: document.getElementById('checkpoint-description').value,
            product_type: document.getElementById('checkpoint-product-type').value,
            checkpoint_type: document.getElementById('checkpoint-type').value,
            frequency: document.getElementById('checkpoint-frequency').value,
            is_mandatory: document.getElementById('checkpoint-mandatory').checked
        };
        
        const response = await fetch('/api/quality/checkpoints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkpointData)
        });
        
        if (!response.ok) throw new Error('Kalite kontrol noktası eklenemedi');
        
        const newCheckpoint = await response.json();
        showAlert('Kalite kontrol noktası başarıyla eklendi!', 'success');
        
        // Modal'ı kapat ve formu temizle
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCheckpointModal'));
        modal.hide();
        document.getElementById('addCheckpointForm').reset();
        
        // Kontrol noktalarını yenile
        await loadQualityCheckpoints();
        
        return newCheckpoint;
    } catch (error) {
        console.error('Add quality checkpoint error:', error);
        showAlert('Kalite kontrol noktası eklenemedi: ' + error.message, 'error');
    }
}

// Kalite kontrolü gerçekleştir
function performQualityCheck(checkpointId) {
    // Bu fonksiyon daha sonra implement edilecek
    showAlert('Kalite kontrolü özelliği yakında eklenecek!', 'info');
}

// Kalite raporlarını göster
function showQualityReports() {
    // Bu fonksiyon daha sonra implement edilecek
    showAlert('Kalite raporları özelliği yakında eklenecek!', 'info');
}
