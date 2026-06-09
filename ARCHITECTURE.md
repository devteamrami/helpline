# 🏗️ Ramiscope PMS - System Architecture

## Overview

Ramiscope Project Management System is built using a modern, scalable, three-tier architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Angular 21 Application (Port 4200)           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Features   │  │     Core     │  │   Shared    │ │ │
│  │  │  - Auth      │  │  - Services  │  │ - Components│ │ │
│  │  │  - Dashboard │  │  - Guards    │  │ - Pipes     │ │ │
│  │  │  - Projects  │  │  - Intercept.│  │ - Directives│ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              │ JSON
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        Node.js/Express Server (Port 5000)              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│ │
│  │  │  Routes  │→ │Controller│→ │ Services │→ │  Utils ││ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘│ │
│  │       ↓              ↓              ↓                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │Middleware│  │Validators│  │  Models  │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              │ Connection Pool
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           PostgreSQL Database (Port 5432)              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│ │
│  │  │  Users   │  │  Roles   │  │ Refresh  │  │ Audit  ││ │
│  │  │  Table   │  │  Table   │  │  Tokens  │  │  Logs  ││ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘│ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (Client Layer)

| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 21.x | Frontend framework |
| TypeScript | 5.9.x | Type-safe JavaScript |
| RxJS | 7.8.x | Reactive programming |
| SCSS | - | Styling |
| Angular Router | 21.x | Client-side routing |
| Angular Forms | 21.x | Form handling |

### Backend (Application Layer)

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express | 4.x | Web framework |
| TypeScript/JavaScript | ES6+ | Programming language |
| JWT | 9.x | Authentication tokens |
| bcryptjs | 2.x | Password hashing |
| express-validator | 7.x | Input validation |
| helmet | 7.x | Security headers |
| cors | 2.x | Cross-origin requests |
| morgan | 1.x | HTTP logging |

### Database (Data Layer)

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 12+ | Relational database |
| pg | 8.x | PostgreSQL client |
| UUID | 9.x | Unique identifiers |

## Design Patterns

### Backend Patterns

#### 1. **MVC (Model-View-Controller)**
```
Routes → Controllers → Services → Database
```
- **Routes**: Define API endpoints
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic
- **Models**: Data structures

#### 2. **Repository Pattern**
```javascript
// Database abstraction
const query = async (text, params) => {
  return await pool.query(text, params);
};
```

#### 3. **Middleware Chain**
```javascript
app.use(helmet());           // Security
app.use(cors());             // CORS
app.use(express.json());     // Body parsing
app.use(rateLimiter);        // Rate limiting
app.use(authenticate);       // Authentication
```

#### 4. **Dependency Injection**
```javascript
// Services injected into controllers
const authService = require('../services/auth.service');
```

### Frontend Patterns

#### 1. **Component-Based Architecture**
```
App Component
├── Auth Module
│   ├── Login Component
│   └── Register Component
└── Dashboard Module
    └── Dashboard Component
```

#### 2. **Service Layer Pattern**
```typescript
// Singleton services
@Injectable({ providedIn: 'root' })
export class AuthService { }
```

#### 3. **Observer Pattern (RxJS)**
```typescript
// Reactive state management
currentUser$ = new BehaviorSubject<User | null>(null);
```

#### 4. **Guard Pattern**
```typescript
// Route protection
canActivate: [authGuard]
```

#### 5. **Interceptor Pattern**
```typescript
// HTTP request/response interception
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Add token to requests
};
```

## Security Architecture

### Authentication Flow

```
1. User Login
   ↓
2. Validate Credentials
   ↓
3. Generate JWT Tokens
   ├── Access Token (15 min)
   └── Refresh Token (7 days)
   ↓
4. Store Tokens
   ├── Access Token → Memory/LocalStorage
   └── Refresh Token → LocalStorage/HttpOnly Cookie
   ↓
5. Include Access Token in Requests
   ↓
6. Verify Token on Backend
   ↓
7. Token Expired?
   ├── Yes → Use Refresh Token
   └── No → Process Request
```

### Security Layers

#### 1. **Transport Security**
- HTTPS in production
- Secure headers (Helmet.js)
- CORS configuration

#### 2. **Authentication Security**
- JWT with strong secrets
- Token expiration
- Refresh token rotation
- Password hashing (bcrypt, 12 rounds)

#### 3. **Authorization Security**
- Role-based access control
- Route guards
- API endpoint protection

#### 4. **Input Security**
- Input validation (express-validator)
- SQL injection prevention (parameterized queries)
- XSS protection (Angular sanitization)

#### 5. **Rate Limiting**
- General API: 100 req/15min
- Auth endpoints: 5 req/15min
- Registration: 3 req/hour

#### 6. **Audit Logging**
- User actions tracked
- IP address logging
- Timestamp recording

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐
│    Roles    │         │    Users    │
├─────────────┤         ├─────────────┤
│ id (PK)     │◄────────│ id (PK)     │
│ name        │    1:N  │ email       │
│ description │         │ username    │
│ created_at  │         │ password    │
│ updated_at  │         │ role_id(FK) │
└─────────────┘         │ is_active   │
                        │ created_at  │
                        └──────┬──────┘
                               │ 1:N
                               ▼
                        ┌─────────────┐
                        │Refresh Token│
                        ├─────────────┤
                        │ id (PK)     │
                        │ user_id(FK) │
                        │ token       │
                        │ expires_at  │
                        │ revoked_at  │
                        └─────────────┘

                        ┌─────────────┐
                        │ Audit Logs  │
                        ├─────────────┤
                        │ id (PK)     │
                        │ user_id(FK) │
                        │ action      │
                        │ ip_address  │
                        │ created_at  │
                        └─────────────┘
```

### Key Design Decisions

1. **UUID Primary Keys**: Better for distributed systems
2. **Timestamps**: Automatic tracking with triggers
3. **Indexes**: On frequently queried columns
4. **Foreign Keys**: Referential integrity
5. **Soft Deletes**: Via `is_active` flag

## API Architecture

### RESTful Design

```
Resource: /api/v1/auth

POST   /register      - Create new user
POST   /login         - Authenticate user
POST   /refresh       - Refresh access token
POST   /logout        - Revoke refresh token
GET    /profile       - Get user profile (protected)
GET    /verify        - Verify token (protected)
```

### Request/Response Format

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "jwt-token",
    "refreshToken": "jwt-token"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## State Management

### Frontend State

```typescript
// Authentication State
AuthService
├── currentUser$ (BehaviorSubject<User>)
├── isAuthenticated$ (BehaviorSubject<boolean>)
└── Methods
    ├── login()
    ├── logout()
    ├── refreshToken()
    └── getProfile()

// Storage
LocalStorage
├── rpms_access_token
├── rpms_refresh_token
└── rpms_user
```

### Backend State

```javascript
// Stateless API
- No session storage
- JWT tokens for state
- Database for persistence

// Connection Pool
- PostgreSQL connection pool
- Max 20 connections
- Auto-reconnect
```

## Error Handling

### Frontend Error Handling

```typescript
// HTTP Interceptor
errorInterceptor
├── 401 Unauthorized → Refresh token
├── 403 Forbidden → Show error
├── 404 Not Found → Show error
└── 500 Server Error → Show error

// Service Level
try-catch blocks
Observable error handling
User-friendly messages
```

### Backend Error Handling

```javascript
// Global Error Middleware
errorHandler
├── Validation Errors → 400
├── Authentication Errors → 401
├── Authorization Errors → 403
├── Not Found → 404
├── Database Errors → 500
└── Unknown Errors → 500

// Logging
Console logging
Error details in development
Sanitized errors in production
```

## Performance Optimization

### Frontend

1. **Lazy Loading**: Feature modules loaded on demand
2. **Change Detection**: OnPush strategy where applicable
3. **Bundle Optimization**: Tree shaking, code splitting
4. **Caching**: HTTP caching headers
5. **Compression**: Gzip/Brotli compression

### Backend

1. **Connection Pooling**: Reuse database connections
2. **Query Optimization**: Indexed columns, efficient queries
3. **Caching**: Redis for session/token caching (future)
4. **Compression**: Response compression
5. **Rate Limiting**: Prevent abuse

### Database

1. **Indexes**: On frequently queried columns
2. **Connection Pool**: Max 20 connections
3. **Query Optimization**: Explain analyze
4. **Partitioning**: For large tables (future)
5. **Replication**: Read replicas (future)

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
├── App Server 1
├── App Server 2
└── App Server 3
    ↓
Database Cluster
├── Primary (Write)
└── Replicas (Read)
```

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Add caching layer

### Future Enhancements

1. **Microservices**: Split into smaller services
2. **Message Queue**: RabbitMQ/Redis for async tasks
3. **Caching**: Redis for sessions and data
4. **CDN**: Static asset delivery
5. **Container Orchestration**: Kubernetes
6. **Monitoring**: Prometheus, Grafana
7. **Logging**: ELK Stack

## Deployment Architecture

### Development

```
Local Machine
├── Frontend (localhost:4200)
├── Backend (localhost:5000)
└── Database (localhost:5432)
```

### Production

```
Cloud Provider (AWS/Azure/GCP)
├── Frontend
│   ├── S3/Blob Storage + CloudFront/CDN
│   └── Static files
├── Backend
│   ├── EC2/App Service/Compute Engine
│   ├── Load Balancer
│   └── Auto Scaling
└── Database
    ├── RDS/Azure Database/Cloud SQL
    ├── Automated backups
    └── Read replicas
```

## Monitoring & Logging

### Application Monitoring

- **Health Checks**: `/api/v1/health`
- **Error Tracking**: Sentry (future)
- **Performance**: New Relic/DataDog (future)
- **Uptime**: Pingdom/UptimeRobot

### Logging Strategy

```
Backend Logs
├── Access Logs (Morgan)
├── Error Logs (Console/File)
├── Audit Logs (Database)
└── Security Logs (Failed auth attempts)

Frontend Logs
├── Console Errors
├── Error Tracking (Sentry)
└── Analytics (Google Analytics)
```

## Testing Strategy

### Backend Testing

```
Unit Tests
├── Services
├── Controllers
└── Utilities

Integration Tests
├── API Endpoints
├── Database Operations
└── Authentication Flow

E2E Tests
└── Complete user flows
```

### Frontend Testing

```
Unit Tests
├── Components
├── Services
└── Pipes/Directives

Integration Tests
├── Component interactions
└── Service integration

E2E Tests
└── User workflows
```

## Conclusion

This architecture provides:

✅ **Scalability**: Can handle growth
✅ **Security**: Multiple security layers
✅ **Maintainability**: Clear separation of concerns
✅ **Performance**: Optimized at each layer
✅ **Reliability**: Error handling and logging
✅ **Extensibility**: Easy to add new features

The system is production-ready and follows industry best practices for enterprise applications.
