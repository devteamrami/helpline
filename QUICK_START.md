# ⚡ Quick Start Guide - Ramiscope PMS

Get up and running in 5 minutes!

## 🎯 Prerequisites

- Node.js v18+
- PostgreSQL v12+
- npm v9+

## 🚀 Quick Setup

### 1. Database Setup (2 minutes)

```bash
# Start PostgreSQL and create database
psql -U postgres
CREATE DATABASE ramiscope_pms;
\q
```

### 2. Backend Setup (2 minutes)

```bash
# Navigate to backend
cd ramiscope-pmt-system-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env - Set these values:
# DB_PASSWORD=your_postgres_password
# JWT_ACCESS_SECRET=your_random_32_char_string
# JWT_REFRESH_SECRET=your_random_32_char_string

# Initialize database
node src/database/init.js

# Start server
npm run dev
```

Backend should be running on `http://localhost:5000`

### 3. Frontend Setup (1 minute)

```bash
# Open new terminal, navigate to frontend
cd ramiscope-project-management-system

# Install dependencies
npm install

# Start development server
npm start
```

Frontend should be running on `http://localhost:4200`

## 🧪 Test It Out

### Create Test User (via API)

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login via UI

1. Open `http://localhost:4200`
2. Login with:
   - **Email:** `test@example.com`
   - **Password:** `Test@123`
3. You should see the dashboard!

## 📁 Project Structure

```
ramiscope-pmt-system-backend/     # Node.js/Express Backend
├── src/
│   ├── config/                   # Configuration
│   ├── controllers/              # Request handlers
│   ├── database/                 # Database schema
│   ├── middleware/               # Express middleware
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic
│   ├── utils/                    # Utilities
│   ├── validators/               # Input validation
│   └── server.js                 # Entry point

ramiscope-project-management-system/  # Angular Frontend
├── src/
│   ├── app/
│   │   ├── core/                 # Core services, guards, interceptors
│   │   ├── features/             # Feature modules
│   │   ├── app.config.ts         # App configuration
│   │   └── app.routes.ts         # Routes
│   ├── environments/             # Environment configs
│   └── styles.scss               # Global styles
```

## 🔑 Key Features

### Backend
- ✅ JWT Authentication
- ✅ PostgreSQL Database
- ✅ Password Hashing (bcrypt)
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ Error Handling
- ✅ Audit Logging
- ✅ CORS & Security

### Frontend
- ✅ Modern Login UI
- ✅ Route Guards
- ✅ HTTP Interceptors
- ✅ Token Management
- ✅ Auto Token Refresh
- ✅ Form Validation
- ✅ Responsive Design
- ✅ Loading States

## 📡 API Endpoints

```
POST   /api/v1/auth/register      # Register new user
POST   /api/v1/auth/login         # Login
POST   /api/v1/auth/refresh       # Refresh token
POST   /api/v1/auth/logout        # Logout
GET    /api/v1/auth/profile       # Get profile (protected)
GET    /api/v1/auth/verify        # Verify token (protected)
GET    /api/v1/health             # Health check
```

## 🛠️ Common Commands

### Backend
```bash
npm start          # Start server
npm run dev        # Start with nodemon
node src/database/init.js  # Initialize database
```

### Frontend
```bash
npm start          # Start dev server
npm run build      # Build for production
npm test           # Run tests
```

## 🐛 Quick Troubleshooting

### Backend won't start?
- Check PostgreSQL is running
- Verify `.env` file exists and has correct values
- Run `npm install` again

### Frontend won't start?
- Check backend is running on port 5000
- Run `npm install` again
- Clear browser cache

### Can't login?
- Check backend console for errors
- Verify user was created successfully
- Check browser DevTools console

### Database errors?
- Run `node src/database/init.js` again
- Check PostgreSQL is running
- Verify database credentials in `.env`

## 📚 Full Documentation

- **Complete Setup Guide:** `SETUP_GUIDE.md`
- **Backend README:** `ramiscope-pmt-system-backend/README.md`
- **Frontend README:** `ramiscope-project-management-system/README.md`

## 🎉 You're Ready!

Your enterprise-grade authentication system is now running!

**Next Steps:**
1. Explore the dashboard
2. Check the API documentation
3. Start building new features
4. Customize the UI to your needs

Happy coding! 🚀
