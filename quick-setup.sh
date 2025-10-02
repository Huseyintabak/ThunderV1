#!/bin/bash
# ThunderV1 Hızlı Kurulum Scripti

echo "🚀 ThunderV1 Kurulum Başlatılıyor..."
echo "=================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Hata kontrolü fonksiyonu
check_error() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Hata: $1${NC}"
        exit 1
    fi
}

# Başarı mesajı fonksiyonu
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Uyarı mesajı fonksiyonu
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Bilgi mesajı fonksiyonu
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Proje dizinine git
info "Proje dizinine geçiliyor..."
cd ~/Desktop/ThunderV1
check_error "Proje dizini bulunamadı. Lütfen projeyi ~/Desktop/ThunderV1 dizinine klonlayın."

# Node.js versiyonunu kontrol et
info "Node.js versiyonu kontrol ediliyor..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js bulunamadı. Lütfen Node.js v18+ kurun.${NC}"
    echo "macOS: brew install node"
    echo "Windows: https://nodejs.org"
    echo "Linux: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    warning "Node.js versiyonu $NODE_VERSION. v18+ önerilir."
fi

success "Node.js $(node --version) bulundu"

# NPM versiyonunu kontrol et
info "NPM versiyonu kontrol ediliyor..."
success "NPM $(npm --version) bulundu"

# Bağımlılıkları kur
info "Bağımlılıklar kuruluyor..."
npm install
check_error "NPM install başarısız"

success "Bağımlılıklar başarıyla kuruldu"

# .env dosyası oluştur
info "Environment dosyası oluşturuluyor..."

# Güçlü şifreler oluştur
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your_super_secure_jwt_secret_key_here_$(date +%s)")
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your_super_secure_session_secret_key_here_$(date +%s)")

cat > .env << EOF
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=3000
NODE_ENV=development
HOST=0.0.0.0

# ===========================================
# SUPABASE CONFIGURATION (Gerçek Değerler)
# ===========================================
SUPABASE_URL=https://beynxlogttkrrkejvftz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleW54bG9ndHRrcnJrZWp2ZnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODk5MDcsImV4cCI6MjA3MzA2NTkwN30.04vv-EjQd92MtrprRAtpeEtEYQRjizMmC8I9e885miE

# Supabase Service Role Key (Supabase Dashboard'dan alın)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# ===========================================
# DATABASE CONFIGURATION (Opsiyonel)
# ===========================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thunder_production
DB_USER=thunder_user
DB_PASSWORD=your_secure_db_password

# ===========================================
# FEATURE FLAGS
# ===========================================
ENABLE_REAL_TIME=true
ENABLE_NOTIFICATIONS=true
ENABLE_AUDIT_LOG=true
DEBUG=false
EOF

success ".env dosyası oluşturuldu"

# Port kontrolü
info "Port 3000 kontrol ediliyor..."
if lsof -i :3000 &> /dev/null; then
    warning "Port 3000 kullanımda. Mevcut process:"
    lsof -i :3000
    echo ""
    read -p "Port 3000'deki process'i sonlandırmak istiyor musunuz? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti :3000 | xargs kill -9
        success "Port 3000 temizlendi"
    else
        warning "Port 3000 kullanımda. Uygulama başlatılamayabilir."
    fi
else
    success "Port 3000 kullanılabilir"
fi

# Kurulum tamamlandı
echo ""
echo "=================================="
success "🎉 Kurulum başarıyla tamamlandı!"
echo "=================================="
echo ""
info "📋 Yapmanız gerekenler:"
echo "1. Supabase Dashboard'dan SERVICE_ROLE_KEY alın"
echo "2. .env dosyasında SUPABASE_SERVICE_ROLE_KEY değerini güncelleyin"
echo "3. 'npm start' komutu ile uygulamayı başlatın"
echo "4. http://localhost:3000 adresinde uygulamayı açın"
echo ""
info "🚀 Uygulamayı başlatmak için:"
echo "   npm start"
echo ""
info "🔧 Development modunda başlatmak için:"
echo "   npm run dev"
echo ""
info "📖 Detaylı kurulum rehberi: KURULUM_REHBERI.md"
echo ""

