// ThunderV1 Gelişmiş Dashboard & Analitik JavaScript
// V2.0.0 - Modern Dashboard with Real-time Updates

// Global değişkenler
let dashboardStats = {};
let advancedStats = {};
let realtimeData = {};
let currentPeriod = '7d';
let charts = {};
let refreshInterval = null;
let realtimeInterval = null;

// Chart.js konfigürasyonu - güvenli yükleme
function initializeChartJS() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js yüklenemedi, fallback moduna geçiliyor');
        return false;
    }
    
    Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    Chart.defaults.color = '#2d3436';
    Chart.defaults.plugins.legend.display = false;
    return true;
}

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Gelişmiş Dashboard yüklendi');
    
    // Chart.js'i başlat
    const chartJSLoaded = initializeChartJS();
    
    // Period selector event listeners
    initializePeriodSelector();
    
    // Sıralı yükleme
    loadAllData().then(() => {
        console.log('Tüm veriler yüklendi');
        startRealTimeUpdates();
    });
    
    // Otomatik yenileme (10 saniyede bir - gerçek zamanlı)
    refreshInterval = setInterval(() => {
        console.log('🔄 Veri güncelleniyor...');
        loadAllData();
    }, 10000);
});

// Period selector'ı başlat
function initializePeriodSelector() {
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Active class'ı güncelle
            periodButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Period'u güncelle ve verileri yenile
            currentPeriod = this.dataset.period;
            loadAllData();
        });
    });
}

// Tüm verileri yükle
async function loadAllData() {
    try {
        console.log('📊 Tüm veriler yükleniyor...');
        
        await Promise.all([
            loadDashboardStats(),
            loadAdvancedStats(),
            loadRealtimeData(),
            loadOperatorPerformance(),
            loadStockAlerts()
        ]);
        
        // Grafikleri güncelle
        createProductionTrendChart();
        createCustomerProductionChart();
        
        console.log('✅ Tüm veriler başarıyla yüklendi');
        
        // Real-time indicator'ı güncelle (fonksiyon kontrolü ile)
        if (typeof updateRealTimeIndicator === 'function') {
            updateRealTimeIndicator(true);
        }
        
    } catch (error) {
        console.error('❌ Veri yükleme hatası:', error);
        showAlert('Veriler yüklenirken hata oluştu', 'error');
    }
}

// Dashboard istatistiklerini yükle
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/statistics');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        dashboardStats = data;
        displayDashboardStats(data);
        return data;
    } catch (error) {
        console.error('Dashboard istatistikleri yüklenemedi:', error);
        // Fallback data ile devam et
        const fallbackData = {
            total_productions: 0,
            active_productions: 0,
            completed_productions: 0,
            total_cost: 0
        };
        dashboardStats = fallbackData;
        displayDashboardStats(fallbackData);
        return fallbackData;
    }
}

// Dashboard istatistiklerini göster
function displayDashboardStats(stats) {
    dashboardStats = stats;
    
    // Ana metrikleri güncelle
    document.getElementById('totalProductions').textContent = stats.productions?.total || 0;
    document.getElementById('qualityRate').textContent = `${stats.quality?.pass_rate || 0}%`;
    document.getElementById('activeOrders').textContent = stats.orders?.total || 0;
    document.getElementById('alertsCount').textContent = stats.notifications?.critical || 0;
    
    // Değişim yüzdelerini güncelle (örnek veriler)
    updateMetricChanges();
}

// Metrik değişimlerini güncelle
function updateMetricChanges() {
    const changes = {
        production: { value: '+12%', type: 'positive' },
        quality: { value: '+5%', type: 'positive' },
        order: { value: '-3%', type: 'negative' },
        alert: { value: 'Kritik', type: 'warning' }
    };
    
    Object.keys(changes).forEach(key => {
        const element = document.getElementById(`${key}Change`);
        if (element) {
            element.innerHTML = `
                <i class="fas fa-arrow-${changes[key].type === 'positive' ? 'up' : 'down'}"></i>
                ${changes[key].value}
            `;
            element.className = `metric-change ${changes[key].type}`;
        }
    });
}

// Gelişmiş istatistikleri yükle
async function loadAdvancedStats() {
    try {
        const response = await fetch('/api/dashboard/advanced-stats');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Advanced stats loaded:', data);
        
        // API'den gelen veriyi direkt kullan
        displayAdvancedStats(data);
        return data;
        
    } catch (error) {
        console.error('Gelişmiş istatistikler yüklenemedi:', error);
        // Fallback data ile devam et
        const fallbackData = {
            production: { total_productions: 0, completed_productions: 0, total_quantity: 0, daily_trend: [] },
            operators: [],
            quality: { total_checks: 0, pass_rate: 0, daily_trend: [] },
            customers: { total_customers: 0, customer_production: [] }
        };
        displayAdvancedStats(fallbackData);
        return fallbackData;
    }
}

// Advanced stats'ı görüntüle
function displayAdvancedStats(data) {
    console.log('Displaying advanced stats:', data);
    
    // Production istatistikleri (element kontrolü ile)
    const productionStats = data.production || {};
    
    const totalProductionsEl = document.getElementById('totalProductions');
    if (totalProductionsEl) {
        totalProductionsEl.textContent = productionStats.total_productions || 0;
    }
    
    const completedProductionsEl = document.getElementById('completedProductions');
    if (completedProductionsEl) {
        completedProductionsEl.textContent = productionStats.completed_productions || 0;
    }
    
    const totalQuantityEl = document.getElementById('totalQuantity');
    if (totalQuantityEl) {
        totalQuantityEl.textContent = productionStats.total_quantity || 0;
    }
    
    // Operatör performansı
    const operators = data.operators || [];
    updateOperatorPerformanceTable(operators);
    
    // Grafikleri güncelle
    createProductionTrendChart(data.production?.daily_trend || []);
    createCustomerProductionChart(data.customers?.customer_production || []);
    
    advancedStats = data;
    updateAdvancedMetrics(data);
}

// Gelişmiş metrikleri güncelle
function updateAdvancedMetrics(stats) {
    // Veri kaynağını göster
    updateDataSourceIndicator(stats);
    
    // Üretim metriklerini güncelle
    if (stats.production) {
        document.getElementById('totalProductions').textContent = stats.production.total_productions;
    }
    
    // Kalite metriklerini güncelle
    if (stats.quality) {
        document.getElementById('qualityRate').textContent = `${stats.quality.pass_rate}%`;
    }
    
    // Sipariş metriklerini güncelle
    if (stats.orders) {
        document.getElementById('activeOrders').textContent = stats.orders.total_orders;
    }
}

// Veri kaynağı göstergesini güncelle
function updateDataSourceIndicator(stats) {
    const indicator = document.querySelector('.real-time-badge');
    if (indicator && stats.is_mock_data) {
        indicator.innerHTML = `
            <i class="fas fa-exclamation-triangle me-1"></i>Veri Yok
        `;
        indicator.className = 'real-time-badge bg-warning';
        indicator.title = 'Bu dönem için gerçek veri bulunmuyor. Veri geldiğinde otomatik güncellenecek.';
    } else if (indicator && !stats.is_mock_data) {
        indicator.innerHTML = `
            <i class="fas fa-circle me-1"></i>Canlı Veri
        `;
        indicator.className = 'real-time-badge bg-success';
        indicator.title = 'Gerçek zamanlı veri gösteriliyor.';
    }
}

// Real-time verileri yükle
async function loadRealtimeData() {
    try {
        const response = await fetch('/api/dashboard/realtime');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        realtimeData = data;
        updateRealtimeData(data);
        return data;
    } catch (error) {
        console.error('Real-time veriler yüklenemedi:', error);
        // Fallback data ile devam et
        const fallbackData = {
            active_productions: [],
            recent_notifications: [],
            system_status: { status: 'unknown', uptime: 0 }
        };
        realtimeData = fallbackData;
        updateRealtimeData(fallbackData);
        return fallbackData;
    }
}

// Real-time verileri güncelle
function updateRealtimeData(data) {
    // Aktif üretimleri güncelle
    updateActiveProductions(data.active_productions || []);
    
    // Bildirimleri güncelle
    updateRecentNotifications(data.recent_notifications || []);
    
    // Sistem durumunu güncelle
    updateSystemStatus(data.system_status);
}

// Aktif üretimleri güncelle
function updateActiveProductions(productions) {
    const container = document.getElementById('activeProductionsList');
    
    if (productions.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-industry fa-3x text-muted mb-3"></i>
                <p class="text-muted">Aktif üretim bulunmuyor</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = productions.map(prod => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div>
                <h6 class="mb-1">${prod.product_name}</h6>
                <small class="text-muted">${prod.assigned_operator || 'Operatör atanmamış'}</small>
        </div>
            <div class="text-end">
                <div class="progress-glass mb-1" style="width: 100px;">
                    <div class="progress-bar" style="width: ${(prod.produced_quantity / prod.planned_quantity * 100)}%"></div>
            </div>
                <small class="text-muted">${prod.produced_quantity}/${prod.planned_quantity}</small>
        </div>
            </div>
    `).join('');
}

// Son bildirimleri güncelle
function updateRecentNotifications(notifications) {
    const container = document.getElementById('recentNotifications');
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-bell fa-3x text-muted mb-3"></i>
                <p class="text-muted">Yeni bildirim yok</p>
        </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="d-flex align-items-start py-2 border-bottom ${notif.type === 'system_error' ? 'border-danger' : ''}">
            <div class="me-3">
                <i class="fas fa-${getNotificationIcon(notif.priority, notif.type)} text-${getPriorityColor(notif.priority)}"></i>
            </div>
            <div class="flex-grow-1">
                <h6 class="mb-1 ${notif.type === 'system_error' ? 'text-danger' : ''}">${notif.title}</h6>
                <p class="mb-1 small text-muted">${notif.message}</p>
                <small class="text-muted">${new Date(notif.created_at).toLocaleString('tr-TR')}</small>
        </div>
        </div>
    `).join('');
}

// Sistem durumunu güncelle
function updateSystemStatus(status) {
    if (!status) return;
    
    // CPU ve bellek kullanımı (simüle edilmiş)
    const cpuUsage = Math.floor(Math.random() * 30) + 20;
    const memoryUsage = Math.floor(Math.random() * 40) + 30;
    
    document.getElementById('cpuUsage').textContent = `${cpuUsage}%`;
    document.getElementById('cpuProgress').style.width = `${cpuUsage}%`;
    
    document.getElementById('memoryUsage').textContent = `${memoryUsage}%`;
    document.getElementById('memoryProgress').style.width = `${memoryUsage}%`;
    
    // Veritabanı durumu
    const dbStatus = status.database_connected ? 'Aktif' : 'Bağlantı Yok';
    const dbClass = status.database_connected ? 'bg-success' : 'bg-danger';
    document.getElementById('dbStatus').textContent = dbStatus;
    document.getElementById('dbStatus').className = `badge ${dbClass}`;
    
    // Son güncelleme
    document.getElementById('lastUpdate').textContent = new Date(status.last_update).toLocaleString('tr-TR');
}

// Dashboard widget'larını yükle
async function loadDashboardWidgets() {
    try {
        console.log('Dashboard widget\'ları yükleniyor...');
        const response = await fetch('/api/dashboard/widgets');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Widget verileri alındı:', data);
        
        dashboardWidgets = data;
        displayDashboardWidgets(data);
        return data;
    } catch (error) {
        console.error('Dashboard widget\'ları yüklenemedi:', error);
        showAlert('Dashboard widget\'ları yüklenemedi: ' + error.message, 'error');
        throw error;
    }
}

// Dashboard widget'larını göster
function displayDashboardWidgets(widgets) {
    const container = document.getElementById('dashboardWidgets');
    if (widgets.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">Henüz widget eklenmemiş</div>';
        return;
    }

    container.innerHTML = widgets.map(widget => `
        <div class="col-md-4 mb-3">
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${widget.title}</h6>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editWidget(${widget.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteWidget(${widget.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">${widget.description || 'Açıklama yok'}</p>
                    <div class="widget-content" id="widget-${widget.id}">
                        ${renderWidgetContent(widget)}
                    </div>
                    <small class="text-muted">
                        <i class="fas fa-tag me-1"></i>${widget.widget_type} | 
                        <i class="fas fa-sync-alt me-1"></i>${widget.refresh_interval}s
                    </small>
                </div>
            </div>
        </div>
    `).join('');

    // Chart'ları render et
    setTimeout(() => {
        widgets.forEach(widget => {
            if (widget.widget_type === 'chart') {
                try {
                    renderChart(`chart-${widget.id}`, widget.widget_type);
                } catch (error) {
                    console.error(`Chart render hatası (${widget.id}):`, error);
                }
            }
        });
    }, 500); // Daha uzun bekleme süresi
}

// Widget içeriğini render et
function renderWidgetContent(widget) {
    switch (widget.widget_type) {
        case 'metric':
            return renderMetricWidget(widget);
        case 'gauge':
            return renderGaugeWidget(widget);
        case 'chart':
            return renderChartWidget(widget);
        case 'table':
            return renderTableWidget(widget);
        case 'progress':
            return renderProgressWidget(widget);
        default:
            return '<div class="text-muted">Widget türü desteklenmiyor</div>';
    }
}

// Metric widget render
function renderMetricWidget(widget) {
    const value = getMetricValue(widget);
    return `
        <div class="text-center">
            <h2 class="text-primary mb-2">${value}</h2>
            <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-primary" style="width: ${Math.min(value, 100)}%"></div>
            </div>
        </div>
    `;
}

// Gauge widget render
function renderGaugeWidget(widget) {
    const value = getMetricValue(widget);
    const percentage = Math.min(value, 100);
    const color = percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'danger';
    
    return `
        <div class="text-center">
            <div class="gauge-container" style="position: relative; width: 120px; height: 60px; margin: 0 auto;">
                <div class="gauge-circle" style="
                    width: 120px; 
                    height: 120px; 
                    border-radius: 50%; 
                    background: conic-gradient(from 0deg, #${percentage >= 80 ? '28a745' : percentage >= 60 ? 'ffc107' : 'dc3545'} 0deg ${percentage * 3.6}deg, #e9ecef ${percentage * 3.6}deg 360deg);
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                "></div>
                <div class="gauge-value" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 24px;
                    font-weight: bold;
                    color: #${percentage >= 80 ? '28a745' : percentage >= 60 ? 'ffc107' : 'dc3545'};
                ">${value}%</div>
            </div>
        </div>
    `;
}

// Chart widget render
function renderChartWidget(widget) {
    const chartId = `chart-${widget.id}`;
    return `
        <div class="chart-container" style="height: 200px;">
            <canvas id="${chartId}"></canvas>
            <div class="fallback-chart" style="display: none;">
                ${renderFallbackChart(widget)}
            </div>
        </div>
    `;
}

// Fallback chart (Chart.js olmadan)
function renderFallbackChart(widget) {
    const data = generateChartData('chart');
    
    // Güvenli veri kontrolü
    if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
        return `
            <div class="text-center text-muted">
                <i class="fas fa-chart-bar fa-2x mb-2"></i>
                <p>Veri yok</p>
            </div>
        `;
    }
    
    const maxValue = Math.max(...data.data);
    
    return `
        <div class="simple-chart" style="height: 180px; padding: 10px;">
            <div class="d-flex justify-content-between align-items-end h-100">
                ${data.data.map((value, index) => {
                    const height = (value / maxValue) * 100;
                    return `
                        <div class="d-flex flex-column align-items-center" style="flex: 1;">
                            <div class="chart-bar bg-primary" style="
                                height: ${height}%; 
                                width: 20px; 
                                margin-bottom: 5px;
                                border-radius: 2px;
                            "></div>
                            <small class="text-muted">${data.labels[index]}</small>
                            <small class="fw-bold">${value}</small>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Table widget render
function renderTableWidget(widget) {
    const data = getTableData(widget);
    return `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Öğe</th>
                        <th>Değer</th>
                        <th>Durum</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>
                            <td>${row.name}</td>
                            <td>${row.value}</td>
                            <td><span class="badge bg-${row.status === 'good' ? 'success' : row.status === 'warning' ? 'warning' : 'danger'}">${row.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Progress widget render
function renderProgressWidget(widget) {
    const value = getMetricValue(widget);
    return `
        <div class="progress-container">
            <div class="d-flex justify-content-between mb-2">
                <span>İlerleme</span>
                <span>${value}%</span>
            </div>
            <div class="progress" style="height: 20px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     style="width: ${value}%" 
                     role="progressbar">
                </div>
            </div>
        </div>
    `;
}

// Metric değeri al
function getMetricValue(widget) {
    // Widget'a göre farklı değerler döndür
    switch (widget.widget_name) {
        case 'production_overview':
            return dashboardStats.productions?.total || 0;
        case 'quality_score':
            return parseFloat(dashboardStats.quality?.pass_rate) || 0;
        case 'resource_utilization':
            return Math.floor(Math.random() * 100);
        case 'production_timeline':
            return Math.floor(Math.random() * 50) + 20;
        case 'quality_trends':
            return Math.floor(Math.random() * 30) + 70;
        case 'alerts_summary':
            return dashboardStats.notifications?.total || 0;
        default:
            return Math.floor(Math.random() * 100);
    }
}

// Tablo verisi al
function getTableData(widget) {
    const alerts = [
        { name: 'Kritik Uyarı', value: '3', status: 'danger' },
        { name: 'Orta Uyarı', value: '5', status: 'warning' },
        { name: 'Bilgi', value: '12', status: 'good' }
    ];
    
    const productions = [
        { name: 'Aktif Üretim', value: dashboardStats.productions?.active || 0, status: 'good' },
        { name: 'Tamamlanan', value: dashboardStats.productions?.completed || 0, status: 'good' },
        { name: 'Bekleyen', value: Math.floor(Math.random() * 5), status: 'warning' }
    ];
    
    switch (widget.widget_name) {
        case 'alerts_summary':
            return alerts;
        default:
            return productions;
    }
}

// Üretim trendi grafiği oluştur
function createProductionTrendChart(data = null) {
    const ctx = document.getElementById('productionTrendChart');
    if (!ctx) return;
    
    // Chart.js yüklü mü kontrol et
    if (typeof Chart === 'undefined') {
        showFallbackChart(ctx, 'production');
        return;
    }
    
    // Mevcut grafiği temizle
    if (charts.productionTrend) {
        charts.productionTrend.destroy();
    }
    
    const chartData = data || advancedStats?.production?.daily_trend || [];
    
    // Sadece gerçek veri kullan
    let labels, values;
    const hasData = chartData.length > 0 && chartData.some(item => (item.quantity || item.count) > 0);
    
    if (!hasData) {
      console.log('Gerçek veri bulunamadı - boş grafik gösteriliyor');
      showNoDataChart(ctx, 'production');
      return;
    } else {
      console.log('Gerçek veri kullanılıyor:', chartData);
      labels = chartData.map(item => new Date(item.date).toLocaleDateString('tr-TR'));
      values = chartData.map(item => item.quantity || item.count);
      updateChartTitle('productionTrendChart', 'Üretim Trendi');
    }
    
    charts.productionTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Üretim Miktarı',
                data: values,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                    }
                },
                scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
                }
            }
        });
}

// Müşteri başı üretim grafiği oluştur
function createCustomerProductionChart(data = null) {
    const ctx = document.getElementById('qualityDistributionChart');
    if (!ctx) return;
    
    // Chart.js yüklü mü kontrol et
    if (typeof Chart === 'undefined') {
        showFallbackChart(ctx, 'customer');
        return;
    }
    
    // Mevcut grafiği temizle
    if (charts.customerProduction) {
        charts.customerProduction.destroy();
    }
    
    const customerData = data || advancedStats?.customers?.customer_production || [];
    
    // Eğer veri yoksa "Veri Yok" göster
    if (customerData.length === 0) {
      showNoDataChart(ctx, 'customer');
      return;
    }
    
    const labels = customerData.map(item => item.customer_name);
    const values = customerData.map(item => item.total_quantity);
    
    charts.customerProduction = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#f5576c',
                    '#4facfe',
                    '#00f2fe',
                    '#43e97b',
                    '#38f9d7'
                ],
                borderWidth: 0,
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
}

// Operatör performansını yükle
async function loadOperatorPerformance() {
    try {
        const response = await fetch('/api/dashboard/advanced-stats?period=' + currentPeriod);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        updateOperatorPerformanceTable(data.operators || []);
        return data.operators;
    } catch (error) {
        console.error('Operatör performansı yüklenemedi:', error);
        // Fallback olarak boş array ile devam et
        updateOperatorPerformanceTable([]);
        return [];
    }
}

// Operatör performans tablosunu güncelle
function updateOperatorPerformanceTable(operators) {
    const container = document.getElementById('operatorPerformanceTable');
    
    if (operators.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fas fa-user-tie fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Operatör verisi bulunmuyor</p>
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = operators.map(op => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <i class="fas fa-user-circle fa-2x text-primary"></i>
                    </div>
                    <div>
                        <h6 class="mb-0">${op.operator_name}</h6>
                        <small class="text-muted">Operatör</small>
                    </div>
                </div>
            </td>
            <td><span class="badge bg-success">${op.completed_productions}</span></td>
            <td><span class="badge bg-info">${op.total_productions}</span></td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="progress-glass me-2" style="width: 60px;">
                        <div class="progress-bar" style="width: ${op.completion_rate}%"></div>
                    </div>
                    <span>${op.completion_rate}%</span>
                </div>
            </td>
            <td>
                <span class="badge bg-${op.completion_rate >= 80 ? 'success' : op.completion_rate >= 60 ? 'warning' : 'danger'}">
                    ${op.completion_rate >= 80 ? 'Mükemmel' : op.completion_rate >= 60 ? 'İyi' : 'Gelişmeli'}
                </span>
            </td>
        </tr>
    `).join('');
}



// Fallback chart göster (Chart.js yoksa)
function showFallbackChart(canvas, type) {
    const container = canvas.parentElement;
    
    if (type === 'production') {
        const data = advancedStats?.production?.daily_trend || [];
        const hasData = data.length > 0 && data.some(item => (item.quantity || item.count) > 0);
        
        let chartData, maxValue;
        if (!hasData) {
          // Test verisi oluştur
          chartData = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            chartData.push({
              date: date.toISOString().split('T')[0],
              quantity: Math.floor(Math.random() * 50) + 10,
              count: Math.floor(Math.random() * 10) + 1
            });
          }
        } else {
          chartData = data;
        }
        
        maxValue = Math.max(...chartData.map(item => item.quantity || item.count), 1);
        
        container.innerHTML = `
            <div class="fallback-chart" style="height: 250px; padding: 20px;">
                <h6 class="text-center mb-3">Üretim Trendi (Basit Görünüm)</h6>
                <div class="d-flex justify-content-between align-items-end h-100">
                    ${chartData.map((item, index) => {
                        const height = ((item.quantity || item.count) / maxValue) * 100;
                        return `
                            <div class="d-flex flex-column align-items-center" style="flex: 1;">
                                <div class="bg-primary rounded" style="
                                    height: ${height}%; 
                                    width: 20px; 
                                    margin-bottom: 10px;
                                    min-height: 10px;
                                "></div>
                                <small class="text-muted">${new Date(item.date).toLocaleDateString('tr-TR', {day: '2-digit', month: '2-digit'})}</small>
                                <small class="fw-bold">${item.quantity || item.count}</small>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    } else if (type === 'quality') {
        const qualityData = advancedStats?.quality || {};
        const passRate = parseFloat(qualityData.pass_rate) || 0;
        const failRate = 100 - passRate;
        
        container.innerHTML = `
            <div class="fallback-chart text-center" style="height: 250px; padding: 20px;">
                <h6 class="mb-3">Kalite Dağılımı (Basit Görünüm)</h6>
                <div class="d-flex justify-content-center align-items-center h-100">
                    <div class="d-flex flex-column align-items-center me-5">
                        <div class="bg-success rounded-circle d-flex align-items-center justify-content-center mb-2" 
                             style="width: 80px; height: 80px;">
                            <span class="text-white fw-bold">${passRate.toFixed(1)}%</span>
                        </div>
                        <small class="text-muted">Başarılı</small>
                    </div>
                    <div class="d-flex flex-column align-items-center">
                        <div class="bg-danger rounded-circle d-flex align-items-center justify-content-center mb-2" 
                             style="width: 80px; height: 80px;">
                            <span class="text-white fw-bold">${failRate.toFixed(1)}%</span>
                        </div>
                        <small class="text-muted">Başarısız</small>
                    </div>
                </div>
            </div>
        `;
    }
}

// Grafik başlığını güncelle
function updateChartTitle(canvasId, title) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const widget = canvas.closest('.dashboard-widget');
        if (widget) {
            const titleElement = widget.querySelector('.widget-title');
            if (titleElement) {
                titleElement.innerHTML = `<i class="fas fa-chart-line me-2"></i>${title}`;
            }
        }
    }
}

// Veri yok grafiği göster
function showNoDataChart(canvas, type) {
    const container = canvas.parentElement;
    
    if (type === 'production') {
        container.innerHTML = `
            <div class="no-data-chart text-center" style="height: 250px; padding: 40px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <i class="fas fa-chart-line fa-4x text-muted mb-3"></i>
                <h5 class="text-muted mb-2">Veri Bulunamadı</h5>
                <p class="text-muted mb-0">Bu dönem için üretim verisi bulunmuyor.</p>
                <small class="text-muted mt-2">Gerçek veri geldiğinde grafik otomatik güncellenecek.</small>
            </div>
        `;
    } else if (type === 'quality' || type === 'customer') {
        container.innerHTML = `
            <div class="no-data-chart text-center" style="height: 250px; padding: 40px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <i class="fas fa-chart-pie fa-4x text-muted mb-3"></i>
                <h5 class="text-muted mb-2">Veri Bulunamadı</h5>
                <p class="text-muted mb-0">Bu dönem için müşteri verisi bulunmuyor.</p>
                <small class="text-muted mt-2">Gerçek veri geldiğinde grafik otomatik güncellenecek.</small>
            </div>
        `;
    }
}

// Chart verisi oluştur
function generateChartData(type) {
    try {
        const labels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        const data = labels.map(() => Math.floor(Math.random() * 100));
        
        return {
            labels: labels,
            data: data, // Fallback için data ekledik
            datasets: [{
                label: 'Değer',
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };
    } catch (error) {
        console.error('Chart verisi oluşturma hatası:', error);
        return {
            labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
            data: [10, 20, 30, 40, 50, 60, 70],
            datasets: [{
                label: 'Değer',
                data: [10, 20, 30, 40, 50, 60, 70],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };
    }
}

// KPI tanımlarını yükle
async function loadKPIDefinitions() {
    try {
        const response = await fetch('/api/kpi/definitions');
        const data = await response.json();
        kpiDefinitions = data;
        displayKPIDefinitions(data);
        return data;
    } catch (error) {
        console.error('KPI tanımları yüklenemedi:', error);
        showAlert('KPI tanımları yüklenemedi', 'error');
        throw error;
    }
}

// KPI tanımlarını göster
function displayKPIDefinitions(kpis) {
    const container = document.getElementById('kpiDefinitions');
    if (kpis.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">Henüz KPI tanımı eklenmemiş</div>';
        return;
    }

    container.innerHTML = kpis.map(kpi => `
        <div class="kpi-card">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${kpi.kpi_name}</h6>
                    <small>${kpi.category} | ${kpi.unit || 'Birim yok'}</small>
                </div>
                <div class="text-end">
                    <small>Hedef: ${kpi.target_value || 'Belirtilmemiş'}</small>
                </div>
            </div>
        </div>
    `).join('');
}

// KPI değerlerini yükle
async function loadKPIValues() {
    try {
        const response = await fetch('/api/kpi/values?limit=10');
        const data = await response.json();
        kpiValues = data;
        displayKPIValues(data);
        return data;
    } catch (error) {
        console.error('KPI değerleri yüklenemedi:', error);
        showAlert('KPI değerleri yüklenemedi', 'error');
        throw error;
    }
}

// KPI değerlerini göster
function displayKPIValues(values) {
    const container = document.getElementById('kpiValues');
    if (values.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">Henüz KPI değeri hesaplanmamış</div>';
        return;
    }

    container.innerHTML = values.map(value => `
        <div class="card mb-2">
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${value.kpi_definitions?.kpi_name || 'Bilinmeyen KPI'}</h6>
                        <small class="text-muted">${new Date(value.period_start).toLocaleDateString('tr-TR')}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-${getStatusColor(value.status)}">${value.actual_value?.toFixed(2)} ${value.kpi_definitions?.unit || ''}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Rapor şablonlarını yükle
async function loadReportTemplates() {
    try {
        const response = await fetch('/api/reports/templates');
        const data = await response.json();
        reportTemplates = data;
        displayReportTemplates(data);
        updateTemplateSelect(data);
        return data;
    } catch (error) {
        console.error('Rapor şablonları yüklenemedi:', error);
        showAlert('Rapor şablonları yüklenemedi', 'error');
        throw error;
    }
}

// Rapor şablonlarını göster
function displayReportTemplates(templates) {
    const container = document.getElementById('reportTemplates');
    if (templates.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">Henüz rapor şablonu eklenmemiş</div>';
        return;
    }

    container.innerHTML = templates.map(template => `
        <div class="col-md-6 mb-3">
            <div class="report-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${template.template_name}</h6>
                        <p class="mb-2">${template.description || 'Açıklama yok'}</p>
                        <small>
                            <i class="fas fa-tag me-1"></i>${template.report_type} | 
                            <i class="fas fa-file me-1"></i>${template.output_format}
                        </small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-light me-1" onclick="generateReportFromTemplate(${template.id})">
                            <i class="fas fa-play me-1"></i>Oluştur
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Rapor geçmişini yükle
async function loadReportHistory() {
    try {
        const response = await fetch('/api/reports/history?limit=10');
        const data = await response.json();
        reportHistory = data;
        
        // reportHistory element'ini göster
        const reportHistoryElement = document.getElementById('reportHistory');
        if (reportHistoryElement) {
            reportHistoryElement.style.display = 'block';
        }
        
        displayReportHistory(data);
        return data;
    } catch (error) {
        console.error('Rapor geçmişi yüklenemedi:', error);
        showAlert('Rapor geçmişi yüklenemedi', 'error');
        throw error;
    }
}

// Rapor geçmişini göster
function displayReportHistory(history) {
    const container = document.getElementById('reportHistory');
    
    // Container null kontrolü
    if (!container) {
        console.error('reportHistory container bulunamadı');
        return;
    }
    
    if (history.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">Henüz rapor oluşturulmamış</div>';
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Rapor Adı</th>
                        <th>Şablon</th>
                        <th>Oluşturan</th>
                        <th>Tarih</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(report => `
                        <tr>
                            <td>${report.report_name}</td>
                            <td>${report.report_templates?.template_name || 'Bilinmeyen'}</td>
                            <td>${report.generated_by}</td>
                            <td>${new Date(report.generated_at).toLocaleString('tr-TR')}</td>
                            <td><span class="badge bg-${getStatusColor(report.status)}">${report.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-1" onclick="downloadReport(${report.id})" title="İndir">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteReport(${report.id})" title="Sil">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Widget ekleme modalını göster
function showAddWidgetModal() {
    const modal = new bootstrap.Modal(document.getElementById('addWidgetModal'));
    modal.show();
}

// Widget ekle
async function addWidget() {
    const form = document.getElementById('widgetForm');
    const formData = new FormData(form);
    
    const widgetData = {
        widget_name: document.getElementById('widgetName').value,
        widget_type: document.getElementById('widgetType').value,
        title: document.getElementById('widgetTitle').value,
        data_source: document.getElementById('dataSource').value,
        description: 'Yeni widget',
        position_x: 0,
        position_y: 0,
        width: 4,
        height: 3,
        refresh_interval: 300,
        is_active: true
    };

    try {
        const response = await fetch('/api/dashboard/widgets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(widgetData)
        });

        if (response.ok) {
            showAlert('Widget başarıyla eklendi', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addWidgetModal')).hide();
            form.reset();
            loadDashboardWidgets();
        } else {
            throw new Error('Widget eklenemedi');
        }
    } catch (error) {
        console.error('Widget ekleme hatası:', error);
        showAlert('Widget eklenemedi', 'error');
    }
}

// KPI ekleme modalını göster
function showAddKPIModal() {
    const modal = new bootstrap.Modal(document.getElementById('addKPIModal'));
    modal.show();
}

// KPI ekle
async function addKPI() {
    const form = document.getElementById('kpiForm');
    
    const kpiData = {
        kpi_name: document.getElementById('kpiName').value,
        category: document.getElementById('kpiCategory').value,
        target_value: parseFloat(document.getElementById('targetValue').value) || null,
        unit: document.getElementById('kpiUnit').value,
        description: 'Yeni KPI',
        calculation_method: 'SELECT COUNT(*) FROM productions',
        frequency: 'daily',
        is_active: true
    };

    try {
        const response = await fetch('/api/kpi/definitions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(kpiData)
        });

        if (response.ok) {
            showAlert('KPI başarıyla eklendi', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addKPIModal')).hide();
            form.reset();
            loadKPIDefinitions();
        } else {
            throw new Error('KPI eklenemedi');
        }
    } catch (error) {
        console.error('KPI ekleme hatası:', error);
        showAlert('KPI eklenemedi', 'error');
    }
}

// KPI hesapla
async function calculateKPI() {
    if (kpiDefinitions.length === 0) {
        showAlert('Önce KPI tanımları ekleyin', 'warning');
        return;
    }

    try {
        const kpi = kpiDefinitions[0]; // İlk KPI'yı hesapla
        const response = await fetch('/api/kpi/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kpi_id: kpi.id,
                period_start: new Date().toISOString(),
                period_end: new Date().toISOString()
            })
        });

        if (response.ok) {
            showAlert('KPI başarıyla hesaplandı', 'success');
            loadKPIValues();
        } else {
            throw new Error('KPI hesaplanamadı');
        }
    } catch (error) {
        console.error('KPI hesaplama hatası:', error);
        showAlert('KPI hesaplanamadı', 'error');
    }
}

// Rapor oluşturma modalını göster
function showAddReportModal() {
    const modal = new bootstrap.Modal(document.getElementById('generateReportModal'));
    modal.show();
}

// Şablon seçimini güncelle
function updateTemplateSelect(templates) {
    const select = document.getElementById('templateSelect');
    select.innerHTML = '<option value="">Şablon seçin...</option>' +
        templates.map(template => 
            `<option value="${template.id}">${template.template_name}</option>`
        ).join('');
}

// Rapor oluştur
async function generateReport() {
    const templateId = document.getElementById('templateSelect').value;
    const reportName = document.getElementById('reportName').value;
    const reportDate = document.getElementById('reportDate').value;

    if (!templateId || !reportName || !reportDate) {
        showAlert('Lütfen tüm alanları doldurun', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/reports/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_id: parseInt(templateId),
                report_name: reportName,
                parameters: { date: reportDate }
            })
        });

        if (response.ok) {
            const result = await response.json();
            showAlert(`Rapor başarıyla oluşturuldu: ${result.report_name}`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('generateReportModal')).hide();
            document.getElementById('reportForm').reset();
            loadReportHistory();
        } else {
            throw new Error('Rapor oluşturulamadı');
        }
    } catch (error) {
        console.error('Rapor oluşturma hatası:', error);
        showAlert('Rapor oluşturulamadı', 'error');
    }
}

// Şablondan rapor oluştur
async function generateReportFromTemplate(templateId) {
    const template = reportTemplates.find(t => t.id === templateId);
    if (!template) return;

    const reportName = prompt('Rapor adını girin:', template.template_name);
    if (!reportName) return;

    const reportDate = prompt('Rapor tarihini girin (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!reportDate) return;

    try {
        const response = await fetch('/api/reports/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_id: templateId,
                report_name: reportName,
                parameters: { date: reportDate }
            })
        });

        if (response.ok) {
            const result = await response.json();
            showAlert(`Rapor başarıyla oluşturuldu: ${result.report_name}`, 'success');
            loadReportHistory();
        } else {
            throw new Error('Rapor oluşturulamadı');
        }
    } catch (error) {
        console.error('Rapor oluşturma hatası:', error);
        showAlert('Rapor oluşturulamadı', 'error');
    }
}

// Widget düzenle
function editWidget(widgetId) {
    showAlert('Widget düzenleme özelliği yakında eklenecek', 'info');
}

// Widget sil
async function deleteWidget(widgetId) {
    if (!confirm('Widget\'ı silmek istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`/api/dashboard/widgets/${widgetId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('Widget başarıyla silindi', 'success');
            loadDashboardWidgets();
        } else {
            throw new Error('Widget silinemedi');
        }
    } catch (error) {
        console.error('Widget silme hatası:', error);
        showAlert('Widget silinemedi', 'error');
    }
}


// Durum rengini al
function getStatusColor(status) {
    switch (status) {
        case 'completed': return 'success';
        case 'pending': return 'warning';
        case 'generating': return 'info';
        case 'failed': return 'danger';
        case 'normal': return 'success';
        case 'warning': return 'warning';
        case 'critical': return 'danger';
        default: return 'secondary';
    }
}

// Kritik stok alarmlarını yükle
async function loadStockAlerts() {
    try {
        const response = await fetch('/api/dashboard/stock-alerts');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const alerts = await response.json();
        updateStockAlerts(alerts);
    } catch (error) {
        console.error('Stok alarmları yükleme hatası:', error);
        // Fallback olarak boş array ile devam et
        updateStockAlerts([]);
    }
}

// Stok alarmlarını güncelle
function updateStockAlerts(alerts) {
    const container = document.getElementById('stockAlerts');
    
    if (!container) {
        console.error('stockAlerts container bulunamadı');
        return;
    }
    
    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-check-circle"></i>
                <h6>Tüm stok seviyeleri normal</h6>
                <p class="text-muted">Kritik stok alarmı bulunmuyor</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="stock-alert-card ${alert.priority}">
            <div class="stock-alert-header">
                <h6 class="stock-alert-title">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${alert.product_name}
                </h6>
                <span class="stock-alert-priority priority-${alert.priority}">
                    ${alert.priority === 'critical' ? 'KRİTİK' : 
                      alert.priority === 'warning' ? 'UYARI' : 'BİLGİ'}
                </span>
            </div>
            <div class="stock-alert-details">
                <div class="row">
                    <div class="col-md-6">
                        <strong>Mevcut Stok:</strong> ${alert.current_stock} ${alert.unit || 'adet'}<br>
                        <strong>Kritik Seviye:</strong> ${alert.critical_level} ${alert.unit || 'adet'}<br>
                        <strong>Minimum Seviye:</strong> ${alert.minimum_level} ${alert.unit || 'adet'}
                    </div>
                    <div class="col-md-6">
                        <strong>Kalan Gün:</strong> ${alert.days_remaining || 'Hesaplanamadı'}<br>
                        <strong>Önerilen Sipariş:</strong> ${alert.recommended_order || 'Hesaplanamadı'} ${alert.unit || 'adet'}<br>
                        <strong>Tedarikçi:</strong> ${alert.supplier || 'Belirtilmemiş'}
                    </div>
                </div>
            </div>
            <div class="stock-alert-actions">
                <button class="btn btn-light btn-sm" onclick="createPurchaseOrder('${alert.product_id}', '${alert.product_name}', ${alert.recommended_order || 0})">
                    <i class="fas fa-shopping-cart me-1"></i>Sipariş Oluştur
                </button>
                <button class="btn btn-outline-light btn-sm" onclick="viewProductDetails('${alert.product_id}')">
                    <i class="fas fa-eye me-1"></i>Detayları Gör
                </button>
                <button class="btn btn-outline-light btn-sm" onclick="dismissAlert('${alert.id}')">
                    <i class="fas fa-times me-1"></i>Kapat
                </button>
            </div>
        </div>
    `).join('');
}

// Stok alarmlarını yenile
function refreshStockAlerts() {
    loadStockAlerts();
}

// Sipariş oluştur
function createPurchaseOrder(productId, productName, quantity) {
    if (confirm(`${productName} için ${quantity} adet sipariş oluşturmak istediğinizden emin misiniz?`)) {
        // Sipariş oluşturma API'si çağrılacak
        showAlert('Sipariş oluşturma özelliği yakında eklenecek', 'info');
    }
}

// Ürün detaylarını görüntüle
function viewProductDetails(productId) {
    // Ürün detayları sayfasına yönlendir
    window.open(`/product-details.html?id=${productId}`, '_blank');
}

// Alarmı kapat
async function dismissAlert(alertId) {
    try {
        const response = await fetch(`/api/dashboard/stock-alerts/${alertId}/dismiss`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Alarm kapatılamadı');
        }
        
        showAlert('Alarm kapatıldı', 'success');
        loadStockAlerts();
    } catch (error) {
        console.error('Alarm kapatma hatası:', error);
        showAlert('Alarm kapatılamadı: ' + error.message, 'error');
    }
}

// Real-time güncellemeleri başlat
function startRealTimeUpdates() {
    // Her 30 saniyede bir real-time verileri güncelle
    realtimeInterval = setInterval(() => {
        loadRealtimeData();
    }, 30000);
}

// Tüm verileri yenile
async function refreshAllData() {
    try {
        showAlert('Veriler yenileniyor...', 'info');
        await loadAllData();
        showAlert('Veriler başarıyla yenilendi', 'success');
    } catch (error) {
        console.error('Veri yenileme hatası:', error);
        showAlert('Veriler yenilenirken hata oluştu', 'error');
    }
}

// Dashboard'u dışa aktar
function exportDashboard() {
    showAlert('Dashboard dışa aktarma özelliği yakında eklenecek', 'info');
}




// Grafik yenileme fonksiyonları
function refreshProductionChart() {
    loadAdvancedStats().then(() => {
        createProductionTrendChart();
        showAlert('Üretim grafiği yenilendi', 'success');
    });
}

function refreshCustomerChart() {
    loadAdvancedStats().then(() => {
        createCustomerProductionChart();
        showAlert('Müşteri grafiği yenilendi', 'success');
    });
}

function refreshOperatorPerformance() {
    loadOperatorPerformance().then(() => {
        showAlert('Operatör performansı yenilendi', 'success');
    });
}

// Yardımcı fonksiyonlar
function getNotificationIcon(priority, type) {
    if (type === 'system_error') {
        return 'exclamation-triangle';
    }
    
    const iconMap = {
        'critical': 'exclamation-triangle',
        'high': 'exclamation-circle',
        'medium': 'exclamation-circle',
        'low': 'info-circle',
        'info': 'info-circle',
        'success': 'check-circle'
    };
    return iconMap[priority] || 'bell';
}

function getPriorityColor(priority) {
    const colorMap = {
        'critical': 'danger',
        'high': 'danger',
        'medium': 'warning',
        'low': 'info',
        'info': 'info',
        'success': 'success'
    };
    return colorMap[priority] || 'secondary';
}

function getStatusColor(status) {
    switch (status) {
        case 'completed': return 'success';
        case 'pending': return 'warning';
        case 'generating': return 'info';
        case 'failed': return 'danger';
        case 'normal': return 'success';
        case 'warning': return 'warning';
        case 'critical': return 'danger';
        default: return 'secondary';
    }
}

// Alert göster
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed alert-custom`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        ${message}
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Real-time indicator'ı güncelle
function updateRealTimeIndicator(isActive = true) {
    const indicator = document.querySelector('.real-time-badge');
    if (indicator) {
        if (isActive) {
            indicator.className = 'real-time-badge bg-success';
            indicator.title = 'Gerçek zamanlı veri gösteriliyor.';
        } else {
            indicator.className = 'real-time-badge bg-warning';
            indicator.title = 'Veri yükleniyor...';
        }
    }
}

// Sayfa kapatılırken temizlik
window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
    }
    
    // Chart'ları temizle
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
});
