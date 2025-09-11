// Üretim Yönetimi JavaScript

// Global değişkenler
let hammaddeler = [];
let yarimamuller = [];
let nihaiUrunler = [];
let urunAgaci = [];
let activeProductions = [];
let productionHistory = [];

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

// Event listener'ları ayarla
function setupEventListeners() {
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
    document.getElementById('production-search').addEventListener('input', filterProductionHistory);
    document.getElementById('production-type-filter').addEventListener('change', filterProductionHistory);
    document.getElementById('production-status-filter').addEventListener('change', filterProductionHistory);
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
    try {
        // Bu fonksiyon backend'de aktif üretimleri getirecek
        // Şimdilik boş array
        activeProductions = [];
        displayActiveProductions();
    } catch (error) {
        console.error('Aktif üretimler yüklenemedi:', error);
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

// Aktif üretimleri göster
function displayActiveProductions() {
    const container = document.getElementById('active-productions-list');
    const noProductions = document.getElementById('no-active-productions');
    
    if (activeProductions.length === 0) {
        container.innerHTML = '';
        noProductions.style.display = 'block';
        return;
    }
    
    noProductions.style.display = 'none';
    container.innerHTML = '';
    
    activeProductions.forEach(production => {
        const productionCard = createProductionCard(production);
        container.appendChild(productionCard);
    });
}

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
    const container = document.getElementById('production-history-list');
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
    document.getElementById('total-productions').textContent = totalProductions;
    document.getElementById('completed-productions').textContent = completedProductions;
    document.getElementById('active-productions-count').textContent = activeProductions;
    document.getElementById('total-cost').textContent = `₺${totalCost.toFixed(2)}`;
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
