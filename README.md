# OneDesk Management Platform (MVP)

Küçük işletmeler (10-15 çalışan) için üretim kalitesinde MVP:
- Employee Directory
- Customer List
- Company Billing Info
- Digital Business Cards
- Leave Tracking
- JWT + RBAC (`ADMIN`, `EMPLOYEE`)

## Mimari Özet
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Node.js + Express + Mongoose + Zod
- Veritabanı: MongoDB
- Personel modeli: Ayrı `employees` koleksiyonu yoktur; tüm personel ve admin hesapları `users` koleksiyonundadır (`role` ile ayrılır).
- Vercel hedefi: Frontend `frontend/dist` olarak statik yayınlanır; backend Express app `/api/*` altında serverless function olarak çalışır.

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

### Mobil Uygulama (React Native / Expo)
`mobile/` workspace eklendi.

Kurulum:
```bash
npm install
cp mobile/.env.example mobile/.env
```

`mobile/.env` için production API:
```env
EXPO_PUBLIC_API_BASE_URL=https://<vercel-domain>/api
```

Çalıştırma:
```bash
npm run dev:mobile
```

Mobil uygulama akışı:
- Employee signin
- Ana ekranda `Dijital Kartviziti Aç` butonu
- Butona basınca vCard verisinden QR kod gösterimi

### Seed
```bash
npm run seed
```

## Production / Vercel
Bu kurulumda Vercel frontend'i statik çıktıdan, backend'i `/api` serverless function üzerinden yayınlar.

### 1) Vercel CLI
Vercel CLI root dev dependency olarak kuruludur.

```bash
npm run vercel:dev
```

Production deploy:

```bash
npm run deploy
```

### 2) Environment Variables
Aşağıdaki environment variable'ları Vercel projesine ekleyin:
- `NODE_ENV=production`
- `MONGODB_URI=mongodb+srv://onedesk_db_user:<db_password>@onedeskbiz.9pfzodi.mongodb.net/?appName=onedeskbiz`
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `BCRYPT_SALT_ROUNDS=10`
- `UPLOAD_DIR=uploads`
- `MAX_FILE_SIZE_MB=2`
- `ONESIGNAL_APP_ID=...`
- `ONESIGNAL_REST_API_KEY=...`
- `PUBLIC_BASE_URL=https://<vercel-domain>`
- `VITE_API_BASE_URL=/api`

`PORT` ve `CORS_ORIGIN` Vercel production ortamında zorunlu değildir.

Mevcut `backend/.env` ve `frontend/.env` değerlerini Vercel'e aktarmak için:

```bash
npm run vercel:env
```

Varsayılan olarak `production`, `preview` ve `development` ortamlarına aktarır. Sadece production için:

```bash
npm run vercel:env -- production
```

## Önemli Endpointler
- API base: `/api`
- Health: `/health`
- Public digital card: `/card/:userId`

## Seed Hesapları
- Admin: `admin@onedesk.local` / `App12345`
- Employee 1: `mert@onedesk.local` / `App12345`
- Employee 2: `selin@onedesk.local` / `App12345`
