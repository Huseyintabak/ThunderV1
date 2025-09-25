// Üretim Planlama sayfası için özel JavaScript

// Üretim planları yükleme
// Global değişkenler
let productionPlans = [];

async function loadProductionPlans() {
    try {
        console.log('📅 Üretim planları yükleniyor...');
        
        const response = await fetch('/api/production-plans');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const plans = await response.json();
        console.log('✅ Üretim planları yüklendi:', plans.length);
        
        // Global array'e kaydet
        productionPlans = plans;
        
        displayProductionPlans(plans);
    } catch (error) {
        console.error('❌ Üretim planları yüklenirken hata:', error);
        showAlert('Üretim planları yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

function displayProductionPlans(plans) {
    console.log('📋 Üretim planları gösteriliyor:', plans.length);
    
    // Aktif ve tamamlanan planları ayır
    const activePlans = plans.filter(plan => 
        ['draft', 'approved', 'in_progress'].includes(plan.status)
    );
    const completedPlans = plans.filter(plan => 
        plan.status === 'completed'
    );
    
    console.log('🔄 Aktif planlar:', activePlans.length);
    console.log('✅ Tamamlanan planlar:', completedPlans.length);
    
    // Aktif planları göster
    displayPlanSection('active-plans-container', activePlans, 'Üretimde olan plan bulunmuyor');
    
    // Tamamlanan planları göster
    displayPlanSection('completed-plans-container', completedPlans, 'Tamamlanan plan bulunmuyor');
    
    // İstatistikleri güncelle
    updatePlanningStatistics(plans);
}

function displayPlanSection(containerId, plans, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('❌ Container bulunamadı:', containerId);
        return;
    }
    
    if (plans.length === 0) {
        container.innerHTML = `
            <div class="text-center py-2">
                <i class="fas fa-calendar fa-2x text-muted mb-2"></i>
                <h6 class="text-muted">${emptyMessage}</h6>
                <p class="text-muted small">Henüz plan bulunmuyor</p>
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
                        <button class="btn btn-success btn-sm" onclick="generateWorkOrder(${plan.id})" title="İş Emri Çıkar">
                            <i class="fas fa-file-alt me-1"></i>İş Emri Çıkar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Kaynak yönetimi
async function loadResources() {
    try {
        console.log('🔧 Kaynaklar yükleniyor...');
        
        const response = await fetch('/api/resources');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const resources = await response.json();
        console.log('✅ Kaynaklar yüklendi:', resources.length);
        
        displayResources(resources);
    } catch (error) {
        console.error('❌ Kaynaklar yüklenirken hata:', error);
        showAlert('Kaynaklar yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

function displayResources(resources) {
    const container = document.getElementById('resources-container');
    if (!container) {
        console.error('❌ Resources container bulunamadı');
        return;
    }
    
    if (resources.length === 0) {
        container.innerHTML = `
            <div class="text-center py-1">
                <i class="fas fa-cogs fa-1x text-muted mb-1"></i>
                <h6 class="text-muted mb-1">Kaynak bulunmuyor</h6>
                <p class="text-muted small mb-0">Henüz kaynak eklenmemiş</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = resources.map(resource => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${resource.resource_name || 'Tanımsız'}</strong>
                <small class="text-muted d-block">${resource.resource_type || 'Tanımsız'}</small>
            </div>
            <div>
                <span class="badge bg-${resource.is_active ? 'success' : 'secondary'}">
                    ${resource.is_active ? 'Aktif' : 'Pasif'}
                </span>
            </div>
        </div>
    `).join('');
}

// Siparişler yükleme
async function loadOrders() {
    try {
        console.log('📦 Siparişler yükleniyor...');
        
        const response = await fetch('/api/orders');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const orders = await response.json();
        console.log('✅ Siparişler yüklendi:', orders.length);
        
        // İstatistikleri güncelle
        updatePlanningStatistics(null, orders);
    } catch (error) {
        console.error('❌ Siparişler yüklenirken hata:', error);
    }
}

// İstatistikleri güncelle
function updatePlanningStatistics(plans = null, orders = null) {
    // Toplam plan sayısı
    if (plans) {
        const totalPlansElement = document.getElementById('total-plans');
        if (totalPlansElement) {
            totalPlansElement.textContent = plans.length;
        }
        
        const activePlansElement = document.getElementById('active-plans');
        if (activePlansElement) {
            const activeCount = plans.filter(p => ['draft', 'approved', 'in_progress'].includes(p.status)).length;
            activePlansElement.textContent = activeCount;
        }
    }
    
    // Toplam sipariş sayısı
    if (orders) {
        const totalOrdersElement = document.getElementById('total-orders');
        if (totalOrdersElement) {
            totalOrdersElement.textContent = orders.length;
        }
    }
}

// Yardımcı fonksiyonlar
function getStatusColor(status) {
    const colors = {
        'draft': 'secondary',
        'approved': 'success',
        'in_progress': 'warning',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'draft': 'Taslak',
        'approved': 'Onaylandı',
        'in_progress': 'Devam Ediyor',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi'
    };
    return texts[status] || status;
}

// Plan işlemleri
function viewPlanDetails(planId) {
    console.log('👁️ Plan detayları görüntüleniyor:', planId);
    // Modal açma işlemi burada yapılacak
}

async function generateWorkOrder(planId) {
    console.log('📄 İş emri oluşturuluyor:', planId);
    
    try {
        // Plan detaylarını al - daha güvenli şekilde
        const plan = productionPlans.find(p => p.id === planId);
        if (!plan) {
            showAlert('Plan bulunamadı!', 'error');
            return;
        }

        console.log('📋 Plan detayları:', {
            id: plan.id,
            plan_name: plan.plan_name,
            total_quantity: plan.total_quantity,
            status: plan.status,
            assigned_operator: plan.assigned_operator
        });

        // API'den ürün detaylarını çek
        let productDetails = [];
        let customerName = 'N/A';
        let orderDate = new Date().toISOString().split('T')[0];
        
        console.log('🔍 Plan verisi analizi:', {
            hasProductDetails: !!plan.product_details,
            productDetailsType: typeof plan.product_details,
            productDetailsValue: plan.product_details,
            planName: plan.plan_name,
            totalQuantity: plan.total_quantity
        });
        
        try {
            // API'den ürün detaylarını çek
            console.log('🌐 API\'den ürün detayları çekiliyor...');
            console.log('🔍 Plan ID:', planId, 'Type:', typeof planId);
            
            const apiUrl = `/api/plans/${planId}/products`;
            console.log('🌐 API URL:', apiUrl);
            
            const productResponse = await fetch(apiUrl);
            console.log('📡 API Response Status:', productResponse.status);
            
            if (productResponse.ok) {
                const productData = await productResponse.json();
                console.log('✅ API\'den ürün verisi alındı:', productData);
                
                if (productData.success && productData.products) {
                    productDetails = productData.products;
                    customerName = productData.order?.customer_name || 'N/A';
                    orderDate = productData.order?.order_date || orderDate;
                    
                    console.log('✅ Ürün detayları API\'den çekildi:', productDetails.length, 'ürün');
                } else {
                    throw new Error('API\'den ürün verisi alınamadı');
                }
            } else {
                const errorText = await productResponse.text();
                console.error('❌ API Hatası:', productResponse.status, errorText);
                throw new Error(`API hatası: ${productResponse.status} - ${errorText}`);
            }
        } catch (error) {
            console.log('⚠️ API\'den ürün çekilemedi, fallback veri kullanılıyor:', error.message);
            
            // Fallback: Plan'dan ürün detaylarını al
            try {
                if (plan.product_details && plan.product_details !== '[]' && plan.product_details !== '') {
                    productDetails = JSON.parse(plan.product_details);
                    console.log('✅ Plan\'dan ürün detayları parse edildi:', productDetails);
                } else {
                    throw new Error('Plan\'da ürün detayları yok');
                }
            } catch (parseError) {
                console.log('⚠️ Plan\'dan ürün detayları parse edilemedi, boş liste kullanılıyor');
                
                // Gerçek veri yoksa boş liste - mock veri ekleme
                productDetails = [];
                
                console.log('📦 Ürün detayları boş - gerçek veri bekleniyor');
            }
        }

        // İş emri verilerini hazırla - API'den gelen verilerle
        const workOrderData = {
            work_order_number: `WO-${Date.now()}`,
            product_name: plan.plan_name || `Plan-${planId}`,
            quantity: parseInt(plan.total_quantity) || 1,
            priority: plan.status === 'approved' ? 'Yüksek' : 'Orta',
            assigned_operator: plan.assigned_operator || '4', // Default operator
            plan_id: parseInt(planId),
            status: 'pending',
            notes: `Plan ${plan.plan_name || planId} için oluşturulan iş emri`,
            product_details: productDetails, // API'den gelen ürün detayları
            customer_name: customerName, // API'den gelen müşteri adı
            order_date: orderDate // API'den gelen tarih
        };

        console.log('📝 İş emri verisi:', workOrderData);

        const response = await fetch('/api/work-orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workOrderData)
        });

        if (response.ok) {
            const result = await response.json();
            showAlert('✅ İş emri başarıyla oluşturuldu!', 'success');
            console.log('✅ İş emri oluşturuldu:', result);
            
            // İş emri detaylarını modal ile göster
            showWorkOrderModal(result);
            
            // Planları yenile
            await loadProductionPlans();
        } else {
            const errorText = await response.text();
            console.error('❌ API Hatası:', errorText);
            showAlert(`İş emri oluşturulamadı: ${errorText}`, 'error');
        }

    } catch (error) {
        console.error('❌ İş emri oluşturma hatası:', error);
        showAlert('İş emri oluşturulurken hata oluştu: ' + error.message, 'error');
    }
}

// Ürün detayları HTML oluşturma
function getProductDetailsHTML(productDetails) {
    console.log('🔍 Ürün detayları HTML oluşturuluyor:', productDetails);
    
    if (!productDetails || !Array.isArray(productDetails) || productDetails.length === 0) {
        console.log('⚠️ Ürün detayları boş, bilgi mesajı gösteriliyor');
        return `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="fas fa-info-circle me-2"></i>
                    Ürün detayları bulunamadı
                    <br><small class="text-muted mt-1">Plan'ın sipariş verileri kontrol ediliyor...</small>
                </td>
            </tr>
        `;
    }
    
    console.log('✅ Ürün detayları render ediliyor:', productDetails.length, 'ürün');
    
    return productDetails.map((product, index) => `
        <tr>
            <td>
                <code class="text-primary">${product.code || product.id || `PRD-${index + 1}`}</code>
            </td>
            <td>
                <strong>${product.name || 'Tanımsız Ürün'}</strong>
                <br><small class="text-muted">ID: ${product.id || 'N/A'}</small>
            </td>
            <td>
                <span class="quantity-badge">${product.quantity || 1} Adet</span>
            </td>
            <td>
                <span class="status-badge">Beklemede</span>
                <br><small class="text-muted mt-1 d-block">
                    <input type="checkbox" class="form-check-input me-1" id="product-${index}">
                    <label for="product-${index}" class="form-check-label">Tamamlandı</label>
                </small>
            </td>
        </tr>
    `).join('');
}

// İş emri modal gösterimi
function showWorkOrderModal(workOrder) {
    console.log('📄 İş emri modalı açılıyor:', workOrder);
    
    // Modal HTML'i oluştur
    const modalHtml = `
        <div class="modal fade" id="workOrderModal" tabindex="-1" aria-labelledby="workOrderModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title" id="workOrderModalLabel">
                            <i class="fas fa-file-alt me-2"></i>İş Emri Detayları
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- İş Emri Başlık Bilgileri -->
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">İş Emri Bilgileri</h6>
                                <table class="table table-sm table-borderless">
                                    <tr>
                                        <td class="fw-bold">İş Emri No:</td>
                                        <td><strong>${workOrder.work_order_number || 'N/A'}</strong></td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Plan Adı:</td>
                                        <td>${workOrder.product_name || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Müşteri:</td>
                                        <td>${workOrder.customer_name || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Tarih:</td>
                                        <td>${workOrder.order_date || new Date().toLocaleDateString('tr-TR')}</td>
                                    </tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">Operatör Bilgileri</h6>
                                <table class="table table-sm table-borderless">
                                    <tr>
                                        <td class="fw-bold">Atanan Operatör:</td>
                                        <td><strong>${workOrder.assigned_operator_name || getOperatorName(workOrder.assigned_operator) || 'Atanmamış'}</strong></td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Öncelik:</td>
                                        <td><span class="badge bg-${workOrder.priority === 'Yüksek' ? 'danger' : 'warning'}">${workOrder.priority || 'Orta'}</span></td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Durum:</td>
                                        <td><span class="badge bg-secondary">${workOrder.status || 'Beklemede'}</span></td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Plan ID:</td>
                                        <td>${workOrder.plan_id || 'N/A'}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>

                        <!-- Üretilmesi Gereken Ürünler -->
                        <div class="mb-4">
                            <h6 class="text-primary mb-3">
                                <i class="fas fa-boxes me-2"></i>Üretilmesi Gereken Ürünler
                            </h6>
                            <div class="table-responsive">
                                <table class="table table-bordered table-hover">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Ürün Kodu</th>
                                            <th>Ürün Adı</th>
                                            <th>Miktar</th>
                                            <th>Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${getProductDetailsHTML(workOrder.product_details)}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Notlar -->
                        <div class="mb-4">
                            <h6 class="text-primary mb-3">
                                <i class="fas fa-sticky-note me-2"></i>Notlar
                            </h6>
                            <div class="bg-light p-3 rounded border">
                                <small class="text-muted">${workOrder.notes || 'Not bulunmuyor'}</small>
                            </div>
                        </div>

                        <!-- İmza Alanları -->
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">
                                    <i class="fas fa-signature me-2"></i>Operatör İmzası
                                </h6>
                                <div class="border rounded p-3 text-center" style="height: 80px; background-color: #f8f9fa;">
                                    <small class="text-muted">İmza Alanı</small>
                                    <div class="mt-2">
                                        <small class="text-muted">Ad Soyad: ___________________</small>
                                    </div>
                                    <div class="mt-1">
                                        <small class="text-muted">Tarih: ___________________</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">
                                    <i class="fas fa-user-tie me-2"></i>Vardiya Amiri İmzası
                                </h6>
                                <div class="border rounded p-3 text-center" style="height: 80px; background-color: #f8f9fa;">
                                    <small class="text-muted">İmza Alanı</small>
                                    <div class="mt-2">
                                        <small class="text-muted">Ad Soyad: ___________________</small>
                                    </div>
                                    <div class="mt-1">
                                        <small class="text-muted">Tarih: ___________________</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Kapat
                        </button>
                        <button type="button" class="btn btn-primary" onclick="printWorkOrder(${workOrder.id})">
                            <i class="fas fa-print me-1"></i>Yazdır
                        </button>
                        <button type="button" class="btn btn-success" onclick="copyWorkOrderInfo('${JSON.stringify(workOrder).replace(/"/g, '&quot;')}')">
                            <i class="fas fa-copy me-1"></i>Kopyala
                        </button>
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
    
    // Modal'ı DOM'a ekle
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('workOrderModal'));
    modal.show();
    
    // Modal kapandığında DOM'dan kaldır
    document.getElementById('workOrderModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// İş emri bilgilerini kopyalama
function copyWorkOrderInfo(workOrderData) {
    let workOrder;
    try {
        workOrder = JSON.parse(workOrderData);
    } catch (error) {
        showAlert('İş emri verisi okunamadı!', 'error');
        return;
    }
    
    if (!workOrder) {
        showAlert('İş emri bulunamadı!', 'error');
        return;
    }
    
    // Ürün detayları metnini oluştur
    let productDetailsText = '';
    if (workOrder.product_details && Array.isArray(workOrder.product_details)) {
        productDetailsText = workOrder.product_details.map(product => 
            `  - ${product.code || product.id || 'N/A'}: ${product.name || 'Tanımsız'} (${product.quantity || 1} adet)`
        ).join('\n');
    }
    
    const info = `
İŞ EMRİ DETAYLARI
================
İş Emri No: ${workOrder.work_order_number || 'N/A'}
Plan Adı: ${workOrder.product_name || 'N/A'}
Müşteri: ${workOrder.customer_name || 'N/A'}
Tarih: ${workOrder.order_date || new Date().toLocaleDateString('tr-TR')}
Öncelik: ${workOrder.priority || 'Orta'}
Durum: ${workOrder.status || 'Beklemede'}
Atanan Operatör: ${workOrder.assigned_operator_name || getOperatorName(workOrder.assigned_operator) || 'Atanmamış'}

ÜRETİLMESİ GEREKEN ÜRÜNLER:
${productDetailsText || '  - Ürün detayı bulunmuyor'}

Notlar: ${workOrder.notes || 'Not bulunmuyor'}

İMZA ALANLARI:
Operatör İmzası: ___________________ Tarih: __/__/____
Vardiya Amiri İmzası: ___________________ Tarih: __/__/____
    `.trim();
    
    navigator.clipboard.writeText(info).then(() => {
        showAlert('İş emri bilgileri panoya kopyalandı!', 'success');
    }).catch(() => {
        showAlert('Kopyalama başarısız!', 'error');
    });
}

// İş emri yazdırma fonksiyonu - Modal içeriğini yeni pencerede yazdır
function printWorkOrder(workOrderId) {
    console.log('🖨️ İş emri yazdırılıyor:', workOrderId);
    
    try {
        // Modal içeriğini al
        const modal = document.getElementById('workOrderModal');
        if (!modal) {
            showAlert('İş emri modalı bulunamadı!', 'error');
            return;
        }
        
        // Modal içeriğini yazdırılabilir HTML'e çevir
        const printContent = createPrintableContent(modal);
        
        // Yeni pencere aç
               const printWindow = window.open('', '_blank', 'width=2480,height=3508,scrollbars=no,resizable=yes');
        
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // Sayfa yüklendikten sonra yazdırma dialogunu aç
            printWindow.onload = function() {
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    showAlert('İş emri yazdırma penceresi açıldı', 'success');
                }, 500);
            };
        } else {
            showAlert('Pop-up engelleyici nedeniyle pencere açılamadı. Lütfen pop-up engelleyicisini kapatın.', 'warning');
        }
    } catch (error) {
        console.error('❌ İş emri yazdırma hatası:', error);
        showAlert('İş emri yazdırılırken hata oluştu: ' + error.message, 'error');
    }
}

// Modal içeriğini yazdırılabilir HTML'e çeviren fonksiyon - MODERN TASARIM
function createPrintableContent(modal) {
    const modalBody = modal.querySelector('.modal-body');
    const modalHeader = modal.querySelector('.modal-header');
    
    if (!modalBody || !modalHeader) {
        return '<html><body><h1>İş emri içeriği bulunamadı</h1></body></html>';
    }
    
    // Modal'dan verileri çıkar
    const workOrderData = extractWorkOrderData(modalBody);
    
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>İş Emri - ${workOrderData.workOrderNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #ffffff;
            color: #2c3e50;
            line-height: 1.6;
            font-size: 14px;
        }
        
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        /* Header Styles */
        .header { 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            margin: -20px -20px 30px -20px;
            border-radius: 0 0 15px 15px;
        }
        
        .header h1 { 
            font-size: 28px; 
            font-weight: 300;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        
        .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 300;
        }
        
        /* Company Info */
        .company-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 5px solid #667eea;
        }
        
        .company-logo {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }
        
        .document-info {
            text-align: right;
            font-size: 12px;
            color: #6c757d;
        }
        
        /* Info Grid */
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .info-card h3 {
            color: #667eea;
            font-size: 16px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e9ecef;
            font-weight: 600;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }
        
        .info-label {
            font-weight: 600;
            color: #495057;
            min-width: 120px;
        }
        
        .info-value {
            color: #212529;
            text-align: right;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            font-size: 11px;
            font-weight: 600;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .badge.bg-info { background: linear-gradient(45deg, #17a2b8, #20c997); color: white; }
        .badge.bg-warning { background: linear-gradient(45deg, #ffc107, #fd7e14); color: white; }
        .badge.bg-danger { background: linear-gradient(45deg, #dc3545, #e83e8c); color: white; }
        .badge.bg-secondary { background: linear-gradient(45deg, #6c757d, #495057); color: white; }

        /* Products Table */
        .products-section {
            margin: 30px 0;
        }
        
        .products-section h3 {
            color: #667eea;
            font-size: 18px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
            font-weight: 600;
        }
        
        .products-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .products-table th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .products-table td { 
            padding: 15px 12px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: middle;
        }
        
        .products-table tr:nth-child(even) { 
            background-color: #f8f9fa; 
        }
        
        .products-table tr:hover {
            background-color: #e3f2fd;
        }
        
        .product-code {
            font-family: 'Courier New', monospace;
            background: #e9ecef;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            color: #495057;
        }
        
        .product-name {
            font-weight: 600;
            color: #212529;
        }
        
        .product-id {
            font-size: 11px;
            color: #6c757d;
            margin-top: 2px;
        }
        
        .quantity-badge {
            background: #f0f0f0;
            color: #000;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 12px;
            border: 1px solid #ccc;
        }
        
        .status-badge {
            background: #f0f0f0;
            color: #000;
            padding: 4px 8px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: 600;
            border: 1px solid #ccc;
        }

        /* Notes Section */
        .notes-section { 
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 1px solid #dee2e6; 
            padding: 20px; 
            border-radius: 10px; 
            margin-bottom: 30px;
            border-left: 5px solid #667eea;
        }
        
        .notes-section h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-weight: 600;
        }

        /* Signature Section */
        .signature-section { 
            margin-top: 40px; 
            page-break-inside: avoid;
        }
        
        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .signature-box { 
            border: 2px solid #e9ecef; 
            padding: 25px; 
            text-align: center; 
            min-height: 120px;
            border-radius: 10px;
            background: #f8f9fa;
            position: relative;
        }
        
        .signature-title { 
            font-weight: 600; 
            margin-bottom: 15px; 
            color: #667eea;
            font-size: 14px;
        }
        
        .signature-line {
            border-bottom: 2px solid #667eea;
            margin: 20px 0 10px 0;
            height: 40px;
        }
        
        .signature-info {
            font-size: 12px;
            color: #6c757d;
            margin-top: 10px;
        }
        
        .signature-info div {
            margin: 5px 0;
        }

        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
        
        /* MINIMAL A4 PRINT STYLES - Sade ve Basit */
        @media print { 
            @page {
                size: A4;
                margin: 0.3in; /* 7.6mm margins - daha küçük */
            }
            
            body { 
                margin: 0; 
                font-family: Arial, sans-serif;
                font-size: 10px;
                line-height: 1.2;
                color: #000;
                background: white;
                width: 100%;
                height: 100vh;
                overflow: hidden;
            }
            
            .container { 
                box-shadow: none; 
                padding: 0;
                margin: 0;
                width: 100%;
                max-width: none;
                height: 100vh;
                background: white;
            }
            
            /* Header - Sade */
            .header { 
                margin: 0 0 8px 0; 
                padding: 10px 0;
                background: white;
                border-bottom: 2px solid #000;
                text-align: center;
            }
            
            .header h1 {
                font-size: 18px;
                margin: 0;
                font-weight: bold;
                color: #000;
            }
            
            .header .subtitle {
                font-size: 10px;
                margin: 2px 0 0 0;
                color: #666;
            }
            
            /* Company Info - Minimal */
            .company-info {
                padding: 5px 0;
                margin-bottom: 8px;
                border-bottom: 1px solid #ccc;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .company-logo {
                font-size: 14px;
                font-weight: bold;
                color: #000;
            }
            
            .document-info {
                font-size: 9px;
                color: #666;
                text-align: right;
            }
            
            /* Info Grid - Kompakt */
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 8px;
            }
            
            .info-card {
                padding: 6px 8px;
                border: 1px solid #ccc;
                background: white;
            }
            
            .info-card h3 {
                font-size: 11px;
                margin: 0 0 4px 0;
                font-weight: bold;
                color: #000;
                border-bottom: 1px solid #ccc;
                padding-bottom: 2px;
            }
            
            .info-row {
                margin-bottom: 2px;
                padding: 1px 0;
                display: flex;
                justify-content: space-between;
            }
            
            .info-label {
                font-size: 9px;
                font-weight: bold;
                color: #333;
                min-width: 80px;
            }
            
            .info-value {
                font-size: 9px;
                color: #000;
                text-align: right;
            }
            
            /* Badge - Sade */
            .badge {
                padding: 1px 4px;
                font-size: 8px;
                font-weight: bold;
                background: #f0f0f0;
                color: #000;
                border: 1px solid #ccc;
                border-radius: 2px;
            }
            
            /* Products Section - Kompakt */
            .products-section {
                margin: 5px 0;
            }
            
            .products-section h3 {
                font-size: 12px;
                margin: 0 0 4px 0;
                font-weight: bold;
                color: #000;
                border-bottom: 1px solid #ccc;
                padding-bottom: 2px;
            }
            
            .products-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9px;
                margin-bottom: 4px;
            }
            
            .products-table th {
                padding: 3px 4px;
                font-size: 8px;
                font-weight: bold;
                background: #f5f5f5;
                border: 1px solid #ccc;
                color: #000;
            }
            
            .products-table td {
                padding: 3px 4px;
                border: 1px solid #ccc;
                color: #000;
            }
            
            .product-code {
                font-family: monospace;
                font-size: 8px;
                background: #f8f8f8;
                padding: 1px 3px;
                border-radius: 1px;
            }
            
            .product-name {
                font-size: 9px;
                font-weight: bold;
            }
            
            .product-id {
                font-size: 7px;
                color: #666;
            }
            
            .quantity-badge, .status-badge {
                font-size: 7px;
                padding: 1px 3px;
                background: #f0f0f0;
                border: 1px solid #ccc;
                border-radius: 1px;
            }
            
            /* Notes Section - Minimal */
            .notes-section {
                padding: 4px 8px;
                margin-bottom: 6px;
                border: 1px solid #ccc;
                background: #f9f9f9;
            }
            
            .notes-section h3 {
                font-size: 10px;
                margin: 0 0 2px 0;
                font-weight: bold;
                color: #000;
            }
            
            .notes-section p {
                font-size: 9px;
                margin: 0;
                color: #333;
            }
            
            /* Signature Section - Kompakt */
            .signature-section {
                margin-top: 6px;
            }
            
            .signature-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            
            .signature-box {
                padding: 6px;
                border: 1px solid #ccc;
                background: white;
                min-height: 50px;
                text-align: center;
            }
            
            .signature-title {
                font-size: 9px;
                margin: 0 0 4px 0;
                font-weight: bold;
                color: #000;
            }
            
            .signature-line {
                border-bottom: 1px solid #000;
                margin: 8px 0 4px 0;
                height: 20px;
            }
            
            .signature-info {
                font-size: 7px;
                color: #666;
            }
            
            .signature-info div {
                margin: 1px 0;
            }
            
            /* Footer - Minimal */
            .footer {
                margin-top: 6px;
                padding-top: 4px;
                border-top: 1px solid #ccc;
                font-size: 7px;
                color: #666;
                text-align: center;
            }
            
            /* Print Optimizations */
            .no-print { display: none; }
            .signature-section { page-break-inside: avoid; }
            .info-grid { page-break-inside: avoid; }
            
            /* Remove all colors for printing */
            * {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
        
        /* A4 Specific Responsive - 2480x3508 pixels */
        @media screen and (width: 2480px) and (height: 3508px) {
            .container {
                max-width: 2480px;
                width: 100%;
            }
            
            body {
                font-size: 12px;
            }
            
            .header h1 {
                font-size: 32px;
            }
            
            .company-logo {
                font-size: 28px;
            }
        }
        
        /* Standard Responsive */
        @media (max-width: 768px) {
            .info-grid, .signature-grid { grid-template-columns: 1fr; }
            .company-info { flex-direction: column; text-align: center; gap: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>İŞ EMRİ</h1>
            <div class="subtitle">Work Order Document</div>
        </div>

        <!-- Company Info -->
        <div class="company-info">
            <div class="company-logo">THUNDER PRODUCTION</div>
            <div class="document-info">
                <div>Belge No: ${workOrderData.workOrderNumber}</div>
                <div>Tarih: ${workOrderData.orderDate}</div>
                <div>Sayfa: 1/1</div>
            </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
            <div class="info-card">
                <h3>İş Emri Bilgileri</h3>
                <div class="info-row">
                    <span class="info-label">İş Emri No:</span>
                    <span class="info-value"><strong>${workOrderData.workOrderNumber}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Plan Adı:</span>
                    <span class="info-value">${workOrderData.productName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Müşteri:</span>
                    <span class="info-value">${workOrderData.customerName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tarih:</span>
                    <span class="info-value">${workOrderData.orderDate}</span>
                </div>
            </div>
            
            <div class="info-card">
                <h3>Operatör Bilgileri</h3>
                <div class="info-row">
                    <span class="info-label">Atanan Operatör:</span>
                    <span class="info-value"><strong>${workOrderData.assignedOperator}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Öncelik:</span>
                    <span class="info-value">
                        <span class="badge bg-${workOrderData.priority === 'Yüksek' ? 'danger' : 'warning'}">${workOrderData.priority}</span>
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Durum:</span>
                    <span class="info-value">
                        <span class="badge bg-secondary">${workOrderData.status}</span>
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Plan ID:</span>
                    <span class="info-value">${workOrderData.planId}</span>
                </div>
            </div>
        </div>

        <!-- Products Section -->
        <div class="products-section">
            <h3>Üretilmesi Gereken Ürünler</h3>
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Ürün Kodu</th>
                        <th>Ürün Adı</th>
                        <th>Miktar</th>
                        <th>Durum</th>
                    </tr>
                </thead>
                <tbody>
                    ${workOrderData.products.map((product, index) => `
                        <tr>
                            <td>
                                <span class="product-code">${product.code || product.id || `PRD-${index + 1}`}</span>
                            </td>
                            <td>
                                <div class="product-name">${product.name || 'Tanımsız Ürün'}</div>
                                <div class="product-id">ID: ${product.id || 'N/A'}</div>
                            </td>
                            <td>
                                <span class="quantity-badge">${product.quantity || 1} Adet</span>
                            </td>
                            <td>
                                <span class="status-badge">Beklemede</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Notes Section -->
        <div class="notes-section">
            <h3>Notlar</h3>
            <p>${workOrderData.notes || 'Not bulunmuyor'}</p>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-grid">
                <div class="signature-box">
                    <div class="signature-title">Operatör İmzası</div>
                    <div class="signature-line"></div>
                    <div class="signature-info">
                        <div><strong>Ad Soyad:</strong> ___________________</div>
                        <div><strong>Tarih:</strong> ___________________</div>
                        <div><strong>İmza:</strong></div>
                    </div>
                </div>
                
                <div class="signature-box">
                    <div class="signature-title">Vardiya Amiri İmzası</div>
                    <div class="signature-line"></div>
                    <div class="signature-info">
                        <div><strong>Ad Soyad:</strong> ___________________</div>
                        <div><strong>Tarih:</strong> ___________________</div>
                        <div><strong>İmza:</strong></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Bu belge elektronik ortamda oluşturulmuştur ve imza ile geçerlidir.</p>
            <p>Thunder Production © ${new Date().getFullYear()} - Tüm hakları saklıdır.</p>
        </div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 1000);
        };
    </script>
</body>
</html>
    `;
}

// Operatör ID'sini operatör adına çeviren fonksiyon
function getOperatorName(operatorId) {
    const operatorMap = {
        '4': 'Thunder Serisi Operatör',
        '5': 'ThunderPRO Serisi Operatör',
        '1': 'Operatör 1',
        '2': 'Operatör 2',
        '3': 'Operatör 3'
    };
    return operatorMap[operatorId] || `Operatör ${operatorId}`;
}

function extractWorkOrderData(modalBody) {
    // Modal'dan verileri çıkar
    const tables = modalBody.querySelectorAll('table');
    const workOrderTable = tables[0];
    const operatorTable = tables[1];
    
    let workOrderNumber = 'N/A';
    let productName = 'N/A';
    let customerName = 'N/A';
    let orderDate = new Date().toLocaleDateString('tr-TR');
    let assignedOperator = 'N/A';
    let priority = 'Orta';
    let status = 'Beklemede';
    let planId = 'N/A';
    let notes = 'Not bulunmuyor';
    let products = [];
    
    if (workOrderTable) {
        const rows = workOrderTable.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const label = cells[0].textContent.trim();
                const value = cells[1].textContent.trim();
                
                if (label.includes('İş Emri No')) workOrderNumber = value.replace('<strong>', '').replace('</strong>', '');
                if (label.includes('Plan Adı')) productName = value;
                if (label.includes('Müşteri')) customerName = value;
                if (label.includes('Tarih')) orderDate = value;
            }
        });
    }
    
    if (operatorTable) {
        const rows = operatorTable.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const label = cells[0].textContent.trim();
                const value = cells[1].textContent.trim();
                
                if (label.includes('Atanan Operatör')) {
                    // Operatör adı zaten modal'da gösteriliyor, direkt al
                    assignedOperator = value.replace('<strong>', '').replace('</strong>', '');
                }
                if (label.includes('Öncelik')) priority = value;
                if (label.includes('Durum')) status = value;
                if (label.includes('Plan ID')) planId = value;
            }
        });
    }
    
    // Notları bul
    const notesSection = modalBody.querySelector('.bg-light');
    if (notesSection) {
        const notesText = notesSection.querySelector('small');
        if (notesText) {
            notes = notesText.textContent.trim();
        }
    }
    
    // Ürünleri bul
    const productTable = modalBody.querySelector('table.table-bordered');
    if (productTable) {
        const productRows = productTable.querySelectorAll('tbody tr');
        productRows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                const code = cells[0].textContent.trim();
                const name = cells[1].textContent.trim();
                const quantity = cells[2].textContent.trim();
                
                if (code && name && !code.includes('Ürün detayları bulunamadı')) {
                    products.push({
                        id: `PRD-${index + 1}`,
                        code: code,
                        name: name,
                        quantity: parseInt(quantity) || 1
                    });
                }
            }
        });
    }
    
    return {
        workOrderNumber,
        productName,
        customerName,
        orderDate,
        assignedOperator,
        priority,
        status,
        planId,
        notes,
        products
    };
}

// Modal fonksiyonları
function showAddPlanModal() {
    console.log('➕ Yeni plan modalı açılıyor');
    // Modal açma işlemi burada yapılacak
}

function showSchedulingModal() {
    console.log('⏰ Zamanlama modalı açılıyor');
    // Modal açma işlemi burada yapılacak
}

function showCreatePlanFromOrdersModal() {
    console.log('📋 Siparişlerden plan oluşturma modalı açılıyor');
    // Modal açma işlemi burada yapılacak
}

function showAddResourceModal() {
    console.log('🔧 Kaynak ekleme modalı açılıyor');
    // Modal açma işlemi burada yapılacak
}

// Görünüm değiştirme
function switchView(viewType) {
    console.log('🔄 Görünüm değiştiriliyor:', viewType);
    // Görünüm değiştirme işlemi burada yapılacak
}

function filterByDateRange(range) {
    console.log('📅 Tarih filtresi uygulanıyor:', range);
    // Filtreleme işlemi burada yapılacak
}

// İş emirlerini yükle
async function loadWorkOrders() {
    try {
        const response = await fetch('/api/work-orders');
        if (response.ok) {
            const workOrders = await response.json();
            console.log('📋 İş emirleri yüklendi:', workOrders.length);
            // İş emirleri listesini güncelle (eğer bir liste varsa)
            return workOrders;
        } else {
            console.error('❌ İş emirleri yüklenemedi');
        }
    } catch (error) {
        console.error('❌ İş emirleri yükleme hatası:', error);
    }
}

// Alert fonksiyonu - Bootstrap toast kullanarak
function showAlert(message, type = 'info') {
    // Bootstrap toast oluştur
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div class="toast" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} text-white">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                <strong class="me-auto">${type === 'error' ? 'Hata' : type === 'success' ? 'Başarılı' : 'Bilgi'}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Toast kapandıktan sonra DOM'dan kaldır
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Üretim Planlama sayfası yüklendi');
    loadProductionPlans();
    loadResources();
    loadOrders();
});
