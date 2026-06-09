# 🚀 Ramiscope Project Management System

> Enterprise-grade project management system with complete authentication, built with Angular 21 and Node.js/Express

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-21-red.svg)](https://angular.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Ramiscope PMS is a modern, full-stack project management system designed for enterprise use. Currently featuring a complete authentication system with JWT tokens, role-based access control, and a beautiful, responsive UI.

### What's Included

✅ **Complete Authentication System**
- User registration and login
- JWT access and refresh tokens
- Password hashing with bcrypt
- Token refresh mechanism
- Protected routes and API endpoints
- Audit logging

✅ **Modern Frontend**
- Angular 21 with standalone components
- Responsive, animated UI
- Form validation
- HTTP interceptors
- Route guards
- State management with RxJS

✅ **Secure Backend**
- RESTful API with Express.js
- PostgreSQL database
- Input validation
- Rate limiting
- Security headers
- Error handling

✅ **Production-Ready**
- Environment configuration
- Comprehensive documentation
- Security best practices
- Scalable architecture
- Deployment guides

## ✨ Features

### Authentication & Security
- 🔐 JWT-based authentication
- 🔄 Automatic token refresh
- 👤 User registration and login
- 🛡️ Password strength validation
- 🚫 Rate limiting on sensitive endpoints
- 📝 Audit logging
- 🔒 Role-based access control

### User Interface
- 🎨 Modern, gradient design
- 📱 Fully responsive (mobile, tablet, desktop)
- ✨ Smooth animations and transitions
- 🔍 Real-time form validation
- 💾 Remember me functionality
- 🔄 Loading states
- ⚠️ User-friendly error messages

### Developer Experience
- 📚 Comprehensive documentation
- 🏗️ Clean, modular architecture
- 🔧 Easy to extend
- 🧪 Ready for testing
- 📦 Well-organized code structure

## 🛠️ Tech Stack

### Frontend
- **Framework:** Angular 21
- **Language:** TypeScript 5.9
- **Styling:** SCSS
- **State Management:** RxJS
- **HTTP Client:** Angular HttpClient
- **Routing:** Angular Router

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
- **Database:** PostgreSQL 12+
- **Authentication:** JWT (jsonwebtoken)
- **Security:** helmet, cors, express-rate-limit
- **Validation:** express-validator
- **Logging:** morgan

### Database
- **RDBMS:** PostgreSQL
- **Features:** UUID, Triggers, Indexes, Foreign Keys

## ⚡ Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- npm 9 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ramiscope-project-management-system
   ```

2. **Setup Database**
   ```bash
   psql -U postgres
   CREATE DATABASE ramiscope_pms;
   \q
   ```

3. **Setup Backend**
   ```bash
   cd ramiscope-pmt-system-backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials and JWT secrets
   node src/database/init.js
   npm run dev
   ```

4. **Setup Frontend**
   ```bash
   cd ramiscope-project-management-system
   npm install
   npm start
   ```

5. **Create Test User**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "username": "admin",
       "password": "Admin@123",
       "firstName": "Admin",
       "lastName": "User"
     }'
   ```

6. **Open Application**
   - Navigate to `http://localhost:4200`
   - Login with the credentials you just created

## 📚 Documentation

### Getting Started
- **[Quick Start Guide](QUICK_START.md)** - Get running in 5 minutes
- **[Complete Setup Guide](SETUP_GUIDE.md)** - Detailed setup instructions
- **[Project Summary](PROJECT_SUMMARY.md)** - Overview of what's implemented

### Technical Documentation
- **[Architecture](ARCHITECTURE.md)** - System architecture and design
- **[Backend README](ramiscope-pmt-system-backend/README.md)** - Backend documentation
- **[Frontend README](ramiscope-project-management-system/README.md)** - Frontend documentation

### Deployment
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Production deployment guide

## 📁 Project Structure

```
ramiscope-project-management-system/
│
├── ramiscope-pmt-system-backend/          # Backend (Node.js/Express)
│   ├── src/
│   │   ├── config/                        # Configuration files
│   │   ├── controllers/                   # Request handlers
│   │   ├── database/                      # Database schema & init
│   │   ├── middleware/                    # Express middleware
│   │   ├── routes/                        # API routes
│   │   ├── services/                      # Business logic
│   │   ├── utils/                         # Utility functions
│   │   ├── validators/                    # Input validation
│   │   ├── app.js                         # Express app setup
│   │   └── server.js                      # Server entry point
│   ├── .env.example                       # Environment template
│   ├── package.json
│   └── README.md
│
├── ramiscope-project-management-system/   # Frontend (Angular)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                      # Core services, guards, interceptors
│   │   │   │   ├── guards/                # Route guards
│   │   │   │   ├── interceptors/          # HTTP interceptors
│   │   │   │   ├── models/                # TypeScript interfaces
│   │   │   │   └── services/              # Singleton services
│   │   │   ├── features/                  # Feature modules
│   │   │   │   ├── auth/                  # Authentication
│   │   │   │   └── dashboard/             # Dashboard
│   │   │   ├── app.config.ts              # App configuration
│   │   │   ├── app.routes.ts              # Route definitions
│   │   │   └── app.ts                     # Root component
│   │   ├── environments/                  # Environment configs
│   │   └── styles.scss                    # Global styles
│   ├── angular.json
│   ├── package.json
│   └── README.md
│
├── QUICK_START.md                         # Quick start guide
├── SETUP_GUIDE.md                         # Complete setup guide
├── ARCHITECTURE.md                        # System architecture
├── PROJECT_SUMMARY.md                     # Project overview
├── DEPLOYMENT_CHECKLIST.md                # Deployment guide
└── README.md                              # This file
```

## 📸 Screenshots

### Login Page
Modern, responsive login interface with smooth animations and real-time validation.

### Dashboard
Clean dashboard with user information and statistics cards.

## 🔒 Security

This project implements multiple security layers:

- **Authentication:** JWT with access and refresh tokens
- **Password Security:** bcrypt hashing with 12 salt rounds
- **Input Validation:** express-validator on all endpoints
- **SQL Injection Prevention:** Parameterized queries
- **XSS Protection:** Angular's built-in sanitization
- **Rate Limiting:** Multiple tiers for different endpoints
- **Security Headers:** Helmet.js configuration
- **CORS:** Configured for specific origins
- **Audit Logging:** All authentication events tracked

## 🚀 API Endpoints

### Authentication

```
POST   /api/v1/auth/register      # Register new user
POST   /api/v1/auth/login         # Login user
POST   /api/v1/auth/refresh       # Refresh access token
POST   /api/v1/auth/logout        # Logout user
GET    /api/v1/auth/profile       # Get user profile (protected)
GET    /api/v1/auth/verify        # Verify token (protected)
GET    /api/v1/health             # Health check
```

### Example Request

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "developer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 Testing

### Backend Testing
```bash
cd ramiscope-pmt-system-backend
npm test
```

### Frontend Testing
```bash
cd ramiscope-project-management-system
npm test
```

## 📈 Roadmap

### Phase 1: Authentication ✅ (Complete)
- [x] User registration
- [x] User login
- [x] JWT authentication
- [x] Token refresh
- [x] Protected routes
- [x] Audit logging

### Phase 2: User Management (Planned)
- [ ] User profile management
- [ ] Password reset
- [ ] Email verification
- [ ] User roles and permissions
- [ ] User settings

### Phase 3: Project Management (Planned)
- [ ] Create/edit/delete projects
- [ ] Project members
- [ ] Project status tracking
- [ ] Project dashboard

### Phase 4: Task Management (Planned)
- [ ] Create/assign tasks
- [ ] Task status workflow
- [ ] Task comments
- [ ] File attachments
- [ ] Task notifications

### Phase 5: Team Collaboration (Planned)
- [ ] Team creation
- [ ] Team chat
- [ ] Real-time notifications
- [ ] Activity feed
- [ ] File sharing

### Phase 6: Reporting (Planned)
- [ ] Project reports
- [ ] Team performance
- [ ] Time tracking
- [ ] Export functionality

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Ensure all tests pass

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**Sourav Ghosh**

## 🙏 Acknowledgments

- Angular Team for the amazing framework
- Express.js community
- PostgreSQL team
- All open-source contributors

## 📞 Support

For support, please:
1. Check the [documentation](SETUP_GUIDE.md)
2. Review [troubleshooting guide](SETUP_GUIDE.md#troubleshooting)
3. Open an issue on GitHub

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ using Angular, Node.js, and PostgreSQL**

*Ready for production deployment and feature development!*
