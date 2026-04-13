# SmallBiz Management Platform (MVP)

Küçük işletmeler (10-15 çalışan) için üretim kalitesinde MVP:
- Employee Directory
- Customer List
- Company Billing Info
- Digital Business Cards
- Attendance & Leave Tracking
- JWT + RBAC (`ADMIN`, `EMPLOYEE`)

## Mimari Özet
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Node.js + Express + Mongoose + Zod
- Veritabanı: MongoDB
- Tek Azure App Service hedefi: Production'da backend, `frontend/dist` statik çıktısını servis eder.

## Monorepo ve Tek Komut Çalışma
Root seviyesinde workspace scriptleri var.

### Lokalde tek komut
Önce backend env oluşturun ve MongoDB URI'yi aşağıdaki formatta girin:

```env
MONGODB_URI=mongodb+srv://onedesk_db_user:<db_password>@onedeskbiz.9pfzodi.mongodb.net/?appName=onedeskbiz
```

Ardından:
```bash
npm install
npm run dev
```
Bu komut aynı anda:
- backend: `http://localhost:4000`
- frontend: `http://localhost:5173`
çalıştırır.

### Seed
```bash
npm run seed
```

## Production / Azure App Service (Tek Servis)
Bu kurulumda tek App Service hem API hem frontend sunar.

### 1) Azure App Settings
Aşağıdaki environment variable'ları App Service'e ekleyin:
- `NODE_ENV=production`
- `PORT=8080` (veya App Service'in verdiği port)
- `MONGODB_URI=mongodb+srv://onedesk_db_user:<db_password>@onedeskbiz.9pfzodi.mongodb.net/?appName=onedeskbiz`
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `BCRYPT_SALT_ROUNDS=10`
- `UPLOAD_DIR=uploads`
- `MAX_FILE_SIZE_MB=2`

`CORS_ORIGIN` production'da aynı origin servis nedeniyle zorunlu değil.

### 2) Startup Command
Azure App Service startup command olarak:
```bash
npm run start:azure
```
kullanın.

Bu komut:
1. frontend'i build eder (`frontend/dist`)
2. backend'i başlatır
3. backend `/api` endpointlerini ve frontend SPA'yı aynı origin altında servis eder.

## Önemli Endpointler
- API base: `/api`
- Health: `/health`
- Public digital card: `/card/:slug`

## Seed Hesapları
- Admin: `admin@smallbiz.local` / `Admin1234!`
- Employee: `employee@smallbiz.local` / `Employee1234!`
