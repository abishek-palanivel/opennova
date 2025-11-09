# OpenNova - Multi-Establishment Booking Platform

A modern web platform for booking and managing establishments (Hotels, Hospitals, and Shops) with three dedicated portals: User, Owner, and Admin.

## 🚀 Quick Start

### Start Both Servers
```bash
# Double-click start-clean.bat or run:
start-clean.bat
```

### Start Individually
```bash
# Backend (Port 9000)
cd backend
mvn spring-boot:run

# Frontend (Port 3000)
cd frontend
npm start
```

## 🔑 Login Credentials

| Portal | Email | Password | URL |
|--------|-------|----------|-----|
| **Admin** | abishekopennova@gmail.com | abi@1234 | http://localhost:3000/admin |
| **Hotel Owner** | abishekpalanivel212@gmail.com | abi@1234 | http://localhost:3000/owner |
| **Hospital Owner** | abishekpopennova@gmail.com | abi@1234 | http://localhost:3000/owner |
| **Shop Owner** | mithunpopennova@gmail.com | abi@1234 | http://localhost:3000/owner |

## 💻 Tech Stack

- **Frontend**: React 18, Tailwind CSS, Axios, React Router
- **Backend**: Java 21, Spring Boot 3.2, Spring Security, JWT
- **Database**: PostgreSQL
- **Features**: QR Codes, Email Service, Google Maps, UPI Payment

## 🌐 Live Deployment

Deploy to the internet for FREE using:
- **Frontend**: Vercel (Free tier)
- **Backend**: Fly.io (Free tier) 
- **Database**: Neon.tech (Free tier)

### Quick Deploy
```bash
# Windows
deploy.bat

# Linux/Mac
./deploy-backend.sh
./deploy-frontend.sh
```

📖 **Full deployment guide**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 🌟 Features

- **Multi-Portal System**: Separate interfaces for Users, Owners, and Admins
- **Real-time Booking Management**: Approve/reject bookings with instant updates
- **Cross-Portal Synchronization**: Changes reflect across all portals
- **Secure Authentication**: JWT-based authentication with role-based access
- **Email Notifications**: Automated booking confirmations and updates
- **QR Code Generation**: Digital booking confirmations
- **Review System**: Customer feedback and ratings
- **Payment Integration**: UPI payment support

## 🗄️ Database Setup

```sql
-- Database: opennova
-- Username: postgres  
-- Password: abi@1234
-- Port: 5432
```

Run the database setup:
```bash
cd database
setup.bat
```

## 📚 Recent Updates

- **Operating Hours Enhancement**: Added comprehensive weekly schedule management with per-day status control
- **Review System Fix**: Removed "0 reviews" clutter from establishment cards
- **Weekly Schedule Manager**: Owners can now set different hours and status for each day of the week
- **Enhanced User Experience**: Click-to-expand operating hours with detailed weekly view