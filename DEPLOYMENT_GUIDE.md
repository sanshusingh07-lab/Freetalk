# FreeTalk Deployment & Google Authentication Setup Guide
# (डिप्लॉयमेंट और गूगल ऑथेंटिकेशन सेटअप गाइड)

इस गाइड में FreeTalk वेबसाइट को लाइव डिप्लॉय करने और Google Authentication को सेटअप करने के पूरे स्टेप्स दिए गए हैं।

---

## 🌟 1. Google OAuth 2.0 Credentials कैसे प्राप्त करें

अगर आप लाइव Google Sign-In चालू करना चाहते हैं:

1. **Google Cloud Console** खोलें:
   👉 [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. नया प्रोजेक्ट बनाएं (उदा. `FreeTalk-App`) या मौजूदा प्रोजेक्ट चुनें।
3. **OAuth consent screen** (सहमति स्क्रीन) पर जाएं:
   - User Type: **External** चुनें और **Create** पर क्लिक करें।
   - App Name: `FreeTalk`
   - User support email और Developer contact email दर्ज करें।
   - Scopes में `.../auth/userinfo.email` और `.../auth/userinfo.profile` शामिल करें।
4. **Credentials** टैब में जाएं:
   - **+ CREATE CREDENTIALS** -> **OAuth client ID** पर क्लिक करें।
   - Application type: **Web application** चुनें।
   - Name: `FreeTalk Web Client`
   - **Authorized JavaScript origins** में जोड़ें:
     - `http://localhost:5173` (Local Dev Frontend)
     - `http://localhost:5000` (Local Dev Backend / Docker)
     - `https://your-production-app.onrender.com` (आपकी लाइव डिप्लॉयड वेबसाइट का URL)
   - **Create** पर क्लिक करें।
5. आपको आपका **Client ID** (उदा. `123456789-xxxxxx.apps.googleusercontent.com`) मिल जाएगा।
6. इसे अपने प्रोजेक्ट में सेट करें:
   - **Frontend**: `frontend/.env` में:
     ```env
     VITE_GOOGLE_CLIENT_ID="123456789-xxxxxx.apps.googleusercontent.com"
     ```
   - **Backend**: `backend/.env` में:
     ```env
     GOOGLE_CLIENT_ID="123456789-xxxxxx.apps.googleusercontent.com"
     ```

> 💡 **Instant Test / Demo Mode**:
> यदि आपने अभी तक Google Cloud Console में Client ID नहीं बनाया है, तब भी आप लॉगिन पेज पर "Sign in with Google" बटन पर क्लिक करके **Instant Test Sign-In** का इस्तेमाल कर सकते हैं!

---

## 🚀 2. FreeTalk को Render.com पर डिप्लॉय करना (सबसे आसान और मुफ़्त तरीका)

Render.com पर Node.js वेब सर्विस और PostgreSQL डेटाबेस दोनों मुफ़्त (Free Tier) में मिलते हैं।

### Method A: 1-Click Blueprint Deploy (`render.yaml`)
1. अपने कोड को GitHub पर पुश करें:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/freetalk.git
   git branch -M main
   git push -u origin main
   ```
2. [Render.com](https://render.com) पर लॉगिन करें।
3. **New +** बटन पर क्लिक करें और **Blueprint** चुनें।
4. अपना GitHub रिपॉजिटरी कनेक्ट करें।
5. Render स्वतः `render.yaml` फाइल पहचान लेगा और:
   - एक मुफ़्त **PostgreSQL Database** (`freetalk-db`) बनाएगा।
   - एक मुफ़्त **Node.js Web Service** (`freetalk`) बनाएगा।
6. Environment Variables में `GOOGLE_CLIENT_ID` पेस्ट करें और **Apply** दबाएं!
7. कुछ ही मिनटों में आपकी पूरी वेबसाइट लाइव हो जाएगी! 🎉

### Method B: Manual Web Service Setup on Render
1. **PostgreSQL Database बनाएं**:
   - Render Dashboard -> **New +** -> **PostgreSQL**.
   - Name: `freetalk-db`.
   - Free plan चुनें और **Create Database** दबाएं।
   - बनने के बाद **Internal Database URL** कॉपी करें।
2. **Web Service बनाएं**:
   - Dashboard -> **New +** -> **Web Service** -> GitHub Repo चुनें।
   - Runtime: `Node`
   - Build Command:
     ```bash
     npm run build && cd backend && npx prisma db push && npm run db:seed
     ```
   - Start Command:
     ```bash
     npm start
     ```
   - Environment Variables जोड़ें:
     - `NODE_ENV` = `production`
     - `DATABASE_URL` = (जो डेटाबेस URL कॉपी किया था)
     - `JWT_SECRET` = `freetalk_super_secret_jwt_key_2026_render_prod`
     - `COOKIE_SECRET` = `freetalk_cookie_secret_key_prod_89237`
     - `GOOGLE_CLIENT_ID` = (आपका Google Client ID)
     - `UPLOAD_DIR` = `./uploads`
3. **Deploy Web Service** पर क्लिक करें।

---

## 🐳 3. Docker / Docker Compose के साथ डिप्लॉय करना

अगर आपके पास कोई VPS (उदा. AWS EC2, DigitalOcean, Hostinger VPS) है या आप Docker के ज़रिए चलाना चाहते हैं:

1. `docker-compose.yml` और `Dockerfile` पहले से तैयार हैं।
2. केवल एक कमांड चलाएं:
   ```bash
   docker compose up -d --build
   ```
3. आपकी वेबसाइट `http://localhost:5000` (या आपके सर्वर के IP:5000) पर लाइव चालू हो जाएगी!

---

## ⚡ 4. Vercel (Frontend) + Render (Backend) Two-Tier Deployment

यदि आप Frontend को **Vercel** पर और Backend को **Render** पर अलग-अलग रखना चाहते हैं:

1. **Backend**:
   - Render पर केवल `backend` डायरेक्टरी को Web Service के रूप में डिप्लॉय करें।
   - Root directory को `backend` सेट करें।
   - Build Command: `npm install && npx prisma generate && npx prisma db push`
   - Start Command: `npm start`
   - Render Backend का URL मिलेगा (उदा. `https://freetalk-backend.onrender.com`).
2. **Frontend on Vercel**:
   - [Vercel.com](https://vercel.com) पर जाएं और अपना GitHub Repo इम्पोर्ट करें।
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Environment Variables:
     - `VITE_API_URL` = `https://freetalk-backend.onrender.com/api`
     - `VITE_GOOGLE_CLIENT_ID` = `(आपका Google Client ID)`
   - **Deploy** दबाएं!
   - `frontend/vercel.json` पहले से SPA रूटिंग के लिए कंफिगर किया गया है।

---

## ✅ Deployment Checklist

- [x] Backend endpoint `POST /api/auth/send-otp` एवं `POST /api/auth/verify-otp` निर्मित और टेस्टेड
- [x] Frontend 2-Step Login एवं 4-Step Registration Email OTP Verification UI तैयार
- [x] Express Server `backend/src/server.js` में Production Frontend Serving और SPA Routing सक्रिय
- [x] Root `package.json` में यूनिफाइड `build` और `start` स्क्रिप्ट्स मौजूद
- [x] `render.yaml` 1-क्लिक ऑटोमेशन फाइल तैयार
- [x] `Dockerfile` और `docker-compose.yml` तैयार
- [x] `frontend/vercel.json` कंफिगर
- [x] Git Repository इनिशियलाइज़्ड और क्लीन कमिटेड
