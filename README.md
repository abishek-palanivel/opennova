# 🏨 OpenNova - Multi-Establishment Booking Platform

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive full-stack web platform for booking and managing multiple types of establishments (Hotels, Hospitals, and Shops) with three dedicated portals: User, Owner, and Admin. Built with modern technologies and best practices for scalability and security.

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

### Frontend
- **Framework**: React 18 with React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Maps**: Google Maps Integration
- **Icons**: Lucide React

### Backend
- **Language**: Java 21
- **Framework**: Spring Boot 3.2
- **Security**: Spring Security with JWT
- **Database**: PostgreSQL 15
- **ORM**: Spring Data JPA
- **Email**: JavaMail API
- **QR Codes**: ZXing Library
- **Build Tool**: Maven

### Infrastructure
- **Version Control**: Git
- **Deployment**: Vercel (Frontend), Fly.io (Backend), Neon.tech (Database)
- **Development**: Hot reload, CORS enabled

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

### User Portal
- Browse and search establishments by type (Hotels, Hospitals, Shops)
- View detailed establishment information with photos and reviews
- Make bookings with real-time availability
- Receive QR code confirmations via email
- Track booking status and history
- Save favorite establishments
- Leave reviews and ratings

### Owner Portal
- Manage establishment profiles and information
- Set weekly operating hours with day-specific controls
- Upload photos and menus
- Approve/reject booking requests in real-time
- View analytics and booking statistics
- Manage collections and payment details
- Respond to customer reviews

### Admin Portal
- Oversee all establishments and users
- Approve/reject establishment registration requests
- Monitor platform activity and analytics
- Manage user accounts and permissions
- Review moderation system
- Export data to Excel
- System-wide configuration

### Technical Features
- **Real-time Updates**: Cross-portal synchronization using WebSocket
- **Secure Authentication**: JWT-based auth with role-based access control (RBAC)
- **Email Notifications**: Automated booking confirmations and status updates
- **QR Code Generation**: Digital booking confirmations with QR codes
- **Payment Integration**: UPI payment support with QR codes
- **File Upload**: Secure image upload for establishments and menus
- **Review System**: Customer feedback with admin approval workflow
- **Account Security**: Login attempt tracking and account lockout protection
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

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

## 📁 Project Structure

```
opennova/
├── backend/                 # Spring Boot backend
│   ├── src/main/java/
│   │   └── com/opennova/
│   │       ├── config/     # Security, CORS, Email configs
│   │       ├── controller/ # REST API endpoints
│   │       ├── dto/        # Data Transfer Objects
│   │       ├── model/      # JPA entities
│   │       ├── repository/ # Database repositories
│   │       ├── security/   # JWT & authentication
│   │       └── service/    # Business logic
│   └── pom.xml
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── App.js
│   └── package.json
├── database/              # SQL migration scripts
└── docs/                  # Documentation files
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Abishek Palanivel**
- GitHub: [@abishek-palanivel](https://github.com/abishek-palanivel)
- Email: abishekopennova@gmail.com

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- React team for the powerful UI library
- All contributors who help improve this project

---

⭐ Star this repository if you find it helpful!