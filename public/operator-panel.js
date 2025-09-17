// Operatör Paneli JavaScript - Real-time Database Integration
let currentOperator = null;
let currentStage = null;
let stageTimer = null;
let stageStartTime = null;

// Real-time client integration
let realtimeClient = null;
let productionStates = new Map(); // orderId-productCode -> production state

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Operatör Paneli yüklendi');
    
    // Real-time client'ı başlat
    initializeRealtimeClient();
    
    loadOperators();
    
    // Operatör giriş durumunu kontrol et
    await checkOperatorLoginStatus();
});

// Operatör giriş durumunu kontrol et
async function checkOperatorLoginStatus() {
    try {
        console.log('🔍 Operatör durumu kontrol ediliyor...');
        
        // Veritabanından aktif operatörleri kontrol et
        const response = await fetch('/api/operators');
        console.log('📡 Operatörler API yanıtı:', response.status);
        
        if (response.ok) {
            const operators = await response.json();
            console.log('👥 Operatörler yüklendi:', operators.length, 'operatör');
            
            // Eğer operatörler varsa, varsayılan operatörü seç
            if (operators && operators.length > 0) {
                const defaultOperator = operators[0]; // İlk operatörü varsayılan olarak seç
                console.log('✅ Varsayılan operatör seçildi:', defaultOperator.name);
                
                // Operatör bilgilerini oluştur
                currentOperator = {
                    operator_id: `OP-${defaultOperator.name.replace(/\s+/g, '-').toLowerCase()}`,
                    name: defaultOperator.name,
                    department: defaultOperator.department || 'Üretim',
                    skill_level: defaultOperator.skill_level || 'Uzman'
                };
                
                // Real-time client'a operatörü kaydet
                if (realtimeClient) {
                    realtimeClient.register(currentOperator.operator_id, currentOperator.name);
                    console.log('🔌 Real-time client\'a operatör kaydedildi');
                }
                
                // Operatör durumunu güncelle
                document.getElementById('current-operator-name').textContent = `${currentOperator.name} (${currentOperator.department})`;
                
                // Operatör panelini göster
                document.getElementById('operatorPanel').style.display = 'block';
                
                // Ürün detayları bölümünü göster
                document.getElementById('product-details-section').style.display = 'block';
                
                // Verileri yükle
                console.log('📦 Veriler yükleniyor...');
                await loadProductionStates();
                await loadAssignedJobs();
                loadActiveProductions();
                loadProductDetails();
                
                console.log('🔄 Otomatik operatör girişi yapıldı:', currentOperator.name);
                return;
            } else {
                console.log('⚠️ Operatör bulunamadı');
            }
        } else {
            console.error('❌ Operatörler API hatası:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Operatör durumu kontrol edilemedi:', error);
    }
    
    // Eğer operatör bulunamazsa giriş modalını göster
    console.log('🔐 Operatör giriş modalı gösteriliyor');
    setTimeout(() => {
        showOperatorLogin();
    }, 100);
}

// Real-time client'ı başlat
function initializeRealtimeClient() {
    if (window.realtimeClient) {
        realtimeClient = window.realtimeClient;
        
        // Event listener'ları ekle
        realtimeClient.on('productionUpdated', handleProductionUpdate);
        realtimeClient.on('currentProductions', handleCurrentProductions);
        realtimeClient.on('notification', handleNotification);
        realtimeClient.on('connected', () => {
            console.log('✅ Real-time bağlantısı kuruldu');
        });
        realtimeClient.on('disconnected', () => {
            console.log('❌ Real-time bağlantısı kesildi');
        });
        
        console.log('✅ Real-time client initialized');
    } else {
        console.warn('⚠️ Real-time client bulunamadı');
    }
}

// Operatör listesini yükle
async function loadOperators() {
    try {
        const response = await fetch('/api/operators');
        if (!response.ok) throw new Error('Operatör listesi yüklenemedi');
        const operators = await response.json();
        
        const operatorSelect = document.getElementById('operatorSelect');
        operatorSelect.innerHTML = '<option value="">Operatör seçiniz...</option>';
        
        operators.forEach(operator => {
            const option = document.createElement('option');
            // API'den gelen veri obje formatında
            option.value = operator.name || operator;
            option.textContent = operator.name || operator;
            // Operatör detaylarını tooltip olarak ekle
            if (operator.skill_level || operator.department) {
                option.title = `${operator.department || 'Üretim'} - ${operator.skill_level || 'Uzman'}`;
            }
            operatorSelect.appendChild(option);
        });
        
        console.log('Operatörler yüklendi:', operators.length);
    } catch (error) {
        console.error('Operatör yükleme hatası:', error);
        showAlert('Operatör listesi yüklenemedi: ' + error.message, 'error');
    }
}

// Operatör girişi
async function loginOperator() {
    const operatorName = document.getElementById('operatorSelect').value;
    const password = document.getElementById('operatorPassword').value;
    
    if (!operatorName) {
        showAlert('Lütfen operatör seçiniz', 'warning');
        return;
    }
    
    // Operatör bilgilerini API'den al
    const selectedOption = document.getElementById('operatorSelect').selectedOptions[0];
    const operatorInfo = {
        operator_id: `OP-${operatorName.replace(/\s+/g, '-').toLowerCase()}`, // Operatör adına göre sabit ID
        name: operatorName,
        department: selectedOption.title ? selectedOption.title.split(' - ')[0] : 'Üretim',
        skill_level: selectedOption.title ? selectedOption.title.split(' - ')[1] : 'Uzman',
        password: password
    };
    
    // Operatör bilgilerini kaydet
    currentOperator = operatorInfo;
    
    // Real-time client'a operatörü kaydet
    if (realtimeClient) {
        realtimeClient.register(operatorInfo.operator_id, operatorInfo.name);
    }
    
    // Operatör durumunu güncelle
    document.getElementById('current-operator-name').textContent = `${operatorName} (${operatorInfo.department})`;
    
    // Üretim durumlarını yükle
    await loadProductionStates();
    
    // Modal'ı kapat ve paneli göster
    const modal = bootstrap.Modal.getInstance(document.getElementById('operatorLoginModal'));
    modal.hide();
    
    document.getElementById('operatorPanel').style.display = 'block';
    
    // Planlanan işleri yükle
    await loadAssignedJobs();
    
    // Ürün detayları bölümünü göster
    document.getElementById('product-details-section').style.display = 'block';
    
    // Eğer aktif üretim varsa displayProductDetails içinde gösterilecek
    if (currentProduction && currentProduction.isActive && currentProduction.producedQuantity < currentProduction.targetQuantity) {
        console.log('🔄 Aktif üretim var, displayProductDetails içinde gösterilecek');
    }
    
    showAlert('Hoş geldiniz, ' + operatorName, 'success');
    console.log('Operatör girişi:', currentOperator);
}

// Operatör çıkışı
function logoutOperator() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        // Aktif aşamayı durdur
        if (stageTimer) {
            clearInterval(stageTimer);
            stageTimer = null;
        }
        
        // Durumları sıfırla
        currentOperator = null;
        currentProduction = null;
        currentStage = null;
        stageStartTime = null;
        
        // Operatör bilgileri temizlendi (üretim verileri veritabanında saklanıyor)
        
        // UI'yi sıfırla
        document.getElementById('operatorPanel').style.display = 'none';
        document.getElementById('stage-details-section').style.display = 'none';
        
        // Giriş modalını göster
        showOperatorLogin();
        
        showAlert('Başarıyla çıkış yapıldı', 'info');
        console.log('Operatör çıkışı yapıldı');
    }
}

// Operatör giriş modalını göster
function showOperatorLogin() {
    const modal = new bootstrap.Modal(document.getElementById('operatorLoginModal'));
    modal.show();
}

// Planlanan işleri yükle (operatöre atanmış üretimler)
async function loadAssignedJobs() {
    console.log('🚀 loadAssignedJobs fonksiyonu başlatıldı');
    try {
        console.log('🔍 Üretim planları yükleniyor...');
        
        // Önce production_plans'dan onaylanmış planları al
        const plansResponse = await fetch('/api/production-plans');
        if (!plansResponse.ok) throw new Error('Üretim planları yüklenemedi');
        const plans = await plansResponse.json();
        
        console.log('📋 Tüm planlar:', plans);
        console.log('📋 Plan sayısı:', plans.length);
        
        // Onaylanmış, aktif veya devam eden planları filtrele
        const approvedPlans = plans.filter(plan => 
            plan.status === 'approved' || 
            plan.status === 'active' || 
            plan.status === 'in_progress'
        );
        console.log('✅ Onaylanmış/aktif planlar:', approvedPlans);
        console.log('✅ Onaylanmış/aktif plan sayısı:', approvedPlans.length);
        
        // Her plan için sipariş detaylarını al
        const jobsWithDetails = [];
        for (const plan of approvedPlans) {
            try {
                console.log(`🔍 Plan ${plan.id} için sipariş ${plan.order_id} yükleniyor...`);
                const orderResponse = await fetch(`/api/orders/${plan.order_id}`);
                if (orderResponse.ok) {
                    const order = await orderResponse.json();
                    console.log(`📦 Sipariş ${plan.order_id} yüklendi:`, order);
                    
                    // Sipariş detaylarını parse et
                    let productDetails = [];
                    try {
                        productDetails = typeof order.product_details === 'string' 
                            ? JSON.parse(order.product_details) 
                            : order.product_details || [];
                    } catch (e) {
                        console.error('Error parsing product_details:', e);
                    }
                    
                    // Her ürün için iş oluştur
                    productDetails.forEach((product, index) => {
                        jobsWithDetails.push({
                            id: `${plan.id}-${index}`,
                            plan_id: plan.id,
                            order_id: plan.order_id,
                            product_name: product.product_name || 'Ürün',
                            product_code: product.product_code || 'N/A',
                            planned_quantity: product.quantity || 1,
                            status: 'planned',
                            assigned_operator: plan.assigned_operator || 'Sistem',
                            customer_name: order.customer_name || 'Bilinmiyor',
                            delivery_date: order.delivery_date || 'Belirtilmemiş',
                            created_at: plan.created_at
                        });
                    });
                }
            } catch (orderError) {
                console.error('Sipariş detayı yükleme hatası:', orderError);
            }
        }
        
        // Debug: Tüm işleri ve operatör bilgilerini logla
        console.log('🔍 Tüm işler:', jobsWithDetails);
        console.log('👤 Mevcut operatör:', currentOperator);
        console.log('👤 Operatör adı:', currentOperator?.name);
        
        // Sadece mevcut operatöre atanmış işleri filtrele
        const assignedJobs = jobsWithDetails.filter(job => {
            // Eğer operatör ataması yapılmamışsa, tüm işleri göster
            if (!job.assigned_operator) {
                console.log(`🔍 İş ${job.id}: Operatör ataması yok, gösteriliyor`);
                return true;
            }
            
            // Eğer operatör ataması yapılmışsa, sadece mevcut operatöre atanmış olanları göster
            const isAssigned = job.assigned_operator === currentOperator?.name;
            
            console.log(`🔍 İş ${job.id}: assigned_operator="${job.assigned_operator}", currentOperator="${currentOperator?.name}", eşleşiyor: ${isAssigned}`);
            return isAssigned;
        });
        
        console.log('✅ Filtrelenmiş işler:', assignedJobs);
        displayAssignedJobs(assignedJobs);
        console.log('Planlanan işler yüklendi:', assignedJobs.length);
    } catch (error) {
        console.error('Planlanan iş yükleme hatası:', error);
        showAlert('Planlanan işler yüklenemedi: ' + error.message, 'error');
    }
}

// Planlanan işleri göster
function displayAssignedJobs(jobs) {
    const container = document.getElementById('assigned-jobs-container');
    
    if (jobs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Planlanan İş Bulunamadı</h5>
                <p class="text-muted">Size atanmış üretim bulunmuyor.</p>
            </div>
        `;
        return;
    }
    
    // Ürünleri grupla (aynı sipariş ve plan ID'sine göre)
    const groupedJobs = {};
    jobs.forEach(job => {
        const key = `${job.order_id}-${job.plan_id}`;
        if (!groupedJobs[key]) {
            groupedJobs[key] = {
                order_id: job.order_id,
                plan_id: job.plan_id,
                customer_name: job.customer_name,
                delivery_date: job.delivery_date,
                status: job.status,
                products: []
            };
        }
        groupedJobs[key].products.push({
            product_name: job.product_name,
            product_code: job.product_code,
            planned_quantity: job.planned_quantity
        });
    });

    // Toplam miktarı hesapla
    const totalQuantity = jobs.reduce((sum, job) => sum + (job.planned_quantity || 0), 0);

    container.innerHTML = Object.values(groupedJobs).map(group => `
        <div class="card mb-3 operator-card">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h6 class="card-title mb-1">
                            <i class="fas fa-shopping-cart me-2"></i>Sipariş #${group.order_id} - ${group.customer_name}
                        </h6>
                        <p class="card-text text-muted mb-2">
                            <i class="fas fa-hashtag me-1"></i>
                            Plan ID: ${group.plan_id} | Toplam ${group.products.length} ürün
                        </p>
                        <div class="row">
                            <div class="col-md-6">
                                <small class="text-muted">
                                    <i class="fas fa-cubes me-1"></i>
                                    Toplam Miktar: ${totalQuantity} adet
                                </small>
                            </div>
                            <div class="col-md-6">
                                <small class="text-muted">
                                    <i class="fas fa-calendar me-1"></i>
                                    Teslim: ${group.delivery_date}
                                </small>
                            </div>
                        </div>
                        <div class="mt-2">
                            <span class="badge bg-${getStatusColor(group.status)} me-2">${getStatusText(group.status)}</span>
                            <span class="badge bg-info">${group.products.length} Ürün</span>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        ${getJobActionButtons(group)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// İş aksiyon butonlarını al
function getJobActionButtons(group) {
    switch (group.status) {
        case 'planned':
            return `
                <button class="btn btn-success btn-sm me-2" onclick="startProduction('${group.order_id}-${group.plan_id}')">
                    <i class="fas fa-play me-1"></i>Üretimi Başlat
                </button>
                <button class="btn btn-outline-info btn-sm" onclick="viewProductionDetails('${group.order_id}-${group.plan_id}')">
                    <i class="fas fa-eye me-1"></i>Detaylar
                </button>
            `;
        case 'active':
            return `
                <button class="btn btn-outline-warning btn-sm" onclick="pauseProduction('${group.order_id}-${group.plan_id}')">
                    <i class="fas fa-pause me-1"></i>Duraklat
                </button>
            `;
        case 'completed':
            return `
                <button class="btn btn-outline-success btn-sm" onclick="viewProductionReport('${group.order_id}-${group.plan_id}')">
                    <i class="fas fa-chart-bar me-1"></i>Rapor
                </button>
            `;
        default:
            return '';
    }
}

// Üretim başlat
function startProduction(jobId) {
    console.log('Üretim başlatılıyor:', jobId);
    
    // Job ID'den plan ID'sini çıkar (format: orderId-planId)
    const [orderId, planId] = jobId.split('-');
    
    // Plan bilgilerini modal'a yükle
    fetch(`/api/production-plans/${planId}`)
        .then(response => response.json())
        .then(plan => {
            // Sipariş detaylarını al
            return fetch(`/api/orders/${orderId}`)
                .then(response => response.json())
                .then(order => {
                    // Sipariş detaylarını parse et
                    let productDetails = [];
                    try {
                        productDetails = typeof order.product_details === 'string' 
                            ? JSON.parse(order.product_details) 
                            : order.product_details || [];
                    } catch (e) {
                        console.error('Error parsing product_details:', e);
                    }
                    
                    // Toplam miktarı hesapla
                    const totalQuantity = productDetails.reduce((sum, product) => sum + (product.quantity || 0), 0);
                    
                    document.getElementById('production-product-name').textContent = `${order.customer_name} - ${productDetails.length} Ürün`;
                    document.getElementById('production-quantity').textContent = `${totalQuantity} adet (${productDetails.length} ürün)`;
                    document.getElementById('production-plan-id').textContent = plan.id;
                    document.getElementById('production-id').textContent = jobId;
                    document.getElementById('production-assigned-operator').textContent = plan.assigned_operator || 'Atanmamış';
                    document.getElementById('production-status').textContent = getStatusText('planned');
                    
                    // Modal'ı göster
                    const modal = new bootstrap.Modal(document.getElementById('startProductionModal'));
                    modal.show();
                    
                    // Job ID'yi sakla
                    document.getElementById('startProductionModal').dataset.jobId = jobId;
                });
        })
        .catch(error => {
            console.error('Üretim bilgisi yükleme hatası:', error);
            showAlert('Üretim bilgisi yüklenemedi: ' + error.message, 'error');
        });
}

// Üretim başlatmayı onayla
async function confirmStartProduction() {
    const jobId = document.getElementById('startProductionModal').dataset.jobId;
    const notes = document.getElementById('production-notes').value;
    
    try {
        // Job ID'den plan ID'sini çıkar (format: orderId-planId)
        const [orderId, planId] = jobId.split('-');
        
        // Planı güncelle - operatör ataması yap
        const response = await fetch(`/api/production-plans/${planId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                assigned_operator: currentOperator.name,
                status: 'in_progress',
                notes: notes
            })
        });
        
        if (!response.ok) throw new Error('Üretim başlatılamadı');
        
        const updatedPlan = await response.json();
        console.log('Üretim başlatıldı:', updatedPlan);
        
        // Sipariş durumunu da güncelle
        try {
            const orderResponse = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'in_production'
                })
            });
            
            if (orderResponse.ok) {
                console.log('Sipariş durumu güncellendi: in_production');
            } else {
                console.error('Sipariş durumu güncellenemedi');
            }
        } catch (orderError) {
            console.error('Sipariş durumu güncelleme hatası:', orderError);
        }
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('startProductionModal'));
        modal.hide();
        
        // İşleri yenile
        await loadAssignedJobs();
        
        // Ürün detaylarını yenile
        await loadProductDetails();
        
        showAlert('Üretim başarıyla başlatıldı! İlk aşama otomatik olarak başlayacak.', 'success');
        
    } catch (error) {
        console.error('Üretim başlatma hatası:', error);
        showAlert('Üretim başlatılamadı: ' + error.message, 'error');
    }
}

// Üretim detaylarını görüntüle
function viewProductionDetails(productionId) {
    console.log('Üretim detayları görüntüleniyor:', productionId);
    showAlert('Detay görüntüleme özelliği yakında eklenecek', 'info');
}

// Üretim ilerlemesini görüntüle
function viewProductionProgress(productionId) {
    console.log('Üretim ilerlemesi görüntüleniyor:', productionId);
    loadProductionStages(productionId);
}

// Üretimi duraklat
function pauseProduction(productionId) {
    console.log('Üretim duraklatılıyor:', productionId);
    showAlert('Duraklatma özelliği yakında eklenecek', 'info');
}

// Üretim raporunu görüntüle
function viewProductionReport(productionId) {
    console.log('Üretim raporu görüntüleniyor:', productionId);
    showAlert('Rapor görüntüleme özelliği yakında eklenecek', 'info');
}

// Aktif üretimleri yükle
async function loadActiveProductions() {
    try {
        const response = await fetch('/api/active-productions');
        if (!response.ok) throw new Error('Aktif üretimler yüklenemedi');
        const productions = await response.json();
        
        displayActiveProductions(productions);
        console.log('Aktif üretimler yüklendi:', productions.length);
    } catch (error) {
        console.error('Aktif üretim yükleme hatası:', error);
        showAlert('Aktif üretimler yüklenemedi: ' + error.message, 'error');
    }
}

// Aktif üretimleri göster
function displayActiveProductions(productions) {
    const container = document.getElementById('active-productions-container');
    
    if (productions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Aktif Üretim Bulunamadı</h5>
                <p class="text-muted">Şu anda devam eden üretim bulunmuyor.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = productions.map(production => `
        <div class="card mb-3 operator-card" onclick="selectProduction(${production.id})">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h6 class="card-title mb-1">${production.product_name}</h6>
                        <p class="card-text text-muted mb-2">
                            <i class="fas fa-calendar me-1"></i>
                            Plan ID: ${production.plan_id}
                        </p>
                        <div class="d-flex align-items-center">
                            <span class="badge bg-${getStatusColor(production.status)} me-2">${getStatusText(production.status)}</span>
                            <small class="text-muted">
                                <i class="fas fa-user me-1"></i>
                                ${production.assigned_operator || 'Atanmamış'}
                            </small>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <!-- Aşamaları Gör butonu kaldırıldı -->
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Üretim seç
function selectProduction(productionId) {
    console.log('Üretim seçildi:', productionId);
    loadProductionStages(productionId);
}

// Üretim aşamalarını yükle
async function loadProductionStages(productionId) {
    try {
        const response = await fetch(`/api/production-stages?production_id=${productionId}`);
        if (!response.ok) throw new Error('Aşamalar yüklenemedi');
        const stages = await response.json();
        
        currentProduction = productionId;
        displayProductionStages(stages);
        document.getElementById('stage-details-section').style.display = 'block';
        
        console.log('Üretim aşamaları yüklendi:', stages.length);
    } catch (error) {
        console.error('Aşama yükleme hatası:', error);
        showAlert('Aşamalar yüklenemedi: ' + error.message, 'error');
    }
}

// Üretim aşamalarını göster
function displayProductionStages(stages) {
    const container = document.getElementById('stage-details-container');
    
    // Aşamaları sırala
    const sortedStages = stages.sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0));
    
    // İlerleme hesapla
    const totalStages = sortedStages.length;
    const completedStages = sortedStages.filter(s => s.status === 'completed').length;
    const activeStage = sortedStages.find(s => s.status === 'in_progress');
    const progressPercentage = Math.round((completedStages / totalStages) * 100);
    
    // Ürün bilgilerini güncelle
    updateProductInfo(sortedStages[0]);
    updateProgressInfo(completedStages, totalStages, progressPercentage, activeStage);
    
    // Flow container'ı oluştur
    container.innerHTML = `
        <div class="stage-flow-container">
            ${sortedStages.map((stage, index) => `
                <div class="stage-flow-item ${getStageFlowClass(stage.status)}" data-stage-id="${stage.id}">
                    ${index > 0 ? `<div class="stage-connector ${getConnectorClass(sortedStages[index-1].status)}"></div>` : ''}
                    <div class="stage-number ${getStageNumberClass(stage.status)}">${index + 1}</div>
                    <div class="stage-timeline">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="mb-1">${stage.stage_name}</h5>
                                <span class="badge bg-${getStageStatusColor(stage.status)}">${getStageStatusText(stage.status)}</span>
                            </div>
                            <div class="text-end">
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    ${stage.estimated_duration || 0} dk
                                </small>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="mb-2">
                                    <i class="fas fa-user text-muted me-2"></i>
                                    <strong>Operatör:</strong> ${stage.operator || 'Atanmamış'}
                                </div>
                                <div class="mb-2">
                                    <i class="fas fa-tools text-muted me-2"></i>
                                    <strong>Beceriler:</strong> ${(stage.required_skills || []).join(', ')}
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-2">
                                    <i class="fas fa-calendar text-muted me-2"></i>
                                    <strong>Başlangıç:</strong> ${stage.start_time ? formatDateTime(stage.start_time) : 'Başlamadı'}
                                </div>
                                <div class="mb-2">
                                    <i class="fas fa-flag-checkered text-muted me-2"></i>
                                    <strong>Bitiş:</strong> ${stage.end_time ? formatDateTime(stage.end_time) : 'Tamamlanmadı'}
                                </div>
                            </div>
                        </div>
                        
                        ${stage.quality_check_required ? `
                            <div class="alert alert-warning mb-3">
                                <i class="fas fa-clipboard-check me-2"></i>
                                <strong>Kalite Kontrolü Gerekli</strong>
                            </div>
                        ` : ''}
                        
                        ${stage.notes ? `
                            <div class="alert alert-info mb-3">
                                <i class="fas fa-sticky-note me-2"></i>
                                <strong>Notlar:</strong> ${stage.notes}
                            </div>
                        ` : ''}
                        
                        <div class="stage-progress-bar">
                            <div class="stage-progress-fill" style="width: ${getStageProgress(stage)}%"></div>
                        </div>
                        
                        <div class="stage-actions">
                            ${getStageActionButtons(stage)}
                        </div>
                        
                        ${stage.status === 'in_progress' ? `
                            <div class="mt-3 text-center">
                                <div class="timer-display" id="timer-${stage.id}">00:00:00</div>
                                <small class="text-muted">Geçen süre</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Aktif aşamalar için timer başlat
    stages.forEach(stage => {
        if (stage.status === 'in_progress' && stage.start_time) {
            startStageTimer(stage.id, stage.start_time);
        }
    });
}

// Ürün detaylarını yükle
async function loadProductDetails() {
    try {
        console.log('🛍️ Ürün detayları yükleniyor...');
        
        const response = await fetch('/api/orders');
        if (!response.ok) {
            throw new Error(`Siparişler yüklenemedi: ${response.status}`);
        }
        
        const orders = await response.json();
        console.log('📋 Siparişler yüklendi:', orders.length, 'sipariş');
        
        // Onaylanmış, üretimde veya bekleyen siparişleri filtrele
        const approvedOrders = orders.filter(order => 
            order.status === 'approved' || 
            order.status === 'in_production' ||
            order.status === 'in_progress' ||
            order.status === 'pending'
        );
        console.log('✅ Onaylanmış/üretimde siparişler:', approvedOrders.length, 'sipariş');
        
        displayProductDetails(approvedOrders);
    } catch (error) {
        console.error('❌ Ürün detayları yükleme hatası:', error);
        document.getElementById('product-details-container').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Ürün detayları yüklenirken hata oluştu.
            </div>
        `;
    }
}

// Ürün detaylarını göster
function displayProductDetails(orders) {
    console.log('🎯 displayProductDetails çağrıldı:', orders);
    console.log('🎯 Sipariş sayısı:', orders?.length || 0);
    const container = document.getElementById('product-details-container');
    console.log('📦 Container bulundu:', container);
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                <p class="text-muted">Henüz onaylanmış sipariş bulunmuyor.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="row">';
    
    // Yarım kalmış üretimleri ayrı kart olarak gösterme, mevcut ürün kartlarında gösterilecek
    
    orders.forEach(order => {
        console.log('📋 Sipariş işleniyor:', order.id, order.order_number);
        const productDetails = Array.isArray(order.product_details) 
            ? order.product_details 
            : JSON.parse(order.product_details || '[]');
        console.log('🛍️ Ürün detayları:', productDetails);
        
        // Her ürün için ayrı kare oluştur
        productDetails.forEach(product => {
            console.log('🔧 Ürün işleniyor:', product.code, product.name);
            // Eğer bu ürün zaten üretimdeyse (yarım veya tamamlanmış), farklı göster
            const key = `${order.id}-${product.code}`;
            const production = productionStates.get(key);
            const isInProgress = production && 
                               production.is_active && 
                               production.produced_quantity < production.target_quantity;
            const isCompleted = production && 
                               production.is_completed && 
                               production.produced_quantity >= production.target_quantity;
            
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100 ${isInProgress ? 'border-warning' : isCompleted ? 'border-success' : 'border-primary'}">
                        <div class="card-header ${isInProgress ? 'bg-warning text-dark' : isCompleted ? 'bg-success text-white' : 'bg-primary text-white'}">
                            <h6 class="mb-0">
                                <i class="fas fa-box me-2"></i>
                                ${product.name || product.code}
                                ${isInProgress ? '<span class="badge bg-warning text-dark ms-2">Devam Ediyor</span>' : ''}
                                ${isCompleted ? '<span class="badge bg-success text-white ms-2">Üretildi</span>' : ''}
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <strong>Ürün Kodu:</strong> 
                                <span class="text-muted">${product.code}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Miktar:</strong> 
                                <span class="badge bg-info fs-6">${product.quantity} adet</span>
                            </div>
                            <div class="mb-2">
                                <strong>Sipariş No:</strong> 
                                <small class="text-muted">${order.order_number}</small>
                            </div>
                            <div class="mb-2">
                                <strong>Müşteri:</strong> 
                                <span class="text-muted">${order.customer_name || 'N/A'}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Teslim Tarihi:</strong> 
                                <span class="text-muted">${formatDate(order.delivery_date)}</span>
                            </div>
                            <div class="mb-3">
                                <strong>Öncelik:</strong> 
                                <span class="badge ${getPriorityBadgeClass(order.priority)}">
                                    ${getPriorityText(order.priority)}
                                </span>
                            </div>
                            ${isInProgress ? `
                                <div class="alert alert-warning mb-3">
                                    <div class="row">
                                        <div class="col-6">
                                            <strong>Üretim Durumu:</strong><br>
                                            <span class="badge bg-info fs-6">${production.produced_quantity}/${production.target_quantity} adet</span>
                                        </div>
                                        <div class="col-6">
                                            <strong>Kalan:</strong><br>
                                            <span class="badge bg-warning fs-6">${production.target_quantity - production.produced_quantity} adet</span>
                                        </div>
                                    </div>
                                    <div class="progress mt-2" style="height: 8px;">
                                        <div class="progress-bar bg-success" style="width: ${(production.produced_quantity / production.target_quantity) * 100}%"></div>
                                    </div>
                                    <small class="text-muted">
                                        <i class="fas fa-clock me-1"></i>
                                        Başlangıç: ${new Date(production.start_time).toLocaleString('tr-TR')}
                                    </small>
                                </div>
                            ` : ''}
                            ${isCompleted ? `
                                <div class="alert alert-success mb-3">
                                    <div class="row">
                                        <div class="col-6">
                                            <strong>Üretim Tamamlandı:</strong><br>
                                            <span class="badge bg-success fs-6">${production.produced_quantity}/${production.target_quantity} adet</span>
                                        </div>
                                        <div class="col-6">
                                            <strong>Tamamlanma:</strong><br>
                                            <span class="badge bg-success fs-6">%100</span>
                                        </div>
                                    </div>
                                    <div class="progress mt-2" style="height: 8px;">
                                        <div class="progress-bar bg-success" style="width: 100%"></div>
                                    </div>
                                    <small class="text-muted">
                                        <i class="fas fa-check-circle me-1"></i>
                                        Tamamlanma: ${new Date(production.completed_at).toLocaleString('tr-TR')}
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                        <div class="card-footer">
                            ${isInProgress ? `
                                <button class="btn btn-sm btn-warning w-100" onclick="continueProduction('${production.order_id}', '${production.product_code}')">
                                    <i class="fas fa-play me-2"></i>Üretime Devam Et
                                </button>
                            ` : isCompleted ? `
                                <button class="btn btn-sm btn-success w-100" onclick="viewProductionHistory('${production.order_id}', '${production.product_code}')">
                                    <i class="fas fa-history me-2"></i>Üretim Geçmişini Gör
                                </button>
                            ` : `
                                <button class="btn btn-sm btn-outline-primary w-100" onclick="selectProductForProduction('${order.id}', '${product.code}', ${product.quantity})">
                                    <i class="fas fa-play me-2"></i>Bu Ürünü Üret
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });
    });
    
    html += '</div>';
    console.log('🎨 HTML oluşturuldu, DOM\'a yazılıyor...', html.length, 'karakter');
    container.innerHTML = html;
    console.log('✅ HTML DOM\'a yazıldı!');
}

// Siparişi üretim için seç
function selectOrderForProduction(orderId) {
    // Bu fonksiyon aktif üretim seçimi için kullanılacak
    console.log('Seçilen sipariş:', orderId);
    // TODO: Bu siparişi aktif üretim olarak işaretle
}

// Üretim verilerini sakla
// Aktif üretimler - her ürün için ayrı durum
let activeProductions = {};

// Şu anda seçili üretim
let currentProduction = null;

// Veritabanından üretim durumlarını yükle
async function loadProductionStates() {
    try {
        if (!currentOperator) {
            console.log('⚠️ Operatör girişi yapılmamış, üretim durumları yüklenemiyor');
            return false;
        }

        console.log('🔍 Üretim durumları yükleniyor, operatör:', currentOperator.operator_id);
        const response = await fetch(`/api/production-states/${currentOperator.operator_id}`);
        
        if (!response.ok) {
            console.error('❌ Üretim durumları API hatası:', response.status, response.statusText);
            throw new Error(`Üretim durumları yüklenemedi: ${response.status}`);
        }
        
        const states = await response.json();
        console.log('📡 Üretim durumları API yanıtı:', states.length, 'durum');
        
        // Production states'i Map'e dönüştür
        productionStates.clear();
        if (Array.isArray(states)) {
            states.forEach(state => {
                const key = `${state.order_id}-${state.product_code}`;
                productionStates.set(key, state);
            });
        }
        
        console.log('📦 Üretim durumları yüklendi:', productionStates.size, 'ürün');
        return true;
    } catch (error) {
        console.error('❌ Üretim durumları yükleme hatası:', error);
        return false;
    }
}

// Üretim durumunu veritabanına kaydet
async function saveProductionState(productionData) {
    try {
        console.log('💾 Üretim durumu kaydediliyor:', productionData);
        
        if (!currentOperator) {
            console.error('❌ Operatör girişi yapılmamış');
            showAlert('Lütfen önce operatör girişi yapın!', 'error');
            return false;
        }

        const key = `${productionData.order_id}-${productionData.product_code}`;
        
        // Mevcut durumu kontrol et
        const existingState = productionStates.get(key);
        
        let response;
        if (existingState) {
            // Güncelle
            console.log('🔄 Mevcut üretim durumu güncelleniyor:', existingState.id);
            response = await fetch(`/api/production-states/${existingState.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productionData)
            });
        } else {
            // Yeni oluştur
            console.log('🆕 Yeni üretim durumu oluşturuluyor');
            response = await fetch('/api/production-states', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productionData)
            });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Hatası:', response.status, errorText);
            throw new Error(`API Hatası: ${response.status} - ${errorText}`);
        }
        
        const savedState = await response.json();
        productionStates.set(key, savedState);
        
        console.log('✅ Üretim durumu kaydedildi:', key, savedState);
        return true;
    } catch (error) {
        console.error('❌ Üretim durumu kaydetme hatası:', error);
        showAlert(`Üretim durumu kaydedilemedi: ${error.message}`, 'error');
        return false;
    }
}

// Üretim geçmişini kaydet
async function saveProductionHistory(productionStateId, historyData) {
    try {
        const response = await fetch('/api/production-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                production_state_id: productionStateId,
                ...historyData
            })
        });
        
        if (!response.ok) throw new Error('Üretim geçmişi kaydedilemedi');
        
        const savedHistory = await response.json();
        console.log('📝 Üretim geçmişi kaydedildi:', savedHistory.id);
        return savedHistory;
    } catch (error) {
        console.error('Üretim geçmişi kaydetme hatası:', error);
        return null;
    }
}

// Real-time event handlers
function handleProductionUpdate(data) {
    console.log('🔄 Üretim güncellendi:', data);
    
    if (data.production) {
        const key = `${data.production.order_id}-${data.production.product_code}`;
        productionStates.set(key, data.production);
        
        // UI'yi güncelle
        if (typeof loadProductDetails === 'function') {
            loadProductDetails();
        }
    }
}

function handleCurrentProductions(data) {
    console.log('📦 Mevcut üretimler alındı:', data);
    
    productionStates.clear();
    data.forEach(state => {
        const key = `${state.order_id}-${state.product_code}`;
        productionStates.set(key, state);
    });
    
    // UI'yi güncelle - loadProductDetails zaten checkOperatorLoginStatus içinde çağrılıyor
    // Burada sadece productionStates Map'ini güncelledik
}

function handleNotification(data) {
    console.log('🔔 Bildirim alındı:', data);
    
    // Bildirim göster
    if (realtimeClient) {
        realtimeClient.showNotification(data.title, data.notification_type, data.message);
    }
}

// Belirli bir ürünün üretim durumunu temizle
function clearSpecificProduction(orderId, productCode) {
    try {
        const key = `${orderId}-${productCode}`;
        if (productionStates.has(key)) {
            productionStates.delete(key);
            console.log('🗑️ Üretim durumu temizlendi:', key);
        }
    } catch (error) {
        console.error('Üretim durumu temizleme hatası:', error);
    }
}

// Test fonksiyonları kaldırıldı - sistem canlı kullanıma hazır

// Üretim geçmişini görüntüle
function viewProductionHistory(orderId, productCode) {
    const key = `${orderId}-${productCode}`;
    const production = productionStates.get(key);
    
    if (!production) {
        showAlert('Üretim geçmişi bulunamadı!', 'error');
        return;
    }
    
    const history = production.production_data?.history || [];
    
    let historyHtml = `
        <div class="modal fade" id="historyModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-history me-2"></i>Üretim Geçmişi
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Ürün:</strong> ${production.product_name}<br>
                                <strong>Kod:</strong> ${production.product_code}
                            </div>
                            <div class="col-md-6">
                                <strong>Toplam Üretilen:</strong> ${production.produced_quantity}/${production.target_quantity} adet<br>
                                <strong>Tamamlanma:</strong> ${production.completed_at ? new Date(production.completed_at).toLocaleString('tr-TR') : 'Devam ediyor'}
                            </div>
                        </div>
                        <hr>
                        <h6>Üretim Detayları:</h6>
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Barkod</th>
                                        <th>Adet</th>
                                        <th>Zaman</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;
    
    history.forEach(entry => {
        historyHtml += `
            <tr>
                <td>${entry.barcode}</td>
                <td><span class="badge bg-primary">${entry.quantity} adet</span></td>
                <td>${entry.timestamp}</td>
            </tr>
        `;
    });
    
    historyHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eski modal'ı kaldır
    const existingModal = document.getElementById('historyModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Yeni modal'ı ekle
    document.body.insertAdjacentHTML('beforeend', historyHtml);
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('historyModal'));
    modal.show();
}

// Üretim devam etme seçeneğini göster (artık displayProductDetails içinde hallettik)
function showContinueProductionOption() {
    // Bu fonksiyon artık kullanılmıyor, displayProductDetails içinde hallettik
    console.log('ℹ️ showContinueProductionOption artık kullanılmıyor, displayProductDetails içinde hallettik');
}

// Üretime devam et
function continueProduction(orderId, productCode) {
    const key = `${orderId}-${productCode}`;
    
    if (productionStates.has(key)) {
        console.log('🔄 Üretime devam ediliyor:', key);
        currentProduction = productionStates.get(key);
        
        // Modal'ı aç (mevcut durumla)
        openProductionModal();
    } else {
        console.error('❌ Üretim durumu bulunamadı:', key);
        showAlert('Üretim durumu bulunamadı!', 'error');
    }
}

// Üretimi iptal et
function cancelProduction() {
    if (confirm('Bu üretimi iptal etmek istediğinizden emin misiniz? Tüm ilerleme kaybolacak.')) {
        clearProductionState();
        
        // Verileri yenile (sayfa yenilemeden)
        loadProductDetails();
        
        showAlert('Üretim iptal edildi', 'info');
    }
}

// Ürünü üretim için seç
async function selectProductForProduction(orderId, productCode, quantity) {
    console.log('Seçilen ürün:', {
        orderId: orderId,
        productCode: productCode,
        quantity: quantity
    });
    
    if (!currentOperator) {
        showAlert('Lütfen önce operatör girişi yapın!', 'error');
        return;
    }
    
    // Ürün bilgilerini al
    const productName = getProductNameFromCode(productCode);
    const key = `${orderId}-${productCode}`;
    
    // Eğer bu ürün için zaten aktif üretim varsa, onu yükle
    if (productionStates.has(key)) {
        console.log('🔄 Mevcut üretim durumu yüklendi:', key);
        currentProduction = productionStates.get(key);
    } else {
        // Yeni üretim durumu oluştur
        console.log('🆕 Yeni üretim durumu oluşturuluyor:', key);
        const productionData = {
            order_id: orderId,
            product_code: productCode,
            product_name: productName,
            target_quantity: quantity,
            produced_quantity: 0,
            is_active: true,
            is_completed: false,
            start_time: new Date().toISOString(),
            last_update_time: new Date().toISOString(),
            operator_id: currentOperator.operator_id,
            operator_name: currentOperator.name,
            production_data: {
                history: []
            }
        };
        
        // Veritabanına kaydet
        const success = await saveProductionState(productionData);
        if (success) {
            currentProduction = productionStates.get(key);
        } else {
            showAlert('Üretim durumu oluşturulamadı!', 'error');
            return;
        }
    }
    
    // Modal'ı aç
    openProductionModal();
}

// Ürün adını koddan al
function getProductNameFromCode(productCode) {
    // Bu fonksiyon ürün kodundan ürün adını bulur
    // Şimdilik basit bir mapping yapıyoruz
    const productMappings = {
        'TRX-2-PLUS-GRAY-94-98': 'TRX-2-PLUS-Gri-94-98',
        'TRX-2-PLUS-BLACK-94-98': 'TRX-2-PLUS-Siyah-94-98',
        'TRX-2-PLUS-WHITE-94-98': 'TRX-2-PLUS-Beyaz-94-98'
    };
    
    return productMappings[productCode] || productCode;
}

// Üretim modalını aç
function openProductionModal() {
    // Modal içeriğini güncelle
    document.getElementById('modal-product-name').textContent = currentProduction.product_name;
    document.getElementById('modal-product-code').textContent = currentProduction.product_code;
    document.getElementById('modal-target-quantity').textContent = currentProduction.target_quantity;
    
    // Üretim durumunu güncelle
    updateProductionStatus();
    updateCurrentProducedDisplay();
    
    // Geçmişi temizle veya mevcut geçmişi göster
    const history = currentProduction.production_data?.history || currentProduction.history || [];
    if (history.length > 0) {
        updateProductionHistory();
    } else {
        document.getElementById('production-history').innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-clock me-2"></i>
                Henüz üretim yapılmadı
            </div>
        `;
    }
    
    // Adet girişi bölümlerini her zaman gizle (başlangıçta)
    document.getElementById('quantity-input-section').style.display = 'none';
    document.getElementById('quick-buttons-section').style.display = 'none';
    document.getElementById('barcode-warning').style.display = 'block';
    
    // Input'ları temizle ve focus yap
    const barcodeInput = document.getElementById('barcodeInput');
    const quantityInput = document.getElementById('producedQuantityInput');
    
    barcodeInput.value = '';
    quantityInput.value = '1';
    
    // Input alanının maksimum değerini kalan miktara göre ayarla
    const remaining = currentProduction.targetQuantity - currentProduction.producedQuantity;
    quantityInput.max = Math.max(1, remaining);
    
    // Hızlı adet butonlarını güncelle
    updateQuickButtons(remaining);
    barcodeInput.focus();
    
    // Enter tuşu ile barkod işleme (otomatik)
    barcodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Form submit'i engelle
            processBarcode();
        }
    });
    
    // Barkod input'u değiştiğinde otomatik kontrol
    barcodeInput.addEventListener('input', function(e) {
        const barcode = e.target.value.trim();
        
        // Önceki timeout'u temizle
        clearTimeout(barcodeInput.autoCheckTimeout);
        
        // Eğer input boşsa, loading'i temizle
        if (barcode.length === 0) {
            barcodeInput.classList.remove('is-valid', 'is-invalid');
            return;
        }
        
        // 3+ karakter girildiğinde otomatik kontrol et
        if (barcode.length >= 3) {
            // Input'a loading stili ekle
            barcodeInput.classList.add('is-loading');
            
            // Kısa bir gecikme ile otomatik kontrol (kullanıcı yazmayı bitirsin)
            barcodeInput.autoCheckTimeout = setTimeout(() => {
                if (barcodeInput.value.trim() === barcode) {
                    console.log('🔄 Otomatik barkod kontrolü başlatılıyor:', barcode);
                    processBarcode();
                }
            }, 800); // 800ms gecikme (barkod okuyucu için daha uygun)
        } else {
            // 3 karakterden az ise loading'i kaldır
            barcodeInput.classList.remove('is-loading');
        }
    });
    
    // Enter tuşu ile adet ekleme
    quantityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addProducedQuantity();
        }
    });
    
    // Modal'ı aç
    const modal = new bootstrap.Modal(document.getElementById('productionModal'));
    modal.show();
}

// Üretim durumunu güncelle
function updateProductionStatus() {
    const remaining = currentProduction.target_quantity - currentProduction.produced_quantity;
    const progress = (currentProduction.produced_quantity / currentProduction.target_quantity) * 100;
    
    document.getElementById('modal-produced-quantity').textContent = currentProduction.produced_quantity;
    document.getElementById('modal-remaining-quantity').textContent = remaining;
    document.getElementById('modal-progress-bar').style.width = `${progress}%`;
    
    // Kaydet ve Kapat butonunu güncelle
    const saveBtn = document.getElementById('saveAndCloseBtn');
    if (currentProduction.produced_quantity > 0) {
        saveBtn.disabled = false;
        if (remaining === 0) {
            saveBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Tamamla ve Kapat';
            saveBtn.classList.remove('btn-warning');
            saveBtn.classList.add('btn-success');
        } else {
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Kaydet ve Kapat';
            saveBtn.classList.remove('btn-success');
            saveBtn.classList.add('btn-warning');
        }
    } else {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Kaydet ve Kapat';
        saveBtn.classList.remove('btn-success');
        saveBtn.classList.add('btn-warning');
    }
    
    // Tamamla butonunu aktif/pasif yap
    const completeBtn = document.getElementById('completeProductionBtn');
    if (remaining === 0) {
        completeBtn.disabled = false;
        completeBtn.classList.remove('btn-success');
        completeBtn.classList.add('btn-primary');
        completeBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Üretimi Tamamla';
    } else {
        completeBtn.disabled = true;
        completeBtn.classList.remove('btn-primary');
        completeBtn.classList.add('btn-success');
        completeBtn.innerHTML = `<i class="fas fa-clock me-2"></i>Kalan: ${remaining} adet`;
    }
}

// Barkod işle (Dinamik Veritabanı Entegrasyonu)
async function processBarcode() {
    const barcodeInput = document.getElementById('barcodeInput');
    const barcode = barcodeInput.value.trim();
    
    if (!barcode) {
        showAlert('Lütfen barkod girin!', 'warning');
        return;
    }
    
    // currentProduction kontrolü
    if (!currentProduction) {
        console.error('❌ currentProduction bulunamadı, modal kapatılıyor');
        showAlert('Üretim bilgileri bulunamadı! Lütfen tekrar deneyin.', 'error');
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('productionModal'));
        if (modal) modal.hide();
        return;
    }
    
    // Barkod doğrulama (basit kontrol)
    if (barcode.length < 3) {
        showAlert('Geçersiz barkod!', 'error');
        barcodeInput.value = '';
        barcodeInput.focus();
        return;
    }
    
    // Loading durumunu ayarla
    barcodeInput.classList.remove('is-loading', 'is-valid', 'is-invalid');
    barcodeInput.classList.add('is-loading');
    barcodeInput.disabled = true;
    
    try {
        // Barkod ürün koduna uygun mu kontrol et (Dinamik)
        const isValid = await validateBarcodeForProduct(barcode);
        
        // Loading'i kaldır
        barcodeInput.classList.remove('is-loading');
        barcodeInput.disabled = false;
        
        if (!isValid) {
            // Hata durumu
            barcodeInput.classList.add('is-invalid');
            showAlert('Bu barkod bu ürüne ait değil! Lütfen doğru barkodu okutun.', 'error');
            
            // 2 saniye sonra input'u temizle ve focus yap
            setTimeout(() => {
                barcodeInput.value = '';
                barcodeInput.classList.remove('is-invalid');
                barcodeInput.focus();
            }, 2000);
            
            return;
        }
        
        // Başarı durumu
        barcodeInput.classList.add('is-valid');
        
        // Barkod doğrulandı, adet girişi bölümlerini göster
        showBarcodeSuccess(barcode);
        
        // 1 saniye sonra input'u temizle
        setTimeout(() => {
            barcodeInput.value = '';
            barcodeInput.classList.remove('is-valid');
        }, 1000);
        
        console.log('✅ Barkod doğrulandı (Dinamik):', barcode);
        
    } catch (error) {
        console.error('❌ Barkod doğrulama hatası:', error);
        
        // Hata durumu
        barcodeInput.classList.remove('is-loading');
        barcodeInput.classList.add('is-invalid');
        barcodeInput.disabled = false;
        
        showAlert('Barkod kontrol edilirken hata oluştu!', 'error');
        
        // 2 saniye sonra input'u temizle ve focus yap
        setTimeout(() => {
            barcodeInput.value = '';
            barcodeInput.classList.remove('is-invalid');
            barcodeInput.focus();
        }, 2000);
    }
}

// Barkod ürün koduna uygun mu kontrol et (Dinamik Veritabanı Entegrasyonu)
async function validateBarcodeForProduct(barcode) {
    // Mevcut üretim bilgilerini al
    if (!currentProduction) {
        console.error('❌ currentProduction bulunamadı');
        return false;
    }
    
    const productCode = currentProduction.product_code;
    
    if (!productCode) {
        console.error('❌ Ürün kodu bulunamadı:', currentProduction);
        return false;
    }
    
    console.log('🔍 Barkod doğrulama başlıyor (Dinamik):', {
        barcode: barcode,
        productCode: productCode
    });
    
    // 1. ÖNCE VERİTABANINDAN KONTROL ET (Dinamik)
    console.log('🌐 Veritabanından kontrol ediliyor...');
    const dbValidation = await validateBarcodeFromDatabase(barcode, productCode);
    
    if (dbValidation) {
        console.log('✅ Veritabanı doğrulaması başarılı');
        return true;
    }
    
    console.log('❌ Veritabanı doğrulaması başarısız, statik kontrol yapılıyor...');
    
    // 2. STATİK EŞLEŞME TABLOSU KONTROLÜ (Fallback)
    const productBarcodeMapping = getProductBarcodeMapping();
    const expectedBarcode = productBarcodeMapping[productCode];
    
    console.log('📋 Statik ürün-barkod eşleşme tablosu:', productBarcodeMapping);
    console.log('🎯 Beklenen barkod (statik):', expectedBarcode);
    
    if (expectedBarcode) {
        // Eğer ürün için özel barkod tanımlanmışsa, SADECE o barkodu kabul et
        if (barcode === expectedBarcode) {
            console.log('✅ Statik tanımlı barkod eşleşmesi bulundu:', barcode);
            return true;
        } else {
            console.log('❌ Barkod statik tanımlı barkod ile eşleşmiyor:', {
                expected: expectedBarcode,
                actual: barcode,
                productCode: productCode
            });
            return false;
        }
    }
    
    // 3. TAM EŞLEŞME KONTROLÜ (Son fallback)
    if (barcode === productCode) {
        console.log('✅ Tam eşleşme bulundu');
        return true;
    }
    
    // 4. NORMALIZE EDİLMİŞ TAM EŞLEŞME (Son fallback)
    const normalizedProductCode = productCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const normalizedBarcode = barcode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    if (normalizedBarcode === normalizedProductCode) {
        console.log('✅ Normalize edilmiş tam eşleşme');
        return true;
    }
    
    // Hiçbir eşleşme bulunamadı
    console.log('❌ Tüm barkod doğrulama yöntemleri başarısız:', {
        barcode: barcode,
        productCode: productCode,
        expectedBarcode: expectedBarcode,
        normalizedBarcode: normalizedBarcode,
        normalizedProductCode: normalizedProductCode,
        dbValidation: dbValidation
    });
    
    return false;
}

// Ürün-barkod eşleşmelerini al
function getProductBarcodeMapping() {
    const mapping = {
        'TRX-2-GRAY-98-92': '8690000009848',
        'TRX-2-PLUS-GRAY-94-98': '8690000009855',
        'TRX-2-PLUS-BLACK-94-98': '8690000009856',
        'TRX-2-PLUS-WHITE-94-98': '8690000009857',
        // Buraya daha fazla ürün-barkod eşleşmesi eklenebilir
    };
    
    console.log('📋 Barkod eşleşme tablosu yüklendi:', mapping);
    return mapping;
}

// Veritabanından ürün barkodunu kontrol et
async function validateBarcodeFromDatabase(barcode, productCode) {
    try {
        console.log('🔍 Veritabanından barkod kontrol ediliyor:', { barcode, productCode });
        
        // API'den ürün barkod bilgilerini al
        const response = await fetch(`/api/products/barcode/${barcode}`);
        
        if (!response.ok) {
            console.log('❌ API yanıtı başarısız:', response.status);
            return false;
        }
        
        const productData = await response.json();
        console.log('📦 API yanıtı:', productData);
        
        // Barkod bulundu mu?
        if (!productData.found) {
            console.log('❌ Barkod veritabanında bulunamadı');
            return false;
        }
        
        // Barkod bu ürüne ait mi?
        const isValid = productData.product_code === productCode;
        console.log('✅ Barkod doğrulama sonucu:', {
            barcode: barcode,
            expectedProductCode: productCode,
            actualProductCode: productData.product_code,
            isValid: isValid
        });
        
        return isValid;
        
    } catch (error) {
        console.error('❌ Veritabanı barkod kontrolü hatası:', error);
        return false;
    }
}

// Barkod başarılı olduğunda adet girişi bölümlerini göster
function showBarcodeSuccess(barcode) {
    // Uyarı mesajını gizle
    document.getElementById('barcode-warning').style.display = 'none';
    
    // Adet girişi bölümlerini göster
    document.getElementById('quantity-input-section').style.display = 'block';
    document.getElementById('quick-buttons-section').style.display = 'block';
    
    // Başarı mesajı
    showAlert(`Barkod doğrulandı: ${barcode}! Şimdi üretilen adet miktarını girin.`, 'success');
    
    // Adet input'una focus yap
    const quantityInput = document.getElementById('producedQuantityInput');
    quantityInput.focus();
    quantityInput.select();
}

// Üretilen adet miktarını ekle
async function addProducedQuantity() {
    // Operatör kontrolü
    if (!currentOperator) {
        showAlert('Lütfen önce operatör girişi yapın!', 'error');
        return;
    }
    
    // currentProduction kontrolü
    if (!currentProduction) {
        console.error('❌ currentProduction bulunamadı');
        showAlert('Üretim bilgileri bulunamadı! Lütfen tekrar deneyin.', 'error');
        return;
    }
    
    // Önce barkod okutulmuş mu kontrol et
    if (document.getElementById('barcode-warning').style.display !== 'none') {
        showAlert('Önce barkod okutmanız gerekiyor!', 'warning');
        return;
    }
    
    const quantityInput = document.getElementById('producedQuantityInput');
    const quantity = parseInt(quantityInput.value) || 0;
    
    if (quantity <= 0) {
        showAlert('Lütfen geçerli bir adet miktarı girin!', 'warning');
        return;
    }
    
    if (quantity > 1000) {
        showAlert('Maksimum 1000 adet girebilirsiniz!', 'warning');
        return;
    }
    
    // Hedef miktarı aşmayı kontrol et
    const remaining = currentProduction.target_quantity - currentProduction.produced_quantity;
    if (quantity > remaining) {
        showAlert(`Hedef miktarı aşamazsınız! Kalan: ${remaining} adet, Girmeye çalıştığınız: ${quantity} adet`, 'warning');
        return;
    }
    
    // Üretim miktarını artır
    currentProduction.produced_quantity += quantity;
    currentProduction.last_update_time = new Date().toISOString();
    
    // Geçmişe ekle
    const timestamp = new Date().toISOString();
    const historyEntry = {
        barcode: 'Manuel Giriş',
        timestamp: timestamp,
        quantity: quantity,
        operator_id: currentOperator.operator_id,
        operator_name: currentOperator.name
    };
    
    // Production data'yı güncelle
    if (!currentProduction.production_data) {
        currentProduction.production_data = { history: [] };
    }
    currentProduction.production_data.history.unshift(historyEntry);
    
    // Veritabanına kaydet
    const success = await saveProductionState(currentProduction);
    if (success) {
        // Geçmişi ayrıca kaydet
        await saveProductionHistory(currentProduction.id, historyEntry);
        
        // UI'yi güncelle
        updateProductionStatus();
        updateProductionHistory();
        updateCurrentProducedDisplay();
        
        // Input alanının maksimum değerini güncelle
        quantityInput.max = Math.max(1, remaining);
        
        // Hızlı adet butonlarını güncelle
        updateQuickButtons(remaining);
        
        // Input'u sıfırla
        quantityInput.value = '1';
        
        // Başarı mesajı
        showAlert(`${quantity} adet üretim kaydedildi!`, 'success');
        
        // Barkod input'una odaklan
        document.getElementById('barcodeInput').focus();
    } else {
        showAlert('Üretim kaydedilemedi!', 'error');
    }
}

// Hızlı adet ekleme
function quickAddQuantity(quantity) {
    // Önce barkod okutulmuş mu kontrol et
    if (document.getElementById('barcode-warning').style.display !== 'none') {
        showAlert('Önce barkod okutmanız gerekiyor!', 'warning');
        return;
    }
    
    const quantityInput = document.getElementById('producedQuantityInput');
    quantityInput.value = quantity;
    addProducedQuantity();
}

// Mevcut üretilen miktarı göster
function updateCurrentProducedDisplay() {
    const display = document.getElementById('current-produced-display');
    if (display) {
        display.textContent = `${currentProduction.produced_quantity} adet`;
    }
}

// Hızlı adet butonlarını güncelle
function updateQuickButtons(remaining) {
    const buttons = [
        { value: 1, selector: 'button[onclick="quickAddQuantity(1)"]' },
        { value: 5, selector: 'button[onclick="quickAddQuantity(5)"]' },
        { value: 10, selector: 'button[onclick="quickAddQuantity(10)"]' },
        { value: 25, selector: 'button[onclick="quickAddQuantity(25)"]' },
        { value: 50, selector: 'button[onclick="quickAddQuantity(50)"]' }
    ];
    
    buttons.forEach(button => {
        const element = document.querySelector(button.selector);
        if (element) {
            if (button.value > remaining) {
                element.disabled = true;
                element.classList.add('disabled');
                element.title = `Kalan miktar: ${remaining} adet`;
            } else {
                element.disabled = false;
                element.classList.remove('disabled');
                element.title = '';
            }
        }
    });
}

// Üretim geçmişini güncelle
function updateProductionHistory() {
    const historyContainer = document.getElementById('production-history');
    
    // History'yi güvenli şekilde al
    const history = currentProduction.production_data?.history || currentProduction.history || [];
    
    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-clock me-2"></i>
                Henüz üretim yapılmadı
            </div>
        `;
        return;
    }
    
    let html = '';
    history.forEach((item, index) => {
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <div>
                    <i class="fas fa-barcode me-2 text-primary"></i>
                    <strong>${item.barcode}</strong>
                    <small class="text-muted ms-2">${item.timestamp}</small>
                </div>
                <div>
                    <span class="badge bg-success">+${item.quantity} adet</span>
                </div>
            </div>
        `;
    });
    
    historyContainer.innerHTML = html;
}

// Üretimi kaydet ve kapat
async function saveAndCloseProduction() {
    if (currentProduction.produced_quantity === 0) {
        showAlert('Henüz üretim yapılmadı!', 'warning');
        return;
    }
    
    const remaining = currentProduction.target_quantity - currentProduction.produced_quantity;
    const message = remaining > 0 
        ? `${currentProduction.product_code} ürününden ${currentProduction.produced_quantity} adet üretildi. ${remaining} adet kaldı. Üretimi yarıda bırakıp daha sonra devam etmek istediğinizden emin misiniz?`
        : `${currentProduction.product_code} ürününün üretimi tamamlandı. Onaylıyor musunuz?`;
    
    if (confirm(message)) {
        if (remaining === 0) {
            // Üretim tamamlandı
            console.log('✅ Üretim tamamlandı:', currentProduction);
            currentProduction.is_active = false;
            currentProduction.is_completed = true;
            currentProduction.completed_at = new Date().toISOString();
            
            const success = await saveProductionState(currentProduction);
            if (success) {
                showAlert('Üretim başarıyla tamamlandı!', 'success');
            } else {
                showAlert('Üretim kaydedilemedi!', 'error');
                return;
            }
        } else {
            // Üretim yarıda bırakıldı
            console.log('💾 Üretim kaydedildi (yarım):', currentProduction);
            const success = await saveProductionState(currentProduction);
            if (success) {
                showAlert(`Üretim kaydedildi! ${remaining} adet kaldı. Daha sonra devam edebilirsiniz.`, 'info');
            } else {
                showAlert('Üretim kaydedilemedi!', 'error');
                return;
            }
        }
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('productionModal'));
        if (modal) {
            modal.hide();
        }
        
        // Verileri yenile (sayfa yenilemeden)
        loadProductDetails();
    }
}

// Üretimi tamamla
async function completeProduction() {
    if (currentProduction.produced_quantity < currentProduction.target_quantity) {
        showAlert('Henüz hedef miktara ulaşılmadı!', 'warning');
        return;
    }
    
    if (confirm(`${currentProduction.product_code} ürününün üretimi tamamlandı. Onaylıyor musunuz?`)) {
        console.log('✅ Üretim tamamlandı:', currentProduction);
        
        // Üretim durumunu "tamamlandı" olarak işaretle
        currentProduction.is_active = false;
        currentProduction.is_completed = true;
        currentProduction.completed_at = new Date().toISOString();
        
        const success = await saveProductionState(currentProduction);
        if (success) {
            showAlert('Üretim başarıyla tamamlandı!', 'success');
            
            // Modal'ı kapat
            const modal = bootstrap.Modal.getInstance(document.getElementById('productionModal'));
            if (modal) {
                modal.hide();
            }
            
            // Verileri yenile (sayfa yenilemeden)
            loadProductDetails();
        } else {
            showAlert('Üretim kaydedilemedi!', 'error');
        }
    }
}

// Öncelik badge class'ı
function getPriorityBadgeClass(priority) {
    switch(priority) {
        case 1: return 'bg-danger';
        case 2: return 'bg-warning';
        case 3: return 'bg-info';
        default: return 'bg-secondary';
    }
}

// Öncelik metni
function getPriorityText(priority) {
    switch(priority) {
        case 1: return 'Yüksek';
        case 2: return 'Orta';
        case 3: return 'Düşük';
        default: return 'Normal';
    }
}

// Tarih formatla
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Tarih formatlama hatası:', error);
        return 'N/A';
    }
}

// Ürün bilgilerini güncelle (müşteri ve sipariş bilgileri ile)
function updateProductInfo(stage) {
    const productDetails = document.getElementById('product-details');
    if (productDetails && stage) {
        // Sipariş detaylarından ürün kodlarını formatla
        const productCodesText = stage.product_codes && stage.product_codes.length > 0 
            ? stage.product_codes.join(', ') 
            : 'N/A';
        
        // Fallback değerler - eğer API'den veri gelmezse
        const customerName = stage.customer_name || stage.order_number || 'Bilinmiyor';
        const orderNumber = stage.order_number || stage.order_id || 'N/A';
        const totalQuantity = stage.total_quantity || stage.planned_quantity || 1;
        
        productDetails.innerHTML = `
            <div class="mb-2">
                <strong>Müşteri Adı:</strong> ${orderNumber}
            </div>
            <div class="mb-2">
                <strong>Sipariş Detayları:</strong> ${productCodesText}
            </div>
            <div class="mb-2">
                <strong>Toplam Sipariş Adedi:</strong> ${totalQuantity} adet
            </div>
            <div class="mb-2">
                <strong>Sipariş No:</strong> ${orderNumber}
            </div>
        `;
        
        // Debug için console log
        console.log('Product info updated:', { orderNumber, productCodesText, totalQuantity });
    }
}

// İlerleme bilgilerini güncelle
function updateProgressInfo(completed, total, percentage, activeStage) {
    const progressDetails = document.getElementById('progress-details');
    if (progressDetails) {
        progressDetails.innerHTML = `
            <div class="mb-2">
                <strong>Tamamlanan:</strong> ${completed}/${total} aşama
            </div>
            <div class="mb-2">
                <div class="progress">
                    <div class="progress-bar" style="width: ${percentage}%">${percentage}%</div>
                </div>
            </div>
            <div class="mb-2">
                <strong>Aktif Aşama:</strong> ${activeStage ? activeStage.stage_name : 'Yok'}
            </div>
            <div class="mb-2">
                <strong>Durum:</strong> 
                <span class="badge bg-${activeStage ? 'primary' : completed === total ? 'success' : 'secondary'}">
                    ${activeStage ? 'Devam Ediyor' : completed === total ? 'Tamamlandı' : 'Beklemede'}
                </span>
            </div>
        `;
    }
}

// Aşama flow sınıfını belirle
function getStageFlowClass(status) {
    switch(status) {
        case 'completed': return 'completed';
        case 'in_progress': return 'active';
        default: return 'pending';
    }
}

// Bağlayıcı sınıfını belirle
function getConnectorClass(prevStatus) {
    switch(prevStatus) {
        case 'completed': return 'completed';
        case 'in_progress': return 'active';
        default: return '';
    }
}

// Aşama numarası sınıfını belirle
function getStageNumberClass(status) {
    switch(status) {
        case 'completed': return 'completed';
        case 'in_progress': return 'active';
        default: return '';
    }
}

// Aşama ilerlemesini hesapla
function getStageProgress(stage) {
    if (stage.status === 'completed') return 100;
    if (stage.status === 'in_progress') {
        if (stage.start_time) {
            const start = new Date(stage.start_time);
            const now = new Date();
            const duration = stage.estimated_duration || 60; // dakika
            const elapsed = (now - start) / (1000 * 60); // dakika
            return Math.min(Math.round((elapsed / duration) * 100), 95);
        }
        return 0;
    }
    return 0;
}

// Tarih formatla
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR');
}

// Aşama flow'u yenile
function refreshStageFlow() {
    if (currentProduction) {
        loadProductionStages(currentProduction);
    }
}

// Aşama kartı sınıfını al
function getStageCardClass(status) {
    switch (status) {
        case 'active': return 'stage-active';
        case 'completed': return 'stage-completed';
        default: return '';
    }
}

// Aşama durum rengini al
function getStageStatusColor(status) {
    switch (status) {
        case 'pending': return 'secondary';
        case 'active': return 'success';
        case 'completed': return 'dark';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

// Aşama durum metnini al
function getStageStatusText(status) {
    switch (status) {
        case 'pending': return 'Bekliyor';
        case 'active': return 'Aktif';
        case 'completed': return 'Tamamlandı';
        case 'cancelled': return 'İptal';
        default: return status;
    }
}

// Aşama aksiyon butonlarını al
function getStageActionButtons(stage) {
    switch (stage.status) {
        case 'pending':
            return `
                <button class="btn btn-success btn-sm" onclick="startStage(${stage.id})">
                    <i class="fas fa-play me-1"></i>Başlat
                </button>
            `;
        case 'active':
            return `
                <button class="btn btn-warning btn-sm" onclick="completeStage(${stage.id})">
                    <i class="fas fa-check me-1"></i>Tamamla
                </button>
                <button class="btn btn-secondary btn-sm" onclick="pauseStage(${stage.id})">
                    <i class="fas fa-pause me-1"></i>Duraklat
                </button>
            `;
        case 'completed':
            return `
                <button class="btn btn-outline-info btn-sm" onclick="viewStageDetails(${stage.id})">
                    <i class="fas fa-eye me-1"></i>Detaylar
                </button>
            `;
        default:
            return '';
    }
}

// Aşama başlat
function startStage(stageId) {
    console.log('Aşama başlatılıyor:', stageId);
    
    // Aşama bilgilerini modal'a yükle
    fetch(`/api/production-stages/${stageId}`)
        .then(response => response.json())
        .then(stage => {
            document.getElementById('start-stage-name').textContent = stage.stage_name;
            document.getElementById('start-stage-duration').textContent = stage.estimated_duration + ' dakika';
            document.getElementById('start-stage-skills').textContent = stage.required_skills ? stage.required_skills.join(', ') : 'Belirtilmemiş';
            
            // Modal'ı göster
            const modal = new bootstrap.Modal(document.getElementById('startStageModal'));
            modal.show();
            
            // Stage ID'yi sakla
            document.getElementById('startStageModal').dataset.stageId = stageId;
        })
        .catch(error => {
            console.error('Aşama bilgisi yükleme hatası:', error);
            showAlert('Aşama bilgisi yüklenemedi: ' + error.message, 'error');
        });
}

// Aşama başlatmayı onayla
async function confirmStartStage() {
    const stageId = document.getElementById('startStageModal').dataset.stageId;
    const notes = document.getElementById('stage-notes').value;
    
    try {
        const response = await fetch(`/api/production-stages/${stageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'active',
                operator: currentOperator.name,
                start_time: new Date().toISOString(),
                notes: notes
            })
        });
        
        if (!response.ok) throw new Error('Aşama başlatılamadı');
        
        const updatedStage = await response.json();
        console.log('Aşama başlatıldı:', updatedStage);
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('startStageModal'));
        modal.hide();
        
        // Aşamaları yenile
        loadProductionStages(currentProduction);
        
        showAlert('Aşama başarıyla başlatıldı', 'success');
        
    } catch (error) {
        console.error('Aşama başlatma hatası:', error);
        showAlert('Aşama başlatılamadı: ' + error.message, 'error');
    }
}

// Aşama tamamla
function completeStage(stageId) {
    console.log('Aşama tamamlanıyor:', stageId);
    
    // Aşama bilgilerini modal'a yükle
    fetch(`/api/production-stages/${stageId}`)
        .then(response => response.json())
        .then(stage => {
            document.getElementById('complete-stage-name').textContent = stage.stage_name;
            document.getElementById('complete-stage-start-time').textContent = 
                stage.start_time ? new Date(stage.start_time).toLocaleString('tr-TR') : 'Belirtilmemiş';
            
            // Geçen süreyi hesapla
            if (stage.start_time) {
                const startTime = new Date(stage.start_time);
                const now = new Date();
                const duration = Math.floor((now - startTime) / 1000 / 60); // dakika
                document.getElementById('complete-stage-duration').textContent = duration + ' dakika';
            }
            
            // Kalite kontrolü gerekli mi?
            if (stage.quality_check_required) {
                document.getElementById('quality-check-section').style.display = 'block';
            } else {
                document.getElementById('quality-check-section').style.display = 'none';
            }
            
            // Modal'ı göster
            const modal = new bootstrap.Modal(document.getElementById('completeStageModal'));
            modal.show();
            
            // Stage ID'yi sakla
            document.getElementById('completeStageModal').dataset.stageId = stageId;
        })
        .catch(error => {
            console.error('Aşama bilgisi yükleme hatası:', error);
            showAlert('Aşama bilgisi yüklenemedi: ' + error.message, 'error');
        });
}

// Aşama tamamlamayı onayla
async function confirmCompleteStage() {
    const stageId = document.getElementById('completeStageModal').dataset.stageId;
    const notes = document.getElementById('completion-notes').value;
    
    try {
        const response = await fetch(`/api/production-stages/${stageId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operator: currentOperator.name,
                notes: notes,
                end_time: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error('Aşama tamamlanamadı');
        
        const updatedStage = await response.json();
        console.log('Aşama tamamlandı:', updatedStage);
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('completeStageModal'));
        modal.hide();
        
        // Aşamaları yenile
        loadProductionStages(currentProduction);
        
        showAlert('Aşama başarıyla tamamlandı', 'success');
        
        // Kalite kontrolü gerekliyse göster
        if (updatedStage.quality_check_required) {
            setTimeout(() => {
                showQualityCheckModal(stageId);
            }, 1000);
        }
        
    } catch (error) {
        console.error('Aşama tamamlama hatası:', error);
        showAlert('Aşama tamamlanamadı: ' + error.message, 'error');
    }
}

// Kalite kontrol modalını göster
function showQualityCheckModal(stageId) {
    // Basit kalite kontrol modalı
    document.getElementById('checkpoint-name').textContent = 'Aşama Kalite Kontrolü';
    document.getElementById('checkpoint-description').textContent = 'Aşama tamamlandıktan sonra kalite kontrolü gereklidir.';
    
    const modal = new bootstrap.Modal(document.getElementById('qualityCheckModal'));
    modal.show();
    
    // Stage ID'yi sakla
    document.getElementById('qualityCheckModal').dataset.stageId = stageId;
}

// Kalite kontrolü kaydet
async function submitQualityCheck() {
    const stageId = document.getElementById('qualityCheckModal').dataset.stageId;
    const result = document.getElementById('quality-result').value;
    const notes = document.getElementById('quality-notes').value;
    
    if (!result) {
        showAlert('Lütfen kontrol sonucunu seçiniz', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/quality/checks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                production_id: currentProduction,
                stage_id: stageId,
                checkpoint_id: 1, // Varsayılan checkpoint
                operator: currentOperator.name,
                result: result,
                notes: notes
            })
        });
        
        if (!response.ok) throw new Error('Kalite kontrolü kaydedilemedi');
        
        const qualityCheck = await response.json();
        console.log('Kalite kontrolü kaydedildi:', qualityCheck);
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('qualityCheckModal'));
        modal.hide();
        
        showAlert('Kalite kontrolü başarıyla kaydedildi', 'success');
        
    } catch (error) {
        console.error('Kalite kontrolü kaydetme hatası:', error);
        showAlert('Kalite kontrolü kaydedilemedi: ' + error.message, 'error');
    }
}

// Aşama timer'ını başlat
function startStageTimer(stageId, startTime) {
    const timerElement = document.getElementById(`timer-${stageId}`);
    if (!timerElement) return;
    
    const start = new Date(startTime);
    
    stageTimer = setInterval(() => {
        const now = new Date();
        const diff = now - start;
        
        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        
        timerElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Aşama duraklat
function pauseStage(stageId) {
    console.log('Aşama duraklatılıyor:', stageId);
    showAlert('Duraklatma özelliği yakında eklenecek', 'info');
}

// Aşama detaylarını görüntüle
function viewStageDetails(stageId) {
    console.log('Aşama detayları görüntüleniyor:', stageId);
    showAlert('Detay görüntüleme özelliği yakında eklenecek', 'info');
}

// Durum rengini al
function getStatusColor(status) {
    switch (status) {
        case 'planned': return 'primary';
        case 'active': return 'success';
        case 'completed': return 'dark';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

// Durum metnini al
function getStatusText(status) {
    switch (status) {
        case 'planned': return 'Planlandı';
        case 'active': return 'Aktif';
        case 'completed': return 'Tamamlandı';
        case 'cancelled': return 'İptal';
        default: return status;
    }
}

// Alert göster
function showAlert(message, type = 'info') {
    // Bootstrap alert oluştur
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 3 saniye sonra otomatik kapat
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}
