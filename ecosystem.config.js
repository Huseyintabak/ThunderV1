module.exports = {
  apps: [{
    name: 'thunder-production',
    script: 'server.js',
    instances: 2, // CPU core sayısına göre ayarlayın
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    // Log ayarları
    log_file: '/var/log/thunder-production/combined.log',
    out_file: '/var/log/thunder-production/out.log',
    error_file: '/var/log/thunder-production/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Restart ayarları
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    
    // Monitoring
    monitoring: true,
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Auto restart
    autorestart: true,
    watch: false, // Production'da false olmalı
    
    // Environment variables
    env_file: '.env',
    
    // Advanced settings
    node_args: '--max-old-space-size=1024',
    
    // Health check
    health_check_grace_period: 3000,
    
    // Cluster settings
    increment_var: 'PORT',
    
    // Process management
    merge_logs: true,
    time: true,
    
    // Error handling
    ignore_watch: ['node_modules', 'logs', '*.log'],
    
    // Performance
    max_memory_restart: '512M',
    
    // Security
    uid: 'www-data',
    gid: 'www-data'
  }],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/Huseyintabak/ThunderV1.git',
      path: '/opt/thunder-production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};