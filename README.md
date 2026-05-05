# Palet & Separatör Havuz Yönetim Sistemi - Frontend

Modern, TypeScript tabanlı React frontend uygulaması. Palet ve separatör havuz yönetimi için geliştirilmiş profesyonel bir yönetim paneli.

## 🚀 Özellikler

### Kimlik Doğrulama
- JWT token tabanlı güvenli giriş sistemi
- Role-based access control (RBAC)
- Otomatik token yenileme ve oturum yönetimi

### Roller ve Yetkiler
- **ADMIN**: Tam sistem erişimi
- **COMPANY_STAFF**: Havuz operasyonları, rota optimizasyonu, dolumcu yönetimi
- **CUSTOMER**: Kendi stok durumu görüntüleme ve manuel talep oluşturma

### Ana Özellikler
- 🗺️ **Rota Optimizasyonu (CVRP)**: Çoklu araç için optimize edilmiş toplama rotaları
- 📦 **Stok Yönetimi**: Gerçek zamanlı stok takibi ve eşik uyarıları
- 🚚 **Toplama Talepleri**: Otomatik ve manuel talep yönetimi
- 📍 **Harita Entegrasyonu**: Leaflet.js ile interaktif harita görüntüleme
- 📊 **Dashboard**: Role-based özelleştirilmiş kontrol panelleri

## 🛠️ Teknoloji Stack

```
React 19.2.5           - UI Library
TypeScript 4.9.5       - Type Safety
React Router 6.30.3    - Routing
Axios 1.15.0           - HTTP Client
Tailwind CSS 3.4.19    - Styling
Leaflet 1.9.4          - Map Visualization
React Query 5.99.0     - Server State Management
```

## 🚦 Kurulum

### Gereksinimler
- Node.js 16+
- npm veya yarn

### Adımlar

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Environment variables ayarlayın (`.env` dosyası zaten mevcut):
```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_APP_NAME=Pallet Management System
REACT_APP_ENABLE_DEVTOOLS=true
```

3. Development server'ı başlatın:
```bash
npm start
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## 👤 Test Kullanıcıları

```
Admin:
  Username: admin
  Password: admin123

Staff:
  Username: staff
  Password: staff123

Customer:
  Username: customer
  Password: customer123
```

## 🗺️ Sayfa Yapısı

### Public Pages
- `/login` - Giriş sayfası

### Protected Pages (Tüm Roller)
- `/dashboard` - Role-based ana sayfa

### Staff Pages (ADMIN, COMPANY_STAFF)
- `/routes` - Rota optimizasyonu (CVRP)
- `/requests` - Toplama talepleri yönetimi
- `/fillers` - Dolumcu yönetimi
- `/stocks` - Stok yönetimi
- `/plans` - Toplama planları

### Customer Pages (CUSTOMER)
- `/my-requests` - Kendi talepleri görüntüleme ve oluşturma

## 📁 Proje Yapısı

```
src/
├── api/                    # API servis katmanı
│   ├── axiosConfig.ts      # Axios interceptors
│   ├── authApi.ts          # Authentication endpoints
│   ├── routeApi.ts         # Route optimization endpoints
│   ├── collectionApi.ts    # Collection request endpoints
│   ├── stockApi.ts         # Stock management endpoints
│   └── fillerApi.ts        # Filler management endpoints
├── components/
│   ├── auth/               # Login, Protected Route
│   ├── common/             # Navbar, Layout, Card, Badge
│   ├── dashboard/          # Role-based dashboards
│   ├── route/              # Route optimization components
│   ├── request/            # Collection request forms
│   └── map/                # Leaflet map components
├── pages/                  # Page components
├── context/                # Auth Context
├── types/                  # TypeScript type definitions
└── utils/                  # Helper functions, constants
```

## 📡 API Entegrasyonu

Backend API varsayılan olarak `http://localhost:8080` adresinde çalışıyor olmalıdır.

### Ana API Endpoints

#### Authentication
```
POST /api/auth/login
```

#### Route Optimization (CVRP)
```
POST /api/logistics/optimize/multi-vehicle
GET  /api/logistics/collection-plans
```

#### Collection Requests
```
POST /api/logistics/collection-requests/manual
GET  /api/logistics/collection-requests
POST /api/logistics/collection-requests/{id}/approve
```

#### Stock Management
```
GET  /api/inventory/stocks
GET  /api/inventory/stocks/filler/{fillerId}
POST /api/inventory/stocks/record-inflow
```

Detaylı API dokümantasyonu için `FRONTEND_INTEGRATION_GUIDE.md` dosyasına bakın.

## 🔧 Development

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

## 🔐 Güvenlik

- JWT token localStorage'da saklanır
- Token her request'te otomatik olarak header'a eklenir
- 401 yanıtlarında otomatik logout
- Role-based route protection

## 📚 Dokümantasyon

- [Frontend Integration Guide](FRONTEND_INTEGRATION_GUIDE.md)
- [API Documentation](http://localhost:8080/swagger-ui.html)

---

**Not**: Backend API'nin çalışıyor olduğundan emin olun.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
