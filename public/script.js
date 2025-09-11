// Global değişkenler
let hammaddeler = [];
let yarimamuller = [];
let nihaiUrunler = [];
let urunAgaci = [];

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    // Navigation event listeners - sadece data-section olan linkler için
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Active nav link'i güncelle
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Form event listeners
    document.getElementById('hammadde-form').addEventListener('submit', handleHammaddeSubmit);
    document.getElementById('yarimamul-form').addEventListener('submit', handleYarimamulSubmit);
    document.getElementById('nihai-form').addEventListener('submit', handleNihaiSubmit);
    document.getElementById('urun-agaci-form').addEventListener('submit', handleUrunAgaciSubmit);

    // Filtre event listeners
    setupUrunAgaciFilterListeners();

    // İlk yükleme
    loadAllData();
});

// Tüm verileri yükle
async function loadAllData() {
    try {
        // Önce temel verileri yükle
        await Promise.all([
            loadHammaddeler(),
            loadYarimamuller(),
            loadNihaiUrunler(),
            loadWorkOrders() // İş emirlerini yükle
        ]);
        
        // Ürün seçeneklerini güncelle
        updateUrunSelects();
        
        // Sonra ürün ağacını yükle
        await loadUrunAgaci();
        
        // Stok kartlarını güncelle
        renderYarimamulStockCards();
        
        console.log('Tüm veriler yüklendi');
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        showAlert('Veriler yüklenirken hata oluştu', 'danger');
    }
}

// Tüm verileri yenile
async function refreshAllData() {
    try {
        showAlert('Veriler yenileniyor...', 'info');
        await loadAllData();
        showAlert('Veriler başarıyla yenilendi', 'success');
    } catch (error) {
        console.error('Veri yenileme hatası:', error);
        showAlert('Veriler yenilenirken hata oluştu', 'danger');
    }
}

// Bölüm gösterme fonksiyonu
function showSection(sectionName) {
    // Tüm bölümleri gizle
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Seçilen bölümü göster
    document.getElementById(sectionName + '-section').style.display = 'block';
    
    // Yarı mamul sekmesine geçildiğinde stok kartlarını güncelle
    if (sectionName === 'yarimamul') {
        renderYarimamulStockCards();
    }
    
    
}

// Hammadde işlemleri
async function loadHammaddeler() {
    try {
        const response = await fetch('/api/hammaddeler');
        if (response.ok) {
            hammaddeler = await response.json();
            renderHammaddeListesi();
        } else {
            console.error('Hammaddeler yüklenirken hata:', response.status);
            showAlert('Hammaddeler yüklenirken hata oluştu', 'danger');
        }
    } catch (error) {
        console.error('Hammaddeler yüklenirken hata:', error);
        showAlert('Hammaddeler yüklenirken hata oluştu', 'danger');
    }
}

function handleHammaddeSubmit(e) {
    e.preventDefault();
    
    const hammadde = {
        ad: document.getElementById('hammadde-adi').value,
        kod: document.getElementById('hammadde-kodu').value,
        miktar: parseFloat(document.getElementById('hammadde-miktar').value),
        birim: document.getElementById('hammadde-birim').value,
        birim_fiyat: parseFloat(document.getElementById('hammadde-fiyat').value),
        aciklama: document.getElementById('hammadde-aciklama').value
    };

    addHammadde(hammadde);
}

async function addHammadde(hammadde) {
    try {
        const response = await fetch('/api/hammaddeler', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(hammadde)
        });

        if (response.ok) {
            const newHammadde = await response.json();
            hammaddeler.unshift(newHammadde);
            renderHammaddeListesi();
            document.getElementById('hammadde-form').reset();
            showAlert('Hammadde başarıyla eklendi', 'success');
            updateUrunSelects();
        } else {
            throw new Error('Hammadde eklenirken hata oluştu');
        }
    } catch (error) {
        console.error('Hammadde ekleme hatası:', error);
        showAlert('Hammadde eklenirken hata oluştu', 'danger');
    }
}

function renderHammaddeListesi() {
    const tbody = document.getElementById('hammadde-listesi');
    tbody.innerHTML = '';

    hammaddeler.forEach(hammadde => {
        const row = document.createElement('tr');
        const toplamDeger = (hammadde.miktar * hammadde.birim_fiyat).toFixed(2);
        
        row.innerHTML = `
            <td>${hammadde.kod}</td>
            <td>${hammadde.ad}</td>
            <td>${hammadde.miktar}</td>
            <td>${hammadde.birim}</td>
            <td>₺${hammadde.birim_fiyat.toFixed(2)}</td>
            <td>₺${toplamDeger}</td>
            <td>
                <button class="btn btn-warning btn-sm me-1" onclick="editHammadde(${hammadde.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteHammadde(${hammadde.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}


// Yarı mamul işlemleri
async function loadYarimamuller() {
    try {
        const response = await fetch('/api/yarimamuller');
        if (response.ok) {
            yarimamuller = await response.json();
            renderYarimamulListesi();
        } else {
            console.error('Yarı mamuller yüklenirken hata:', response.status);
            showAlert('Yarı mamuller yüklenirken hata oluştu', 'danger');
        }
    } catch (error) {
        console.error('Yarı mamuller yüklenirken hata:', error);
        showAlert('Yarı mamuller yüklenirken hata oluştu', 'danger');
    }
}

function handleYarimamulSubmit(e) {
    e.preventDefault();
    
    const miktar = parseFloat(document.getElementById('yarimamul-miktar').value);
    const birimMaliyet = parseFloat(document.getElementById('yarimamul-maliyet').value);
    
    // Validasyon kontrolleri
    if (miktar <= 0) {
        showAlert('Miktar 0\'dan büyük olmalıdır!', 'warning');
        return;
    }
    
    if (birimMaliyet <= 0) {
        showAlert('Birim maliyet 0\'dan büyük olmalıdır!', 'warning');
        return;
    }
    
    const yarimamul = {
        ad: document.getElementById('yarimamul-adi').value,
        kod: document.getElementById('yarimamul-kodu').value,
        barkod: document.getElementById('yarimamul-barkod').value,
        miktar: miktar,
        birim: document.getElementById('yarimamul-birim').value,
        birim_maliyet: birimMaliyet,
        aciklama: document.getElementById('yarimamul-aciklama').value
    };

    addYarimamul(yarimamul);
}

async function addYarimamul(yarimamul) {
    try {
        const response = await fetch('/api/yarimamuller', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(yarimamul)
        });

        if (response.ok) {
            const newYarimamul = await response.json();
            yarimamuller.unshift(newYarimamul);
            renderYarimamulListesi();
            document.getElementById('yarimamul-form').reset();
            showAlert('Yarı mamul başarıyla eklendi', 'success');
            updateUrunSelects();
        } else {
            throw new Error('Yarı mamul eklenirken hata oluştu');
        }
    } catch (error) {
        console.error('Yarı mamul ekleme hatası:', error);
        showAlert('Yarı mamul eklenirken hata oluştu', 'danger');
    }
}

function renderYarimamulListesi() {
    const tbody = document.getElementById('yarimamul-listesi');
    tbody.innerHTML = '';

    yarimamuller.forEach(yarimamul => {
        const row = document.createElement('tr');
        const toplamMaliyet = (yarimamul.miktar * yarimamul.birim_maliyet).toFixed(2);
        
        row.innerHTML = `
            <td>${yarimamul.kod}</td>
            <td>${yarimamul.ad}</td>
            <td><code>${yarimamul.barkod || 'Tanımlanmamış'}</code></td>
            <td>${yarimamul.miktar}</td>
            <td>${yarimamul.birim}</td>
            <td>₺${yarimamul.birim_maliyet.toFixed(2)}</td>
            <td>₺${toplamMaliyet}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-warning btn-sm" onclick="editYarimamul(${yarimamul.id})" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-info btn-sm" onclick="showBOMCostDetails(${yarimamul.id})" title="BOM Maliyet Detayları">
                        <i class="fas fa-calculator"></i>
                    </button>
                    <button class="btn btn-success btn-sm" onclick="updateYarimamulCostFromBOM(${yarimamul.id}).then(() => loadYarimamuller())" title="BOM'dan Maliyet Hesapla">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteYarimamul(${yarimamul.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Yarı mamul stok kartlarını güncelle
    renderYarimamulStockCards();
}

// Yarı mamul stok kartlarını göster
function renderYarimamulStockCards() {
    const container = document.getElementById('yarimamul-stock-cards');
    container.innerHTML = '';

    yarimamuller.forEach(yarimamul => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-3';
        
        const stockStatus = yarimamul.miktar > 0 ? 'success' : 'warning';
        const stockText = yarimamul.miktar > 0 ? 'Stokta' : 'Stok Yok';
        const totalValue = (yarimamul.miktar * yarimamul.birim_maliyet).toFixed(2);
        
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">${yarimamul.ad}</h6>
                        <span class="badge bg-${stockStatus}">${stockText}</span>
                    </div>
                    <p class="card-text small text-muted mb-2">${yarimamul.kod}</p>
                    <div class="row text-center">
                        <div class="col-4">
                            <div class="border-end">
                                <div class="h5 mb-0 text-primary">${yarimamul.miktar}</div>
                                <small class="text-muted">${yarimamul.birim}</small>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="border-end">
                                <div class="h6 mb-0 text-info">₺${yarimamul.birim_maliyet.toFixed(2)}</div>
                                <small class="text-muted">Birim Maliyet</small>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="h6 mb-0 text-success">₺${totalValue}</div>
                            <small class="text-muted">Toplam Değer</small>
                        </div>
                    </div>
                    <div class="mt-3">
                        <div class="d-grid gap-1">
                            <button class="btn btn-outline-primary btn-sm" onclick="showBOMCostDetails(${yarimamul.id})" title="BOM Maliyet Detayları">
                                <i class="fas fa-calculator me-1"></i>BOM Detay
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="updateYarimamulCostFromBOM(${yarimamul.id}).then(() => loadYarimamuller())" title="BOM'dan Maliyet Hesapla">
                                <i class="fas fa-sync me-1"></i>Maliyet Hesapla
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Toplam stok değerini hesapla ve göster
    const totalStockValue = yarimamuller.reduce((total, yarimamul) => {
        return total + (yarimamul.miktar * yarimamul.birim_maliyet);
    }, 0);
    
    // Toplam değer kartını ekle
    const totalCard = document.createElement('div');
    totalCard.className = 'col-md-12 mb-3';
    totalCard.innerHTML = `
        <div class="card border-success">
            <div class="card-body text-center">
                <h5 class="card-title text-success mb-0">
                    <i class="fas fa-calculator me-2"></i>Toplam Stok Değeri
                </h5>
                <div class="h3 text-success mt-2">₺${totalStockValue.toFixed(2)}</div>
                <small class="text-muted">${yarimamuller.length} yarı mamul ürün</small>
            </div>
        </div>
    `;
    container.appendChild(totalCard);
}

// Nihai ürün işlemleri
async function loadNihaiUrunler() {
    try {
        const response = await fetch('/api/nihai_urunler');
        if (response.ok) {
            nihaiUrunler = await response.json();
            renderNihaiListesi();
        } else {
            console.error('Nihai ürünler yüklenirken hata:', response.status);
            showAlert('Nihai ürünler yüklenirken hata oluştu', 'danger');
        }
    } catch (error) {
        console.error('Nihai ürünler yüklenirken hata:', error);
        showAlert('Nihai ürünler yüklenirken hata oluştu', 'danger');
    }
}

function handleNihaiSubmit(e) {
    e.preventDefault();
    
    const nihai = {
        ad: document.getElementById('nihai-adi').value,
        kod: document.getElementById('nihai-kodu').value,
        barkod: document.getElementById('nihai-barkod').value,
        miktar: parseFloat(document.getElementById('nihai-miktar').value),
        birim: document.getElementById('nihai-birim').value,
        satis_fiyati: parseFloat(document.getElementById('nihai-fiyat').value),
        aciklama: document.getElementById('nihai-aciklama').value
    };

    addNihaiUrun(nihai);
}

async function addNihaiUrun(nihai) {
    try {
        const response = await fetch('/api/nihai_urunler', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nihai)
        });

        if (response.ok) {
            const newNihai = await response.json();
            nihaiUrunler.unshift(newNihai);
            renderNihaiListesi();
            document.getElementById('nihai-form').reset();
            showAlert('Nihai ürün başarıyla eklendi', 'success');
            updateUrunSelects();
        } else {
            throw new Error('Nihai ürün eklenirken hata oluştu');
        }
    } catch (error) {
        console.error('Nihai ürün ekleme hatası:', error);
        showAlert('Nihai ürün eklenirken hata oluştu', 'danger');
    }
}

function renderNihaiListesi() {
    const tbody = document.getElementById('nihai-listesi');
    tbody.innerHTML = '';

    nihaiUrunler.forEach(nihai => {
        const row = document.createElement('tr');
        const toplamDeger = (nihai.miktar * nihai.satis_fiyati).toFixed(2);
        
        row.innerHTML = `
            <td>${nihai.kod}</td>
            <td>${nihai.ad}</td>
            <td><code>${nihai.barkod || 'Tanımlanmamış'}</code></td>
            <td>${nihai.miktar}</td>
            <td>${nihai.birim}</td>
            <td>₺${nihai.satis_fiyati.toFixed(2)}</td>
            <td>₺${toplamDeger}</td>
            <td>
                <button class="btn btn-warning btn-sm me-1" onclick="editNihai(${nihai.id})" title="Düzenle">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteNihai(${nihai.id})" title="Sil">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Ürün ağacı işlemleri
async function loadUrunAgaci() {
    try {
        const response = await fetch('/api/urun_agaci');
        if (response.ok) {
            urunAgaci = await response.json();
            renderUrunAgaciListesi();
        } else {
            console.error('Ürün ağacı yüklenirken hata:', response.status);
            showAlert('Ürün ağacı yüklenirken hata oluştu', 'danger');
        }
    } catch (error) {
        console.error('Ürün ağacı yüklenirken hata:', error);
        showAlert('Ürün ağacı yüklenirken hata oluştu', 'danger');
    }
}

function handleUrunAgaciSubmit(e) {
    e.preventDefault();
    
    const anaUrunId = document.getElementById('ana-urun').value;
    
    if (!anaUrunId) {
        showAlert('Lütfen ana ürün seçiniz', 'warning');
        return;
    }
    
    // Alt ürün satırlarını kontrol et
    const altUrunRows = document.querySelectorAll('.alt-urun-row');
    if (altUrunRows.length === 0) {
        showAlert('Lütfen en az bir alt ürün ekleyiniz', 'warning');
        return;
    }
    
    // Ana ürün tipini belirle
    const anaUrun = getUrunById(anaUrunId);
    
    if (!anaUrun) {
        showAlert('Ana ürün bilgisi bulunamadı', 'error');
        return;
    }
    
    // Tüm alt ürünleri topla
    const altUrunler = [];
    let hasError = false;
    
    altUrunRows.forEach((row, index) => {
        const select = row.querySelector('.alt-urun-select');
        const miktar = row.querySelector('.alt-urun-miktar');
        
        if (!select.value || !miktar.value) {
            showAlert(`${index + 1}. satırda eksik bilgi var`, 'warning');
            hasError = true;
            return;
        }
        
        const altUrun = getUrunById(select.value);
        if (!altUrun) {
            showAlert(`${index + 1}. satırdaki ürün bulunamadı`, 'error');
            hasError = true;
            return;
        }
        
        // Ana ürün ile aynı ürün seçilmişse hata ver (ID + tip kontrolü)
        if (altUrun.id === anaUrun.id && altUrun.tip === anaUrun.tip) {
            showAlert(`${index + 1}. satırda ana ürün ile aynı ürün seçilemez`, 'warning');
            hasError = true;
            return;
        }
        
        altUrunler.push({
            ana_urun_id: parseInt(anaUrunId),
            ana_urun_tipi: anaUrun.tip,
            alt_urun_id: parseInt(select.value),
            alt_urun_tipi: altUrun.tip,
            gerekli_miktar: parseFloat(miktar.value),
            birim: 'adet'
        });
        
    });
    
    if (hasError) return;
    
    // Tüm alt ürünleri ekle
    addMultipleUrunAgaci(altUrunler);
}

async function addUrunAgaci(agac) {
    try {
        const response = await fetch('/api/urun_agaci', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(agac)
        });

        if (response.ok) {
            const newAgac = await response.json();
            urunAgaci.unshift(newAgac);
            renderUrunAgaciListesi();
            document.getElementById('urun-agaci-form').reset();
            showAlert('Ürün ağacı başarıyla eklendi', 'success');
            
            // Ana ürün yarı mamul ise, maliyetini BOM'dan hesapla
            if (newAgac.ana_urun_tipi === 'yarimamul') {
                setTimeout(async () => {
                    await updateYarimamulCostFromBOM(newAgac.ana_urun_id);
                    await loadYarimamuller();
                }, 1000);
            }
        } else {
            throw new Error('Ürün ağacı eklenirken hata oluştu');
        }
    } catch (error) {
        console.error('Ürün ağacı ekleme hatası:', error);
        showAlert('Ürün ağacı eklenirken hata oluştu', 'danger');
    }
}

// Çoklu ürün ağacı ekleme
async function addMultipleUrunAgaci(altUrunler) {
    try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const agac of altUrunler) {
            try {
                const response = await fetch('/api/urun_agaci', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(agac)
                });

                if (response.ok) {
                    const newAgac = await response.json();
                    urunAgaci.unshift(newAgac);
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error('Ürün ağacı ekleme hatası:', error);
                errorCount++;
            }
        }
        
        // Sonuçları göster
        if (successCount > 0) {
            renderUrunAgaciListesi();
            clearUrunAgaciForm();
            
            if (errorCount === 0) {
                showAlert(`${successCount} adet ürün ağacı başarıyla eklendi`, 'success');
            } else {
                showAlert(`${successCount} adet başarılı, ${errorCount} adet hatalı`, 'warning');
            }
        } else {
            showAlert('Hiçbir ürün ağacı eklenemedi', 'danger');
        }
    } catch (error) {
        console.error('Çoklu ürün ağacı ekleme hatası:', error);
        showAlert('Ürün ağacı eklenirken hata oluştu', 'danger');
    }
}

function renderUrunAgaciListesi() {
    const tbody = document.getElementById('urun-agaci-listesi');
    tbody.innerHTML = '';

    // Veri yüklenmemişse bekle
    if (hammaddeler.length === 0 && yarimamuller.length === 0 && nihaiUrunler.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Veriler yükleniyor...</td></tr>';
        return;
    }

    urunAgaci.forEach(agac => {
        const row = document.createElement('tr');
        
        // Ana ürün adını doğru şekilde al
        let anaUrunDisplay = 'Bilinmeyen';
        let anaUrunAd = '';
        let anaUrunId = agac.ana_urun_id;
        let anaUrunTipi = agac.ana_urun_tipi;
        let anaUrunAktif = true;
        
        if (agac.ana_urun_tipi === 'yarimamul') {
            const anaUrun = yarimamuller.find(y => y.id === agac.ana_urun_id);
            if (anaUrun) {
                anaUrunDisplay = `${anaUrun.ad} (yarimamul)`;
                anaUrunAd = anaUrun.ad;
                anaUrunAktif = anaUrun.aktif !== false; // undefined ise true kabul et
            } else {
                anaUrunDisplay = `ID: ${agac.ana_urun_id} (Bulunamadı)`;
            }
        } else if (agac.ana_urun_tipi === 'nihai') {
            const anaUrun = nihaiUrunler.find(n => n.id === agac.ana_urun_id);
            if (anaUrun) {
                anaUrunDisplay = `${anaUrun.ad} (nihai)`;
                anaUrunAd = anaUrun.ad;
                anaUrunAktif = anaUrun.aktif !== false; // undefined ise true kabul et
            } else {
                anaUrunDisplay = `ID: ${agac.ana_urun_id} (Bulunamadı)`;
            }
        }
        
        // Alt ürün adını doğru şekilde al
        let altUrunDisplay = 'Bilinmeyen';
        let altUrunAd = '';
        let altUrunId = agac.alt_urun_id;
        let altUrunTipi = agac.alt_urun_tipi;
        let altUrunAktif = true;
        
        if (agac.alt_urun_tipi === 'hammadde') {
            const altUrun = hammaddeler.find(h => h.id === agac.alt_urun_id);
            if (altUrun) {
                altUrunDisplay = `${altUrun.ad} (hammadde)`;
                altUrunAd = altUrun.ad;
                altUrunAktif = altUrun.aktif !== false; // undefined ise true kabul et
            } else {
                altUrunDisplay = `ID: ${agac.alt_urun_id} (Bulunamadı)`;
            }
        } else if (agac.alt_urun_tipi === 'yarimamul') {
            const altUrun = yarimamuller.find(y => y.id === agac.alt_urun_id);
            if (altUrun) {
                altUrunDisplay = `${altUrun.ad} (yarimamul)`;
                altUrunAd = altUrun.ad;
                altUrunAktif = altUrun.aktif !== false; // undefined ise true kabul et
            } else {
                altUrunDisplay = `ID: ${agac.alt_urun_id} (Bulunamadı)`;
            }
        } else if (agac.alt_urun_tipi === 'nihai') {
            const altUrun = nihaiUrunler.find(n => n.id === agac.alt_urun_id);
            if (altUrun) {
                altUrunDisplay = `${altUrun.ad} (nihai)`;
                altUrunAd = altUrun.ad;
                altUrunAktif = altUrun.aktif !== false; // undefined ise true kabul et
            } else {
                altUrunDisplay = `ID: ${agac.alt_urun_id} (Bulunamadı)`;
            }
        }
        
        // Filtre için data attribute'ları ekle
        row.dataset.anaUrunId = anaUrunId;
        row.dataset.anaUrunAd = anaUrunAd;
        row.dataset.anaUrunTipi = anaUrunTipi;
        row.dataset.altUrunId = altUrunId;
        row.dataset.altUrunAd = altUrunAd;
        row.dataset.altUrunTipi = altUrunTipi;
        row.dataset.isActive = (anaUrunAktif && altUrunAktif).toString();
        
        row.innerHTML = `
            <td>${anaUrunDisplay}</td>
            <td>${altUrunDisplay}</td>
            <td>${agac.gerekli_miktar}</td>
            <td>
                <button class="btn btn-warning btn-sm me-1" onclick="editUrunAgaci(${agac.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteUrunAgaci(${agac.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Filtre uygulanmışsa, filtreleme yap
    if (urunAgaciFilter.anaUrun || urunAgaciFilter.sadeceAktif) {
        filterUrunAgaciListesi();
    }
}

// Ürün ağacı listesini güncelle (renderUrunAgaciListesi'nin alias'ı)
function updateUrunAgaciListesi() {
    renderUrunAgaciListesi();
}

// Ürün seçeneklerini güncelle
function updateUrunSelects() {
    const anaUrunSelect = document.getElementById('ana-urun');
    
    // Ana ürünler: Sadece yarı mamuller ve nihai ürünler
    const anaUrunler = [
        ...yarimamuller.map(y => ({ id: y.id, ad: y.ad, tip: 'yarimamul' })),
        ...nihaiUrunler.map(n => ({ id: n.id, ad: n.ad, tip: 'nihai' }))
    ];
    
    // Ana ürün seçeneklerini güncelle (sadece yarı mamul ve nihai ürün)
    anaUrunSelect.innerHTML = '<option value="">Seçiniz...</option>';
    anaUrunler.forEach(urun => {
        const option = document.createElement('option');
        option.value = urun.id;
        option.textContent = `${urun.ad} (${urun.tip})`;
        anaUrunSelect.appendChild(option);
    });
    
    // Ana ürün seçimi değiştiğinde alt ürünleri güncelle
    anaUrunSelect.addEventListener('change', function() {
        updateAltUrunSelectsForAnaUrun(this.value);
    });
    
    // İlk yüklemede alt ürün select'lerini temizle
    updateAllAltUrunSelects([]);
}

// Ana ürün seçildiğinde alt ürünleri güncelle
function updateAltUrunSelectsForAnaUrun(anaUrunId) {
    if (!anaUrunId) {
        // Ana ürün seçilmediyse tüm alt ürün select'lerini temizle
        updateAllAltUrunSelects([]);
        return;
    }
    
    // Seçilen ana ürünün tipini bul
    const anaUrun = getUrunById(anaUrunId);
    if (!anaUrun) return;
    
    // Ana ürünün mevcut alt ürünlerini bul
    const mevcutAltUrunler = urunAgaci.filter(agac => 
        agac.ana_urun_id === parseInt(anaUrunId) && 
        agac.ana_urun_tipi === anaUrun.tip
    );
    
    // Mevcut alt ürünlerin detaylarını al
    const altUrunDetaylari = mevcutAltUrunler.map(agac => {
        let urun = null;
        if (agac.alt_urun_tipi === 'hammadde') {
            urun = hammaddeler.find(h => h.id === agac.alt_urun_id);
        } else if (agac.alt_urun_tipi === 'yarimamul') {
            urun = yarimamuller.find(y => y.id === agac.alt_urun_id);
        } else if (agac.alt_urun_tipi === 'nihai') {
            urun = nihaiUrunler.find(n => n.id === agac.alt_urun_id);
        }
        
        return urun ? {
            id: urun.id,
            ad: urun.ad,
            tip: agac.alt_urun_tipi,
            miktar: agac.gerekli_miktar
        } : null;
    }).filter(urun => urun !== null);
    
    // Alt ürün select'lerini güncelle
    updateAllAltUrunSelects(altUrunDetaylari);
    
    // Mevcut alt ürünleri form alanlarına doldur
    fillAltUrunForm(altUrunDetaylari);
}

// Tüm alt ürün select'lerini güncelle
function updateAllAltUrunSelects(altUrunler) {
    const altUrunSelects = document.querySelectorAll('.alt-urun-select');
    altUrunSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seçiniz...</option>';
        altUrunler.forEach(urun => {
            const option = document.createElement('option');
            option.value = urun.id;
            option.textContent = `${urun.ad} (${urun.tip})`;
            select.appendChild(option);
        });
        select.value = currentValue; // Önceki değeri geri yükle
    });
}

// Mevcut alt ürünleri form alanlarına doldur
function fillAltUrunForm(altUrunDetaylari) {
    const container = document.getElementById('alt-urunler-container');
    container.innerHTML = '';
    
    if (altUrunDetaylari.length === 0) {
        // Hiç alt ürün yoksa boş bir satır ekle
        addAltUrunRow();
        return;
    }
    
    // Her alt ürün için bir satır oluştur
    altUrunDetaylari.forEach(altUrun => {
        const newRow = document.createElement('div');
        newRow.className = 'row mb-3 alt-urun-row';
        
        newRow.innerHTML = `
            <div class="col-md-5">
                <label class="form-label">Alt Ürün</label>
                <select class="form-select alt-urun-select" required>
                    <option value="">Seçiniz...</option>
                    <option value="${altUrun.id}" selected>${altUrun.ad} (${altUrun.tip})</option>
                </select>
            </div>
            <div class="col-md-4">
                <label class="form-label">Gerekli Miktar</label>
                <input type="number" class="form-control alt-urun-miktar" step="0.01" value="${altUrun.miktar}" required>
            </div>
            <div class="col-md-3">
                <label class="form-label">&nbsp;</label>
                <div class="d-flex">
                    <button type="button" class="btn btn-outline-danger btn-sm me-2" onclick="removeAltUrunRow(this)" title="Satırı Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button type="button" class="btn btn-outline-info btn-sm" onclick="duplicateAltUrunRow(this)" title="Satırı Kopyala">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(newRow);
    });
    
    // Yeni satır ekleme butonu
    const addRowDiv = document.createElement('div');
    addRowDiv.className = 'row mb-3';
    addRowDiv.innerHTML = `
        <div class="col-12">
            <button type="button" class="btn btn-outline-success btn-sm" onclick="addAltUrunRow()">
                <i class="fas fa-plus me-1"></i>Yeni Alt Ürün Ekle
            </button>
        </div>
    `;
    container.appendChild(addRowDiv);
}

// Ürün adını getir
function getUrunAdi(id) {
    // Veri yüklenmemişse bekle
    if (!hammaddeler || !yarimamuller || !nihaiUrunler) {
        return 'Yükleniyor...';
    }
    
    const tumUrunler = [
        ...hammaddeler.map(h => ({ id: h.id, ad: h.ad, tip: 'hammadde' })),
        ...yarimamuller.map(y => ({ id: y.id, ad: y.ad, tip: 'yarimamul' })),
        ...nihaiUrunler.map(n => ({ id: n.id, ad: n.ad, tip: 'nihai' }))
    ];
    
    const urun = tumUrunler.find(u => u.id == id);
    return urun ? `${urun.ad} (${urun.tip})` : `ID: ${id} (Bulunamadı)`;
}

// ID'ye göre ürün getir
function getUrunById(id) {
    // ÖNCE yarı mamullerde ara (daha spesifik)
    const yarimamul = yarimamuller.find(y => y.id == id);
    if (yarimamul) {
        return { id: yarimamul.id, ad: yarimamul.ad, tip: 'yarimamul' };
    }
    
    // SONRA nihai ürünlerde ara
    const nihai = nihaiUrunler.find(n => n.id == id);
    if (nihai) {
        return { id: nihai.id, ad: nihai.ad, tip: 'nihai' };
    }
    
    // SON OLARAK hammaddelerde ara
    const hammadde = hammaddeler.find(h => h.id == id);
    if (hammadde) {
        return { id: hammadde.id, ad: hammadde.ad, tip: 'hammadde' };
    }
    
    return null;
}

// Debug için ürün bilgilerini kontrol et
function debugUrunBilgileri() {
    console.log('Hammaddeler:', hammaddeler.map(h => ({ id: h.id, ad: h.ad })));
    console.log('Yarı Mamuller:', yarimamuller.map(y => ({ id: y.id, ad: y.ad })));
    console.log('Nihai Ürünler:', nihaiUrunler.map(n => ({ id: n.id, ad: n.ad })));
    
    const br02 = getUrunById(10);
    console.log('BR02 (ID: 10):', br02);
}

// Debug için ürün bilgilerini kontrol et
function debugUrunBilgileri() {
    console.log('Hammaddeler:', hammaddeler.map(h => ({ id: h.id, ad: h.ad })));
    console.log('Yarı Mamuller:', yarimamuller.map(y => ({ id: y.id, ad: y.ad })));
    console.log('Nihai Ürünler:', nihaiUrunler.map(n => ({ id: n.id, ad: n.ad })));
    
    const br02 = getUrunById(10);
    console.log('BR02 (ID: 10):', br02);
}

// Malzeme gereksinimlerini hesapla
function calculateMaterialRequirements() {
    const anaUrunId = document.getElementById('ana-urun').value;
    
    if (!anaUrunId) {
        showAlert('Lütfen ana ürün seçiniz', 'warning');
        return;
    }
    
    // Alt ürün satırlarını kontrol et
    const altUrunRows = document.querySelectorAll('.alt-urun-row');
    if (altUrunRows.length === 0) {
        showAlert('Lütfen en az bir alt ürün ekleyiniz', 'warning');
        return;
    }
    
    const anaUrun = getUrunById(anaUrunId);
    if (!anaUrun) {
        showAlert('Ana ürün bilgisi bulunamadı', 'error');
        return;
    }
    
    // Tüm alt ürünler için malzemeleri hesapla
    let allMaterials = [];
    let totalCost = 0;
    
    altUrunRows.forEach((row, index) => {
        const select = row.querySelector('.alt-urun-select');
        const miktar = row.querySelector('.alt-urun-miktar');
        
        if (!select.value || !miktar.value) {
            showAlert(`${index + 1}. satırda eksik bilgi var`, 'warning');
            return;
        }
        
        const altUrun = getUrunById(select.value);
        if (!altUrun) {
            showAlert(`${index + 1}. satırdaki ürün bulunamadı`, 'error');
            return;
        }
        
        const quantity = parseFloat(miktar.value);
        const materials = calculateMaterialsForProduct(select.value, altUrun.tip, quantity);
        
        // Malzemeleri birleştir (aynı malzeme varsa miktarları topla)
        materials.forEach(material => {
            const existingMaterial = allMaterials.find(m => m.id === material.id);
            if (existingMaterial) {
                existingMaterial.required += material.required;
                existingMaterial.totalCost += material.totalCost;
            } else {
                allMaterials.push({...material});
            }
        });
    });
    
    // Toplam maliyeti hesapla
    totalCost = allMaterials.reduce((sum, m) => sum + m.totalCost, 0);
    
    // Sonuçları göster
    displayMaterialCalculationResults(allMaterials, anaUrun, null, 1, totalCost);
}

// Belirli bir ürün için gerekli malzemeleri hesapla
function calculateMaterialsForProduct(productId, productType, quantity) {
    const materials = [];
    
    // Ürün ağacından alt ürünleri bul
    const bomItems = urunAgaci.filter(item => 
        item.ana_urun_id === parseInt(productId) && 
        item.ana_urun_tipi === productType
    );

    for (const bomItem of bomItems) {
        const requiredQuantity = bomItem.gerekli_miktar * quantity;
        let material = null;
        let currentStock = 0;
        let unitPrice = 0;

        // Malzeme tipine göre bilgileri al
        if (bomItem.alt_urun_tipi === 'hammadde') {
            material = hammaddeler.find(h => h.id === bomItem.alt_urun_id);
            if (material) {
                currentStock = material.miktar;
                unitPrice = material.birim_fiyat;
            }
        } else if (bomItem.alt_urun_tipi === 'yarimamul') {
            material = yarimamuller.find(y => y.id === bomItem.alt_urun_id);
            if (material) {
                currentStock = material.miktar;
                unitPrice = material.birim_maliyet;
            }
        }

        if (material) {
            const shortage = Math.max(0, requiredQuantity - currentStock);
            const totalCost = requiredQuantity * unitPrice;

            materials.push({
                id: material.id,
                name: material.ad,
                code: material.kod,
                type: bomItem.alt_urun_tipi,
                required: requiredQuantity,
                available: currentStock,
                shortage: shortage,
                unit: bomItem.birim,
                unitPrice: unitPrice,
                totalCost: totalCost
            });
        }
    }

    return materials;
}

// Malzeme hesaplama sonuçlarını göster
function displayMaterialCalculationResults(materials, anaUrun, altUrun, quantity, totalCost = null) {
    const resultsDiv = document.getElementById('material-calculation-results');
    const tbody = document.getElementById('material-calculation-list');
    
    tbody.innerHTML = '';

    if (totalCost === null) {
        totalCost = materials.reduce((sum, m) => sum + m.totalCost, 0);
    }

    materials.forEach(material => {
        const row = document.createElement('tr');
        const shortageClass = material.shortage > 0 ? 'text-danger' : 'text-success';
        
        row.innerHTML = `
            <td>${material.name} (${material.code})</td>
            <td><span class="badge bg-${material.type === 'hammadde' ? 'primary' : 'warning'}">${material.type}</span></td>
            <td>${material.required.toFixed(2)} ${material.unit}</td>
            <td>${material.available.toFixed(2)} ${material.unit}</td>
            <td class="${shortageClass}">${material.shortage.toFixed(2)} ${material.unit}</td>
            <td>₺${material.unitPrice.toFixed(2)}</td>
            <td>₺${material.totalCost.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });

    // Toplam maliyeti güncelle
    document.getElementById('total-material-cost').textContent = `₺${totalCost.toFixed(2)}`;
    
    // Sonuçları göster
    resultsDiv.style.display = 'block';
    
    // Sayfayı sonuçlara kaydır
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
    
    const message = altUrun ? 
        `${altUrun.ad} üretimi için ${materials.length} malzeme gerekiyor` :
        `${anaUrun.ad} üretimi için toplam ${materials.length} malzeme gerekiyor`;
    
    showAlert(message, 'info');
}

// Alert gösterme fonksiyonu
// Alert gösterme fonksiyonu (Modal pop-up)
function showAlert(message, type = 'info') {
    const modalElement = document.getElementById('alertModal');
    const modal = new bootstrap.Modal(modalElement);
    const modalHeader = document.getElementById('alertModalHeader');
    const modalTitle = document.getElementById('alertModalTitle');
    const modalBody = document.getElementById('alertModalBody');
    
    // Modal başlık ve renk ayarları
    const alertConfig = {
        'success': {
            title: 'Başarılı',
            class: 'bg-success text-white',
            icon: 'fas fa-check-circle text-success me-2'
        },
        'error': {
            title: 'Hata',
            class: 'bg-danger text-white',
            icon: 'fas fa-exclamation-triangle text-danger me-2'
        },
        'warning': {
            title: 'Uyarı',
            class: 'bg-warning text-dark',
            icon: 'fas fa-exclamation-triangle text-warning me-2'
        },
        'info': {
            title: 'Bilgi',
            class: 'bg-info text-white',
            icon: 'fas fa-info-circle text-info me-2'
        }
    };
    
    const config = alertConfig[type] || alertConfig['info'];
    
    // Modal başlığını güncelle
    modalTitle.textContent = config.title;
    modalHeader.className = `modal-header ${config.class}`;
    
    // Modal içeriğini güncelle
    modalBody.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="${config.icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Modal event listener'ları temizle
    modalElement.removeEventListener('hidden.bs.modal', modalElement._alertHandler);
    
    // Modal kapanma event handler'ı ekle
    modalElement._alertHandler = function() {
        // Modal tamamen kapandıktan sonra backdrop'u temizle
        setTimeout(() => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, 100);
    };
    
    modalElement.addEventListener('hidden.bs.modal', modalElement._alertHandler);
    
    // Modal'ı göster
    modal.show();
    
    // Başarı mesajları için otomatik kapanma
    if (type === 'success') {
        setTimeout(() => {
            modal.hide();
        }, 2000);
    }
}

// Silme fonksiyonları
async function deleteHammadde(id) {
    if (confirm('Bu hammaddeyi silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/hammaddeler/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const result = await response.json();
                showAlert('Hammadde başarıyla silindi!', 'success');
                loadHammaddeler(); // Listeyi yenile
            } else {
                const error = await response.json();
                showAlert(error.error, 'danger');
            }
        } catch (error) {
            console.error('Silme hatası:', error);
            showAlert('Silme işlemi sırasında hata oluştu', 'danger');
        }
    }
}

async function deleteYarimamul(id) {
    if (confirm('Bu yarı mamulü silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/yarimamuller/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const result = await response.json();
                showAlert('Yarı mamul başarıyla silindi!', 'success');
                loadYarimamuller(); // Listeyi yenile
            } else {
                const error = await response.json();
                showAlert(error.error, 'danger');
            }
        } catch (error) {
            console.error('Silme hatası:', error);
            showAlert('Silme işlemi sırasında hata oluştu', 'danger');
        }
    }
}

async function deleteNihai(id) {
    if (confirm('Bu nihai ürünü silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/nihai_urunler/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const result = await response.json();
                showAlert('Nihai ürün başarıyla silindi!', 'success');
                loadNihaiUrunler(); // Listeyi yenile
            } else {
                const error = await response.json();
                showAlert(error.error, 'danger');
            }
        } catch (error) {
            console.error('Silme hatası:', error);
            showAlert('Silme işlemi sırasında hata oluştu', 'danger');
        }
    }
}

async function deleteUrunAgaci(id) {
    if (confirm('Bu ürün ağacı kaydını silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/urun_agaci/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const result = await response.json();
                showAlert(result.message, 'success');
                loadUrunAgaci(); // Listeyi yenile
            } else {
                const error = await response.json();
                showAlert(error.error, 'danger');
            }
        } catch (error) {
            console.error('Silme hatası:', error);
            showAlert('Silme işlemi sırasında hata oluştu', 'danger');
        }
    }
}

// Düzenleme fonksiyonları
function editHammadde(id) {
    const hammadde = hammaddeler.find(h => h.id === id);
    if (hammadde) {
        // Form alanlarını doldur
        document.getElementById('hammadde-adi').value = hammadde.ad;
        document.getElementById('hammadde-kodu').value = hammadde.kod;
        document.getElementById('hammadde-miktar').value = hammadde.miktar;
        document.getElementById('hammadde-birim').value = hammadde.birim;
        document.getElementById('hammadde-fiyat').value = hammadde.birim_fiyat;
        document.getElementById('hammadde-aciklama').value = hammadde.aciklama || '';
        
        // Form submit event'ini güncelle
        const form = document.getElementById('hammadde-form');
        form.onsubmit = function(e) {
            e.preventDefault();
            updateHammadde(id);
        };
        
        // Buton metnini güncelle
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save me-1"></i>Güncelle';
        
        showAlert('Hammadde düzenleme moduna geçildi', 'info');
    }
}

function editYarimamul(id) {
    const yarimamul = yarimamuller.find(y => y.id === id);
    if (yarimamul) {
        // Form alanlarını doldur
        document.getElementById('yarimamul-adi').value = yarimamul.ad;
        document.getElementById('yarimamul-kodu').value = yarimamul.kod;
        document.getElementById('yarimamul-barkod').value = yarimamul.barkod || '';
        document.getElementById('yarimamul-miktar').value = yarimamul.miktar;
        document.getElementById('yarimamul-birim').value = yarimamul.birim;
        document.getElementById('yarimamul-maliyet').value = yarimamul.birim_maliyet;
        document.getElementById('yarimamul-aciklama').value = yarimamul.aciklama || '';
        
        // Form submit event'ini güncelle
        const form = document.getElementById('yarimamul-form');
        form.onsubmit = function(e) {
            e.preventDefault();
            updateYarimamul(id);
        };
        
        // Buton metnini güncelle
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save me-1"></i>Güncelle';
        
        showAlert('Yarı mamul düzenleme moduna geçildi', 'info');
    }
}

function editNihai(id) {
    const nihai = nihaiUrunler.find(n => n.id === id);
    if (nihai) {
        // Form alanlarını doldur
        document.getElementById('nihai-adi').value = nihai.ad;
        document.getElementById('nihai-kodu').value = nihai.kod;
        document.getElementById('nihai-barkod').value = nihai.barkod || '';
        document.getElementById('nihai-miktar').value = nihai.miktar;
        document.getElementById('nihai-birim').value = nihai.birim;
        document.getElementById('nihai-fiyat').value = nihai.satis_fiyati;
        document.getElementById('nihai-aciklama').value = nihai.aciklama || '';
        
        // Form submit event'ini güncelle
        const form = document.getElementById('nihai-form');
        form.onsubmit = function(e) {
            e.preventDefault();
            updateNihai(id);
        };
        
        // Buton metnini güncelle
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save me-1"></i>Güncelle';
        
        showAlert('Nihai ürün düzenleme moduna geçildi', 'info');
    }
}

function editUrunAgaci(id) {
    const agac = urunAgaci.find(u => u.id === id);
    if (agac) {
        // Form alanlarını doldur
        document.getElementById('ana-urun').value = agac.ana_urun_id;
        document.getElementById('alt-urun').value = agac.alt_urun_id;
        document.getElementById('gerekli-miktar').value = agac.gerekli_miktar;
        
        // Form submit event'ini güncelle
        const form = document.getElementById('urun-agaci-form');
        form.onsubmit = function(e) {
            e.preventDefault();
            updateUrunAgaci(id);
        };
        
        // Buton metnini güncelle
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save me-1"></i>Güncelle';
        
        showAlert('Ürün ağacı düzenleme moduna geçildi', 'info');
    }
}

// Güncelleme fonksiyonları
async function updateHammadde(id) {
    const hammadde = {
        ad: document.getElementById('hammadde-adi').value,
        kod: document.getElementById('hammadde-kodu').value,
        miktar: parseFloat(document.getElementById('hammadde-miktar').value),
        birim: document.getElementById('hammadde-birim').value,
        birim_fiyat: parseFloat(document.getElementById('hammadde-fiyat').value),
        aciklama: document.getElementById('hammadde-aciklama').value
    };

    try {
        const response = await fetch(`/api/hammaddeler/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(hammadde)
        });

        if (response.ok) {
            const updatedHammadde = await response.json();
            // Yerel diziyi güncelle
            const index = hammaddeler.findIndex(h => h.id === id);
            if (index !== -1) {
                hammaddeler[index] = updatedHammadde;
                renderHammaddeListesi();
            }
            showAlert('Hammadde başarıyla güncellendi', 'success');
            resetHammaddeForm();
        } else {
            const error = await response.json();
            showAlert(error.error, 'danger');
        }
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        showAlert('Güncelleme işlemi sırasında hata oluştu', 'danger');
    }
}

async function updateYarimamul(id) {
    const yarimamul = {
        ad: document.getElementById('yarimamul-adi').value,
        kod: document.getElementById('yarimamul-kodu').value,
        barkod: document.getElementById('yarimamul-barkod').value,
        miktar: parseFloat(document.getElementById('yarimamul-miktar').value),
        birim: document.getElementById('yarimamul-birim').value,
        birim_maliyet: parseFloat(document.getElementById('yarimamul-maliyet').value),
        aciklama: document.getElementById('yarimamul-aciklama').value
    };

    try {
        const response = await fetch(`/api/yarimamuller/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(yarimamul)
        });

        if (response.ok) {
            const updatedYarimamul = await response.json();
            // Yerel diziyi güncelle
            const index = yarimamuller.findIndex(y => y.id === id);
            if (index !== -1) {
                yarimamuller[index] = updatedYarimamul;
                renderYarimamulListesi();
            }
            showAlert('Yarı mamul başarıyla güncellendi', 'success');
            resetYarimamulForm();
        } else {
            const error = await response.json();
            showAlert(error.error, 'danger');
        }
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        showAlert('Güncelleme işlemi sırasında hata oluştu', 'danger');
    }
}

async function updateNihai(id) {
    const nihai = {
        ad: document.getElementById('nihai-adi').value,
        kod: document.getElementById('nihai-kodu').value,
        barkod: document.getElementById('nihai-barkod').value,
        miktar: parseFloat(document.getElementById('nihai-miktar').value),
        birim: document.getElementById('nihai-birim').value,
        satis_fiyati: parseFloat(document.getElementById('nihai-fiyat').value),
        aciklama: document.getElementById('nihai-aciklama').value
    };

    try {
        const response = await fetch(`/api/nihai_urunler/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nihai)
        });

        if (response.ok) {
            const updatedNihai = await response.json();
            // Yerel diziyi güncelle
            const index = nihaiUrunler.findIndex(n => n.id === id);
            if (index !== -1) {
                nihaiUrunler[index] = updatedNihai;
                renderNihaiListesi();
            }
            showAlert('Nihai ürün başarıyla güncellendi', 'success');
            resetNihaiForm();
        } else {
            const error = await response.json();
            showAlert(error.error, 'danger');
        }
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        showAlert('Güncelleme işlemi sırasında hata oluştu', 'danger');
    }
}

// Nihai ürün BOM maliyetini hesapla
async function updateNihaiCostFromBOM(nihaiId) {
    try {
        console.log(`Nihai ürün ${nihaiId} için BOM maliyeti hesaplanıyor...`);
        
        const bomCostData = await calculateBOMCost(nihaiId, 'nihai');
        const bomCost = bomCostData.totalCost || 0;
        console.log(`Hesaplanan BOM maliyeti: ₺${bomCost}`);
        
        if (bomCost > 0) {
            // Nihai ürünün BOM maliyetini güncelle
            const response = await fetch(`/api/nihai_urunler/${nihaiId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bom_maliyet: bomCost
                })
            });
            
            if (response.ok) {
                // Yerel veriyi güncelle
                const nihai = nihaiUrunler.find(n => n.id === nihaiId);
                if (nihai) {
                    nihai.bom_maliyet = bomCost;
                }
                
                // Ekranları güncelle
                renderNihaiListesi();
                
                showAlert(`Nihai ürün BOM maliyeti güncellendi: ₺${bomCost.toFixed(2)}`, 'success');
            } else {
                console.error('Nihai ürün maliyet güncelleme hatası:', response.status);
                showAlert('Maliyet güncelleme hatası', 'danger');
            }
        } else {
            showAlert('BOM maliyeti hesaplanamadı. Ürün ağacı kontrol edin.', 'warning');
        }
    } catch (error) {
        console.error('Nihai ürün BOM maliyet hesaplama hatası:', error);
        showAlert('BOM maliyet hesaplama sırasında hata oluştu', 'danger');
    }
}

// Tüm nihai ürünlerin BOM maliyetlerini hesapla
async function updateAllNihaiCostsFromBOM() {
    try {
        console.log('Tüm nihai ürünler için BOM maliyeti hesaplanıyor...');
        showAlert('BOM maliyetleri hesaplanıyor...', 'info');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const nihai of nihaiUrunler) {
            try {
                console.log(`Nihai ürün ${nihai.id} (${nihai.ad}) için maliyet hesaplanıyor...`);
                
        const bomCostData = await calculateBOMCost(nihai.id, 'nihai');
        const bomCost = bomCostData.totalCost || 0;
        console.log(`Nihai ürün ${nihai.id} BOM maliyeti: ₺${bomCost}`);
        
        if (bomCost > 0) {
                    // Nihai ürünün BOM maliyetini güncelle
                    const response = await fetch(`/api/nihai_urunler/${nihai.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            bom_maliyet: bomCost
                        })
                    });
                    
                    if (response.ok) {
                        nihai.bom_maliyet = bomCost;
                        successCount++;
                        console.log(`Nihai ürün ${nihai.id} maliyeti güncellendi: ₺${bomCost}`);
                    } else {
                        errorCount++;
                        console.error(`Nihai ürün ${nihai.id} maliyet güncelleme hatası:`, response.status);
                    }
                } else {
                    errorCount++;
                    console.log(`Nihai ürün ${nihai.id} için BOM bulunamadı veya maliyet 0`);
                }
            } catch (error) {
                errorCount++;
                console.error(`Nihai ürün ${nihai.id} işleme hatası:`, error);
            }
        }
        
        // Ekranları güncelle
        renderNihaiListesi();
        
        // Sonuç mesajı
        const message = `Maliyet hesaplama tamamlandı! ✅ Başarılı: ${successCount} ürün ❌ Hata: ${errorCount} ürün`;
        showAlert(message, successCount > 0 ? 'success' : 'warning');
        
        console.log('Nihai ürün BOM maliyet hesaplama tamamlandı:', { successCount, errorCount });
        
    } catch (error) {
        console.error('Nihai ürün BOM maliyet hesaplama hatası:', error);
        showAlert('BOM maliyet hesaplama sırasında hata oluştu', 'danger');
    }
}

async function updateUrunAgaci(id) {
    const agac = {
        ana_urun_id: document.getElementById('ana-urun').value,
        alt_urun_id: document.getElementById('alt-urun').value,
        gerekli_miktar: parseFloat(document.getElementById('gerekli-miktar').value)
    };

    try {
        const response = await fetch(`/api/urun_agaci/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(agac)
        });

        if (response.ok) {
            const updatedAgac = await response.json();
            // Yerel diziyi güncelle
            const index = urunAgaci.findIndex(u => u.id === id);
            if (index !== -1) {
                urunAgaci[index] = updatedAgac;
                renderUrunAgaciListesi();
            }
            showAlert('Ürün ağacı başarıyla güncellendi', 'success');
            resetUrunAgaciForm();
        } else {
            const error = await response.json();
            showAlert(error.error, 'danger');
        }
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        showAlert('Güncelleme işlemi sırasında hata oluştu', 'danger');
    }
}

// Form sıfırlama fonksiyonları
function resetHammaddeForm() {
    document.getElementById('hammadde-form').reset();
    document.getElementById('hammadde-form').onsubmit = handleHammaddeSubmit;
    const submitBtn = document.querySelector('#hammadde-form button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus me-1"></i>Hammadde Ekle';
}

function resetYarimamulForm() {
    document.getElementById('yarimamul-form').reset();
    document.getElementById('yarimamul-form').onsubmit = handleYarimamulSubmit;
    const submitBtn = document.querySelector('#yarimamul-form button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus me-1"></i>Yarı Mamul Ekle';
}

function resetNihaiForm() {
    document.getElementById('nihai-form').reset();
    document.getElementById('nihai-form').onsubmit = handleNihaiSubmit;
    const submitBtn = document.querySelector('#nihai-form button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus me-1"></i>Nihai Ürün Ekle';
}

function resetUrunAgaciForm() {
    document.getElementById('urun-agaci-form').reset();
    document.getElementById('urun-agaci-form').onsubmit = handleUrunAgaciSubmit;
    const submitBtn = document.querySelector('#urun-agaci-form button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus me-1"></i>Ürün Ağacı Ekle';
}

// Alt ürün satırı ekle
function addAltUrunRow() {
    const container = document.getElementById('alt-urunler-container');
    const newRow = document.createElement('div');
    newRow.className = 'row mb-3 alt-urun-row';
    
    // Tüm ürünler listesi (yeni ekleme için)
    const tumUrunler = [
        ...hammaddeler.map(h => ({ id: h.id, ad: h.ad, tip: 'hammadde' })),
        ...yarimamuller.map(y => ({ id: y.id, ad: y.ad, tip: 'yarimamul' })),
        ...nihaiUrunler.map(n => ({ id: n.id, ad: n.ad, tip: 'nihai' }))
    ];
    
    newRow.innerHTML = `
        <div class="col-md-5">
            <label class="form-label">Alt Ürün</label>
            <select class="form-select alt-urun-select" required>
                <option value="">Seçiniz...</option>
                ${tumUrunler.map(urun => 
                    `<option value="${urun.id}">${urun.ad} (${urun.tip})</option>`
                ).join('')}
            </select>
        </div>
        <div class="col-md-4">
            <label class="form-label">Gerekli Miktar</label>
            <input type="number" class="form-control alt-urun-miktar" step="0.01" required>
        </div>
        <div class="col-md-3">
            <label class="form-label">&nbsp;</label>
            <div class="d-flex">
                <button type="button" class="btn btn-outline-danger btn-sm me-2" onclick="removeAltUrunRow(this)" title="Satırı Sil">
                    <i class="fas fa-trash"></i>
                </button>
                <button type="button" class="btn btn-outline-info btn-sm" onclick="duplicateAltUrunRow(this)" title="Satırı Kopyala">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // Yeni satırdaki select'e odaklan
    const newSelect = newRow.querySelector('.alt-urun-select');
    setTimeout(() => newSelect.focus(), 100);
}

// Alt ürün satırını sil
function removeAltUrunRow(button) {
    const row = button.closest('.alt-urun-row');
    const container = document.getElementById('alt-urunler-container');
    const rows = container.querySelectorAll('.alt-urun-row');
    
    // En az bir satır kalmalı
    if (rows.length <= 1) {
        showAlert('En az bir alt ürün satırı olmalıdır', 'warning');
        return;
    }
    
    row.remove();
}

// Alt ürün satırını kopyala
function duplicateAltUrunRow(button) {
    const row = button.closest('.alt-urun-row');
    const newRow = row.cloneNode(true);
    
    // Yeni satırdaki input'ları temizle
    newRow.querySelector('.alt-urun-select').value = '';
    newRow.querySelector('.alt-urun-miktar').value = '';
    
    // Yeni satırı ekle
    row.parentNode.insertBefore(newRow, row.nextSibling);
    
    // Yeni satırdaki select'e odaklan
    const newSelect = newRow.querySelector('.alt-urun-select');
    setTimeout(() => newSelect.focus(), 100);
}

// Ürün ağacı formunu temizle
function clearUrunAgaciForm() {
    document.getElementById('ana-urun').value = '';
    
    // Tüm alt ürün satırlarını sil
    const container = document.getElementById('alt-urunler-container');
    container.innerHTML = '';
    
    // İlk satırı ekle
    addAltUrunRow();
}

// Ürün ağacı filtre değişkenleri
let urunAgaciFilter = {
    anaUrun: '',
    sadeceAktif: false
};

// Filtre bölümünü göster/gizle
function toggleUrunAgaciFilter() {
    const filterDiv = document.getElementById('urun-agaci-filter');
    const isVisible = filterDiv.style.display !== 'none';
    
    if (isVisible) {
        filterDiv.style.display = 'none';
    } else {
        filterDiv.style.display = 'block';
        // Filtre seçeneklerini güncelle
        updateUrunAgaciFilterOptions();
    }
}

// Filtre seçeneklerini güncelle
function updateUrunAgaciFilterOptions() {
    // Ana ürün seçenekleri - sadece yarı mamul ve nihai ürünler
    const anaUrunSelect = document.getElementById('filter-ana-urun');
    anaUrunSelect.innerHTML = '<option value="">Tümü</option>';
    
    // Sadece yarı mamul ve nihai ürünleri ekle
    const anaUrunler = [
        ...yarimamuller.map(y => ({ id: y.id, ad: y.ad, tip: 'yarimamul' })),
        ...nihaiUrunler.map(n => ({ id: n.id, ad: n.ad, tip: 'nihai' }))
    ];
    
    anaUrunler.forEach(urun => {
        const option = document.createElement('option');
        option.value = urun.id;
        option.textContent = `${urun.ad} (${urun.tip})`;
        anaUrunSelect.appendChild(option);
    });
}

// Filtreleri temizle
function clearUrunAgaciFilter() {
    document.getElementById('filter-ana-urun').value = '';
    document.getElementById('filter-sadece-aktif').checked = false;
    
    urunAgaciFilter = {
        anaUrun: '',
        sadeceAktif: false
    };
    
    // Filtre sonuçlarını gizle
    document.getElementById('filter-results-info').style.display = 'none';
    
    // Listeyi yenile
    updateUrunAgaciListesi();
}

// Filtre değişikliklerini dinle
function setupUrunAgaciFilterListeners() {
    const filterInputs = [
        'filter-ana-urun',
        'filter-sadece-aktif'
    ];
    
    filterInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            if (element.type === 'checkbox') {
                element.addEventListener('change', handleUrunAgaciFilterChange);
            } else {
                element.addEventListener('input', handleUrunAgaciFilterChange);
            }
        }
    });
}

// Filtre değişikliği işleyicisi
function handleUrunAgaciFilterChange() {
    // Filtre değerlerini güncelle
    urunAgaciFilter.anaUrun = document.getElementById('filter-ana-urun').value;
    urunAgaciFilter.sadeceAktif = document.getElementById('filter-sadece-aktif').checked;
    
    // Listeyi filtrele
    filterUrunAgaciListesi();
}

// Ürün ağacı listesini filtrele
function filterUrunAgaciListesi() {
    const tbody = document.getElementById('urun-agaci-listesi');
    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;
    let totalCount = rows.length;
    
    rows.forEach(row => {
        let showRow = true;
        
        // Ana ürün filtresi
        if (urunAgaciFilter.anaUrun) {
            const anaUrunId = row.dataset.anaUrunId;
            if (anaUrunId !== urunAgaciFilter.anaUrun) {
                showRow = false;
            }
        }
        
        // Sadece aktif ürünler filtresi
        if (urunAgaciFilter.sadeceAktif && showRow) {
            const isActive = row.dataset.isActive === 'true';
            if (!isActive) {
                showRow = false;
            }
        }
        
        // Satırı göster/gizle
        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    });
    
    // Filtre sonuçları bilgisini güncelle
    updateFilterResultsInfo(visibleCount, totalCount);
}

// Filtre sonuçları bilgisini güncelle
function updateFilterResultsInfo(visibleCount, totalCount) {
    const resultsInfo = document.getElementById('filter-results-info');
    const resultsText = document.getElementById('filter-results-text');
    
    if (visibleCount < totalCount) {
        resultsText.textContent = `${visibleCount} / ${totalCount} kayıt gösteriliyor`;
        resultsInfo.style.display = 'block';
    } else {
        resultsInfo.style.display = 'none';
    }
}

// Debug fonksiyonu - BR01 kaydını kontrol et
function debugBR01() {
    console.log('BR01 kaydı aranıyor...');
    const br01 = yarimamuller.find(y => y.kod === 'BR01' || y.ad.includes('BR01'));
    if (br01) {
        console.log('BR01 kaydı bulundu:', br01);
        console.log('Birim maliyet:', br01.birim_maliyet);
        console.log('Miktar:', br01.miktar);
        console.log('Toplam değer:', br01.miktar * br01.birim_maliyet);
    } else {
        console.log('BR01 kaydı bulunamadı');
        console.log('Mevcut yarı mamuller:', yarimamuller);
    }
}

// BR01 kaydını güncelle
async function updateBR01() {
    const br01 = yarimamuller.find(y => y.kod === 'BR01' || y.ad.includes('BR01'));
    if (br01) {
        const newMaliyet = prompt('BR01 için yeni birim maliyet girin:', br01.birim_maliyet || '0');
        if (newMaliyet && !isNaN(newMaliyet)) {
            try {
                const response = await fetch(`/api/yarimamuller/${br01.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ birim_maliyet: parseFloat(newMaliyet) })
                });
                
                if (response.ok) {
                    showAlert('BR01 birim maliyeti güncellendi!', 'success');
                    await loadYarimamuller();
                } else {
                    showAlert('Güncelleme hatası!', 'error');
                }
            } catch (error) {
                console.error('Güncelleme hatası:', error);
                showAlert('Güncelleme hatası!', 'error');
            }
        }
    } else {
        showAlert('BR01 kaydı bulunamadı!', 'error');
    }
}

// BOM tabanlı maliyet hesaplama sistemi
async function calculateBOMCost(productId, productType) {
    try {
        console.log(`BOM hesaplama başlatılıyor: Product ID ${productId}, Type: ${productType}`);
        
        // Ürün ağacından alt ürünleri bul
        const bomItems = urunAgaci.filter(item => 
            item.ana_urun_id === productId && 
            item.ana_urun_tipi === productType
        );

        console.log(`BOM items bulundu:`, bomItems);

        if (bomItems.length === 0) {
            console.log(`Product ID ${productId} için BOM bulunamadı`);
            return { totalCost: 0, breakdown: [] };
        }

        let totalCost = 0;
        let costBreakdown = [];

        for (const bomItem of bomItems) {
            console.log(`BOM item işleniyor:`, bomItem);
            
            let material = null;
            let unitPrice = 0;

            // Malzeme tipine göre bilgileri al
            if (bomItem.alt_urun_tipi === 'hammadde') {
                material = hammaddeler.find(h => h.id === bomItem.alt_urun_id);
                console.log(`Hammadde bulundu:`, material);
                if (material) {
                    unitPrice = material.birim_fiyat;
                } else {
                    console.warn(`Hammadde ID ${bomItem.alt_urun_id} bulunamadı`);
                }
            } else if (bomItem.alt_urun_tipi === 'yarimamul') {
                // Yarı mamul için recursive hesaplama
                console.log(`Yarı mamul recursive hesaplama: ${bomItem.alt_urun_id}`);
                const subCost = await calculateBOMCost(bomItem.alt_urun_id, 'yarimamul');
                unitPrice = subCost.totalCost;
                console.log(`Yarı mamul maliyeti: ${unitPrice}`);
            }

            if (material || bomItem.alt_urun_tipi === 'yarimamul') {
                const itemCost = bomItem.gerekli_miktar * unitPrice;
                totalCost += itemCost;
                
                costBreakdown.push({
                    materialName: material ? material.ad : `Yarı Mamul ID: ${bomItem.alt_urun_id}`,
                    materialType: bomItem.alt_urun_tipi,
                    requiredQuantity: bomItem.gerekli_miktar,
                    unit: bomItem.birim,
                    unitPrice: unitPrice,
                    totalCost: itemCost
                });
                
                console.log(`Item cost eklendi: ${itemCost}, Total: ${totalCost}`);
            } else {
                console.warn(`Malzeme bulunamadı: ${bomItem.alt_urun_tipi} ID ${bomItem.alt_urun_id}`);
            }
        }

        console.log(`BOM hesaplama tamamlandı. Toplam maliyet: ${totalCost}`);
        return {
            totalCost: totalCost,
            breakdown: costBreakdown
        };
    } catch (error) {
        console.error('BOM maliyet hesaplama hatası:', error);
        return { totalCost: 0, breakdown: [] };
    }
}

// Yarı mamul maliyetini BOM'dan hesapla ve güncelle
async function updateYarimamulCostFromBOM(yarimamulId) {
    try {
        const costData = await calculateBOMCost(yarimamulId, 'yarimamul');
        
        if (costData.totalCost > 0) {
            // Yarı mamul maliyetini güncelle
            const response = await fetch(`/api/yarimamuller/${yarimamulId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    birim_maliyet: costData.totalCost
                })
            });
            
            if (response.ok) {
                console.log(`Yarı mamul ID ${yarimamulId} maliyeti BOM'dan hesaplandı: ₺${costData.totalCost.toFixed(2)}`);
                return { success: true, cost: costData.totalCost, breakdown: costData.breakdown };
            } else {
                throw new Error('Maliyet güncelleme hatası');
            }
        } else {
            console.warn(`Yarı mamul ID ${yarimamulId} için BOM bulunamadı veya maliyet 0`);
            return { success: false, message: 'BOM bulunamadı' };
        }
    } catch (error) {
        console.error('Yarı mamul maliyet güncelleme hatası:', error);
        return { success: false, error: error.message };
    }
}

// Tüm yarı mamullerin maliyetini BOM'dan hesapla
async function updateAllYarimamulCostsFromBOM() {
    showAlert('Tüm yarı mamul maliyetleri BOM\'dan hesaplanıyor...', 'info');
    
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    console.log('Mevcut yarı mamuller:', yarimamuller);
    console.log('Mevcut ürün ağacı:', urunAgaci);

    for (const yarimamul of yarimamuller) {
        console.log(`Hesaplanıyor: ${yarimamul.ad} (ID: ${yarimamul.id})`);
        
        const result = await updateYarimamulCostFromBOM(yarimamul.id);
        results.push({
            id: yarimamul.id,
            name: yarimamul.ad,
            result: result
        });
        
        console.log(`${yarimamul.ad} sonucu:`, result);
        
        if (result.success) {
            successCount++;
        } else {
            errorCount++;
        }
    }

    // Verileri yenile
    await loadYarimamuller();

    // Sonuçları göster
    let message = `Maliyet hesaplama tamamlandı!\n`;
    message += `✅ Başarılı: ${successCount} ürün\n`;
    message += `❌ Hata: ${errorCount} ürün`;
    
    if (errorCount > 0) {
        message += `\n\nDetaylar için konsolu kontrol edin.`;
    }
    
    showAlert(message, successCount > 0 ? 'success' : 'warning');
    
    // Detaylı sonuçları konsola yazdır
    console.log('Maliyet hesaplama sonuçları:', results);
    
    return results;
}

// BOM maliyet detaylarını göster
async function showBOMCostDetails(productId, productType = 'yarimamul') {
    let product = null;
    let productName = '';
    
    if (productType === 'yarimamul') {
        product = yarimamuller.find(y => y.id === productId);
        productName = product ? product.ad : 'Bilinmeyen Yarı Mamul';
    } else if (productType === 'nihai') {
        product = nihaiUrunler.find(n => n.id === productId);
        productName = product ? product.ad : 'Bilinmeyen Nihai Ürün';
    }
    
    if (!product) {
        showAlert(`${productType === 'yarimamul' ? 'Yarı mamul' : 'Nihai ürün'} bulunamadı!`, 'error');
        return;
    }

    const costData = await calculateBOMCost(productId, productType);
    
    let details = `BOM Maliyet Detayları: ${productName}\n\n`;
    details += `Toplam Maliyet: ₺${costData.totalCost.toFixed(2)}\n\n`;
    
    if (costData.breakdown.length > 0) {
        details += `Malzeme Detayları:\n`;
        costData.breakdown.forEach((item, index) => {
            details += `${index + 1}. ${item.materialName} (${item.materialType})\n`;
            details += `   Miktar: ${item.requiredQuantity} ${item.unit}\n`;
            details += `   Birim Fiyat: ₺${item.unitPrice.toFixed(2)}\n`;
            details += `   Toplam: ₺${item.totalCost.toFixed(2)}\n\n`;
        });
    } else {
        details += `Bu ürün için BOM tanımlanmamış.`;
    }
    
    showAlert(details, 'info');
}

// Debug fonksiyonu - BOM durumunu kontrol et
function debugBOMStatus() {
    console.log('=== BOM DEBUG RAPORU ===');
    console.log('Yarı Mamuller:', yarimamuller);
    console.log('Hammaddeler:', hammaddeler);
    console.log('Ürün Ağacı:', urunAgaci);
    
    console.log('\n=== YARI MAMUL BOM KONTROLÜ ===');
    yarimamuller.forEach(yarimamul => {
        const bomItems = urunAgaci.filter(item => 
            item.ana_urun_id === yarimamul.id && 
            item.ana_urun_tipi === 'yarimamul'
        );
        console.log(`${yarimamul.ad} (ID: ${yarimamul.id}) - BOM Items:`, bomItems);
        
        if (bomItems.length > 0) {
            bomItems.forEach(bomItem => {
                if (bomItem.alt_urun_tipi === 'hammadde') {
                    const hammadde = hammaddeler.find(h => h.id === bomItem.alt_urun_id);
                    console.log(`  - Hammadde: ${hammadde ? hammadde.ad : 'BULUNAMADI'} (ID: ${bomItem.alt_urun_id})`);
                } else if (bomItem.alt_urun_tipi === 'yarimamul') {
                    const altYarimamul = yarimamuller.find(y => y.id === bomItem.alt_urun_id);
                    console.log(`  - Alt Yarı Mamul: ${altYarimamul ? altYarimamul.ad : 'BULUNAMADI'} (ID: ${bomItem.alt_urun_id})`);
                }
            });
        }
    });
    
    console.log('=== DEBUG RAPORU TAMAMLANDI ===');
}

// Nihai ürünler için debug fonksiyonu
function debugNihaiBOMStatus() {
    console.log('=== NİHAİ ÜRÜN BOM DEBUG ===');
    console.log('Nihai Ürünler:', nihaiUrunler);
    console.log('Ürün Ağacı:', urunAgaci);
    
    nihaiUrunler.forEach(nihai => {
        console.log(`\n--- Nihai Ürün: ${nihai.ad} (ID: ${nihai.id}) ---`);
        
        // Bu nihai ürün için BOM items
        const bomItems = urunAgaci.filter(item => 
            item.ana_urun_id === nihai.id && 
            item.ana_urun_tipi === 'nihai'
        );
        
        console.log(`BOM Items (${bomItems.length} adet):`, bomItems);
        
        if (bomItems.length === 0) {
            console.log('❌ Bu nihai ürün için BOM tanımlanmamış!');
        } else {
            console.log('✅ BOM tanımlanmış, detaylar:');
            bomItems.forEach((item, index) => {
                console.log(`  ${index + 1}. Alt Ürün ID: ${item.alt_urun_id}, Tip: ${item.alt_urun_tipi}, Miktar: ${item.gerekli_miktar}`);
                
                // Alt ürünün var olup olmadığını kontrol et
                if (item.alt_urun_tipi === 'hammadde') {
                    const hammadde = hammaddeler.find(h => h.id === item.alt_urun_id);
                    if (hammadde) {
                        console.log(`     ✅ Hammadde bulundu: ${hammadde.ad} (₺${hammadde.birim_fiyat})`);
                    } else {
                        console.log(`     ❌ Hammadde bulunamadı: ID ${item.alt_urun_id}`);
                    }
                } else if (item.alt_urun_tipi === 'yarimamul') {
                    const yarimamul = yarimamuller.find(y => y.id === item.alt_urun_id);
                    if (yarimamul) {
                        console.log(`     ✅ Yarı mamul bulundu: ${yarimamul.ad} (₺${yarimamul.birim_maliyet})`);
                    } else {
                        console.log(`     ❌ Yarı mamul bulunamadı: ID ${item.alt_urun_id}`);
                    }
                }
            });
        }
    });
}

// Nihai ürünler için örnek BOM oluştur (test amaçlı)
async function createNihaiBOM() {
    try {
        console.log('Nihai ürünler için BOM oluşturuluyor...');
        
        // Nihai ürünleri bul
        const nihaiUrunler = await fetch('/api/nihai_urunler').then(r => r.json());
        console.log('Nihai ürünler:', nihaiUrunler);
        
        // Yarı mamulleri bul
        const yarimamuller = await fetch('/api/yarimamuller').then(r => r.json());
        console.log('Yarı mamuller:', yarimamuller);
        
        // Her nihai ürün için BOM oluştur
        for (const nihai of nihaiUrunler) {
            console.log(`Nihai ürün ${nihai.ad} için BOM oluşturuluyor...`);
            
            // Bu nihai ürün için mevcut BOM var mı kontrol et
            const existingBOM = urunAgaci.filter(item => 
                item.ana_urun_id === nihai.id && item.ana_urun_tipi === 'nihai'
            );
            
            if (existingBOM.length > 0) {
                console.log(`Nihai ürün ${nihai.ad} için BOM zaten mevcut, atlanıyor...`);
                continue;
            }
            
            // Yarı mamulleri nihai ürünlere ekle
            for (const yarimamul of yarimamuller) {
                const bomData = {
                    ana_urun_id: nihai.id,
                    ana_urun_tipi: 'nihai',
                    alt_urun_id: yarimamul.id,
                    alt_urun_tipi: 'yarimamul',
                    gerekli_miktar: 1, // Varsayılan miktar
                    birim: 'adet'
                };
                
                try {
                    const response = await fetch('/api/urun_agaci', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bomData)
                    });
                    
                    if (response.ok) {
                        console.log(`✅ BOM eklendi: ${nihai.ad} -> ${yarimamul.ad}`);
                    } else {
                        console.error(`❌ BOM eklenemedi: ${nihai.ad} -> ${yarimamul.ad}`);
                    }
                } catch (error) {
                    console.error(`BOM ekleme hatası:`, error);
                }
            }
        }
        
        // Verileri yenile
        await loadAllData();
        showAlert('Nihai ürünler için BOM oluşturuldu!', 'success');
        
    } catch (error) {
        console.error('Nihai ürün BOM oluşturma hatası:', error);
        showAlert('BOM oluşturma sırasında hata oluştu', 'danger');
    }
}

// CSV Export/Import Fonksiyonları
let currentImportType = '';

// CSV Export
function exportToCSV(type) {
    let data = [];
    let filename = '';
    
    switch(type) {
        case 'hammadde':
            data = hammaddeler;
            filename = 'hammaddeler.csv';
            break;
        case 'yarimamul':
            data = yarimamuller;
            filename = 'yarimamuller.csv';
            break;
        case 'nihai':
            data = nihaiUrunler;
            filename = 'nihai_urunler.csv';
            break;
        case 'urun-agaci':
            data = urunAgaci;
            filename = 'urun_agaci.csv';
            break;
        default:
            showAlert('Geçersiz veri tipi', 'error');
            return;
    }
    
    if (data.length === 0) {
        showAlert('Export edilecek veri bulunamadı', 'warning');
        return;
    }
    
    // CSV formatına çevir
    const csv = convertToCSV(data);
    downloadCSV(csv, filename);
    showAlert(`${type} verileri CSV olarak export edildi`, 'success');
}

// Veriyi CSV formatına çevir
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    // İlk satır: başlıklar
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    // Veri satırları
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header];
            // Virgül, tırnak veya yeni satır içeren değerleri tırnak içine al
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

// CSV dosyasını indir
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// CSV Import
function importFromCSV(type) {
    currentImportType = type;
    document.getElementById('csv-file-input').click();
}

// CSV dosya seçimi işle
function handleCSVFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const data = parseCSV(csv);
            
            if (data.length === 0) {
                showAlert('CSV dosyası boş veya geçersiz format', 'error');
                return;
            }
            
            // Veri tipine göre import et
            importDataToSystem(data, currentImportType);
            
        } catch (error) {
            console.error('CSV parse hatası:', error);
            showAlert('CSV dosyası okunurken hata oluştu', 'error');
        }
    };
    
    reader.readAsText(file);
    // Input'u temizle
    event.target.value = '';
}

// CSV'yi parse et
function parseCSV(csv) {
    const lines = csv.split('\n');
    const result = [];
    
    if (lines.length < 2) return result;
    
    // İlk satır: başlıklar
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Veri satırları
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        if (values.length !== headers.length) continue;
        
        const row = {};
        headers.forEach((header, index) => {
            let value = values[index];
            
            // Sayısal değerleri parse et
            if (header.includes('miktar') || header.includes('fiyat') || header.includes('maliyet') || 
                header.includes('gerekli_miktar') || header.includes('id')) {
                value = parseFloat(value) || 0;
            }
            
            // Boolean değerleri parse et
            if (header === 'aktif') {
                value = value === 'true' || value === '1';
            }
            
            row[header] = value;
        });
        
        result.push(row);
    }
    
    return result;
}

// CSV satırını parse et (tırnak içindeki virgülleri dikkate alarak)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Çift tırnak - escape edilmiş tırnak
                current += '"';
                i++; // Bir sonraki karakteri atla
            } else {
                // Tırnak durumunu değiştir
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Virgül ve tırnak içinde değiliz - yeni alan
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Son alanı ekle
    result.push(current.trim());
    
    return result;
}

// Veriyi sisteme import et
async function importDataToSystem(data, type) {
    try {
        showAlert(`${data.length} kayıt import ediliyor...`, 'info');
        
        let successCount = 0;
        let updateCount = 0;
        let errorCount = 0;
        
        for (const item of data) {
            try {
                let response;
                let isUpdate = false;
                
                // ID varsa önce kontrol et (güncelleme için)
                if (item.id) {
                    // Mevcut veriyi kontrol et
                    let existingData = [];
                switch(type) {
                    case 'hammadde':
                            const hammaddeResponse = await fetch('/api/hammaddeler');
                            if (hammaddeResponse.ok) {
                                existingData = await hammaddeResponse.json();
                            }
                            break;
                        case 'yarimamul':
                            const yarimamulResponse = await fetch('/api/yarimamuller');
                            if (yarimamulResponse.ok) {
                                existingData = await yarimamulResponse.json();
                            }
                            break;
                        case 'nihai':
                            const nihaiResponse = await fetch('/api/nihai_urunler');
                            if (nihaiResponse.ok) {
                                existingData = await nihaiResponse.json();
                            }
                            break;
                        case 'urun-agaci':
                            const urunAgaciResponse = await fetch('/api/urun_agaci');
                            if (urunAgaciResponse.ok) {
                                existingData = await urunAgaciResponse.json();
                            }
                            break;
                    }
                    
                    // Aynı ID'ye sahip kayıt var mı kontrol et
                    const existingItem = existingData.find(existing => existing.id == item.id);
                    if (existingItem) {
                        isUpdate = true;
                    }
                }
                
                switch(type) {
                    case 'hammadde':
                        if (isUpdate) {
                            response = await fetch(`/api/hammaddeler/${item.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(item)
                            });
                        } else {
                        response = await fetch('/api/hammaddeler', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item)
                        });
                        }
                        break;
                    case 'yarimamul':
                        if (isUpdate) {
                            response = await fetch(`/api/yarimamuller/${item.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(item)
                            });
                        } else {
                        response = await fetch('/api/yarimamuller', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item)
                        });
                        }
                        break;
                    case 'nihai':
                        if (isUpdate) {
                            response = await fetch(`/api/nihai_urunler/${item.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(item)
                            });
                        } else {
                        response = await fetch('/api/nihai_urunler', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item)
                        });
                        }
                        break;
                    case 'urun-agaci':
                        if (isUpdate) {
                            response = await fetch(`/api/urun_agaci/${item.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(item)
                            });
                        } else {
                        response = await fetch('/api/urun_agaci', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item)
                        });
                        }
                        break;
                }
                
                if (response && response.ok) {
                    if (isUpdate) {
                        updateCount++;
                    } else {
                    successCount++;
                    }
                } else {
                    errorCount++;
                }
                
            } catch (error) {
                console.error('Import hatası:', error);
                errorCount++;
            }
        }
        
        // Verileri yenile
        await loadAllData();
        
        // Sonuç mesajı
        let message = `Import tamamlandı! ✅ Yeni: ${successCount} kayıt`;
        if (updateCount > 0) {
            message += ` 🔄 Güncellenen: ${updateCount} kayıt`;
        }
        if (errorCount > 0) {
            message += ` ❌ Hata: ${errorCount} kayıt`;
        }
        showAlert(message, (successCount > 0 || updateCount > 0) ? 'success' : 'warning');
        
    } catch (error) {
        console.error('Import işlemi hatası:', error);
        showAlert('Import işlemi sırasında hata oluştu', 'danger');
    }
}

// BR02 ve BR03 için BOM kopyala (test amaçlı)
async function copyBOMFromBR01() {
    try {
        // BR01'in BOM'unu bul
        const br01BOM = urunAgaci.filter(item => 
            item.ana_urun_id === 504 && item.ana_urun_tipi === 'yarimamul'
        );
        
        if (br01BOM.length === 0) {
            showAlert('BR01 için BOM bulunamadı!', 'error');
            return;
        }
        
        console.log('BR01 BOM kopyalanıyor:', br01BOM);
        
        // BR02 için BOM kopyala
        const br02 = yarimamuller.find(y => y.kod === 'BR02');
        if (br02) {
            for (const bomItem of br01BOM) {
                const newBOM = {
                    ana_urun_id: br02.id,
                    ana_urun_tipi: 'yarimamul',
                    alt_urun_id: bomItem.alt_urun_id,
                    alt_urun_tipi: bomItem.alt_urun_tipi,
                    gerekli_miktar: bomItem.gerekli_miktar,
                    birim: bomItem.birim
                };
                
                const response = await fetch('/api/urun_agaci', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newBOM)
                });
                
                if (response.ok) {
                    console.log(`BR02 için BOM eklendi: ${bomItem.alt_urun_id}`);
                }
            }
        }
        
        // BR03 için BOM kopyala
        const br03 = yarimamuller.find(y => y.kod === 'BR03');
        if (br03) {
            for (const bomItem of br01BOM) {
                const newBOM = {
                    ana_urun_id: br03.id,
                    ana_urun_tipi: 'yarimamul',
                    alt_urun_id: bomItem.alt_urun_id,
                    alt_urun_tipi: bomItem.alt_urun_tipi,
                    gerekli_miktar: bomItem.gerekli_miktar,
                    birim: bomItem.birim
                };
                
                const response = await fetch('/api/urun_agaci', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newBOM)
                });
                
                if (response.ok) {
                    console.log(`BR03 için BOM eklendi: ${bomItem.alt_urun_id}`);
                }
            }
        }
        
        // Verileri yenile
        await loadAllData();
        showAlert('BR02 ve BR03 için BOM kopyalandı!', 'success');
        
    } catch (error) {
        console.error('BOM kopyalama hatası:', error);
        showAlert('BOM kopyalama hatası!', 'error');
    }
}

// ==================== İŞ EMİRLERİ FONKSİYONLARI ====================







// ==================== İŞ EMİRLERİ FONKSİYONLARI ====================






// İş Emri Fonksiyonları
let workOrders = [];

// İş emri modal'ını göster
function showCreateWorkOrderModal() {
    const modalElement = document.getElementById('createWorkOrderModal');
    if (modalElement) {
        // Tarihleri varsayılan olarak ayarla
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        document.getElementById('workOrderStartDate').value = today;
        document.getElementById('workOrderEndDate').value = nextWeek;
        
        // Modal'ı göster
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-modal', 'true');
        modalElement.setAttribute('role', 'dialog');
        
        // Backdrop oluştur
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'createWorkOrderBackdrop';
        document.body.appendChild(backdrop);
        
        // Modal'ı kapatma olayları
        const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', closeCreateWorkOrderModal);
        });
        
        // Backdrop'a tıklayınca kapat
        backdrop.addEventListener('click', closeCreateWorkOrderModal);
    }
}

// İş emri modal'ını kapat
function closeCreateWorkOrderModal() {
    const modalElement = document.getElementById('createWorkOrderModal');
    const backdrop = document.getElementById('createWorkOrderBackdrop');
    
    if (modalElement) {
        modalElement.style.display = 'none';
        modalElement.classList.remove('show');
        modalElement.removeAttribute('aria-modal');
        modalElement.removeAttribute('role');
    }
    
    if (backdrop) {
        backdrop.remove();
    }
}

// İş emri oluştur
async function createWorkOrder() {
    try {
        const formData = {
            product_name: document.getElementById('workOrderProductName').value,
            product_code: document.getElementById('workOrderProductCode').value,
            quantity: parseInt(document.getElementById('workOrderQuantity').value),
            priority: document.getElementById('workOrderPriority').value,
            assigned_personnel: document.getElementById('workOrderPersonnel').value,
            start_date: document.getElementById('workOrderStartDate').value,
            end_date: document.getElementById('workOrderEndDate').value,
            notes: document.getElementById('workOrderNotes').value,
            created_by: 'Kullanıcı'
        };

        const response = await fetch('/api/work-orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const workOrder = await response.json();
            showAlert(`İş emri oluşturuldu: ${workOrder.work_order_number}`, 'success');
            closeCreateWorkOrderModal();
            loadWorkOrders();
        } else {
            const error = await response.json();
            showAlert(`Hata: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('İş emri oluşturma hatası:', error);
        showAlert('İş emri oluşturulurken hata oluştu', 'error');
    }
}

// İş emirlerini yükle
async function loadWorkOrders() {
    try {
        const response = await fetch('/api/work-orders');
        if (response.ok) {
            workOrders = await response.json();
            displayWorkOrders(workOrders);
        } else {
            console.error('İş emirleri yüklenemedi');
        }
    } catch (error) {
        console.error('İş emirleri yükleme hatası:', error);
    }
}

// İş emirlerini göster
function displayWorkOrders(orders) {
    const tbody = document.getElementById('work-orders-list');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Henüz iş emri bulunmuyor</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${order.work_order_number}</strong></td>
            <td>
                <div>${order.product_name}</div>
                <small class="text-muted">${order.product_code || 'Kod yok'}</small>
            </td>
            <td>${order.quantity} adet</td>
            <td><span class="badge bg-${getStatusColor(order.status)}">${getStatusText(order.status)}</span></td>
            <td><span class="badge bg-${getPriorityColor(order.priority)}">${getPriorityText(order.priority)}</span></td>
            <td>${order.assigned_personnel || 'Atanmamış'}</td>
            <td>${order.start_date ? new Date(order.start_date).toLocaleDateString('tr-TR') : '-'}</td>
            <td>${order.end_date ? new Date(order.end_date).toLocaleDateString('tr-TR') : '-'}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary" onclick="viewWorkOrder(${order.id})" title="Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="downloadWorkOrderPDF(${order.id})" title="PDF İndir">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="editWorkOrder(${order.id})" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteWorkOrder(${order.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Durum rengi
function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'in_progress': 'primary',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

// Öncelik rengi
function getPriorityColor(priority) {
    const colors = {
        'low': 'secondary',
        'normal': 'success',
        'high': 'warning',
        'urgent': 'danger'
    };
    return colors[priority] || 'secondary';
}

// Durum metni
function getStatusText(status) {
    const texts = {
        'pending': 'Beklemede',
        'in_progress': 'Devam Ediyor',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi'
    };
    return texts[status] || status;
}

// Öncelik metni
function getPriorityText(priority) {
    const texts = {
        'low': 'Düşük',
        'normal': 'Normal',
        'high': 'Yüksek',
        'urgent': 'Acil'
    };
    return texts[priority] || priority;
}

// İş emri görüntüle
function viewWorkOrder(id) {
    const workOrder = workOrders.find(w => w.id === id);
    if (workOrder) {
        showAlert(`İş Emri: ${workOrder.work_order_number}\nÜrün: ${workOrder.product_name}\nMiktar: ${workOrder.quantity} adet\nDurum: ${getStatusText(workOrder.status)}`, 'info');
    }
}

// İş emri PDF indir
function downloadWorkOrderPDF(id) {
    window.open(`/api/work-orders/${id}/pdf`, '_blank');
}

// İş emri düzenle
function editWorkOrder(id) {
    const workOrder = workOrders.find(w => w.id === id);
    if (workOrder) {
        // Form alanlarını doldur
        document.getElementById('workOrderProductName').value = workOrder.product_name;
        document.getElementById('workOrderProductCode').value = workOrder.product_code || '';
        document.getElementById('workOrderQuantity').value = workOrder.quantity;
        document.getElementById('workOrderPriority').value = workOrder.priority;
        document.getElementById('workOrderPersonnel').value = workOrder.assigned_personnel || '';
        document.getElementById('workOrderStartDate').value = workOrder.start_date || '';
        document.getElementById('workOrderEndDate').value = workOrder.end_date || '';
        document.getElementById('workOrderNotes').value = workOrder.notes || '';
        
        showCreateWorkOrderModal();
    }
}

// İş emri sil
async function deleteWorkOrder(id) {
    if (confirm('Bu iş emrini silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/work-orders/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showAlert('İş emri silindi', 'success');
                loadWorkOrders();
            } else {
                const error = await response.json();
                showAlert(`Hata: ${error.error}`, 'error');
            }
        } catch (error) {
            console.error('İş emri silme hatası:', error);
            showAlert('İş emri silinirken hata oluştu', 'error');
        }
    }
}

// İş emirlerini yenile
async function refreshWorkOrders() {
    await loadWorkOrders();
    showAlert('İş emirleri yenilendi', 'success');
}

// İş emri filtrelerini temizle
function clearWorkOrderFilters() {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-priority').value = '';
    document.getElementById('filter-personnel').value = '';
    displayWorkOrders(workOrders);
}

