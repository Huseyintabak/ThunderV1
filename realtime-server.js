const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

class RealtimeServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map(); // operatorId -> WebSocket
        this.supabase = null;
        
        // Supabase client oluştur
        if (config.SUPABASE_URL !== 'https://your-project.supabase.co' && config.SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here') {
            try {
                this.supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
                console.log('✅ Real-time server: Supabase client created');
            } catch (error) {
                console.log('❌ Real-time server: Supabase client creation failed:', error.message);
            }
        }
        
        this.setupWebSocket();
        this.setupDatabaseListeners();
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New WebSocket connection');
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(ws, message);
                } catch (error) {
                    console.error('❌ WebSocket message error:', error);
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
                }
            });
            
            ws.on('close', () => {
                this.removeClient(ws);
                console.log('🔌 WebSocket connection closed');
            });
            
            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                this.removeClient(ws);
            });
        });
    }
    
    handleMessage(ws, message) {
        switch (message.type) {
            case 'register':
                this.registerClient(ws, message.operatorId, message.operatorName);
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            case 'production_update':
                this.broadcastProductionUpdate(message.data);
                break;
            default:
                console.log('❓ Unknown message type:', message.type);
        }
    }
    
    registerClient(ws, operatorId, operatorName) {
        this.clients.set(operatorId, {
            ws,
            operatorId,
            operatorName,
            connectedAt: new Date()
        });
        
        console.log(`👤 Operator registered: ${operatorName} (${operatorId})`);
        
        // Operatöre hoş geldin mesajı gönder
        ws.send(JSON.stringify({
            type: 'welcome',
            message: `Hoş geldiniz, ${operatorName}!`,
            operatorId,
            timestamp: Date.now()
        }));
        
        // Operatöre mevcut üretim durumlarını gönder
        this.sendCurrentProductions(operatorId);
    }
    
    removeClient(ws) {
        for (const [operatorId, client] of this.clients.entries()) {
            if (client.ws === ws) {
                this.clients.delete(operatorId);
                console.log(`👤 Operator disconnected: ${client.operatorName} (${operatorId})`);
                break;
            }
        }
    }
    
    async sendCurrentProductions(operatorId) {
        if (!this.supabase) return;
        
        try {
            const { data: productions, error } = await this.supabase
                .from('production_states')
                .select('*')
                .eq('operator_id', operatorId)
                .eq('is_active', true);
            
            if (error) throw error;
            
            const client = this.clients.get(operatorId);
            if (client) {
                client.ws.send(JSON.stringify({
                    type: 'current_productions',
                    data: productions,
                    timestamp: Date.now()
                }));
            }
        } catch (error) {
            console.error('❌ Error sending current productions:', error);
        }
    }
    
    broadcastProductionUpdate(productionData) {
        const message = JSON.stringify({
            type: 'production_updated',
            data: productionData,
            timestamp: Date.now()
        });
        
        // Tüm bağlı istemcilere gönder
        this.clients.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(message);
            }
        });
        
        console.log(`📢 Production update broadcasted to ${this.clients.size} clients`);
    }
    
    sendToOperator(operatorId, message) {
        const client = this.clients.get(operatorId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
                ...message,
                timestamp: Date.now()
            }));
            return true;
        }
        return false;
    }
    
    broadcastToDepartment(department, message) {
        let sentCount = 0;
        this.clients.forEach((client) => {
            if (client.operatorName && client.operatorName.includes(department)) {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify({
                        ...message,
                        timestamp: Date.now()
                    }));
                    sentCount++;
                }
            }
        });
        console.log(`📢 Message sent to ${sentCount} operators in ${department}`);
    }
    
    setupDatabaseListeners() {
        if (!this.supabase) return;
        
        // Production states değişikliklerini dinle
        const productionChannel = this.supabase
            .channel('production_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'production_states' },
                (payload) => {
                    console.log('🔄 Production state changed:', payload.eventType);
                    this.handleProductionChange(payload);
                }
            )
            .subscribe();
        
        // Production history değişikliklerini dinle
        const historyChannel = this.supabase
            .channel('production_history_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'production_history' },
                (payload) => {
                    console.log('📝 Production history added:', payload.new);
                    this.handleHistoryChange(payload);
                }
            )
            .subscribe();
        
        // Notifications değişikliklerini dinle
        const notificationChannel = this.supabase
            .channel('notification_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'production_notifications' },
                (payload) => {
                    console.log('🔔 New notification:', payload.new);
                    this.handleNotificationChange(payload);
                }
            )
            .subscribe();
    }
    
    handleProductionChange(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        // Tüm operatörlere üretim durumu güncellemesi gönder
        this.broadcastProductionUpdate({
            eventType,
            production: newRecord || oldRecord,
            operatorId: newRecord?.operator_id || oldRecord?.operator_id
        });
        
        // Eğer operatör değiştiyse, eski operatöre bildirim gönder
        if (eventType === 'UPDATE' && oldRecord?.operator_id !== newRecord?.operator_id) {
            if (oldRecord?.operator_id) {
                this.sendToOperator(oldRecord.operator_id, {
                    type: 'production_transferred',
                    message: `Üretim ${newRecord?.operator_id} operatörüne transfer edildi`,
                    production: newRecord
                });
            }
        }
    }
    
    handleHistoryChange(payload) {
        const { new: historyRecord } = payload;
        
        // İlgili operatöre geçmiş güncellemesi gönder
        if (historyRecord.operator_id) {
            this.sendToOperator(historyRecord.operator_id, {
                type: 'history_updated',
                data: historyRecord
            });
        }
    }
    
    handleNotificationChange(payload) {
        const { new: notification } = payload;
        
        // Belirli operatöre bildirim gönder
        if (notification.operator_id) {
            this.sendToOperator(notification.operator_id, {
                type: 'notification',
                data: notification
            });
        } else {
            // Genel bildirim - tüm operatörlere gönder
            this.broadcastProductionUpdate({
                type: 'general_notification',
                data: notification
            });
        }
    }
    
    getConnectedOperators() {
        return Array.from(this.clients.values()).map(client => ({
            operatorId: client.operatorId,
            operatorName: client.operatorName,
            connectedAt: client.connectedAt
        }));
    }
    
    getStats() {
        return {
            connectedClients: this.clients.size,
            operators: this.getConnectedOperators(),
            uptime: process.uptime()
        };
    }
}

module.exports = RealtimeServer;

