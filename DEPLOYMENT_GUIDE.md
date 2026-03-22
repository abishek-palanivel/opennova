# 🚀 OpenNova Deployment Guide

## Quick Railway Deployment (5 Minutes)

### Step 1: Prepare Code
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy on Railway
1. **Go to [railway.app](https://railway.app)** → Sign up with GitHub
2. **New Project** → "Deploy from GitHub repo" → Select OpenNova
3. **Add Database** → Click "New" → "Database" → "PostgreSQL"
4. **Set Environment Variables** in backend service:
   ```
   JWT_SECRET=OpenNova2024SecretKey123456789
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   ```
5. **Deploy** → Railway automatically builds using `railway.json`!

### Step 3: Update Frontend URL
1. Copy your Railway backend URL (e.g., `https://your-app.railway.app`)
2. Update `frontend/.env.production`:
   ```
   REACT_APP_API_URL=https://your-app.railway.app
   ```
3. Commit and push changes

## 📧 Gmail Setup (Required)
1. **Enable 2FA** → Google Account → Security → 2-Step Verification
2. **App Password** → Security → App passwords → Mail → Generate
3. **Use 16-character password** (not your regular Gmail password)

## 🎉 Success!
Your OpenNova platform is now live at:
- **Backend**: `https://your-app.railway.app`
- **Admin Portal**: `https://your-app.railway.app/admin`
- **Login**: abishekopennova@gmail.com / abi@1234

## 💰 Cost: FREE
- Railway: $5 credit/month (≈500 hours)
- PostgreSQL: 1GB included
- 24/7 uptime for small apps

---
**Total deployment time: ~5 minutes** ⚡