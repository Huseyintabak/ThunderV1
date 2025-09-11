// Barkod Üretim Sayfası JavaScript

// Global değişkenler
let allProducts = [];
let generatedBarcodes = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupEventListeners();
});

// Event listener'ları ayarla
function setupEventListeners() {
    document.getElementById('product-select').addEventListener('change', function() {
        updateProductInfo();
    });
    
    document.getElementById('quantity').addEventListener('change', function() {
        updateProductInfo();
    });
    
    document.getElementById('barcode-size').addEventListener('change', function() {
        updateBarcodeSize();
    });
}

// Ürünleri yükle
async function loadProducts() {
    try {
        // Yarı mamulleri yükle
        const yarimamulResponse = await fetch('/api/yarimamuller');
        const yarimamuller = yarimamulResponse.ok ? await yarimamulResponse.json() : [];
        
        // Nihai ürünleri yükle
        const nihaiResponse = await fetch('/api/nihai_urunler');
        const nihaiUrunler = nihaiResponse.ok ? await nihaiResponse.json() : [];
        
        // Tüm ürünleri birleştir
        allProducts = [
            ...yarimamuller.map(p => ({ ...p, type: 'yarimamul' })),
            ...nihaiUrunler.map(p => ({ ...p, type: 'nihai' }))
        ];
        
        // Ürün seçeneklerini doldur
        populateProductSelect();
        
    } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
        showAlert('Ürünler yüklenirken hata oluştu', 'danger');
    }
}

// Ürün seçeneklerini doldur
function populateProductSelect() {
    const select = document.getElementById('product-select');
    select.innerHTML = '<option value="">Ürün seçiniz...</option>';
    
    // Yarı mamuller
    const yarimamuller = allProducts.filter(p => p.type === 'yarimamul');
    if (yarimamuller.length > 0) {
        const optgroup1 = document.createElement('optgroup');
        optgroup1.label = 'Yarı Mamuller';
        yarimamuller.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.kod} - ${product.ad}`;
            option.dataset.type = 'yarimamul';
            option.dataset.barcode = product.barkod || '';
            optgroup1.appendChild(option);
        });
        select.appendChild(optgroup1);
    }
    
    // Nihai ürünler
    const nihaiUrunler = allProducts.filter(p => p.type === 'nihai');
    if (nihaiUrunler.length > 0) {
        const optgroup2 = document.createElement('optgroup');
        optgroup2.label = 'Nihai Ürünler';
        nihaiUrunler.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.kod} - ${product.ad}`;
            option.dataset.type = 'nihai';
            option.dataset.barcode = product.barkod || '';
            optgroup2.appendChild(option);
        });
        select.appendChild(optgroup2);
    }
}

// Ürün bilgilerini güncelle
function updateProductInfo() {
    const selectedOption = document.getElementById('product-select').selectedOptions[0];
    if (selectedOption && selectedOption.value) {
        const barcode = selectedOption.dataset.barcode;
        if (barcode) {
            console.log(`Seçilen ürün barkodu: ${barcode}`);
        } else {
            console.log('Seçilen ürünün barkodu yok');
        }
    }
}

// Barkod boyutunu güncelle
function updateBarcodeSize() {
    const size = document.getElementById('barcode-size').value;
    console.log(`Barkod boyutu: ${size}`);
}

// Barkod üret
function generateBarcodes() {
    const productSelect = document.getElementById('product-select');
    const quantity = parseInt(document.getElementById('quantity').value);
    const barcodeSize = document.getElementById('barcode-size').value;
    const barcodeFormat = document.getElementById('barcode-format').value;
    
    if (!productSelect.value) {
        showAlert('Lütfen bir ürün seçiniz', 'warning');
        return;
    }
    
    if (quantity < 1 || quantity > 100) {
        showAlert('Adet 1-100 arasında olmalıdır', 'warning');
        return;
    }
    
    const selectedOption = productSelect.selectedOptions[0];
    const product = allProducts.find(p => p.id == productSelect.value);
    
    if (!product) {
        showAlert('Ürün bulunamadı', 'error');
        return;
    }
    
    // Barkod numarasını al
    let barcodeNumber = product.barkod;
    if (!barcodeNumber) {
        // Barkod yoksa otomatik oluştur
        barcodeNumber = generateBarcodeNumber(product);
    }
    
    // Boyutları ayarla
    const [width, height] = barcodeSize.split('x').map(Number);
    
    // Barkodları üret
    for (let i = 0; i < quantity; i++) {
        const barcodeData = {
            id: Date.now() + i,
            product: product,
            barcodeNumber: barcodeNumber,
            format: barcodeFormat,
            width: width,
            height: height,
            timestamp: new Date()
        };
        
        generatedBarcodes.push(barcodeData);
    }
    
    // Barkodları göster
    displayBarcodes();
    updateBarcodeCount();
    
    showAlert(`${quantity} adet barkod üretildi`, 'success');
}

// EAN-13 barkod numarası oluştur
function generateBarcodeNumber(product) {
    // Eğer ürünün barkodu yoksa, EAN-13 standartlarına göre oluştur
    if (product.barkod && product.barkod.length === 13) {
        return product.barkod;
    }
    
    // Türkiye ülke kodu: 869
    const countryCode = '869';
    
    // Üretici kodu (5 haneli)
    const manufacturerCode = product.type === 'yarimamul' ? '00001' : '00002';
    
    // Ürün kodu (5 haneli)
    const productCode = product.id.toString().padStart(5, '0');
    
    // 12 haneli kod oluştur
    const code12 = countryCode + manufacturerCode + productCode;
    
    // EAN-13 checksum hesapla
    const checksum = calculateEAN13Checksum(code12);
    
    return code12 + checksum;
}

// EAN-13 checksum hesaplama
function calculateEAN13Checksum(code12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(code12[i]);
        if (i % 2 === 1) { // EAN-13'te tek pozisyonlar (1,3,5...) 1 ile çarpılır
            sum += digit;
        } else { // Çift pozisyonlar (0,2,4...) 3 ile çarpılır
            sum += digit * 3;
        }
    }
    return ((10 - (sum % 10)) % 10).toString();
}

// Barkodları göster
function displayBarcodes() {
    const container = document.getElementById('barcode-container');
    container.innerHTML = '';
    
    generatedBarcodes.forEach(barcodeData => {
        const barcodeItem = document.createElement('div');
        barcodeItem.className = 'barcode-item';
        
        // Mamul durumu belirleme
        const mamulDurumu = barcodeData.product.type === 'yarimamul' ? 'Yarı Mamul' : 'Nihai Ürün';
        const mamulClass = barcodeData.product.type === 'yarimamul' ? 'text-warning' : 'text-success';
        
        barcodeItem.innerHTML = `
            <div class="barcode-header">
                <div class="product-name">${barcodeData.product.ad}</div>
                <div class="mamul-durumu ${mamulClass}">${mamulDurumu}</div>
            </div>
            <div id="barcode-${barcodeData.id}" class="barcode-svg"></div>
            <div class="barcode-number">${barcodeData.barcodeNumber}</div>
            <div class="product-code">${barcodeData.product.kod}</div>
        `;
        container.appendChild(barcodeItem);
        
        // Barkodu oluştur
        try {
            // EAN-13 için barkod numarasını kontrol et
            if (barcodeData.barcodeNumber.length === 13 && /^\d{13}$/.test(barcodeData.barcodeNumber)) {
                JsBarcode(`#barcode-${barcodeData.id}`, barcodeData.barcodeNumber, {
                    format: 'EAN13',
                    width: 2,
                    height: barcodeData.height,
                    displayValue: false,
                    margin: 5,
                    background: "#ffffff",
                    lineColor: "#000000"
                });
            } else {
                // EAN-13 geçerli değilse CODE128 kullan
                JsBarcode(`#barcode-${barcodeData.id}`, barcodeData.barcodeNumber, {
                    format: 'CODE128',
                    width: 2,
                    height: barcodeData.height,
                    displayValue: false,
                    margin: 5,
                    background: "#ffffff",
                    lineColor: "#000000"
                });
            }
        } catch (error) {
            console.error('Barkod oluşturma hatası:', error);
            console.log('Barkod numarası:', barcodeData.barcodeNumber);
            console.log('Barkod uzunluğu:', barcodeData.barcodeNumber.length);
            
            // Hata durumunda sadece numarayı göster
            document.getElementById(`barcode-${barcodeData.id}`).innerHTML = 
                `<div class="barcode-fallback">
                    <div class="barcode-lines"></div>
                    <div class="barcode-text">${barcodeData.barcodeNumber}</div>
                </div>`;
        }
    });
}

// Barkod sayısını güncelle
function updateBarcodeCount() {
    document.getElementById('barcode-count').textContent = `${generatedBarcodes.length} adet`;
}

// Barkodları yazdır
function printBarcodes() {
    if (generatedBarcodes.length === 0) {
        showAlert('Yazdırılacak barkod yok', 'warning');
        return;
    }
    
    // Yazdırma stillerini ayarla
    const printStyles = `
        <style>
            @media print {
                body * { visibility: hidden; }
                .print-area, .print-area * { visibility: visible; }
                .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                .barcode-container { 
                    display: flex !important;
                    flex-wrap: wrap !important;
                    justify-content: flex-start !important;
                }
                .barcode-item {
                    margin: 5px !important;
                    page-break-inside: avoid !important;
                }
            }
        </style>
    `;
    
    // Geçici yazdırma penceresi oluştur
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Barkodlar - ${new Date().toLocaleDateString('tr-TR')}</title>
                ${printStyles}
            </head>
            <body>
                ${document.querySelector('.print-area').outerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Barkodları temizle
function clearBarcodes() {
    if (generatedBarcodes.length === 0) {
        showAlert('Temizlenecek barkod yok', 'info');
        return;
    }
    
    if (confirm(`${generatedBarcodes.length} adet barkod silinecek. Emin misiniz?`)) {
        generatedBarcodes = [];
        document.getElementById('barcode-container').innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-barcode fa-3x mb-3"></i>
                <p>Barkod üretmek için ürün seçin ve "Barkod Üret" butonuna tıklayın</p>
            </div>
        `;
        updateBarcodeCount();
        showAlert('Tüm barkodlar temizlendi', 'info');
    }
}

// Alert göster
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 3 saniye sonra otomatik kapat
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

// Sayfa yüklendiğinde ürünleri yükle
console.log('Barkod üretim sayfası yüklendi');
