// Üretim Geçmişi sayfası için özel JavaScript

// Üretim geçmişi yükleme
async function loadProductionHistory() {
    try {
        console.log('📊 Üretim geçmişi yükleniyor...');
        
        const response = await fetch('/api/production-history');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const history = await response.json();
        console.log('✅ Üretim geçmişi yüklendi:', history.length);
        
        displayProductionHistory(history);
    } catch (error) {
        console.error('❌ Üretim geçmişi yüklenirken hata:', error);
        showAlert('Üretim geçmişi yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

function displayProductionHistory(history) {
    const container = document.getElementById('history-table-body');
    if (!container) {
        console.error('❌ History table body bulunamadı');
        return;
    }
    
    if (history.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-history fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Üretim geçmişi bulunmuyor</h5>
                    <p class="text-muted">Henüz tamamlanan üretim bulunmuyor</p>
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = history.map(production => `
        <tr>
            <td><strong>#${production.id}</strong></td>
            <td>${production.product_name || 'Ürün'}</td>
            <td>${production.operator_name || 'Operatör'}</td>
            <td>${new Date(production.start_time).toLocaleDateString('tr-TR')}</td>
            <td>${production.end_time ? new Date(production.end_time).toLocaleDateString('tr-TR') : 'Devam ediyor'}</td>
            <td>
                <span class="badge bg-primary">${production.quantity || 0}</span>
            </td>
            <td>
                <span class="badge bg-${getStatusColor(production.status)}">
                    ${getStatusText(production.status)}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewProductionDetails(${production.id})" title="Detayları Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="downloadProductionReport(${production.id})" title="Rapor İndir">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filtreleme
function filterHistory() {
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    console.log('🔍 Filtreleme uygulanıyor:', { dateFrom, dateTo, statusFilter });
    
    // Filtreleme işlemi burada yapılacak
    loadProductionHistory();
}

// Üretim detayları
function viewProductionDetails(productionId) {
    console.log('👁️ Üretim detayları görüntüleniyor:', productionId);
    // Modal açma işlemi burada yapılacak
}

function downloadProductionReport(productionId) {
    console.log('📄 Üretim raporu indiriliyor:', productionId);
    // Rapor indirme işlemi burada yapılacak
}

// Rapor indirme
function exportHistoryReport() {
    console.log('📊 Üretim geçmişi raporu indiriliyor...');
    // Bu fonksiyon daha sonra implement edilecek
    showAlert('Rapor indirme özelliği yakında eklenecek!', 'info');
}

// Yardımcı fonksiyonlar
function getStatusColor(status) {
    const colors = {
        'completed': 'success',
        'cancelled': 'danger',
        'in_progress': 'warning',
        'pending': 'secondary'
    };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi',
        'in_progress': 'Devam Ediyor',
        'pending': 'Beklemede'
    };
    return texts[status] || status;
}

// Alert fonksiyonu
function showAlert(message, type = 'info') {
    // Basit alert - daha sonra modal ile değiştirilebilir
    alert(`${type.toUpperCase()}: ${message}`);
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Üretim Geçmişi sayfası yüklendi');
    loadProductionHistory();
});
