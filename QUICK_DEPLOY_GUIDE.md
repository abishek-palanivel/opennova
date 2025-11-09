# 🚀 OpenNova Quick Deployment Guide

## Your Repositories:
- **Frontend**: https://github.com/abishekopennova-prog/opennova-frontend
- **Backend**: https://github.com/abishekopennova-prog/opennova-backend-clean

## 🗄️ Step 1: Create Free Database (Neon.tech)

1. **Go to**: https://neon.tech
2. **Sign up** with GitHub (use same account as your repos)
3. **Create Project**:
   - Project name: `opennova-db`
   - Region: Choose closest to you
   - PostgreSQL version: 15 (default)
4. **Copy Database URL** (looks like):
   ```
   postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require
   ```

## 🖥️ Step 2: Fix Backend Deployment (Render.com)

### A. Go to your Render dashboard where the backend is failing

### B. Set Environment Variables:
Go to Environment tab and add these:

```
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require
DATABASE_HOST=ep-xxx.neon.tech
DATABASE_PORT=5432
DATABASE_NAME=neondb
DATABASE_USERNAME=username
DATABASE_PASSWORD=password
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
FRONTEND_URL=https://opennova-frontend.vercel.app
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### C. Manual Deploy
Click "Manual Deploy" → "Deploy latest commit"

## 🌐 Step 3: Deploy Frontend (Vercel)

1. **Go to**: https://vercel.com
2. **Import Project** → **GitHub** → Select `opennova-frontend`
3. **Configure**:
   - Framework: React
   - Build Command: `npm run build`
   - Output Directory: `build`
4. **Environment Variables**:
   ```
   REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com
   ```
5. **Deploy**

## 🗄️ Step 4: Setup Database Tables

After backend is running, you need to create the database tables:

### Option A: Use pgAdmin or any PostgreSQL client
Connect to your Neon database and run all SQL files from your `database/` folder in order.

### Option B: Use Neon SQL Editor
1. Go to Neon dashboard → SQL Editor
2. Copy and paste contents of each SQL file from `database/` folder
3. Run them in order: 01_schema.sql, then others

## 🎯 Final URLs:
- **Frontend**: https://opennova-frontend.vercel.app
- **Backend**: https://your-backend-name.onrender.com
- **Database**: Your Neon PostgreSQL instance

## 🔧 Troubleshooting:
- If backend still fails: Check environment variables are set correctly
- If frontend can't connect: Update REACT_APP_API_BASE_URL
- If database errors: Ensure all SQL files are executed in order

## 📞 Need Help?
Share any error messages and I'll help you fix them!