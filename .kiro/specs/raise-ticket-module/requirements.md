# Requirements Document

## Introduction

The Raise Ticket module is a cross-system integration feature that connects Ramiscope (the main client software) with the Project Management System (PMS). Ramiscope users can raise support tickets via a dedicated API, and PMS staff can manage, respond to, and resolve those tickets through a purpose-built interface within the PMS. The module includes a threaded conversation system, file attachments via AWS S3, real-time push notifications via Firebase, automated email alerts, and a standalone FAQ management page.

---

## Glossary

- **Ramiscope**: The main client-facing software that initiates ticket creation by calling the PMS API.
- **PMS**: The Project Management System — hosts the ticket API, stores all ticket data, and provides the staff-facing management interface.
- **Ticket_API**: The REST API endpoint hosted by the PMS that accepts ticket creation requests from Ramiscope.
- **Ticket**: A support request raised by a Ramiscope user, stored in the `tickets` table.
- **Conversation_Entry**: A single message or reply within a ticket thread, stored in the `ticket_conversations` table.
- **Attachment**: A file (screenshot or document) uploaded to AWS S3 and linked to a Conversation_Entry.
- **Staff**: A PMS user with the role of `admin`, `superadmin`, or `manager` who manages and replies to tickets.
- **Ramiscope_User**: An external user of Ramiscope identified by user ID, first name, last name, employee code, and email address.
- **Site**: A client site associated with a Ramiscope_User, identified by site ID and site name.
- **Notification_Service**: The combined Firebase and email notification subsystem.
- **Firebase_Service**: The Firebase Cloud Messaging integration responsible for real-time push notifications.
- **Email_Service**: The automated email notification subsystem that sends alerts on ticket and conversation events.
- **FAQ_Manager**: The PMS interface for staff to create and manage FAQ entries.
- **FAQ_Entry**: A single question-and-answer record stored for Ramiscope user reference.
- **Audit_Logger**: The system component that records IP address and timestamp for every database write operation.
- **FCM_Token**: A Firebase Cloud Messaging device registration token stored per user to enable push notification delivery.

---

## Requirements

### Requirement 1: Ticket Creation via API

**User Story:** As a Ramiscope user, I want to raise a support ticket by calling an API, so that my issue is logged in the PMS and staff can assist me.

#### Acceptance Criteria

1. WHEN a POST request is received at the ticket creation endpoint with a valid JSON body, THE Ticket_API SHALL create a new Ticket record and return a `201 Created` response containing the ticket ID and ticket name.
2. THE Ticket_API SHALL accept the following fields in the request body: `ticket_name` (string, required, max 255 characters), `description` (string, required, max 5000 characters), `user_id` (string, required, max 255 characters), `user_first_name` (string, required, max 255 characters), `user_last_name` (string, required, max 255 characters), `user_email` (string, required, valid email format, max 255 characters), `employee_code` (string, required, max 255 characters), `site_id` (string, required, max 255 characters), `site_name` (string, required, max 255 characters), and `page_url` (string, required, max 2048 characters).
3. IF any required field is missing, empty, or exceeds its maximum length in the request body, THEN THE Ticket_API SHALL return a `400 Bad Request` response with an error message identifying each offending field by name, even when the JSON structure is otherwise valid.
4. IF the request body is not valid JSON, THEN THE Ticket_API SHALL return a `400 Bad Request` response with the message "Invalid JSON payload".
5. THE Ticket_API SHALL accept requests authenticated with a valid API key supplied in the `X-API-Key` request header, where a valid API key is a non-empty string matching a key that is registered and active in the system.
6. IF the `X-API-Key` header is absent or contains an invalid key, THEN THE Ticket_API SHALL return a `401 Unauthorized` response.
7. WHEN a Ticket is created, THE Audit_Logger SHALL record the IP address of the server that handled the request and the creation timestamp against the new Ticket record.
8. WHEN a Ticket is successfully created, THE Ticket_API SHALL assign the ticket a status of `open`.
9. IF the PMS database is unavailable when a ticket creation request is received, THEN THE Ticket_API SHALL return a `503 Service Unavailable` response and SHALL NOT create a partial Ticket record.

---

### Requirement 2: Ticket Conversation System

**User Story:** As a Ramiscope user or PMS staff member, I want to exchange threaded messages on a ticket, so that we can communicate back and forth until the issue is resolved.

#### Acceptance Criteria

1. WHEN a reply is submitted on an existing ticket, THE Ticket_API SHALL create a new Conversation_Entry linked to that ticket and return a `201 Created` response.
2. THE Ticket_API SHALL accept the following fields for a conversation reply: `ticket_id` (UUID, required), `sender_type` (enum: `user` or `staff`, required), `sender_id` (string, required, max 255 characters), and `message` (string, required, minimum 1 character, maximum 5000 characters).
3. IF `ticket_id` does not correspond to an existing ticket, THEN THE Ticket_API SHALL return a `404 Not Found` response.
4. IF any required field (`message`, `sender_type`, `sender_id`) is missing, empty, invalid, or `message` exceeds 5000 characters, THEN THE Ticket_API SHALL return a `400 Bad Request` response identifying each offending field by name.
5. WHEN the ticket detail endpoint is called for an existing ticket, THE Ticket_API SHALL return all Conversation_Entries for that ticket ordered by `created_at` ascending.
6. WHEN a Conversation_Entry is created, THE Audit_Logger SHALL record the IP address of the requesting client and the creation timestamp against the new Conversation_Entry record.
7. WHEN a staff member submits a reply, THE Ticket_API SHALL update the ticket's `last_replied_at` timestamp and set `last_reply_by` to `staff`.
8. WHEN a Ramiscope user submits a reply, THE Ticket_API SHALL update the ticket's `last_replied_at` timestamp and set `last_reply_by` to `user`.
9. IF a reply is submitted on a ticket with status `resolved` or `closed`, THEN THE Ticket_API SHALL return a `409 Conflict` response and SHALL NOT create a new Conversation_Entry.

---

### Requirement 3: File Attachments

**User Story:** As a Ramiscope user or PMS staff member, I want to attach screenshots and documents to a conversation message, so that I can provide visual evidence or supporting files.

#### Acceptance Criteria

1. WHEN a file is uploaded alongside a conversation reply, THE Ticket_API SHALL upload the file to the configured AWS S3 bucket and store the resulting S3 object key and original filename in the Conversation_Entry's attachment metadata.
2. THE Ticket_API SHALL accept the following file MIME types for upload: `image/jpeg`, `image/png`, `image/gif`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
3. IF an uploaded file's MIME type is not in the accepted list, THEN THE Ticket_API SHALL return a `422 Unprocessable Entity` response with the message "Unsupported file type" and SHALL NOT upload any files from the request.
4. THE Ticket_API SHALL enforce a maximum file size of 10 MB per individual file upload.
5. IF any uploaded file in the request exceeds 10 MB, THEN THE Ticket_API SHALL return a `413 Payload Too Large` response and SHALL NOT upload any files from the request.
6. THE Ticket_API SHALL support uploading a maximum of 5 files per Conversation_Entry.
7. IF more than 5 files are submitted in a single request, THEN THE Ticket_API SHALL return a `400 Bad Request` response with the message "Maximum 5 attachments per message".
8. WHEN a file is successfully uploaded to S3, THE Ticket_API SHALL store the S3 object key and the original filename in the Conversation_Entry's attachment metadata as a JSONB array.
9. IF any S3 upload fails after one or more files have already been uploaded, THEN THE Ticket_API SHALL delete all already-uploaded S3 objects for that request, return an error response indicating an upload failure, and SHALL NOT create the Conversation_Entry record.
10. THE Ticket_API SHALL perform all file type and size validation before initiating any S3 upload attempt.
11. WHEN a conversation reply is submitted with no attached files, THE Ticket_API SHALL treat the request as valid and create the Conversation_Entry with an empty attachments array.

---

### Requirement 4: Firebase Push Notifications

**User Story:** As a Ramiscope user or PMS staff member, I want to receive real-time push notifications when a ticket is created or a reply is posted, so that I am immediately aware of new activity.

#### Acceptance Criteria

1. WHEN a new Ticket is created, THE Firebase_Service SHALL asynchronously send a push notification to all staff users who have a stored FCM device token.
2. WHEN a new Conversation_Entry is created by a Ramiscope user, THE Firebase_Service SHALL asynchronously send a push notification to all staff users who have a stored FCM device token, regardless of whether any staff member has been assigned to the ticket.
3. WHEN a new Conversation_Entry is created by a staff member AND the originating Ramiscope user has a stored FCM device token, THE Firebase_Service SHALL asynchronously send a push notification to that user's registered device using the stored FCM token.
4. IF the originating Ramiscope user has no stored FCM device token when a staff reply is created, THEN THE Firebase_Service SHALL skip the push notification for that user and log the absence in the `audit_logs` table.
5. THE Firebase_Service SHALL use the office-provided Firebase credentials JSON to authenticate with Firebase Cloud Messaging.
6. IF the Firebase_Service fails to deliver a notification due to an FCM error, THE Ticket_API SHALL log the failure in the `audit_logs` table and SHALL NOT block the ticket or conversation creation response.
7. THE Firebase_Service SHALL include the `ticket_id`, `ticket_name`, and a human-readable summary message (maximum 200 characters) in the notification payload.

---

### Requirement 5: Email Notifications

**User Story:** As a Ramiscope user or PMS staff member, I want to receive an email alert for every ticket creation and every conversation reply, so that I have a persistent record of all ticket activity.

#### Acceptance Criteria

1. WHEN a new Ticket is created, THE Email_Service SHALL send an email notification to all staff members with the role `admin`, `superadmin`, or `manager`.
2. WHEN a new Conversation_Entry is created by a Ramiscope user, THE Email_Service SHALL send an email notification to all staff members with the role `admin`, `superadmin`, or `manager`.
3. WHEN a new Conversation_Entry is created by a staff member, THE Email_Service SHALL send an email notification to the `user_email` address stored on the Ticket record.
4. IF the Email_Service fails to send an email to the Ramiscope user, THE Ticket_API SHALL log the failure in the `audit_logs` table and SHALL NOT block the Conversation_Entry creation.
5. THE Email_Service SHALL include the ticket name, ticket ID, sender name, a subject line identifying the ticket (e.g., "New reply on ticket: [ticket_name]"), and a message preview (first 200 characters of the message body) in every notification email.
6. IF the Email_Service fails to send an email or is completely unavailable, THE Ticket_API SHALL log the failure in the `audit_logs` table and SHALL NOT block the ticket or conversation creation response.
7. THE Email_Service SHALL send emails using an SMTP configuration defined in the PMS environment variables.

---

### Requirement 6: PMS Staff Ticket Management Interface

**User Story:** As a PMS staff member, I want a dedicated interface within the PMS to view all tickets and reply to them, so that I can efficiently manage and resolve user issues.

#### Acceptance Criteria

1. THE PMS SHALL provide a ticket listing page accessible only to authenticated users with the role `admin`, `superadmin`, or `manager`; users without these roles SHALL be redirected to an unauthorized page.
2. THE PMS ticket listing page SHALL display the following columns for each ticket: ticket name, Ramiscope user full name, site name, status, creation date, and last reply date.
3. WHEN a staff member selects a status filter on the ticket listing page, THE PMS SHALL display only tickets matching the selected status (`open`, `in_progress`, `resolved`, or `closed`).
4. THE PMS ticket listing page SHALL support searching tickets by ticket name or Ramiscope user name, with results updating within 300 milliseconds of the last keystroke using a debounced input.
5. THE PMS ticket listing page SHALL support pagination with a default page size of 20 tickets per page; staff members SHALL be able to change the page size to 10, 20, or 50 tickets per page.
6. WHEN a staff member clicks on a ticket in the listing, THE PMS SHALL navigate to the ticket detail page displaying the full conversation thread ordered by `created_at` ascending.
7. THE PMS ticket detail page SHALL display each Conversation_Entry with the sender name, sender type (user or staff), message content, attachment download links, and timestamp.
8. THE PMS ticket detail page SHALL provide a reply form allowing staff to submit a text message and optionally attach up to 5 files.
9. WHEN a staff member submits a reply, THE PMS SHALL call the Ticket_API conversation endpoint and, on success, append the new Conversation_Entry to the thread without a full page reload.
10. IF the reply submission API call fails, THE PMS SHALL display an inline error message and retain the draft message content in the reply form.
11. WHEN a staff member selects a new status from the status dropdown on the ticket detail page, THE PMS SHALL call the Ticket_API status endpoint to persist the change and update the displayed status on success.
12. IF the status update API call fails, THE PMS SHALL display an inline error message and revert the status dropdown to its previous value.

---

### Requirement 7: Ticket Status Management

**User Story:** As a PMS staff member, I want to update the status of a ticket, so that I can track the resolution lifecycle of each issue.

#### Acceptance Criteria

1. THE Ticket_API SHALL support the following ticket statuses: `open`, `in_progress`, `resolved`, `closed`.
2. WHEN a PATCH request is received at the ticket status endpoint with a valid `status` value and an existing `ticket_id`, THE Ticket_API SHALL update the ticket status and return a `200 OK` response containing the updated ticket ID and new status.
3. IF the provided `status` value is not one of the four valid statuses, THEN THE Ticket_API SHALL return a `400 Bad Request` response.
4. IF the ticket ID in the PATCH request does not correspond to an existing ticket, THEN THE Ticket_API SHALL return a `404 Not Found` response before validating the status value.
5. IF a PATCH request attempts to transition a ticket from `closed` to any other status, THEN THE Ticket_API SHALL return a `409 Conflict` response and SHALL NOT update the ticket status.
6. WHEN a ticket status is updated, THE Audit_Logger SHALL record the requester's IP address, the previous status value, the new status value, and the UTC timestamp of the change in the `audit_logs` table.
7. WHEN a ticket status is updated, the status update SHALL succeed and return `200 OK` even if the Audit_Logger write to `audit_logs` fails.

---

### Requirement 8: FAQ Management

**User Story:** As a PMS staff member, I want to create and manage FAQ entries, so that Ramiscope users have a self-service reference for common questions.

#### Acceptance Criteria

1. THE FAQ_Manager SHALL provide a dedicated management page within the PMS accessible only to users with the role `admin` or `superadmin`.
2. WHEN a staff member submits a new FAQ entry with a non-empty `question` (maximum 500 characters) and non-empty `answer` (maximum 5000 characters), THE FAQ_Manager SHALL persist the entry and return a `201 Created` response.
3. IF `question` is empty or exceeds 500 characters, THEN THE FAQ_Manager SHALL return a `400 Bad Request` response identifying the `question` field.
4. IF `answer` is empty or exceeds 5000 characters, THEN THE FAQ_Manager SHALL return a `400 Bad Request` response identifying the `answer` field.
5. WHEN a staff member submits an edit to an existing FAQ entry, THE FAQ_Manager SHALL validate the updated `question` and `answer` fields against the same length constraints as creation and, if valid, persist the changes and return a `200 OK` response.
6. WHEN a staff member deletes an existing FAQ entry, THE FAQ_Manager SHALL permanently remove the record from the database and return a `200 OK` response.
7. THE FAQ_Manager SHALL display all FAQ entries in a paginated list with 20 entries per page by default.
8. WHEN an FAQ entry is created, updated, or deleted, THE Audit_Logger SHALL record the staff member's user ID and role, the system IP address, and the UTC timestamp of the operation in the `audit_logs` table.
9. IF an edit or delete request targets a non-existent FAQ entry ID, THEN THE FAQ_Manager SHALL return a `404 Not Found` response.
10. IF an edit request provides a `question` or `answer` that is empty or exceeds its maximum length, THEN THE FAQ_Manager SHALL return a `400 Bad Request` response identifying each offending field by name.

---

### Requirement 9: Audit Tracking

**User Story:** As a system administrator, I want every database write operation in the ticket module to record the system IP and timestamp, so that I have a complete audit trail for compliance and debugging.

#### Acceptance Criteria

1. WHEN a record is inserted into the `tickets` table, THE Audit_Logger SHALL write an entry to the `audit_logs` table containing the server IP address and the UTC creation timestamp.
2. WHEN a record is inserted into the `ticket_conversations` table, THE Audit_Logger SHALL write an entry to the `audit_logs` table containing the requesting client's IP address and the UTC creation timestamp.
3. WHEN a record in the `tickets` table is updated, THE Audit_Logger SHALL write an entry to the `audit_logs` table containing the server IP address, the UTC timestamp of the change, and for each modified field: the field name, the previous value, and the new value.
4. WHEN a record is inserted into the `faqs` table, THE Audit_Logger SHALL write an entry to the `audit_logs` table containing the server IP address and the UTC creation timestamp.
5. WHEN a record in the `faqs` table is updated or deleted, THE Audit_Logger SHALL write an entry to the `audit_logs` table containing the server IP address, the UTC timestamp of the operation, and for each modified field: the field name, the previous value, and the new value.
6. THE Audit_Logger SHALL write entries to the existing `audit_logs` table for all significant ticket module events: ticket created, conversation reply added, ticket status changed, FAQ entry created, FAQ entry updated, FAQ entry deleted, Firebase notification failure, and email notification failure.
7. IF the Audit_Logger fails to write to the `audit_logs` table, THE primary operation (ticket creation, reply, status update, FAQ write) SHALL still complete successfully and return its normal success response.

---

### Requirement 10: Database Architecture

**User Story:** As a backend developer, I want the ticket data split across a lightweight main table and a conversation detail table, so that ticket listing queries remain performant even at high volume.

#### Acceptance Criteria

1. THE PMS database SHALL contain a `tickets` table with the following columns and constraints: `id` (UUID, primary key, default `uuid_generate_v4()`), `ticket_name` (VARCHAR(255), NOT NULL), `description` (TEXT, NOT NULL), `user_id` (VARCHAR(255), NOT NULL), `user_first_name` (VARCHAR(255), NOT NULL), `user_last_name` (VARCHAR(255), NOT NULL), `user_email` (VARCHAR(255), NOT NULL), `employee_code` (VARCHAR(255), NOT NULL), `site_id` (VARCHAR(255), NOT NULL), `site_name` (VARCHAR(255), NOT NULL), `page_url` (VARCHAR(2048), NOT NULL), `status` (VARCHAR(20), NOT NULL, DEFAULT `open`, CHECK IN (`open`, `in_progress`, `resolved`, `closed`)), `last_reply_by` (VARCHAR(10), CHECK IN (`user`, `staff`)), `last_replied_at` (TIMESTAMP WITH TIME ZONE), `system_ip` (INET, NOT NULL), `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT CURRENT_TIMESTAMP), `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT CURRENT_TIMESTAMP).
2. THE PMS database SHALL contain a `ticket_conversations` table with the following columns and constraints: `id` (UUID, primary key, default `uuid_generate_v4()`), `ticket_id` (UUID, NOT NULL, foreign key referencing `tickets(id)` ON DELETE CASCADE), `sender_type` (VARCHAR(10), NOT NULL, CHECK IN (`user`, `staff`)), `sender_id` (VARCHAR(255), NOT NULL), `message` (TEXT, NOT NULL, CHECK `char_length(message) >= 1 AND char_length(message) <= 5000`), `attachments` (JSONB, DEFAULT `[]`), `system_ip` (INET, NOT NULL), `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT CURRENT_TIMESTAMP), `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT CURRENT_TIMESTAMP).
3. THE `ticket_conversations` table SHALL have a foreign key constraint on `ticket_id` referencing `tickets(id)` with `ON DELETE CASCADE`.
4. THE PMS database SHALL contain a `faqs` table with the following columns and constraints: `id` (UUID, primary key, default `uuid_generate_v4()`), `question` (VARCHAR(500), NOT NULL), `answer` (TEXT, NOT NULL, CHECK `char_length(answer) <= 5000`), `system_ip` (INET, NOT NULL), `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT CURRENT_TIMESTAMP), `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT CURRENT_TIMESTAMP).
5. THE `tickets` table SHALL have indexes on `status`, `created_at`, and `user_id` to support listing and filtering queries.
6. THE `ticket_conversations` table SHALL have an index on `ticket_id` to support efficient conversation retrieval.
7. WHEN a record is updated in the `tickets`, `ticket_conversations`, or `faqs` table, THE PMS database SHALL automatically update the `updated_at` column using a BEFORE UPDATE trigger that calls the existing `update_updated_at_column()` function.
