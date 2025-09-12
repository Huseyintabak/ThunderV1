// Faz 0: Workflow Engine
// İş süreçlerini yöneten ve otomatik geçişleri sağlayan sistem

class WorkflowEngine {
    constructor() {
        this.workflows = new Map();
        this.currentWorkflow = null;
        this.workflowHistory = [];
        this.isProcessing = false;
        
        // Varsayılan iş süreçlerini tanımla
        this.initializeDefaultWorkflows();
    }

    // Varsayılan iş süreçlerini tanımla
    initializeDefaultWorkflows() {
        // Üretim Başlatma Workflow'u
        this.addWorkflow('production-start', {
            name: 'Üretim Başlatma',
            steps: [
                { id: 'product-selection', name: 'Ürün Seçimi', required: true, next: 'quantity-input' },
                { id: 'quantity-input', name: 'Miktar Girişi', required: true, next: 'material-check' },
                { id: 'material-check', name: 'Malzeme Kontrolü', required: true, next: 'production-start' },
                { id: 'production-start', name: 'Üretim Başlatma', required: true, next: 'production-stages' }
            ],
            startStep: 'product-selection',
            endStep: 'production-start'
        });

        // Üretim Aşamaları Workflow'u
        this.addWorkflow('production-stages', {
            name: 'Üretim Aşamaları',
            steps: [
                { id: 'stage-selection', name: 'Aşama Seçimi', required: true, next: 'stage-execution' },
                { id: 'stage-execution', name: 'Aşama Uygulama', required: true, next: 'quality-check' },
                { id: 'quality-check', name: 'Kalite Kontrolü', required: true, next: 'stage-completion' },
                { id: 'stage-completion', name: 'Aşama Tamamlama', required: true, next: 'next-stage' }
            ],
            startStep: 'stage-selection',
            endStep: 'stage-completion'
        });

        // Kalite Kontrol Workflow'u
        this.addWorkflow('quality-control', {
            name: 'Kalite Kontrol',
            steps: [
                { id: 'checkpoint-selection', name: 'Kontrol Noktası Seçimi', required: true, next: 'quality-test' },
                { id: 'quality-test', name: 'Kalite Testi', required: true, next: 'result-evaluation' },
                { id: 'result-evaluation', name: 'Sonuç Değerlendirme', required: true, next: 'quality-report' },
                { id: 'quality-report', name: 'Kalite Raporu', required: true, next: 'approval' }
            ],
            startStep: 'checkpoint-selection',
            endStep: 'approval'
        });
    }

    // Workflow ekle
    addWorkflow(id, workflow) {
        this.workflows.set(id, {
            ...workflow,
            currentStep: workflow.startStep,
            completedSteps: [],
            status: 'idle' // 'idle', 'running', 'paused', 'completed', 'error'
        });
    }

    // Workflow başlat
    startWorkflow(workflowId, initialData = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' bulunamadı`);
        }

        if (this.isProcessing) {
            throw new Error('Başka bir workflow işleniyor');
        }

        this.currentWorkflow = workflowId;
        workflow.status = 'running';
        workflow.currentStep = workflow.startStep;
        workflow.completedSteps = [];
        workflow.data = initialData;

        this.workflowHistory.push({
            workflowId,
            action: 'started',
            timestamp: new Date(),
            data: initialData
        });

        console.log(`Workflow '${workflowId}' başlatıldı`);
        this.emitWorkflowEvent('workflow-started', { workflowId, workflow });
        
        return this.getCurrentStep();
    }

    // Sonraki adıma geç
    nextStep(stepData = {}) {
        if (!this.currentWorkflow) {
            throw new Error('Aktif workflow yok');
        }

        const workflow = this.workflows.get(this.currentWorkflow);
        const currentStep = this.getCurrentStep();
        
        if (!currentStep) {
            throw new Error('Mevcut adım bulunamadı');
        }

        // Mevcut adımı tamamlandı olarak işaretle
        workflow.completedSteps.push({
            stepId: currentStep.id,
            completedAt: new Date(),
            data: stepData
        });

        // Sonraki adımı belirle
        const nextStepId = currentStep.next;
        if (!nextStepId) {
            // Workflow tamamlandı
            this.completeWorkflow();
            return null;
        }

        // Sonraki adıma geç
        workflow.currentStep = nextStepId;
        
        this.workflowHistory.push({
            workflowId: this.currentWorkflow,
            action: 'step-completed',
            stepId: currentStep.id,
            nextStepId: nextStepId,
            timestamp: new Date(),
            data: stepData
        });

        console.log(`Workflow '${this.currentWorkflow}' adımı tamamlandı: ${currentStep.id} -> ${nextStepId}`);
        this.emitWorkflowEvent('step-completed', { 
            workflowId: this.currentWorkflow, 
            completedStep: currentStep,
            nextStep: this.getCurrentStep()
        });

        return this.getCurrentStep();
    }

    // Workflow'u tamamla
    completeWorkflow() {
        if (!this.currentWorkflow) {
            return;
        }

        const workflow = this.workflows.get(this.currentWorkflow);
        workflow.status = 'completed';
        
        this.workflowHistory.push({
            workflowId: this.currentWorkflow,
            action: 'completed',
            timestamp: new Date()
        });

        console.log(`Workflow '${this.currentWorkflow}' tamamlandı`);
        this.emitWorkflowEvent('workflow-completed', { 
            workflowId: this.currentWorkflow, 
            workflow 
        });

        this.currentWorkflow = null;
        this.isProcessing = false;
    }

    // Workflow'u duraklat
    pauseWorkflow() {
        if (!this.currentWorkflow) {
            return;
        }

        const workflow = this.workflows.get(this.currentWorkflow);
        workflow.status = 'paused';
        
        this.workflowHistory.push({
            workflowId: this.currentWorkflow,
            action: 'paused',
            timestamp: new Date()
        });

        console.log(`Workflow '${this.currentWorkflow}' duraklatıldı`);
        this.emitWorkflowEvent('workflow-paused', { 
            workflowId: this.currentWorkflow, 
            workflow 
        });
    }

    // Workflow'u devam ettir
    resumeWorkflow() {
        if (!this.currentWorkflow) {
            return;
        }

        const workflow = this.workflows.get(this.currentWorkflow);
        workflow.status = 'running';
        
        this.workflowHistory.push({
            workflowId: this.currentWorkflow,
            action: 'resumed',
            timestamp: new Date()
        });

        console.log(`Workflow '${this.currentWorkflow}' devam ettirildi`);
        this.emitWorkflowEvent('workflow-resumed', { 
            workflowId: this.currentWorkflow, 
            workflow 
        });
    }

    // Mevcut adımı al
    getCurrentStep() {
        if (!this.currentWorkflow) {
            return null;
        }

        const workflow = this.workflows.get(this.currentWorkflow);
        return workflow.steps.find(step => step.id === workflow.currentStep);
    }

    // Workflow durumunu al
    getWorkflowStatus(workflowId) {
        const workflow = this.workflows.get(workflowId);
        return workflow ? {
            id: workflowId,
            name: workflow.name,
            status: workflow.status,
            currentStep: workflow.currentStep,
            completedSteps: workflow.completedSteps,
            progress: this.calculateProgress(workflow)
        } : null;
    }

    // İlerleme yüzdesini hesapla
    calculateProgress(workflow) {
        const totalSteps = workflow.steps.length;
        const completedSteps = workflow.completedSteps.length;
        return Math.round((completedSteps / totalSteps) * 100);
    }

    // Workflow event'ini emit et
    emitWorkflowEvent(eventType, data) {
        if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(eventType, data);
        }
    }

    // Workflow geçmişini al
    getWorkflowHistory() {
        return this.workflowHistory;
    }

    // Tüm workflow'ları listele
    getAllWorkflows() {
        return Array.from(this.workflows.entries()).map(([id, workflow]) => ({
            id,
            name: workflow.name,
            status: workflow.status,
            currentStep: workflow.currentStep,
            progress: this.calculateProgress(workflow)
        }));
    }
}

// Global Workflow Engine instance'ı oluştur
const workflowEngine = new WorkflowEngine();

// Window objesine ekle
if (typeof window !== 'undefined') {
    window.workflowEngine = workflowEngine;
}

console.log('Workflow Engine initialized');
