// Sipariş Yönetimi sayfası için özel JavaScript

// Sipariş yönetimi fonksiyonları
async function loadOrders() {
    try {
        console.log('📦 Siparişler yükleniyor...');
        
        const response = await fetch('/api/orders');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const orders = await response.json();
        console.log('✅ Siparişler yüklendi:', orders.length);
        
        displayOrders(orders);
    } catch (error) {
        console.error('❌ Siparişler yüklenirken hata:', error);
        showAlert('Siparişler yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

function displayOrders(orders) {
    console.log('📋 Siparişler gösteriliyor:', orders.length);
    
    // Aktif ve tamamlanan siparişleri ayır
    const activeOrders = orders.filter(order => 
        ['pending', 'processing', 'approved'].includes(order.status)
    );
    const completedOrders = orders.filter(order => 
        order.status === 'completed'
    );
    
    console.log('🔄 Aktif siparişler:', activeOrders.length);
    console.log('✅ Tamamlanan siparişler:', completedOrders.length);
    
    // Aktif siparişleri göster
    displayOrderSection('active-orders-container', activeOrders, 'Üretimde olan sipariş bulunmuyor');
    
    // Tamamlanan siparişleri göster
    displayOrderSection('completed-orders-container', completedOrders, 'Tamamlanan sipariş bulunmuyor');
}

function displayOrderSection(containerId, orders, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('❌ Container bulunamadı:', containerId);
        return;
    }
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-2">
                <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                <h6 class="text-muted">${emptyMessage}</h6>
                <p class="text-muted small">Henüz sipariş bulunmuyor</p>
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
                                <td>${getCustomerName(order.customer_name)}</td>
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

// Yardımcı fonksiyonlar
function getPriorityColor(priority) {
    const colors = {
        'Düşük': 'secondary',
        'Orta': 'warning',
        'Yüksek': 'danger',
        'Acil': 'dark'
    };
    return colors[priority] || 'secondary';
}

function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'processing': 'info',
        'approved': 'success',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'pending': 'Beklemede',
        'processing': 'İşleniyor',
        'approved': 'Onaylandı',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi'
    };
    return texts[status] || status;
}

function isWorkingDay(date) {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Pazartesi-Cuma
}

// Sipariş işlemleri
function viewOrder(orderId) {
    console.log('👁️ Sipariş görüntüleniyor:', orderId);
    // Modal açma işlemi burada yapılacak
}

async function approveOrder(orderId) {
    try {
        console.log('✅ Sipariş onaylanıyor:', orderId);
        
        // Onay al
        if (!confirm('Bu siparişi onaylamak istediğinizden emin misiniz?')) {
            return;
        }
        
        // API'ye onaylama isteği gönder
        const response = await fetch(`/api/orders/${orderId}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Sipariş başarıyla onaylandı');
            showAlert('Sipariş başarıyla onaylandı!', 'success');
            
            // Siparişleri yenile
            await loadOrders();
        } else {
            const error = await response.json();
            console.error('❌ Sipariş onaylama hatası:', error);
            showAlert(`Sipariş onaylanamadı: ${error.error || 'Bilinmeyen hata'}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Sipariş onaylama hatası:', error);
        showAlert('Sipariş onaylanırken hata oluştu', 'error');
    }
}

function editOrder(orderId) {
    console.log('✏️ Sipariş düzenleniyor:', orderId);
    // Düzenleme işlemi burada yapılacak
}

async function deleteOrder(orderId) {
    try {
        console.log('🗑️ Sipariş siliniyor:', orderId);
        
        // Onay al
        if (!confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
            return;
        }
        
        // API'ye silme isteği gönder
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            console.log('✅ Sipariş başarıyla silindi');
            showAlert('Sipariş başarıyla silindi!', 'success');
            
            // Siparişleri yenile
            await loadOrders();
        } else {
            const error = await response.json();
            console.error('❌ Sipariş silme hatası:', error);
            showAlert(`Sipariş silinemedi: ${error.error || 'Bilinmeyen hata'}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Sipariş silme hatası:', error);
        showAlert('Sipariş silinirken hata oluştu', 'error');
    }
}

// Global değişkenler
let selectedProducts = [];
let customersList = []; // Müşteri listesi cache'i

// Modal fonksiyonları
async function showAddOrderModal() {
    console.log('➕ Yeni sipariş modalı açılıyor');
    
    // Form alanlarını temizle
    document.getElementById('addOrderForm').reset();
    selectedProducts = [];
    document.getElementById('selectedProducts').innerHTML = '';
    
        // Teslim tarihini bugünden 1 gün sonra olarak ayarla
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        document.getElementById('deliveryDate').value = nextDay.toISOString().split('T')[0];
    
    // Sipariş numarasını otomatik oluştur
    const orderNumber = 'ORD-' + Date.now();
    document.getElementById('orderNumber').value = orderNumber;
    
    // Dropdown'ları doldur
    await loadCustomers();
    await loadOperators();
    await loadNihaiProducts();
    
    // Modal'ı aç
    const modal = new bootstrap.Modal(document.getElementById('addOrderModal'));
    modal.show();
}

// Müşteri adı alma fonksiyonu
function getCustomerName(customerIdOrName) {
    // Eğer zaten müşteri adı ise direkt döndür
    if (isNaN(customerIdOrName)) {
        return customerIdOrName;
    }
    
    // Müşteri ID'si ise cache'den bul
    const customer = customersList.find(c => c.id == customerIdOrName);
    if (customer) {
        return customer.name || customer.customer_name || `Müşteri ${customerIdOrName}`;
    }
    
    // Bulunamazsa ID'yi döndür
    return `Müşteri ${customerIdOrName}`;
}

// Dropdown yükleme fonksiyonları
async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        if (response.ok) {
            const customers = await response.json();
            customersList = customers; // Cache'e kaydet
            
            const customerSelect = document.getElementById('customerName');
            customerSelect.innerHTML = '<option value="">Müşteri seçiniz...</option>';
            
            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customer.name || customer.customer_name;
                customerSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('❌ Müşteriler yüklenemedi:', error);
        // Mock müşteri listesi
        customersList = [
            { id: 1, name: 'ABC Tekstil A.Ş.' },
            { id: 2, name: 'XYZ Giyim Ltd.' },
            { id: 3, name: 'DEF Moda San.' }
        ];
        
        const customerSelect = document.getElementById('customerName');
        customerSelect.innerHTML = `
            <option value="">Müşteri seçiniz...</option>
            <option value="1">ABC Tekstil A.Ş.</option>
            <option value="2">XYZ Giyim Ltd.</option>
            <option value="3">DEF Moda San.</option>
        `;
    }
}

async function loadOperators() {
    try {
        const response = await fetch('/api/operators');
        if (response.ok) {
            const operators = await response.json();
            const operatorSelect = document.getElementById('assignedOperator');
            operatorSelect.innerHTML = '<option value="">Operatör seçiniz...</option>';
            
            operators.forEach(operator => {
                const option = document.createElement('option');
                option.value = operator.id;
                option.textContent = operator.name;
                operatorSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('❌ Operatörler yüklenemedi:', error);
        // Mock operatör listesi
        const operatorSelect = document.getElementById('assignedOperator');
        operatorSelect.innerHTML = `
            <option value="">Operatör seçiniz...</option>
            <option value="4">Thunder Serisi Operatör</option>
            <option value="5">ThunderPRO Serisi Operatör</option>
        `;
    }
}

async function loadNihaiProducts() {
    try {
        const response = await fetch('/api/nihai-urunler');
        if (response.ok) {
            const products = await response.json();
            const productSelect = document.getElementById('productSelect');
            productSelect.innerHTML = '<option value="">Ürün seçiniz...</option>';
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                // Ürün adını kontrol et - ad veya urun_adi alanından birini kullan
                const productName = product.ad || product.urun_adi || product.kod || 'Bilinmeyen Ürün';
                option.textContent = `${product.kod} - ${productName}`;
                option.dataset.code = product.kod;
                option.dataset.name = productName;
                productSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('❌ Nihai ürünler yüklenemedi:', error);
        // Mock ürün listesi
        const productSelect = document.getElementById('productSelect');
        productSelect.innerHTML = `
            <option value="">Ürün seçiniz...</option>
            <option value="1" data-code="TRX-1" data-name="TRX Serisi Ürün">TRX-1 - TRX Serisi Ürün</option>
            <option value="2" data-code="PRO-1" data-name="PRO Serisi Ürün">PRO-1 - PRO Serisi Ürün</option>
        `;
    }
}

// Ürün ekleme fonksiyonu
function addProductToOrder() {
    const productSelect = document.getElementById('productSelect');
    const quantityInput = document.getElementById('productQuantity');
    
    if (!productSelect.value || !quantityInput.value || quantityInput.value < 1) {
        showAlert('Lütfen ürün ve miktar seçiniz!', 'error');
        return;
    }
    
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const product = {
        id: productSelect.value,
        code: selectedOption.dataset.code,
        name: selectedOption.dataset.name,
        quantity: parseInt(quantityInput.value)
    };
    
    // Aynı ürün zaten eklenmiş mi kontrol et
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (existingProduct) {
        existingProduct.quantity += product.quantity;
    } else {
        selectedProducts.push(product);
    }
    
    // Ürün listesini güncelle
    updateSelectedProductsDisplay();
    
    // Form alanlarını temizle
    productSelect.value = '';
    quantityInput.value = '';
}

function updateSelectedProductsDisplay() {
    const container = document.getElementById('selectedProducts');
    container.innerHTML = '';
    
    selectedProducts.forEach((product, index) => {
        const productDiv = document.createElement('div');
        productDiv.className = 'alert alert-info d-flex justify-content-between align-items-center';
        productDiv.innerHTML = `
            <span><strong>${product.code}</strong> - ${product.name} (${product.quantity} adet)</span>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeProductFromOrder(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(productDiv);
    });
}

function removeProductFromOrder(index) {
    selectedProducts.splice(index, 1);
    updateSelectedProductsDisplay();
}

async function createNewOrder() {
    try {
        console.log('📝 Yeni sipariş oluşturuluyor...');
        
        // Zorunlu alanları kontrol et
        if (!document.getElementById('customerName').value || 
            !document.getElementById('deliveryDate').value || 
            !document.getElementById('priority').value ||
            selectedProducts.length === 0) {
            showAlert('Lütfen tüm zorunlu alanları doldurun ve en az bir ürün ekleyin!', 'error');
            return;
        }
        
        // Form verilerini al
        const customerSelect = document.getElementById('customerName');
        const selectedCustomerId = customerSelect.value;
        const selectedCustomerName = customerSelect.options[customerSelect.selectedIndex].text;
        
        const orderData = {
            customer_name: selectedCustomerName, // Müşteri adını direkt gönder
            order_number: document.getElementById('orderNumber').value,
            delivery_date: document.getElementById('deliveryDate').value,
            priority: parseInt(document.getElementById('priority').value),
            assigned_operator: document.getElementById('assignedOperator').value || null,
            product_details: JSON.stringify(selectedProducts), // JSON formatında sakla
            notes: document.getElementById('notes').value,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        // API'ye gönder
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Yeni sipariş oluşturuldu:', result);
            
            // Modal'ı kapat
            const modal = bootstrap.Modal.getInstance(document.getElementById('addOrderModal'));
            modal.hide();
            
            // Başarı mesajı
            showAlert('Yeni sipariş başarıyla oluşturuldu!', 'success');
            
            // Siparişleri yenile
            await loadOrders();
            
        } else {
            const error = await response.json();
            showAlert(`Sipariş oluşturulamadı: ${error.error || 'Bilinmeyen hata'}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Sipariş oluşturma hatası:', error);
        showAlert('Sipariş oluşturulurken hata oluştu', 'error');
    }
}

// Alert fonksiyonu
function showAlert(message, type = 'info') {
    // Basit alert - daha sonra modal ile değiştirilebilir
    alert(`${type.toUpperCase()}: ${message}`);
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Sipariş Yönetimi sayfası yüklendi');
    
    // Önce müşteri listesini yükle, sonra siparişleri yükle
    loadCustomers().then(() => {
        loadOrders();
    });
});
