# Design Document: Raise Ticket Module

## Overview

The Raise Ticket module is a cross-system integration feature that bridges Ramiscope (the external client software) with the PMS (Project Management System). It provides a complete support ticket lifecycle: external ticket creation via API key authentication, threaded staff-user conversations with file attachments, real-time Firebase push notifications, SMTP email alerts, a staff-facing Angular management interface, ticket status lifecycle management, and a standalone FAQ management page.

### Purpose

This module enables Ramiscope users to raise support tickets that PMS staff can manage, respond to, and resolve. It integrates with AWS S3 for file storage, Firebase Cloud Messaging for push notifications, and SMTP for email alerts. All database writes are audited to the existing `audit_logs` table.

### Key Features

- **External Ticket Creation**: API key–authenticated POST endpoint for Ramiscope to create tickets
- **Threaded Conversations**: Bidirectional messaging between Ramiscope users and PMS staff
- **File Attachments**: AWS S3 uploads (up to 5 files, 10 MB each, specific MIME types)
- **Push Notifications**: Async Firebase FCM notifications to staff and users
- **Email Notifications**: SMTP email alerts on ticket creation and replies
- **Staff Management UI**: Angular pages for ticket listing, detail/reply, and FAQ management
- **Status Lifecycle**: Controlled transitions (open → in_progress → resolved → closed)
- **FAQ Management**: Admin/superadmin CRUD interface for FAQ entries
- **Audit Logging**: All DB writes logged to `audit_logs`; failures never block primary operations

### Technology Stack

- **Backend**: Node.js/Express (port 5000), PostgreSQL, parameterized queries
- **Frontend**: Angular 21.2.0, standalone components, Angular Material, RxJS BehaviorSubject
- **File Storage**: AWS S3 (via `@aws-sdk/client-s3`)
- **Push Notifications**: Firebase Admin SDK (`firebase-admin`)
- **Email**: Nodemailer with SMTP
- **Auth**: JWT Bearer tokens (staff) + API key header (external Ramiscope calls)
- **PBT Library**: fast-check (JavaScript/TypeScript)

---

## Architecture

### System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Ramiscope (External)                          │
│   POST /api/tickets  (X-API-Key header)                              │
│   POST /api/tickets/:id/conversations  (X-API-Key header)            │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼───────────────────────────────────────┐
│                     PMS Backend (Express :5000)                      │
│                                                                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │  API Key Auth   │  │  JWT Auth +      │  │  Error Middleware  │  │
│  │  Middleware     │  │  Role Authorize  │  │                    │  │
│  └────────┬────────┘  └────────┬─────────┘  └────────────────────┘  │
│           │                   │                                      │
│  ┌────────▼───────────────────▼──────────────────────────────────┐  │
│  │                     Ticket Router                              │  │
│  │  POST /tickets  GET /tickets  GET /tickets/:id                 │  │
│  │  POST /tickets/:id/conversations  PATCH /tickets/:id/status    │  │
│  └────────────────────────────┬──────────────────────────────────┘  │
│                               │                                      │
│  ┌────────────────────────────▼──────────────────────────────────┐  │
│  │                   Ticket Controller                            │  │
│  └────────────────────────────┬──────────────────────────────────┘  │
│                               │                                      │
│  ┌────────────────────────────▼──────────────────────────────────┐  │
│  │                    Ticket Service                              │  │
│  │  (business logic, DB queries, orchestrates notifications)      │  │
│  └──────┬──────────────┬──────────────┬──────────────────────────┘  │
│         │              │              │                              │
│  ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────────┐                  │
│  │  S3 Service │ │FCM Service │ │ Email Service │                  │
│  │  (AWS SDK)  │ │(Firebase)  │ │ (Nodemailer)  │                  │
│  └─────────────┘ └────────────┘ └───────────────┘                  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    FAQ Router / Controller / Service           │  │
│  │  GET/POST /faqs   PUT/DELETE /faqs/:id                         │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ SQL (parameterized queries)
┌──────────────────────────────▼───────────────────────────────────────┐
│                     PostgreSQL Database                              │
│  ┌──────────┐  ┌──────────────────────┐  ┌──────┐  ┌────────────┐  │
│  │ tickets  │  │ ticket_conversations │  │ faqs │  │ audit_logs │  │
│  └──────────┘  └──────────────────────┘  └──────┘  └────────────┘  │
│  ┌──────────┐  ┌──────────────────────┐                             │
│  │  users   │  │    refresh_tokens    │                             │
│  │(+fcm_tok)│  │                      │                             │
│  └──────────┘  └──────────────────────┘                             │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     Angular Frontend (:4200)                         │
│  ┌──────────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  TicketListComponent │  │TicketDetailComp. │  │ FaqComponent  │  │
│  │  /tickets            │  │ /tickets/:id     │  │ /faqs         │  │
│  └──────────┬───────────┘  └────────┬─────────┘  └───────┬───────┘  │
│             └──────────────────────┬┘                    │          │
│                          ┌─────────▼──────────┐          │          │
│                          │   TicketService    │◄─────────┘          │
│                          │   FaqService       │                      │
│                          │  (BehaviorSubject) │                      │
│                          └─────────┬──────────┘                      │
└────────────────────────────────────┼────────────────────────────────┘
                                     │ HTTP + JWT Bearer
                                     ▼ PMS Backend
```

### Notification Flow

```
Ticket Created:
  Ramiscope → POST /api/tickets → TicketService.createTicket()
    ├── DB: INSERT tickets
    ├── AuditLogger.log('ticket_created')
    ├── [async] FCMService.notifyAllStaff(ticket)
    └── [async] EmailService.notifyAllStaff(ticket)

User Reply:
  Ramiscope → POST /api/tickets/:id/conversations (sender_type=user)
    ├── DB: INSERT ticket_conversations
    ├── DB: UPDATE tickets SET last_reply_by='user'
    ├── AuditLogger.log('conversation_reply_added')
    ├── [async] FCMService.notifyAllStaff(conversation)
    └── [async] EmailService.notifyAllStaff(conversation)

Staff Reply:
  PMS UI → POST /api/tickets/:id/conversations (sender_type=staff)
    ├── DB: INSERT ticket_conversations
    ├── DB: UPDATE tickets SET last_reply_by='staff'
    ├── AuditLogger.log('conversation_reply_added')
    ├── [async] FCMService.notifyUser(ticket.user_email, fcm_token)
    └── [async] EmailService.notifyUser(ticket.user_email)
```

### Backend Architecture Pattern

Following the existing Controller → Service → Database pattern:

1. **Router Layer** — Express route definitions, middleware stack (auth, validation)
2. **Controller Layer** — Request extraction, response formatting, HTTP status codes
3. **Service Layer** — Business logic, DB queries, transaction management, notification orchestration
4. **Utility Services** — S3Service, FCMService, EmailService, AuditLogger (injected into TicketService)

---

## Components and Interfaces

### Backend Components

#### 1. API Key Middleware (`/middleware/apiKey.middleware.js`)

Validates the `X-API-Key` header against a registered key stored in environment variables. Used exclusively on the external-facing ticket endpoints.

```javascript
// Validates X-API-Key header
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.RAMISCOPE_API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};
```

#### 2. Ticket Router (`/routes/ticket.routes.js`)

```javascript
// External (API key auth)
POST   /api/tickets                          // Create ticket (Ramiscope)
POST   /api/tickets/:id/conversations        // Add reply (Ramiscope user)

// Internal (JWT auth, staff roles)
GET    /api/tickets                          // List tickets with pagination/filter
GET    /api/tickets/:id                      // Ticket detail + conversations
PATCH  /api/tickets/:id/status               // Update ticket status

// Middleware stacks:
// External: validateApiKey → validateBody → controller
// Internal: authenticate → authorize(['admin','superadmin','manager']) → validate → controller
```

#### 3. FAQ Router (`/routes/faq.routes.js`)

```javascript
GET    /api/faqs                             // List FAQs (paginated)
POST   /api/faqs                             // Create FAQ
PUT    /api/faqs/:id                         // Update FAQ
DELETE /api/faqs/:id                         // Delete FAQ

// Middleware: authenticate → authorize(['admin','superadmin']) → validate → controller
```

#### 4. Ticket Controller (`/controllers/ticket.controller.js`)

Key methods:
```javascript
async createTicket(req, res)          // POST /api/tickets
async addConversation(req, res)       // POST /api/tickets/:id/conversations
async getTickets(req, res)            // GET /api/tickets
async getTicketById(req, res)         // GET /api/tickets/:id
async updateTicketStatus(req, res)    // PATCH /api/tickets/:id/status
```

#### 5. FAQ Controller (`/controllers/faq.controller.js`)

Key methods:
```javascript
async getFaqs(req, res)               // GET /api/faqs
async createFaq(req, res)             // POST /api/faqs
async updateFaq(req, res)             // PUT /api/faqs/:id
async deleteFaq(req, res)             // DELETE /api/faqs/:id
```

#### 6. Ticket Service (`/services/ticket.service.js`)

Core business logic. Orchestrates DB writes, S3 uploads, and async notifications.

```javascript
async createTicket(data, systemIp)
async addConversation(ticketId, data, files, systemIp)
async getTickets(params)              // pagination, search, filter
async getTicketById(id)               // includes conversations ordered by created_at ASC
async updateTicketStatus(id, status, userId, systemIp)
```

#### 7. FAQ Service (`/services/faq.service.js`)

```javascript
async getFaqs(params)
async createFaq(data, userId, systemIp)
async updateFaq(id, data, userId, systemIp)
async deleteFaq(id, userId, systemIp)
```

#### 8. S3 Service (`/services/s3.service.js`)

Wraps `@aws-sdk/client-s3`. Validates MIME type and size before upload. Implements atomic rollback on partial failure.

```javascript
async uploadFiles(files)              // Returns array of { s3Key, originalName }
async deleteFiles(s3Keys)             // Rollback on partial failure
validateFiles(files)                  // Throws on invalid type/size/count
```

#### 9. FCM Service (`/services/fcm.service.js`)

Wraps `firebase-admin`. All sends are fire-and-forget; failures are logged to `audit_logs`.

```javascript
async notifyAllStaff(payload)         // Sends to all users with fcm_token
async notifyUser(fcmToken, payload)   // Sends to specific user token
```

#### 10. Email Service (`/services/email.service.js`)

Wraps Nodemailer. All sends are fire-and-forget; failures are logged to `audit_logs`.

```javascript
async notifyStaffNewTicket(ticket)
async notifyStaffNewReply(ticket, conversation)
async notifyUserStaffReply(ticket, conversation)
```

#### 11. Audit Logger (`/utils/auditLogger.js`)

Thin wrapper around the existing `audit_logs` table. Never throws — all errors are swallowed and logged to console.

```javascript
async log({ action, resource, userId, ipAddress, details })
```

#### 12. Validators

- `/validators/ticket.validator.js` — validates ticket creation and conversation body fields
- `/validators/faq.validator.js` — validates FAQ question/answer fields

### Frontend Components

#### 1. Ticket Service (`/features/tickets/services/ticket.service.ts`)

```typescript
// State
private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
public tickets$ = this.ticketsSubject.asObservable();
private loadingSubject = new BehaviorSubject<boolean>(false);
public loading$ = this.loadingSubject.asObservable();

// Methods
getTickets(params?: TicketListParams): Observable<TicketListResponse>
getTicketById(id: string): Observable<TicketDetail>
addConversation(ticketId: string, data: FormData): Observable<ConversationEntry>
updateTicketStatus(ticketId: string, status: TicketStatus): Observable<Ticket>
```

#### 2. FAQ Service (`/features/tickets/services/faq.service.ts`)

```typescript
private faqsSubject = new BehaviorSubject<Faq[]>([]);
public faqs$ = this.faqsSubject.asObservable();

getFaqs(params?: FaqListParams): Observable<FaqListResponse>
createFaq(data: CreateFaqRequest): Observable<Faq>
updateFaq(id: string, data: UpdateFaqRequest): Observable<Faq>
deleteFaq(id: string): Observable<void>
```

#### 3. Ticket List Component (`/features/tickets/ticket-list/ticket-list.component.ts`)

```typescript
// Route: /tickets
// Guard: authGuard + roleGuard(['admin','superadmin','manager'])
tickets: Ticket[] = [];
currentPage = 1;
pageSize = 20;
totalItems = 0;
searchControl = new FormControl('');       // debounced 300ms
statusFilter = new FormControl('');
```

#### 4. Ticket Detail Component (`/features/tickets/ticket-detail/ticket-detail.component.ts`)

```typescript
// Route: /tickets/:id
ticket: TicketDetail | null = null;
conversations: ConversationEntry[] = [];
replyControl = new FormControl('', [Validators.required, Validators.maxLength(5000)]);
selectedFiles: File[] = [];               // max 5
isSubmitting = false;
replyError: string | null = null;
```

#### 5. FAQ Component (`/features/tickets/faq/faq.component.ts`)

```typescript
// Route: /faqs
// Guard: authGuard + roleGuard(['admin','superadmin'])
faqs: Faq[] = [];
isEditing: string | null = null;          // FAQ id being edited
faqForm: FormGroup;                       // question + answer controls
```

---

## Data Models

### Database Schema — Migration SQL

```sql
-- ============================================================
-- Migration: raise_ticket_module
-- ============================================================

-- 1. Add fcm_token column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(500);

-- 2. TICKETS table
CREATE TABLE IF NOT EXISTS tickets (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_name      VARCHAR(255) NOT NULL,
    description      TEXT NOT NULL,
    user_id          VARCHAR(255) NOT NULL,
    user_first_name  VARCHAR(255) NOT NULL,
    user_last_name   VARCHAR(255) NOT NULL,
    user_email       VARCHAR(255) NOT NULL,
    employee_code    VARCHAR(255) NOT NULL,
    site_id          VARCHAR(255) NOT NULL,
    site_name        VARCHAR(255) NOT NULL,
    page_url         VARCHAR(2048) NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'open',
    last_reply_by    VARCHAR(10),
    last_replied_at  TIMESTAMP WITH TIME ZONE,
    system_ip        INET NOT NULL,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_ticket_status
        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    CONSTRAINT chk_ticket_last_reply_by
        CHECK (last_reply_by IS NULL OR last_reply_by IN ('user', 'staff'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_status     ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id    ON tickets(user_id);

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. TICKET_CONVERSATIONS table
CREATE TABLE IF NOT EXISTS ticket_conversations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL,
    sender_id   VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    system_ip   INET NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_conv_sender_type
        CHECK (sender_type IN ('user', 'staff')),
    CONSTRAINT chk_conv_message_length
        CHECK (char_length(message) >= 1 AND char_length(message) <= 5000)
);

CREATE INDEX IF NOT EXISTS idx_ticket_conversations_ticket_id
    ON ticket_conversations(ticket_id);

DROP TRIGGER IF EXISTS update_ticket_conversations_updated_at ON ticket_conversations;
CREATE TRIGGER update_ticket_conversations_updated_at
    BEFORE UPDATE ON ticket_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. FAQS table
CREATE TABLE IF NOT EXISTS faqs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question   VARCHAR(500) NOT NULL,
    answer     TEXT NOT NULL,
    system_ip  INET NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_faq_answer_length
        CHECK (char_length(answer) <= 5000)
);

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tickets IS 'Support tickets raised by Ramiscope users';
COMMENT ON TABLE ticket_conversations IS 'Threaded conversation entries for each ticket';
COMMENT ON TABLE faqs IS 'FAQ entries managed by PMS admin/superadmin staff';
COMMENT ON COLUMN users.fcm_token IS 'Firebase Cloud Messaging device token for push notifications';
```

### TypeScript Interfaces (`/features/tickets/models/ticket.model.ts`)

```typescript
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SenderType = 'user' | 'staff';

export interface Ticket {
  id: string;
  ticketName: string;
  description: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  employeeCode: string;
  siteId: string;
  siteName: string;
  pageUrl: string;
  status: TicketStatus;
  lastReplyBy: SenderType | null;
  lastRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  s3Key: string;
  originalName: string;
}

export interface ConversationEntry {
  id: string;
  ticketId: string;
  senderType: SenderType;
  senderId: string;
  message: string;
  attachments: Attachment[];
  createdAt: string;
}

export interface TicketDetail extends Ticket {
  conversations: ConversationEntry[];
}

export interface TicketListParams {
  page?: number;
  limit?: number;
  status?: TicketStatus | '';
  search?: string;
}

export interface TicketListResponse {
  tickets: Ticket[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqRequest { question: string; answer: string; }
export interface UpdateFaqRequest { question?: string; answer?: string; }

export interface FaqListResponse {
  faqs: Faq[];
  pagination: { currentPage: number; itemsPerPage: number; totalItems: number; totalPages: number; };
}
```

### API Request / Response Contracts

#### POST /api/tickets

Request body:
```json
{
  "ticket_name": "Login page broken",
  "description": "Cannot log in since yesterday...",
  "user_id": "usr_123",
  "user_first_name": "Jane",
  "user_last_name": "Doe",
  "user_email": "jane.doe@example.com",
  "employee_code": "EMP001",
  "site_id": "site_42",
  "site_name": "London HQ",
  "page_url": "https://app.ramiscope.com/login"
}
```

Success response `201`:
```json
{ "success": true, "message": "Ticket created successfully",
  "data": { "id": "<uuid>", "ticket_name": "Login page broken", "status": "open" } }
```

#### POST /api/tickets/:id/conversations

Request: `multipart/form-data`
- `sender_type`: `"user"` | `"staff"`
- `sender_id`: string
- `message`: string (1–5000 chars)
- `files[]`: up to 5 files (optional)

Success response `201`:
```json
{ "success": true, "message": "Reply added successfully",
  "data": { "id": "<uuid>", "ticket_id": "<uuid>", "sender_type": "staff",
            "message": "...", "attachments": [{"s3Key":"...", "originalName":"..."}],
            "created_at": "2025-01-01T00:00:00Z" } }
```

#### GET /api/tickets

Query params: `page`, `limit` (10|20|50), `status`, `search`

Success response `200`:
```json
{ "success": true, "data": { "tickets": [...], "pagination": { "currentPage": 1,
  "itemsPerPage": 20, "totalItems": 45, "totalPages": 3 } } }
```

#### PATCH /api/tickets/:id/status

Request body: `{ "status": "in_progress" }`

Success response `200`:
```json
{ "success": true, "message": "Status updated", "data": { "id": "<uuid>", "status": "in_progress" } }
```

---

## Security Design

### Authentication Layers

| Endpoint | Auth Method | Middleware |
|---|---|---|
| `POST /api/tickets` | API Key (`X-API-Key`) | `validateApiKey` |
| `POST /api/tickets/:id/conversations` | API Key (`X-API-Key`) | `validateApiKey` |
| `GET /api/tickets` | JWT Bearer | `authenticate` + `authorize(['admin','superadmin','manager'])` |
| `GET /api/tickets/:id` | JWT Bearer | `authenticate` + `authorize(['admin','superadmin','manager'])` |
| `PATCH /api/tickets/:id/status` | JWT Bearer | `authenticate` + `authorize(['admin','superadmin','manager'])` |
| `GET /api/faqs` | JWT Bearer | `authenticate` + `authorize(['admin','superadmin'])` |
| `POST /api/faqs` | JWT Bearer | `authenticate` + `authorize(['admin','superadmin'])` |
| `PUT /api/faqs/:id` | JWT Bearer | `authenticate` + `authorize(['admin','superadmin'])` |
| `DELETE /api/faqs/:id` | JWT Bearer | `authenticate` + `authorize(['admin','superadmin'])` |

### API Key Design

- The API key is a single shared secret stored in `process.env.RAMISCOPE_API_KEY`
- The key must be a non-empty string; the middleware rejects absent or non-matching values with `401`
- The key is never logged or returned in any response body
- Key rotation requires an environment variable update and server restart

### File Upload Security

All validation runs **before** any S3 upload attempt:

1. **Count check**: reject if `files.length > 5` → `400`
2. **Size check**: reject if any `file.size > 10 * 1024 * 1024` → `413`
3. **MIME type check**: reject if any `file.mimetype` not in allowlist → `422`

Accepted MIME types:
```
image/jpeg, image/png, image/gif,
application/pdf,
application/msword,
application/vnd.openxmlformats-officedocument.wordprocessingml.document,
application/vnd.ms-excel,
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

S3 object keys use the pattern: `tickets/{ticketId}/conversations/{conversationId}/{uuid}-{originalName}` to prevent path traversal and collisions.

### Input Validation

All backend validators use parameterized queries (no ORM, no string interpolation). Frontend forms use Angular Reactive Forms with `Validators.maxLength`, `Validators.required`, and `Validators.email`.

### Role-Based Access (Frontend)

A `roleGuard` function checks `AuthService.currentUserValue.role` against an allowed list. Unauthorized users are redirected to `/unauthorized`.

```typescript
// Usage in routes
{
  path: 'tickets',
  canActivate: [authGuard, roleGuard(['admin', 'superadmin', 'manager'])],
  component: TicketListComponent
}
```

### Environment Variables (additions to `.env`)

```dotenv
# Ramiscope API Key
RAMISCOPE_API_KEY=your_api_key_here

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=ramiscope-pms-attachments

# Firebase
FIREBASE_CREDENTIALS_PATH=./config/firebase-credentials.json

# SMTP Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@ramiscope.com
SMTP_PASS=your_smtp_password
SMTP_FROM="Ramiscope PMS <notifications@ramiscope.com>"
```

---

## Error Handling

### Backend Error Handling Strategy

**HTTP Status Code Map:**

| Condition | Status |
|---|---|
| Validation failure (missing/invalid fields) | `400 Bad Request` |
| Invalid JSON body | `400 Bad Request` |
| Missing/invalid API key | `401 Unauthorized` |
| Missing/invalid JWT | `401 Unauthorized` |
| Insufficient role | `403 Forbidden` |
| Ticket/FAQ not found | `404 Not Found` |
| Reply on resolved/closed ticket | `409 Conflict` |
| Transition from `closed` status | `409 Conflict` |
| File count > 5 | `400 Bad Request` |
| File size > 10 MB | `413 Payload Too Large` |
| Unsupported MIME type | `422 Unprocessable Entity` |
| Database unavailable | `503 Service Unavailable` |
| Unexpected server error | `500 Internal Server Error` |

**Error Response Format** (consistent with existing modules):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "ticket_name", "message": "ticket_name is required" },
    { "field": "user_email", "message": "user_email must be a valid email address" }
  ]
}
```

**Notification Failure Handling:**

Both FCM and Email services are invoked asynchronously after the primary DB write succeeds. Failures are caught, logged to `audit_logs`, and never propagate to the HTTP response:

```javascript
// Pattern used in ticket.service.js
const notifyAsync = async () => {
  try {
    await fcmService.notifyAllStaff(ticket);
  } catch (err) {
    await auditLogger.log({ action: 'fcm_notification_failure', details: { error: err.message } });
  }
  try {
    await emailService.notifyAllStaff(ticket);
  } catch (err) {
    await auditLogger.log({ action: 'email_notification_failure', details: { error: err.message } });
  }
};
// Fire and forget — do not await
notifyAsync();
```

**S3 Atomic Rollback:**

If any file upload fails mid-batch, all previously uploaded objects are deleted before returning an error:

```javascript
const uploadedKeys = [];
try {
  for (const file of files) {
    const key = await s3Service.uploadOne(file);
    uploadedKeys.push(key);
  }
} catch (err) {
  await s3Service.deleteFiles(uploadedKeys); // rollback
  throw new Error('File upload failed');
}
```

**Audit Logger Resilience:**

The `auditLogger.log()` function wraps all DB writes in a try/catch and never throws. The primary operation always completes regardless of audit log failures.

### Frontend Error Handling

- **Reply submission failure**: Inline error message below the reply form; draft message is preserved in the form control
- **Status update failure**: Inline error message; status dropdown reverts to previous value
- **List/detail load failure**: Error banner with retry button
- **File validation**: Client-side pre-validation before API call (count, size, type) with inline error messages

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

#### Reflection: Consolidations Applied

After reviewing all acceptance criteria prework, the following consolidations were made:

1. **Criteria 1.6 (missing API key → 401)** is subsumed by the API key validation property (1.5) — combined into Property 1.
2. **Criteria 2.7 and 2.8** (last_reply_by tracking for staff vs user) are two sides of the same invariant — combined into Property 5.
3. **Criteria 3.3 (MIME rejection → 422)** is the negative case of 3.2 — combined into Property 7.
4. **Criteria 3.5 (size rejection → 413)** is the negative case of 3.4 — combined into Property 8.
5. **Criteria 3.7 (count rejection → 400)** is the negative case of 3.6 — combined into Property 9.
6. **Criteria 3.10 (validation before upload)** is an invariant of Properties 7, 8, 9 — covered by verifying no S3 calls on validation failure.
7. **Criteria 8.3 and 8.4** (FAQ field validation) are the same validation pattern — combined into Property 14.
8. **Criteria 9.7 and 7.7** (audit failure resilience) express the same resilience invariant — combined into Property 16.

---

### Property 1: API Key Validation

*For any* HTTP request to the ticket creation or conversation endpoints, the request SHALL be accepted (pass to the next middleware) if and only if the `X-API-Key` header is present and matches the registered key. Any absent or non-matching key SHALL result in a `401 Unauthorized` response.

**Validates: Requirements 1.5, 1.6**

---

### Property 2: Ticket Creation Returns Required Fields

*For any* valid ticket creation request (all required fields present, within length constraints, valid email), the API SHALL return `201 Created` with a response body containing `ticket_id`, `ticket_name`, and `status: "open"`.

**Validates: Requirements 1.1, 1.8**

---

### Property 3: Ticket Creation Validation

*For any* ticket creation request where one or more required fields are missing, empty, or exceed their maximum length, the API SHALL return `400 Bad Request` and the `errors` array SHALL contain an entry identifying each offending field by name.

**Validates: Requirements 1.3**

---

### Property 4: Conversation Creation on Valid Ticket

*For any* valid conversation reply submitted against an existing, non-resolved, non-closed ticket, the API SHALL return `201 Created` and the new `Conversation_Entry` SHALL be retrievable via the ticket detail endpoint.

**Validates: Requirements 2.1**

---

### Property 5: Last Reply Tracking Invariant

*For any* conversation reply submitted on any ticket, after the reply is created, the ticket's `last_reply_by` field SHALL equal the `sender_type` of the submitted reply (`"user"` or `"staff"`), and `last_replied_at` SHALL be a timestamp greater than or equal to the ticket's previous `last_replied_at`.

**Validates: Requirements 2.7, 2.8**

---

### Property 6: Conversation Ordering

*For any* ticket with N conversation entries (N ≥ 1), the ticket detail endpoint SHALL return all N entries ordered by `created_at` ascending, such that for every adjacent pair `(entries[i], entries[i+1])`, `entries[i].created_at ≤ entries[i+1].created_at`.

**Validates: Requirements 2.5**

---

### Property 7: File MIME Type Validation

*For any* conversation reply request containing at least one file whose MIME type is not in the accepted list, the API SHALL return `422 Unprocessable Entity` and SHALL NOT invoke any S3 upload operation.

**Validates: Requirements 3.2, 3.3, 3.10**

---

### Property 8: File Size Validation

*For any* conversation reply request containing at least one file whose size exceeds 10 MB, the API SHALL return `413 Payload Too Large` and SHALL NOT invoke any S3 upload operation.

**Validates: Requirements 3.4, 3.5, 3.10**

---

### Property 9: File Count Validation

*For any* conversation reply request containing more than 5 files, the API SHALL return `400 Bad Request` with the message "Maximum 5 attachments per message" and SHALL NOT invoke any S3 upload operation.

**Validates: Requirements 3.6, 3.7, 3.10**

---

### Property 10: Attachment Metadata Round-Trip

*For any* conversation reply submitted with N valid files (1 ≤ N ≤ 5), after the reply is created, retrieving the conversation entry SHALL return an `attachments` array of exactly N objects, each containing an `s3Key` and `originalName` matching the uploaded files.

**Validates: Requirements 3.1, 3.8**

---

### Property 11: S3 Atomic Rollback

*For any* conversation reply request where S3 upload fails after one or more files have already been uploaded, the API SHALL delete all previously uploaded S3 objects, return an error response, and SHALL NOT create a `Conversation_Entry` record.

**Validates: Requirements 3.9**

---

### Property 12: Reply Blocked on Terminal/Near-Terminal Ticket

*For any* ticket with status `resolved` or `closed`, any attempt to add a conversation reply SHALL return `409 Conflict` and SHALL NOT create a new `Conversation_Entry`.

**Validates: Requirements 2.9**

---

### Property 13: Closed Ticket Status Transition Blocked

*For any* ticket with status `closed`, any PATCH request to update the status to any value (including `open`, `in_progress`, `resolved`) SHALL return `409 Conflict` and the ticket status SHALL remain `closed`.

**Validates: Requirements 7.5**

---

### Property 14: FAQ Field Validation

*For any* FAQ create or update request where `question` is empty or exceeds 500 characters, or `answer` is empty or exceeds 5000 characters, the API SHALL return `400 Bad Request` and the `errors` array SHALL identify each offending field by name.

**Validates: Requirements 8.2, 8.3, 8.4, 8.10**

---

### Property 15: FAQ Delete Round-Trip

*For any* existing FAQ entry, after a successful DELETE request, any subsequent GET or PUT request targeting that FAQ's ID SHALL return `404 Not Found`.

**Validates: Requirements 8.6, 8.9**

---

### Property 16: Audit Failure Does Not Block Primary Operations

*For any* ticket creation, conversation reply, status update, or FAQ write operation, if the `audit_logs` write fails (simulated by mocking the DB write to throw), the primary operation SHALL still complete successfully and return its normal success response (`201` or `200`).

**Validates: Requirements 7.7, 9.7**

---

### Property 17: Notification Targeting — Staff Notifications

*For any* new ticket or user reply, the FCM service SHALL send notifications to exactly the set of users who have a non-null `fcm_token`, and the email service SHALL send emails to exactly the set of users with roles `admin`, `superadmin`, or `manager`.

**Validates: Requirements 4.1, 4.2, 5.1, 5.2**

---

### Property 18: Notification Targeting — User Notifications

*For any* staff reply on a ticket where the originating user has a stored `fcm_token`, the FCM service SHALL send a notification to that user's token. If no `fcm_token` is stored, the FCM service SHALL skip the notification and log the absence.

**Validates: Requirements 4.3, 4.4**

---

### Property 19: Pagination Invariant

*For any* paginated list request (tickets or FAQs) with page size `L` and page number `P`, the number of items returned SHALL be at most `L`, and the sum of items across all pages SHALL equal `totalItems`.

**Validates: Requirements 6.5, 8.7**

---

## Testing Strategy

### Dual Testing Approach

This module uses both **unit/example-based tests** and **property-based tests** for comprehensive coverage.

- **Unit tests**: Specific examples, edge cases, error conditions, integration points
- **Property tests**: Universal properties across randomized inputs (19 properties above)
- **Integration tests**: Audit log writes, FCM/SMTP delivery, S3 uploads against real/mocked services

### Property-Based Testing

**Library**: `fast-check` (JavaScript/TypeScript)

**Why fast-check?**
- Native TypeScript support, excellent Jest integration
- Rich built-in generators (strings, records, arrays, UUIDs)
- Automatic shrinking to minimal failing examples
- Active maintenance

**Configuration**: Minimum **100 iterations** per property test.

**Tag format**: `Feature: raise-ticket-module, Property {N}: {property_title}`

**Example property test structure:**

```typescript
import fc from 'fast-check';
import { createTicket } from '../services/ticket.service';

// Feature: raise-ticket-module, Property 3: Ticket Creation Validation
describe('Property 3: Ticket Creation Validation', () => {
  it('returns 400 and identifies every offending field', async () => {
    const allFields = [
      'ticket_name', 'description', 'user_id', 'user_first_name',
      'user_last_name', 'user_email', 'employee_code', 'site_id',
      'site_name', 'page_url'
    ];
    await fc.assert(
      fc.asyncProperty(
        // Generate a non-empty subset of fields to omit
        fc.subarray(allFields, { minLength: 1 }),
        async (fieldsToOmit) => {
          const validPayload = buildValidTicketPayload();
          fieldsToOmit.forEach(f => delete validPayload[f]);
          const result = await createTicket(validPayload, '127.0.0.1');
          expect(result.status).toBe(400);
          const errorFields = result.body.errors.map((e: any) => e.field);
          fieldsToOmit.forEach(f => expect(errorFields).toContain(f));
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

```typescript
// Feature: raise-ticket-module, Property 6: Conversation Ordering
describe('Property 6: Conversation Ordering', () => {
  it('returns conversations ordered by created_at ascending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (numReplies) => {
          const ticket = await createTestTicket();
          for (let i = 0; i < numReplies; i++) {
            await addTestConversation(ticket.id, `Message ${i}`);
          }
          const detail = await getTicketById(ticket.id);
          const timestamps = detail.conversations.map((c: any) =>
            new Date(c.created_at).getTime()
          );
          for (let i = 1; i < timestamps.length; i++) {
            expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

```typescript
// Feature: raise-ticket-module, Property 10: Attachment Metadata Round-Trip
describe('Property 10: Attachment Metadata Round-Trip', () => {
  it('stores s3Key and originalName for every uploaded file', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (fileCount) => {
          const files = buildValidFiles(fileCount);
          const ticket = await createTestTicket();
          const conv = await addConversationWithFiles(ticket.id, files);
          expect(conv.attachments).toHaveLength(fileCount);
          conv.attachments.forEach((att: any, i: number) => {
            expect(att.s3Key).toBeTruthy();
            expect(att.originalName).toBe(files[i].originalname);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

**Backend Unit Tests (Jest):**

1. **Validator Tests** — test each field constraint (required, maxLength, email format, enum values) with boundary values
2. **Controller Tests** — mock service layer, verify HTTP status codes and response shapes
3. **Service Tests** — mock DB and external services, verify business logic (status transitions, last_reply_by updates, S3 rollback)
4. **Middleware Tests** — API key validation (present/absent/wrong), JWT auth, role authorization

**Frontend Unit Tests (Jasmine/Karma):**

1. **Service Tests** — mock HttpClient, verify BehaviorSubject state updates
2. **Component Tests** — verify rendering, form validation, debounce behavior (300ms), error display, file selection limits
3. **Guard Tests** — verify role-based redirect behavior

### Integration Tests

1. **Audit Log Writes** — create ticket/conversation/FAQ, query `audit_logs`, verify entries exist with correct `action`, `ip_address`, and `details`
2. **S3 Upload** — upload valid files, verify S3 objects exist; upload invalid files, verify no S3 objects created
3. **FCM Delivery** — mock Firebase Admin SDK, verify `sendMulticast` called with correct tokens and payload
4. **SMTP Delivery** — mock Nodemailer transport, verify `sendMail` called with correct recipients and subject

### Smoke Tests

1. **Database Migration** — verify `tickets`, `ticket_conversations`, `faqs` tables exist with correct columns, constraints, and indexes after migration
2. **FCM Token Column** — verify `users.fcm_token` column exists
3. **Trigger Verification** — verify `update_updated_at_column()` triggers are attached to all three new tables

### Test File Locations

```
Backend:
  src/
    __tests__/
      ticket.validator.test.js
      ticket.controller.test.js
      ticket.service.test.js
      faq.controller.test.js
      faq.service.test.js
      apiKey.middleware.test.js
      s3.service.test.js
      fcm.service.test.js
      email.service.test.js
      auditLogger.test.js
      properties/
        ticket-creation.property.test.js
        conversation.property.test.js
        file-upload.property.test.js
        status-management.property.test.js
        faq.property.test.js
        notifications.property.test.js
        audit-resilience.property.test.js

Frontend:
  src/app/features/tickets/
    __tests__/
      ticket.service.spec.ts
      faq.service.spec.ts
      ticket-list.component.spec.ts
      ticket-detail.component.spec.ts
      faq.component.spec.ts
```
