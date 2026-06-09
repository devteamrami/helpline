# Implementation Plan: Raise Ticket Module

## Overview

Implement the Raise Ticket module as a cross-system integration between Ramiscope and the PMS. The backend is Node.js/Express with PostgreSQL, AWS S3, Firebase FCM, and Nodemailer. The frontend is Angular 21.2.0 with standalone components and Angular Material. Implementation proceeds from database layer upward through services, controllers, routes, and finally the Angular UI.

## Tasks

- [ ] 1. Database migration and environment configuration
  - [x] 1.1 Write and apply the database migration SQL
    - Create `src/database/migrations/raise_ticket_module.sql` with the full migration from the design
    - Add `fcm_token VARCHAR(500)` column to `users` table via `ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(500)`
    - Create `tickets` table with all columns, CHECK constraints, indexes, and `update_tickets_updated_at` trigger
    - Create `ticket_conversations` table with FK to `tickets(id) ON DELETE CASCADE`, CHECK constraints, index on `ticket_id`, and trigger
    - Create `faqs` table with CHECK constraint on `answer` length and trigger
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 1.2 Add environment variables for new integrations
    - Append `RAMISCOPE_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`, `FIREBASE_CREDENTIALS_PATH`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` to `.env.example`
    - Document each variable with an inline comment
    - _Requirements: 1.5_

- [x] 2. Backend middleware and validators
  - [x] 2.1 Implement API key authentication middleware
    - Create `src/middleware/apiKey.middleware.js`
    - Read `X-API-Key` header; compare against `process.env.RAMISCOPE_API_KEY`
    - Return `401 { success: false, message: 'Unauthorized' }` on absent or non-matching key; call `next()` on match
    - _Requirements: 1.5, 1.6_

  - [ ]* 2.2 Write property test for API key validation (Property 1)
    - **Property 1: API Key Validation**
    - **Validates: Requirements 1.5, 1.6**
    - Use `fast-check` to generate arbitrary strings; assert that only the exact registered key passes and all others yield `401`
    - Tag: `Feature: raise-ticket-module, Property 1: API Key Validation`
    - Create `src/__tests__/properties/ticket-creation.property.test.js`

  - [x] 2.3 Implement ticket request validators
    - Create `src/validators/ticket.validator.js`
    - `validateCreateTicket`: check all 10 required fields for presence, non-empty, and max-length; validate `user_email` format
    - `validateAddConversation`: check `sender_type` enum (`user`|`staff`), `sender_id` presence/length, `message` 1–5000 chars
    - `validateUpdateStatus`: check `status` is one of `open`, `in_progress`, `resolved`, `closed`
    - Return structured `errors` array `[{ field, message }]` matching the design error format
    - _Requirements: 1.2, 1.3, 2.2, 2.4, 7.3_

  - [ ]* 2.4 Write property test for ticket creation validation (Property 3)
    - **Property 3: Ticket Creation Validation**
    - **Validates: Requirements 1.3**
    - Use `fc.subarray` over all 10 required field names; omit each subset; assert `400` and that `errors` contains each omitted field
    - Tag: `Feature: raise-ticket-module, Property 3: Ticket Creation Validation`

  - [x] 2.5 Implement FAQ request validator
    - Create `src/validators/faq.validator.js`
    - `validateCreateFaq` and `validateUpdateFaq`: check `question` non-empty ≤ 500 chars, `answer` non-empty ≤ 5000 chars
    - Return structured `errors` array
    - _Requirements: 8.2, 8.3, 8.4, 8.10_

  - [ ]* 2.6 Write property test for FAQ field validation (Property 14)
    - **Property 14: FAQ Field Validation**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.10**
    - Generate `question` strings of length 0 or > 500 and `answer` strings of length 0 or > 5000; assert `400` with correct field names in `errors`
    - Tag: `Feature: raise-ticket-module, Property 14: FAQ Field Validation`
    - Create `src/__tests__/properties/faq.property.test.js`

- [x] 3. Backend utility services
  - [x] 3.1 Implement AuditLogger utility
    - Create `src/utils/auditLogger.js`
    - Export `async log({ action, resource, userId, ipAddress, details })` that inserts into `audit_logs` using a parameterized query
    - Wrap the entire function body in try/catch; swallow all errors and `console.error` them — never throw
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 3.2 Write property test for audit failure resilience (Property 16)
    - **Property 16: Audit Failure Does Not Block Primary Operations**
    - **Validates: Requirements 7.7, 9.7**
    - Mock the DB write inside `auditLogger` to throw; assert that `createTicket`, `addConversation`, `updateTicketStatus`, and FAQ writes still return their normal success responses
    - Tag: `Feature: raise-ticket-module, Property 16: Audit Failure Does Not Block Primary Operations`
    - Create `src/__tests__/properties/audit-resilience.property.test.js`

  - [x] 3.3 Implement S3 Service
    - Create `src/services/s3.service.js`
    - `validateFiles(files)`: check count ≤ 5, each size ≤ 10 MB, each MIME type in the accepted list; throw typed errors with correct HTTP status codes
    - `uploadFiles(files, ticketId, conversationId)`: upload each file to `tickets/{ticketId}/conversations/{conversationId}/{uuid}-{originalName}`; collect uploaded keys; on any failure call `deleteFiles(uploadedKeys)` then re-throw
    - `deleteFiles(s3Keys)`: delete each key from S3; swallow individual errors
    - _Requirements: 3.1, 3.2, 3.4, 3.6, 3.8, 3.9, 3.10_

  - [ ]* 3.4 Write property tests for file validation (Properties 7, 8, 9)
    - **Property 7: File MIME Type Validation** — Validates: Requirements 3.2, 3.3, 3.10
    - **Property 8: File Size Validation** — Validates: Requirements 3.4, 3.5, 3.10
    - **Property 9: File Count Validation** — Validates: Requirements 3.6, 3.7, 3.10
    - Generate files with invalid MIME types, oversized files, and arrays of > 5 files; assert correct status codes and no S3 calls
    - Tag: `Feature: raise-ticket-module, Property 7/8/9: File Validation`
    - Create `src/__tests__/properties/file-upload.property.test.js`

  - [x] 3.5 Implement FCM Service
    - Create `src/services/fcm.service.js`
    - Initialize Firebase Admin SDK from `process.env.FIREBASE_CREDENTIALS_PATH`
    - `notifyAllStaff(payload)`: query all users with non-null `fcm_token`; call `firebase.messaging().sendEachForMulticast()`; on failure call `auditLogger.log({ action: 'fcm_notification_failure', ... })`
    - `notifyUser(fcmToken, payload)`: send to single token; on failure log to audit
    - All sends are fire-and-forget (never awaited by callers)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 3.6 Write property test for notification targeting (Properties 17, 18)
    - **Property 17: Notification Targeting — Staff Notifications** — Validates: Requirements 4.1, 4.2, 5.1, 5.2
    - **Property 18: Notification Targeting — User Notifications** — Validates: Requirements 4.3, 4.4
    - Mock Firebase Admin and Nodemailer; generate user sets with varying `fcm_token` presence and roles; assert correct targeting
    - Tag: `Feature: raise-ticket-module, Property 17/18: Notification Targeting`
    - Create `src/__tests__/properties/notifications.property.test.js`

  - [x] 3.7 Implement Email Service
    - Create `src/services/email.service.js`
    - Initialize Nodemailer transport from `SMTP_*` env vars
    - `notifyStaffNewTicket(ticket)`: query staff with roles `admin`, `superadmin`, `manager`; send email with ticket name, ID, and description preview (first 200 chars)
    - `notifyStaffNewReply(ticket, conversation)`: same recipients; subject `New reply on ticket: [ticket_name]`
    - `notifyUserStaffReply(ticket, conversation)`: send to `ticket.user_email`; on failure log to audit
    - All sends are fire-and-forget
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 4. Backend Ticket Service and FAQ Service
  - [x] 4.1 Implement TicketService
    - Create `src/services/ticket.service.js`
    - `createTicket(data, systemIp)`: INSERT into `tickets`; call `auditLogger.log`; fire-and-forget `notifyAsync` (FCM + email to staff); return created ticket
    - `addConversation(ticketId, data, files, systemIp)`: check ticket exists and status not `resolved`/`closed` (throw `409`); call `s3Service.validateFiles` then `s3Service.uploadFiles`; INSERT into `ticket_conversations`; UPDATE `tickets` SET `last_reply_by`, `last_replied_at`; call `auditLogger.log`; fire-and-forget notifications based on `sender_type`; return conversation entry
    - `getTickets(params)`: paginated SELECT with optional `status` filter and `ILIKE` search on `ticket_name` and user name fields
    - `getTicketById(id)`: SELECT ticket + JOIN conversations ORDER BY `created_at ASC`; throw `404` if not found
    - `updateTicketStatus(id, status, userId, systemIp)`: check ticket exists; check current status not `closed` (throw `409`); UPDATE; call `auditLogger.log` with old/new status; return updated ticket
    - _Requirements: 1.1, 1.7, 1.8, 1.9, 2.1, 2.3, 2.6, 2.7, 2.8, 2.9, 7.1, 7.2, 7.4, 7.5, 7.6_

  - [ ]* 4.2 Write property test for ticket creation response (Property 2)
    - **Property 2: Ticket Creation Returns Required Fields**
    - **Validates: Requirements 1.1, 1.8**
    - Generate valid ticket payloads with `fc.record`; assert `201`, response contains `id`, `ticket_name`, `status: "open"`
    - Tag: `Feature: raise-ticket-module, Property 2: Ticket Creation Returns Required Fields`

  - [ ]* 4.3 Write property test for last reply tracking (Property 5)
    - **Property 5: Last Reply Tracking Invariant**
    - **Validates: Requirements 2.7, 2.8**
    - Generate `sender_type` as `fc.constantFrom('user', 'staff')`; after reply, assert `last_reply_by === sender_type` and `last_replied_at` is non-decreasing
    - Tag: `Feature: raise-ticket-module, Property 5: Last Reply Tracking Invariant`
    - Create `src/__tests__/properties/conversation.property.test.js`

  - [ ]* 4.4 Write property test for conversation ordering (Property 6)
    - **Property 6: Conversation Ordering**
    - **Validates: Requirements 2.5**
    - Generate `fc.integer({ min: 1, max: 10 })` replies; assert returned conversations are sorted by `created_at` ascending

  - [ ]* 4.5 Write property test for reply blocked on terminal ticket (Property 12)
    - **Property 12: Reply Blocked on Terminal/Near-Terminal Ticket**
    - **Validates: Requirements 2.9**
    - Generate `status` as `fc.constantFrom('resolved', 'closed')`; assert `409` and no new `Conversation_Entry` created
    - Tag: `Feature: raise-ticket-module, Property 12: Reply Blocked on Terminal Ticket`
    - Create `src/__tests__/properties/status-management.property.test.js`

  - [ ]* 4.6 Write property test for closed ticket status transition (Property 13)
    - **Property 13: Closed Ticket Status Transition Blocked**
    - **Validates: Requirements 7.5**
    - Generate target status as `fc.constantFrom('open', 'in_progress', 'resolved', 'closed')`; assert `409` and status remains `closed`

  - [ ]* 4.7 Write property test for conversation creation on valid ticket (Property 4)
    - **Property 4: Conversation Creation on Valid Ticket**
    - **Validates: Requirements 2.1**
    - Generate valid conversation payloads against open/in_progress tickets; assert `201` and entry retrievable via detail endpoint

  - [ ]* 4.8 Write property test for attachment metadata round-trip (Property 10)
    - **Property 10: Attachment Metadata Round-Trip**
    - **Validates: Requirements 3.1, 3.8**
    - Generate `fc.integer({ min: 1, max: 5 })` valid files; assert returned `attachments` array length equals file count and each has `s3Key` and `originalName`

  - [ ]* 4.9 Write property test for S3 atomic rollback (Property 11)
    - **Property 11: S3 Atomic Rollback**
    - **Validates: Requirements 3.9**
    - Mock S3 to fail on the Nth upload; assert all previously uploaded keys are deleted and no `Conversation_Entry` is created

  - [x] 4.10 Implement FAQService
    - Create `src/services/faq.service.js`
    - `getFaqs(params)`: paginated SELECT from `faqs`
    - `createFaq(data, userId, systemIp)`: INSERT; call `auditLogger.log`; return created FAQ
    - `updateFaq(id, data, userId, systemIp)`: check exists (throw `404`); UPDATE; call `auditLogger.log`; return updated FAQ
    - `deleteFaq(id, userId, systemIp)`: check exists (throw `404`); DELETE; call `auditLogger.log`
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [ ]* 4.11 Write property test for FAQ delete round-trip (Property 15)
    - **Property 15: FAQ Delete Round-Trip**
    - **Validates: Requirements 8.6, 8.9**
    - Create FAQ; DELETE; assert subsequent GET and PUT return `404`
    - Tag: `Feature: raise-ticket-module, Property 15: FAQ Delete Round-Trip`

  - [ ]* 4.12 Write property test for pagination invariant (Property 19)
    - **Property 19: Pagination Invariant**
    - **Validates: Requirements 6.5, 8.7**
    - Generate `fc.integer({ min: 1, max: 50 })` page size and `fc.integer({ min: 1, max: 5 })` page number; assert items per page ≤ L and sum across all pages equals `totalItems`
    - Tag: `Feature: raise-ticket-module, Property 19: Pagination Invariant`

- [x] 5. Checkpoint — Backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Backend controllers and routes
  - [x] 6.1 Implement TicketController
    - Create `src/controllers/ticket.controller.js`
    - `createTicket`: extract body + `req.ip`; call `ticketService.createTicket`; return `201`
    - `addConversation`: extract `req.params.id`, body, `req.files`, `req.ip`; call `ticketService.addConversation`; return `201`
    - `getTickets`: extract query params (`page`, `limit`, `status`, `search`); call `ticketService.getTickets`; return `200`
    - `getTicketById`: extract `req.params.id`; call `ticketService.getTicketById`; return `200`
    - `updateTicketStatus`: extract `req.params.id`, `req.body.status`, `req.user.id`, `req.ip`; call `ticketService.updateTicketStatus`; return `200`
    - Map service-thrown errors to correct HTTP status codes (404, 409, 503, 500)
    - _Requirements: 1.1, 1.4, 1.9, 2.1, 2.3, 6.3, 6.5, 7.2, 7.4_

  - [x] 6.2 Implement FAQController
    - Create `src/controllers/faq.controller.js`
    - `getFaqs`, `createFaq`, `updateFaq`, `deleteFaq` — extract params, call FAQService, return correct status codes
    - Map `404` and validation errors to correct responses
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.9_

  - [x] 6.3 Implement ticket routes and wire middleware
    - Create `src/routes/ticket.routes.js`
    - External routes (API key auth): `POST /api/tickets` → `[validateApiKey, validateCreateTicket, ticketController.createTicket]`; `POST /api/tickets/:id/conversations` → `[validateApiKey, multer upload, validateAddConversation, ticketController.addConversation]`
    - Internal routes (JWT auth): `GET /api/tickets` → `[authenticate, authorize(['admin','superadmin','manager']), ticketController.getTickets]`; `GET /api/tickets/:id` → same auth; `PATCH /api/tickets/:id/status` → `[authenticate, authorize(['admin','superadmin','manager']), validateUpdateStatus, ticketController.updateTicketStatus]`
    - Register router in `src/app.js` or main entry file
    - _Requirements: 1.5, 6.1, 7.2_

  - [x] 6.4 Implement FAQ routes and wire middleware
    - Create `src/routes/faq.routes.js`
    - All routes: `[authenticate, authorize(['admin','superadmin'])]` + validator + controller
    - `GET /api/faqs`, `POST /api/faqs`, `PUT /api/faqs/:id`, `DELETE /api/faqs/:id`
    - Register router in main entry file
    - _Requirements: 8.1_

- [x] 7. Checkpoint — Backend API complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend TypeScript models and Angular services
  - [x] 8.1 Create TypeScript models
    - Create `src/app/features/tickets/models/ticket.model.ts`
    - Define and export: `TicketStatus`, `SenderType`, `Ticket`, `Attachment`, `ConversationEntry`, `TicketDetail`, `TicketListParams`, `TicketListResponse`, `Faq`, `CreateFaqRequest`, `UpdateFaqRequest`, `FaqListParams`, `FaqListResponse`
    - _Requirements: 6.2, 6.7_

  - [x] 8.2 Implement Angular TicketService
    - Create `src/app/features/tickets/services/ticket.service.ts` as `@Injectable({ providedIn: 'root' })`
    - Declare `private ticketsSubject = new BehaviorSubject<Ticket[]>([])` and `public tickets$`; `private loadingSubject = new BehaviorSubject<boolean>(false)` and `public loading$`
    - Implement `getTickets(params?)`, `getTicketById(id)`, `addConversation(ticketId, formData)`, `updateTicketStatus(ticketId, status)` using `HttpClient`
    - Update `ticketsSubject` on successful `getTickets` response
    - _Requirements: 6.3, 6.4, 6.5, 6.9, 6.11_

  - [x] 8.3 Implement Angular FaqService
    - Create `src/app/features/tickets/services/faq.service.ts` as `@Injectable({ providedIn: 'root' })`
    - Declare `private faqsSubject = new BehaviorSubject<Faq[]>([])` and `public faqs$`
    - Implement `getFaqs(params?)`, `createFaq(data)`, `updateFaq(id, data)`, `deleteFaq(id)` using `HttpClient`
    - Update `faqsSubject` after each mutating operation
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7_

- [ ] 9. Frontend Angular components
  - [x] 9.1 Implement TicketListComponent
    - Create `src/app/features/tickets/ticket-list/ticket-list.component.ts` as a standalone component
    - Inject `TicketService`; subscribe to `tickets$` and `loading$`
    - Declare `searchControl = new FormControl('')` with `debounceTime(300)` + `distinctUntilChanged()` piped to `getTickets()`
    - Declare `statusFilter = new FormControl('')`; subscribe to value changes to re-fetch
    - Implement pagination: `currentPage`, `pageSize` (default 20, options 10/20/50), `totalItems`; wire to `mat-paginator`
    - Display columns: ticket name, user full name, site name, status, creation date, last reply date using `mat-table`
    - Navigate to `/tickets/:id` on row click
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 9.2 Implement TicketDetailComponent
    - Create `src/app/features/tickets/ticket-detail/ticket-detail.component.ts` as a standalone component
    - Inject `TicketService`; load ticket + conversations on init via `getTicketById(id)`
    - Display conversation thread ordered by `created_at` ascending; show sender name, sender type, message, attachment links, timestamp
    - Implement reply form: `replyControl = new FormControl('', [Validators.required, Validators.maxLength(5000)])`; file input limited to 5 files with client-side MIME/size validation
    - On submit: build `FormData`, call `ticketService.addConversation()`; on success append new entry to thread without reload; on failure set `replyError` and preserve draft
    - Implement status dropdown: on change call `ticketService.updateTicketStatus()`; on failure display inline error and revert dropdown
    - _Requirements: 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12_

  - [x] 9.3 Implement FaqComponent
    - Create `src/app/features/tickets/faq/faq.component.ts` as a standalone component
    - Inject `FaqService`; subscribe to `faqs$`; load FAQs on init
    - Display paginated FAQ list (20 per page) using `mat-table` or `mat-list`
    - Implement inline edit: `isEditing: string | null`; show edit form with `question` and `answer` `FormControl`s when editing
    - Wire create, update, delete buttons to `FaqService` methods; refresh list on success
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7_

- [x] 10. Frontend routing, role guard, and app wiring
  - [x] 10.1 Implement roleGuard function
    - Create `src/app/core/guards/role.guard.ts` exporting `roleGuard(allowedRoles: string[]): CanActivateFn`
    - Inject `AuthService`; check `authService.currentUserValue?.role` against `allowedRoles`
    - Return `true` if role matches; return `router.createUrlTree(['/unauthorized'])` otherwise
    - _Requirements: 6.1, 8.1_

  - [x] 10.2 Add ticket and FAQ routes to the Angular router
    - In `src/app/app.routes.ts` (or the relevant feature routes file), add lazy-loaded or direct routes:
      - `{ path: 'tickets', canActivate: [authGuard, roleGuard(['admin','superadmin','manager'])], component: TicketListComponent }`
      - `{ path: 'tickets/:id', canActivate: [authGuard, roleGuard(['admin','superadmin','manager'])], component: TicketDetailComponent }`
      - `{ path: 'faqs', canActivate: [authGuard, roleGuard(['admin','superadmin'])], component: FaqComponent }`
    - Add navigation links to the sidebar/nav component for staff roles
    - _Requirements: 6.1, 8.1_

- [x] 11. Final checkpoint — Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fast-check` with minimum 100 iterations per property (`{ numRuns: 100 }`)
- Unit tests validate specific examples, edge cases, and error conditions
- The backend follows the existing Controller → Service → Database pattern in the codebase
- All DB queries must use parameterized queries — no string interpolation
- Notification services (FCM, Email) are always fire-and-forget; never `await` them in the request path
- The `auditLogger` must never throw; all errors are swallowed and `console.error`'d
- Frontend components are Angular 21.2.0 standalone components using Angular Material

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.5", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.6", "3.2", "3.3", "3.5", "3.7"] },
    { "id": 3, "tasks": ["3.4", "3.6", "4.1", "4.10"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.11", "4.12"] },
    { "id": 5, "tasks": ["6.1", "6.2", "8.1"] },
    { "id": 6, "tasks": ["6.3", "6.4", "8.2", "8.3"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 8, "tasks": ["10.1"] },
    { "id": 9, "tasks": ["10.2"] }
  ]
}
```
