// Raporlama ve Analitik JavaScript
// ThunderV1 V1.6.0

let dashboardStats = {};
let dashboardWidgets = [];
let kpiDefinitions = [];
let kpiValues = [];
let reportTemplates = [];
let reportHistory = [];

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Raporlama sayfası yüklendi');
    
    // Sıralı yükleme
    loadDashboardStats().then(() => {
        console.log('Dashboard istatistikleri yüklendi');
    });
    
    loadDashboardWidgets().then(() => {
        console.log('Dashboard widget\'ları yüklendi');
    });
    
    loadKPIDefinitions().then(() => {
        console.log('KPI tanımları yüklendi');
    });
    
    loadKPIValues().then(() => {
        console.log('KPI değerleri yüklendi');
    });
    
    loadReportTemplates().then(() => {
        console.log('Rapor şablonları yüklendi');
    });
    
    loadReportHistory().then(() => {
        console.log('Rapor geçmişi yüklendi');
    });
    
    // Otomatik yenileme (5 dakikada bir)
    setInterval(() => {
        loadDashboardStats();
        loadKPIValues();
    }, 300000);
});

// Dashboard istatistiklerini yükle
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/statistics');
        const data = await response.json();
        dashboardStats = data;
        displayDashboardStats(data);
        return data;
    } catch (error) {
        console.error('Dashboard istatistikleri yüklenemedi:', error);
        showAlert('Dashboard istatistikleri yüklenemedi', 'error');
        throw error;
    }
}

// Dashboard istatistiklerini göster
function displayDashboardStats(stats) {
    const container = document.getElementById('dashboardStats');
    container.innerHTML = `
        <div class="col-md-3">
            <div class="metric-card">
                <h5><i class="fas fa-industry me-2"></i>Üretim</h5>
                <h3>${stats.productions.total}</h3>
                <p>Toplam: ${stats.productions.total} | Bugün: ${stats.productions.today} | Aktif: ${stats.productions.active}</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <h5><i class="fas fa-check-circle me-2"></i>Kalite</h5>
                <h3>${stats.quality.pass_rate}%</h3>
                <p>Başarı Oranı: ${stats.quality.pass_rate}% | Kontroller: ${stats.quality.total_checks}</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <h5><i class="fas fa-bell me-2"></i>Bildirimler</h5>
                <h3>${stats.notifications.total}</h3>
                <p>Toplam: ${stats.notifications.total} | Okunmamış: ${stats.notifications.unread} | Kritik: ${stats.notifications.critical}</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="metric-card">
                <h5><i class="fas fa-cogs me-2"></i>Kaynaklar</h5>
                <h3>${stats.resources.active}</h3>
                <p>Aktif: ${stats.resources.active} | Makineler: ${stats.resources.machines} | Operatörler: ${stats.resources.operators}</p>
            </div>
        </div>
    `;
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

// Chart render
function renderChart(canvasId, type) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.log('Canvas bulunamadı:', canvasId);
        return;
    }
    
    // Chart.js yüklü mü kontrol et
    if (typeof Chart === 'undefined') {
        console.log('Chart.js yüklenmedi, fallback gösteriliyor');
        // Canvas'ı gizle, fallback'i göster
        ctx.style.display = 'none';
        const fallback = ctx.parentElement.querySelector('.fallback-chart');
        if (fallback) {
            fallback.style.display = 'block';
        }
        return;
    }
    
    const data = generateChartData(type);
    
    try {
        new Chart(ctx, {
            type: type === 'chart' ? 'line' : 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Chart oluşturma hatası:', error);
        // Canvas'ı gizle, fallback'i göster
        ctx.style.display = 'none';
        const fallback = ctx.parentElement.querySelector('.fallback-chart');
        if (fallback) {
            fallback.style.display = 'block';
        }
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
                                <button class="btn btn-sm btn-outline-primary" onclick="downloadReport(${report.id})">
                                    <i class="fas fa-download"></i>
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

// Rapor indir
function downloadReport(reportId) {
    showAlert('Rapor indirme özelliği yakında eklenecek', 'info');
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

// Alert göster
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}
