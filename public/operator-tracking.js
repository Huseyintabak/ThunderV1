// Operatör Takibi sayfası için özel JavaScript

// Operatör durumu yükleme
async function loadOperatorStatus() {
    try {
        console.log('👥 Operatör durumu yükleniyor...');
        
        // İstatistikleri yükle
        await loadOperatorStats();
        
        // Operatör listesini yükle
        await loadOperatorsList();
        
    } catch (error) {
        console.error('❌ Operatör durumu yüklenirken hata:', error);
        showAlert('Operatör durumu yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

// Operatör istatistikleri
async function loadOperatorStats() {
    try {
        console.log('📊 Operatör istatistikleri yükleniyor...');
        
        const response = await fetch('/api/operators');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const operators = await response.json();
        console.log('✅ Operatörler yüklendi:', operators.length);
        
        // Aktif operatörleri hesapla
        const activeOperators = operators.filter(op => op.status === 'active');
        
        // Aktif üretimleri yükle
        const productionsResponse = await fetch('/api/active-productions');
        let activeProductions = [];
        if (productionsResponse.ok) {
            activeProductions = await productionsResponse.json();
        }
        
        // Bugün tamamlanan üretimleri yükle
        const today = new Date().toISOString().split('T')[0];
        const completedResponse = await fetch(`/api/completed-productions?date=${today}`);
        let completedToday = [];
        if (completedResponse.ok) {
            completedToday = await completedResponse.json();
        }
        
        // İstatistikleri güncelle
        updateOperatorStats({
            totalOperators: operators.length,
            activeOperators: activeOperators.length,
            activeProductions: activeProductions.length,
            completedToday: completedToday.length,
            producedToday: completedToday.reduce((sum, p) => sum + (p.quantity || 0), 0),
            efficiencyRate: calculateEfficiencyRate(operators, activeProductions)
        });
        
    } catch (error) {
        console.error('❌ Operatör istatistikleri yüklenirken hata:', error);
    }
}

function updateOperatorStats(stats) {
    console.log('📊 İstatistikler güncelleniyor:', stats);
    
    // DOM elementlerini güncelle
    const elements = {
        'total-operators-count': stats.totalOperators,
        'active-operators-count': stats.activeOperators,
        'active-productions-count': stats.activeProductions,
        'completed-today-count': stats.completedToday,
        'produced-today-count': stats.producedToday,
        'efficiency-rate': stats.efficiencyRate + '%'
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn('⚠️ Element bulunamadı:', id);
        }
    });
}

function calculateEfficiencyRate(operators, activeProductions) {
    if (operators.length === 0) return 0;
    
    const activeOperators = operators.filter(op => op.status === 'active').length;
    const totalCapacity = operators.reduce((sum, op) => sum + (op.capacity || 0), 0);
    const usedCapacity = activeProductions.length;
    
    if (totalCapacity === 0) return 0;
    
    return Math.round((usedCapacity / totalCapacity) * 100);
}

// Operatör listesi
async function loadOperatorsList() {
    try {
        console.log('👥 Operatör listesi yükleniyor...');
        
        const response = await fetch('/api/operators');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const operators = await response.json();
        console.log('✅ Operatör listesi yüklendi:', operators.length);
        
        displayOperatorsList(operators);
        
    } catch (error) {
        console.error('❌ Operatör listesi yüklenirken hata:', error);
    }
}

function displayOperatorsList(operators) {
    const container = document.getElementById('operators-list-container');
    if (!container) {
        console.error('❌ Operatör listesi container bulunamadı');
        return;
    }
    
    if (operators.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-users fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Operatör bulunmuyor</h5>
                <p class="text-muted">Henüz operatör eklenmemiş</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="row g-2">
            ${operators.map(operator => `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-2">
                    <div class="card operator-card-new operator-item" data-status="${operator.status}">
                        <div class="card-body p-3">
                            <div class="d-flex align-items-center mb-3">
                                <div class="operator-avatar-new bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="operator-name-new mb-1">${operator.name || 'Operatör'}</h6>
                                    <p class="operator-role-new mb-0">${operator.role || 'Operatör'}</p>
                                </div>
                                <span class="badge bg-${operator.status === 'active' ? 'success' : 'secondary'}">
                                    ${operator.status === 'active' ? 'Aktif' : 'Beklemede'}
                                </span>
                            </div>
                            
                            <div class="operator-productions-new">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <small class="text-muted">Aktif Üretim</small>
                                    <span class="badge bg-info">${operator.active_productions || 0}</span>
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <small class="text-muted">Deneyim</small>
                                    <span class="badge bg-warning">${operator.experience || 0} yıl</span>
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <small class="text-muted">Kapasite</small>
                                    <span class="badge bg-success">${operator.capacity || 0}/gün</span>
                                </div>
                                
                                ${operator.active_productions > 0 ? `
                                    <div class="mt-2">
                                        <small class="text-muted d-block mb-1">Aktif Üretimler:</small>
                                        <div class="progress" style="height: 6px;">
                                            <div class="progress-bar bg-primary" style="width: ${Math.min((operator.active_productions / (operator.capacity || 1)) * 100, 100)}%"></div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div class="mt-2 pt-2 border-top">
                                    <div class="row text-center">
                                        <div class="col-6">
                                            <small class="text-muted d-block">Konum</small>
                                            <small class="fw-bold">${operator.location || 'N/A'}</small>
                                        </div>
                                        <div class="col-6">
                                            <small class="text-muted d-block">Saatlik Ücret</small>
                                            <small class="fw-bold">₺${operator.hourly_rate || 0}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Operatör filtreleme
function filterOperators(filter) {
    console.log('🔍 Operatör filtresi:', filter);
    
    // Filtre butonlarını güncelle
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Operatör kartlarını filtrele
    const operatorItems = document.querySelectorAll('.operator-item');
    operatorItems.forEach(item => {
        const status = item.getAttribute('data-status');
        if (filter === 'all') {
            item.classList.remove('hidden');
        } else if (filter === 'active' && status === 'active') {
            item.classList.remove('hidden');
        } else if (filter === 'inactive' && status === 'inactive') {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
    
    // Filtre sonucu sayısını göster
    const visibleItems = document.querySelectorAll('.operator-item:not(.hidden)');
    console.log(`✅ ${visibleItems.length} operatör gösteriliyor`);
}

// Rapor indirme
function exportOperatorReport() {
    console.log('📊 Operatör raporu indiriliyor...');
    // Bu fonksiyon daha sonra implement edilecek
    showAlert('Rapor indirme özelliği yakında eklenecek!', 'info');
}

// Alert fonksiyonu
function showAlert(message, type = 'info') {
    // Basit alert - daha sonra modal ile değiştirilebilir
    alert(`${type.toUpperCase()}: ${message}`);
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', function() {
    console.log('👥 Operatör Takibi sayfası yüklendi');
    loadOperatorStatus();
});
