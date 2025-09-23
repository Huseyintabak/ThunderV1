// Depo Yönetimi JavaScript
let currentTab = 'hammadde';
let allProducts = {
    hammadde: [],
    yarimamul: [],
    nihai: []
};

// Excel import/export için global değişkenler
let selectedFile = null;
let excelData = [];

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏭 Depo Yönetimi sayfası yüklendi');
    
    // İstatistikleri yükle
    loadStatistics();
    
    // Hammadde verilerini yükle
    loadHammaddeData();
    
    // Event listener'ları ekle
    setupEventListeners();
});

// Event listener'ları kur
function setupEventListeners() {
    // Arama input'u
    document.getElementById('searchInput').addEventListener('input', function() {
        filterProducts();
    });
    
    // Kategori filtresi
    document.getElementById('categoryFilter').addEventListener('change', function() {
        filterProducts();
    });
    
    // Durum filtresi
    document.getElementById('statusFilter').addEventListener('change', function() {
        filterProducts();
    });
    
    // Excel dosya input'u için event listener
    document.getElementById('excelFile').addEventListener('change', handleFileSelect);
}

// Tab değiştirme
function showTab(tabName) {
    console.log('📋 Tab değiştiriliyor:', tabName);
    
    // Tüm tab'ları gizle
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Tüm tab butonlarını pasif yap
    document.querySelectorAll('.depo-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Seçilen tab'ı göster
    document.getElementById(tabName + '-tab').style.display = 'block';
    
    // Seçilen tab butonunu aktif yap
    event.target.classList.add('active');
    
    currentTab = tabName;
    
    // Veriyi yükle
    switch(tabName) {
        case 'hammadde':
            loadHammaddeData();
            break;
        case 'yarimamul':
            loadYarimamulData();
            break;
        case 'nihai':
            loadNihaiData();
            break;
    }
}

// İstatistikleri yükle
async function loadStatistics() {
    try {
        console.log('📊 İstatistikler yükleniyor...');
        
        // Hammadde sayısı
        const hammaddeResponse = await fetch('/api/hammaddeler');
        if (hammaddeResponse.ok) {
            const hammaddeData = await hammaddeResponse.json();
            document.getElementById('total-hammadde').textContent = hammaddeData.length;
        }
        
        // Yarı mamul sayısı
        const yarimamulResponse = await fetch('/api/yarimamuller');
        if (yarimamulResponse.ok) {
            const yarimamulData = await yarimamulResponse.json();
            document.getElementById('total-yarimamul').textContent = yarimamulData.length;
        }
        
        // Nihai ürün sayısı
        const nihaiResponse = await fetch('/api/nihai_urunler');
        if (nihaiResponse.ok) {
            const nihaiData = await nihaiResponse.json();
            document.getElementById('total-nihai').textContent = nihaiData.length;
        }
        
        // Toplam değer hesapla
        calculateTotalValue();
        
    } catch (error) {
        console.error('❌ İstatistik yükleme hatası:', error);
        showAlert('İstatistikler yüklenirken hata oluştu', 'danger');
    }
}

// Toplam değer hesapla
async function calculateTotalValue() {
    try {
        let totalValue = 0;
        
        // Hammadde değerleri
        const hammaddeResponse = await fetch('/api/hammaddeler');
        if (hammaddeResponse.ok) {
            const hammaddeData = await hammaddeResponse.json();
            hammaddeData.forEach(item => {
                totalValue += (item.satis_fiyati || 0) * (item.miktar || 0);
            });
        }
        
        // Yarı mamul değerleri
        const yarimamulResponse = await fetch('/api/yarimamuller');
        if (yarimamulResponse.ok) {
            const yarimamulData = await yarimamulResponse.json();
            yarimamulData.forEach(item => {
                totalValue += (item.satis_fiyati || 0) * (item.miktar || 0);
            });
        }
        
        // Nihai ürün değerleri
        const nihaiResponse = await fetch('/api/nihai_urunler');
        if (nihaiResponse.ok) {
            const nihaiData = await nihaiResponse.json();
            nihaiData.forEach(item => {
                totalValue += (item.satis_fiyati || 0) * (item.miktar || 0);
            });
        }
        
        document.getElementById('total-value').textContent = totalValue.toLocaleString('tr-TR');
        
    } catch (error) {
        console.error('❌ Toplam değer hesaplama hatası:', error);
    }
}

// Hammadde verilerini yükle
async function loadHammaddeData() {
    try {
        console.log('📦 Hammadde verileri yükleniyor...');
        
        const response = await fetch('/api/hammaddeler');
        if (response.ok) {
            const data = await response.json();
            allProducts.hammadde = data;
            displayHammaddeTable(data);
        } else {
            throw new Error('Hammadde verileri alınamadı');
        }
        
    } catch (error) {
        console.error('❌ Hammadde yükleme hatası:', error);
        showAlert('Hammadde verileri yüklenirken hata oluştu', 'danger');
        displayHammaddeTable([]);
    }
}

// Yarı mamul verilerini yükle
async function loadYarimamulData() {
    try {
        console.log('⚙️ Yarı mamul verileri yükleniyor...');
        
        const response = await fetch('/api/yarimamuller');
        if (response.ok) {
            const data = await response.json();
            allProducts.yarimamul = data;
            displayYarimamulTable(data);
        } else {
            throw new Error('Yarı mamul verileri alınamadı');
        }
        
    } catch (error) {
        console.error('❌ Yarı mamul yükleme hatası:', error);
        showAlert('Yarı mamul verileri yüklenirken hata oluştu', 'danger');
        displayYarimamulTable([]);
    }
}

// Nihai ürün verilerini yükle
async function loadNihaiData() {
    try {
        console.log('📦 Nihai ürün verileri yükleniyor...');
        
        const response = await fetch('/api/nihai_urunler');
        if (response.ok) {
            const data = await response.json();
            allProducts.nihai = data;
            displayNihaiTable(data);
        } else {
            throw new Error('Nihai ürün verileri alınamadı');
        }
        
    } catch (error) {
        console.error('❌ Nihai ürün yükleme hatası:', error);
        showAlert('Nihai ürün verileri yüklenirken hata oluştu', 'danger');
        displayNihaiTable([]);
    }
}

// Hammadde tablosunu göster
function displayHammaddeTable(data) {
    const tbody = document.getElementById('hammaddeTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <i class="fas fa-boxes fa-3x text-muted mb-3"></i>
                    <div class="text-muted">Henüz hammadde kaydı bulunmuyor</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.ad || '-'}</td>
            <td><span class="badge bg-secondary">${item.kod || '-'}</span></td>
            <td><strong>${item.miktar || 0}</strong></td>
            <td>${item.birim || '-'}</td>
            <td>₺${(item.satis_fiyati || 0).toLocaleString('tr-TR')}</td>
            <td>${item.kategori || '-'}</td>
            <td>
                <span class="badge ${item.aktif ? 'bg-success' : 'bg-danger'}">
                    ${item.aktif ? 'Aktif' : 'Pasif'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editHammadde(${item.id})" title="Düzenle">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteHammadde(${item.id})" title="Sil">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Yarı mamul tablosunu göster
function displayYarimamulTable(data) {
    const tbody = document.getElementById('yarimamulTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <i class="fas fa-cogs fa-3x text-muted mb-3"></i>
                    <div class="text-muted">Henüz yarı mamul kaydı bulunmuyor</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.ad || '-'}</td>
            <td><span class="badge bg-secondary">${item.kod || '-'}</span></td>
            <td><strong>${item.miktar || 0}</strong></td>
            <td>${item.birim || '-'}</td>
            <td>₺${(item.satis_fiyati || 0).toLocaleString('tr-TR')}</td>
            <td>${item.kategori || '-'}</td>
            <td>
                <span class="badge ${item.aktif ? 'bg-success' : 'bg-danger'}">
                    ${item.aktif ? 'Aktif' : 'Pasif'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editYarimamul(${item.id})" title="Düzenle">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteYarimamul(${item.id})" title="Sil">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Nihai ürün tablosunu göster
function displayNihaiTable(data) {
    const tbody = document.getElementById('nihaiTableBody');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <i class="fas fa-cube fa-3x text-muted mb-3"></i>
                    <div class="text-muted">Henüz nihai ürün kaydı bulunmuyor</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.ad || '-'}</td>
            <td><span class="badge bg-secondary">${item.kod || '-'}</span></td>
            <td><strong>${item.miktar || 0}</strong></td>
            <td>${item.birim || '-'}</td>
            <td>₺${(item.satis_fiyati || 0).toLocaleString('tr-TR')}</td>
            <td>${item.kategori || '-'}</td>
            <td>
                <span class="badge ${item.aktif ? 'bg-success' : 'bg-danger'}">
                    ${item.aktif ? 'Aktif' : 'Pasif'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editNihai(${item.id})" title="Düzenle">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteNihai(${item.id})" title="Sil">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Ürünleri filtrele
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    console.log('🔍 Filtreleme:', { searchTerm, categoryFilter, statusFilter });
    
    let filteredData = allProducts[currentTab];
    
    // Arama filtresi
    if (searchTerm) {
        filteredData = filteredData.filter(item => 
            (item.ad && item.ad.toLowerCase().includes(searchTerm)) ||
            (item.kod && item.kod.toLowerCase().includes(searchTerm)) ||
            (item.kategori && item.kategori.toLowerCase().includes(searchTerm))
        );
    }
    
    // Durum filtresi
    if (statusFilter) {
        const isActive = statusFilter === 'aktif';
        filteredData = filteredData.filter(item => item.aktif === isActive);
    }
    
    // Tabloyu güncelle
    switch(currentTab) {
        case 'hammadde':
            displayHammaddeTable(filteredData);
            break;
        case 'yarimamul':
            displayYarimamulTable(filteredData);
            break;
        case 'nihai':
            displayNihaiTable(filteredData);
            break;
    }
}

// Arama fonksiyonu
function searchProducts() {
    filterProducts();
}

// Yeni hammadde ekle
function addHammadde() {
    console.log('➕ Yeni hammadde ekleniyor...');
    showAlert('Hammadde ekleme özelliği yakında eklenecek', 'info');
}

// Yeni yarı mamul ekle
function addYarimamul() {
    console.log('➕ Yeni yarı mamul ekleniyor...');
    showAlert('Yarı mamul ekleme özelliği yakında eklenecek', 'info');
}

// Yeni nihai ürün ekle
function addNihai() {
    console.log('➕ Yeni nihai ürün ekleniyor...');
    showAlert('Nihai ürün ekleme özelliği yakında eklenecek', 'info');
}

// Hammadde düzenle
function editHammadde(id) {
    console.log('✏️ Hammadde düzenleniyor:', id);
    showAlert('Hammadde düzenleme özelliği yakında eklenecek', 'info');
}

// Yarı mamul düzenle
function editYarimamul(id) {
    console.log('✏️ Yarı mamul düzenleniyor:', id);
    showAlert('Yarı mamul düzenleme özelliği yakında eklenecek', 'info');
}

// Nihai ürün düzenle
function editNihai(id) {
    console.log('✏️ Nihai ürün düzenleniyor:', id);
    showAlert('Nihai ürün düzenleme özelliği yakında eklenecek', 'info');
}

// Hammadde sil
async function deleteHammadde(id) {
    if (confirm('Bu hammaddeyi silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/hammaddeler/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showAlert('Hammadde başarıyla silindi', 'success');
                loadHammaddeData();
                loadStatistics();
            } else {
                throw new Error('Silme işlemi başarısız');
            }
        } catch (error) {
            console.error('❌ Hammadde silme hatası:', error);
            showAlert('Hammadde silinirken hata oluştu', 'danger');
        }
    }
}

// Yarı mamul sil
async function deleteYarimamul(id) {
    if (confirm('Bu yarı mamulü silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/yarimamuller/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showAlert('Yarı mamul başarıyla silindi', 'success');
                loadYarimamulData();
                loadStatistics();
            } else {
                throw new Error('Silme işlemi başarısız');
            }
        } catch (error) {
            console.error('❌ Yarı mamul silme hatası:', error);
            showAlert('Yarı mamul silinirken hata oluştu', 'danger');
        }
    }
}

// Nihai ürün sil
async function deleteNihai(id) {
    if (confirm('Bu nihai ürünü silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/nihai_urunler/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showAlert('Nihai ürün başarıyla silindi', 'success');
                loadNihaiData();
                loadStatistics();
            } else {
                throw new Error('Silme işlemi başarısız');
            }
        } catch (error) {
            console.error('❌ Nihai ürün silme hatası:', error);
            showAlert('Nihai ürün silinirken hata oluştu', 'danger');
        }
    }
}

// Alert göster
function showAlert(message, type) {
    // Mevcut alert'leri temizle
    const existingAlerts = document.querySelectorAll('.alert-custom');
    existingAlerts.forEach(alert => alert.remove());
    
    // Yeni alert oluştur
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-custom alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Container'ın başına ekle
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// ==================== EXCEL IMPORT/EXPORT FONKSİYONLARI ====================

// Excel dosyası seçildiğinde
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    selectedFile = file;
    console.log('📁 Excel dosyası seçildi:', file.name);
    
    // Dosyayı oku
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            excelData = XLSX.utils.sheet_to_json(worksheet);
            
            console.log('📊 Excel verisi okundu:', excelData.length, 'satır');
            
            // Önizleme göster
            showExcelPreview(excelData);
            
            // Import butonunu aktif et
            document.getElementById('importBtn').disabled = false;
            
        } catch (error) {
            console.error('❌ Excel dosyası okuma hatası:', error);
            showAlert('Excel dosyası okunamadı. Lütfen geçerli bir Excel dosyası seçin.', 'danger');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Excel önizleme göster
function showExcelPreview(data) {
    if (!data || data.length === 0) return;
    
    const previewDiv = document.getElementById('importPreview');
    const headersRow = document.getElementById('previewHeaders');
    const bodyRows = document.getElementById('previewBody');
    
    // İlk 5 satırı göster
    const previewData = data.slice(0, 5);
    
    // Başlıkları oluştur
    const headers = Object.keys(previewData[0] || {});
    headersRow.innerHTML = headers.map(header => `<th>${header}</th>`).join('');
    
    // Veri satırlarını oluştur
    bodyRows.innerHTML = previewData.map(row => 
        `<tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>`
    ).join('');
    
    previewDiv.style.display = 'block';
}

// Excel import işlemi
async function processExcelImport() {
    if (!excelData || excelData.length === 0) {
        showAlert('Önce bir Excel dosyası seçin', 'warning');
        return;
    }
    
    const importType = document.getElementById('importType').value;
    console.log('📥 Excel import başlıyor:', importType, excelData.length, 'satır');
    
    try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const row of excelData) {
            try {
                // Veriyi temizle ve formatla
                const cleanData = {
                    ad: row.ad || '',
                    kod: row.kod || '',
                    miktar: parseFloat(row.miktar) || 0,
                    birim: row.birim || 'adet',
                    satis_fiyati: parseFloat(row.satis_fiyati) || 0,
                    kategori: row.kategori || '',
                    aktif: row.aktif === true || row.aktif === 'true' || row.aktif === 1 || row.aktif === '1',
                    aciklama: row.aciklama || '',
                    uretim_suresi: parseFloat(row.uretim_suresi) || 0,
                    bom_maliyet: parseFloat(row.bom_maliyet) || 0
                };
                
                // API endpoint'ini belirle
                let endpoint = '';
                switch(importType) {
                    case 'hammadde':
                        endpoint = '/api/hammaddeler';
                        break;
                    case 'yarimamul':
                        endpoint = '/api/yarimamuller';
                        break;
                    case 'nihai':
                        endpoint = '/api/nihai_urunler';
                        break;
                }
                
                // Veriyi gönder
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(cleanData)
                });
                
                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error('❌ Satır import hatası:', row, await response.text());
                }
                
            } catch (error) {
                errorCount++;
                console.error('❌ Satır işleme hatası:', row, error);
            }
        }
        
        // Sonuç mesajı
        if (successCount > 0) {
            showAlert(`${successCount} satır başarıyla içe aktarıldı${errorCount > 0 ? `, ${errorCount} satır hatalı` : ''}`, 'success');
            
            // Veriyi yenile
            switch(importType) {
                case 'hammadde':
                    loadHammaddeData();
                    break;
                case 'yarimamul':
                    loadYarimamulData();
                    break;
                case 'nihai':
                    loadNihaiData();
                    break;
            }
            
            // İstatistikleri yenile
            loadStatistics();
        } else {
            showAlert('Hiçbir satır içe aktarılamadı', 'danger');
        }
        
        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('excelImportModal'));
        modal.hide();
        
    } catch (error) {
        console.error('❌ Excel import hatası:', error);
        showAlert('Excel import işlemi sırasında hata oluştu', 'danger');
    }
}

// Hammadde Excel export
function exportHammaddeToExcel() {
    console.log('📤 Hammadde Excel export başlıyor');
    exportToExcel(allProducts.hammadde, 'Hammadde');
}

// Yarı mamul Excel export
function exportYarimamulToExcel() {
    console.log('📤 Yarı mamul Excel export başlıyor');
    exportToExcel(allProducts.yarimamul, 'Yarimamul');
}

// Nihai ürün Excel export
function exportNihaiToExcel() {
    console.log('📤 Nihai ürün Excel export başlıyor');
    exportToExcel(allProducts.nihai, 'Nihai_Urun');
}

// Genel Excel export fonksiyonu
function exportToExcel(data, sheetName) {
    if (!data || data.length === 0) {
        showAlert('Export edilecek veri bulunamadı', 'warning');
        return;
    }
    
    try {
        // Excel çalışma kitabı oluştur
        const wb = XLSX.utils.book_new();
        
        // Veriyi worksheet'e dönüştür
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Sütun genişliklerini ayarla
        const colWidths = [
            { wch: 8 },   // id
            { wch: 30 },  // ad
            { wch: 20 },  // kod
            { wch: 10 },  // miktar
            { wch: 10 },  // birim
            { wch: 15 },  // satis_fiyati
            { wch: 20 },  // kategori
            { wch: 10 },  // aktif
            { wch: 15 },  // aciklama
            { wch: 15 },  // uretim_suresi
            { wch: 15 }   // bom_maliyet
        ];
        ws['!cols'] = colWidths;
        
        // Worksheet'i çalışma kitabına ekle
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Dosyayı indir
        const fileName = `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showAlert(`${data.length} kayıt Excel dosyasına aktarıldı`, 'success');
        
    } catch (error) {
        console.error('❌ Excel export hatası:', error);
        showAlert('Excel export işlemi sırasında hata oluştu', 'danger');
    }
}

// Hammadde Excel import
function importHammaddeFromExcel() {
    document.getElementById('importType').value = 'hammadde';
    // Modal'ı aç
    const modal = new bootstrap.Modal(document.getElementById('excelImportModal'));
    modal.show();
}

// Yarı mamul Excel import
function importYarimamulFromExcel() {
    document.getElementById('importType').value = 'yarimamul';
    // Modal'ı aç
    const modal = new bootstrap.Modal(document.getElementById('excelImportModal'));
    modal.show();
}

// Nihai ürün Excel import
function importNihaiFromExcel() {
    document.getElementById('importType').value = 'nihai';
    // Modal'ı aç
    const modal = new bootstrap.Modal(document.getElementById('excelImportModal'));
    modal.show();
}
