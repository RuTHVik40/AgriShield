# 🌿 AgriShield — Precision Agriculture PWA

A high-end Progressive Web App for pest detection, geospatial proximity alerts, and community intelligence for farmers.

---

## 📁 Project Structure

```
agrishield/
├── frontend/              # Next.js 15 PWA
│   ├── app/               # App Router pages
│   │   ├── dashboard/     # Main farmer dashboard
│   │   ├── scanner/       # AI pest scanner
│   │   └── community/     # Community feed & heatmap
│   ├── components/        # Reusable React components
│   │   ├── scanner/       # Webcam + TF.js scanner
│   │   ├── map/           # Heatmap + proximity map
│   │   └── community/     # Feed, posts, alerts
│   ├── lib/               # Utilities, API clients
│   └── public/            # Static assets + PWA icons
│
├── backend/               # FastAPI + PostGIS
│   ├── routers/           # API route handlers
│   ├── models/            # SQLAlchemy models
│   ├── services/          # Business logic
│   └── migrations/        # Alembic DB migrations
│
└── ml-models/             # TF.js model files
    ├── model/             # model.json + weight shards
    └── scripts/           # Model conversion scripts
```

---

## 🔑 API Keys & Secrets You Must Add

Create the following `.env` files:

### `frontend/.env.local`
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-32-char-secret-here          # ← GENERATE: openssl rand -base64 32

# Google OAuth (for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id             # ← https://console.cloud.google.com
GOOGLE_CLIENT_SECRET=your-google-client-secret     # ← https://console.cloud.google.com

# Twilio (for Phone/OTP login)
TWILIO_ACCOUNT_SID=your-twilio-sid                 # ← https://twilio.com
TWILIO_AUTH_TOKEN=your-twilio-auth-token           # ← https://twilio.com
TWILIO_PHONE_NUMBER=+1234567890                    # ← Your Twilio number

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Web Push (VAPID Keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key # ← Generate below
VAPID_PRIVATE_KEY=your-vapid-private-key           # ← Generate below
```

### `backend/.env`
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/agrishield  # ← Your PostgreSQL

# JWT
SECRET_KEY=your-jwt-secret-here                    # ← openssl rand -hex 32

# Web Push VAPID
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=admin@yourdomain.com                   # ← Your email

# Twilio (for sending OTP from backend)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (optional - for push notifications alternative)
# FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

---

## 🔧 Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```
Copy the output into both `.env.local` and `backend/.env`.

---

## 🚀 Running the Project

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+ with PostGIS extension
- (Optional) Docker for PostgreSQL

### 1. Start PostgreSQL with PostGIS
```bash
# Using Docker (easiest):
docker run -d \
  --name agrishield-db \
  -e POSTGRES_USER=agrishield \
  -e POSTGRES_PASSWORD=agrishield \
  -e POSTGRES_DB=agrishield \
  -p 5432:5432 \
  postgis/postgis:15-3.3

# Enable PostGIS:
docker exec -it agrishield-db psql -U agrishield -d agrishield -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 2. Start the FastAPI Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Fill in your secrets
alembic upgrade head       # Run migrations
uvicorn main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### 3. Add the TF.js Model
```bash
# Option A: Use the dummy model for testing (included)
# The app will work but show random predictions.

# Option B: Convert your trained Keras model:
cd ml-models/scripts
pip install tensorflowjs
tensorflowjs_converter \
  --input_format=keras \
  your_model.h5 \
  ../model/

# Then copy model/ → frontend/public/model/
cp -r ../model/ ../../frontend/public/model/
```

### 4. Start the Next.js Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # Fill in your secrets
npm run dev
```
App will be live at `http://localhost:3000`

### 5. Build for Production
```bash
cd frontend
npm run build
npm start
```

---

## 📱 PWA Installation
Open `http://localhost:3000` in Chrome/Edge → Click "Install" in address bar.

---

## 🐛 Testing the Scanner
1. Go to `/scanner`
2. Allow camera access
3. Point at a plant leaf (or upload an image)
4. The AI will detect pests and show recommendations

---

## 🗺️ Testing Proximity Alerts
Use the API directly:
```bash
curl -X POST http://localhost:8000/api/alerts/pest-detected \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pest_name": "Aphids",
    "confidence": 0.94,
    "latitude": 17.3850,
    "longitude": 78.4867,
    "severity": "high"
  }'
```
All farmers within 5km will receive a push notification.
