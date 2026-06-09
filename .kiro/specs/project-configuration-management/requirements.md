# Requirements Document: Project Configuration Management

## Introduction

The Project Configuration Management module provides comprehensive settings and configuration capabilities for projects within the Ramiscope Project Management System. This module enables project administrators to customize project metadata, manage team members and their roles, configure workflows and status transitions, define custom item types and fields, manage sprint settings for Agile development, and control notification preferences. The module supports multi-tenant architecture where each project maintains its own isolated configuration while integrating with the existing JWT-based authentication and role-based access control system.

### Prerequisites

**IMPORTANT**: This module has a dependency on a **User/Member Management module** that does not currently exist in the system. Before implementing Project Member Management features, the following system-level user management capabilities must be available:

1. **List Users API**: Endpoint to retrieve all system users (for adding members to projects)
2. **User Search API**: Endpoint to search users by name, email, or username
3. **User Details API**: Endpoint to get detailed user information
4. **User Management UI**: Angular components to display and search users

The Project Member Management feature will **reference existing system users** and assign them project-specific roles. It will NOT create new user accounts - that functionality belongs to the User/Member Management module.

**Implementation Order**:
1. First: Implement User/Member Management module (separate spec)
2. Then: Implement Project Configuration Management module (this spec)

## Glossary

- **Project_Config_System**: The Project Configuration Management module
- **Project**: A distinct workspace within the system containing work items, members, and settings
- **Project_Admin**: A user with administrative privileges for a specific project (manager, admin, or superadmin role)
- **System_User**: Any authenticated user in the Ramiscope system
- **Work_Item**: A unit of work within a project (Epic, Story, Task, Bug, etc.)
- **Sprint**: A fixed time period (1-4 weeks) during which a development team works to complete specific work items
- **Status_Column**: A workflow state that work items can be in (e.g., To Do, In Progress, Done)
- **Custom_Field**: A project-specific data field that can be added to work items
- **Role_Assignment**: The association of a user with a specific role within a project context
- **Notification_Rule**: A configuration that determines when and how users receive notifications
- **Item_Type**: A category of work item (Epic, Story, Task, Bug, etc.)
- **Status_Transition**: An allowed movement of a work item from one status column to another
- **Project_Member**: A user who has been granted access to a specific project
- **Configuration_Parser**: Component that parses project configuration data from JSON format
- **Configuration_Serializer**: Component that serializes project configuration data to JSON format

## Requirements

### Requirement 1: Project General Settings Management

**User Story:** As a Project Admin, I want to configure general project settings including name, description, visual identity, type, timeline, and status, so that I can properly identify and organize projects within the system.

#### Acceptance Criteria

1. WHEN a Project_Admin creates a new project, THE Project_Config_System SHALL accept a project name between 3 and 100 characters
2. WHEN a Project_Admin provides a project description, THE Project_Config_System SHALL accept descriptions up to 2000 characters
3. THE Project_Config_System SHALL support project types: Software, Operations, Campaign, and Research
4. WHEN a Project_Admin sets a start date, THE Project_Config_System SHALL validate that the start date is not in the future beyond 1 year
5. WHEN a Project_Admin sets a target end date, THE Project_Config_System SHALL validate that the end date is after the start date
6. THE Project_Config_System SHALL support project statuses: Active, On Hold, Completed, and Archived
7. WHEN a Project_Admin selects a project icon, THE Project_Config_System SHALL accept icon identifiers from the Material Icons library
8. WHEN a Project_Admin selects a project color, THE Project_Config_System SHALL validate that the color is a valid hexadecimal color code
9. FOR ALL valid project configuration objects, THE Configuration_Parser SHALL parse JSON configuration into a Project_Config object
10. FOR ALL valid project configuration objects, THE Configuration_Serializer SHALL serialize Project_Config objects into valid JSON
11. FOR ALL valid Project_Config objects, parsing then serializing then parsing SHALL produce an equivalent object (round-trip property)

### Requirement 2: Project Member Management

**User Story:** As a Project Admin, I want to add existing system users as project members and assign them project-specific roles, so that I can control who has access to the project and what they can do.

**Prerequisites:** This requirement depends on the User/Member Management module providing:
- GET /api/v1/users - List all users
- GET /api/v1/users/search?q={query} - Search users
- GET /api/v1/users/:userId - Get user details

#### Acceptance Criteria

1. WHEN a Project_Admin adds a member, THE Project_Config_System SHALL verify the user exists in the System_User table via the User Management API
2. WHEN a Project_Admin searches for users to add, THE Project_Config_System SHALL provide a user search interface that queries the User Management API
3. WHEN a Project_Admin views the add member dialog, THE Project_Config_System SHALL display a searchable list of system users with their names, emails, and current roles
4. WHEN a Project_Admin adds a member, THE Project_Config_System SHALL prevent duplicate member assignments to the same project
5. WHEN a Project_Admin assigns a role to a member, THE Project_Config_System SHALL accept roles: Lead Dev, Sr. Dev, Jr. Dev, Tester, Designer, Product Owner, Scrum Master, and Stakeholder
6. WHEN a Project_Admin removes a member, THE Project_Config_System SHALL remove all role assignments for that member in the project
7. WHEN a Project_Admin sets a default assignee, THE Project_Config_System SHALL verify the user is a current project member
8. THE Project_Config_System SHALL allow a project to have between 1 and 500 members
9. WHEN a member is removed from a project, THE Project_Config_System SHALL preserve audit history of their previous membership
10. WHEN a Project_Admin views the members list, THE Project_Config_System SHALL display member details including: full name, email, project role, system role, and join date
11. WHEN a Project_Admin adds a member, THE Project_Config_System SHALL send a notification to the added user
12. WHEN a user is deactivated at the system level, THE Project_Config_System SHALL automatically mark them as inactive in all project memberships
13. FOR ALL member addition operations, adding a member then removing them then checking membership SHALL return false (idempotence property)

### Requirement 3: Workflow Configuration

**User Story:** As a Project Admin, I want to define custom status columns, allowed status transitions, and done criteria, so that I can model my team's specific workflow process.

#### Acceptance Criteria

1. WHEN a Project_Admin creates a status column, THE Project_Config_System SHALL accept column names between 2 and 50 characters
2. THE Project_Config_System SHALL allow a project to have between 3 and 20 status columns
3. WHEN a Project_Admin defines a status transition, THE Project_Config_System SHALL validate that both source and target status columns exist
4. WHEN a Project_Admin defines a status transition, THE Project_Config_System SHALL prevent circular transitions that would create infinite loops
5. THE Project_Config_System SHALL require at least one status column to be marked as "Done" status
6. WHEN a Project_Admin sets done criteria, THE Project_Config_System SHALL accept criteria text up to 500 characters per status column
7. WHEN a Work_Item attempts to transition status, THE Project_Config_System SHALL verify the transition is allowed in the workflow configuration
8. FOR ALL workflow configurations, THE Project_Config_System SHALL ensure at least one path exists from the initial status to a done status
9. FOR ALL status column names, applying a sort operation then applying it again SHALL produce the same order (idempotence property)

### Requirement 4: Item Type Configuration

**User Story:** As a Project Admin, I want to enable or disable standard item types and create custom item types, so that I can tailor the work item taxonomy to my project's needs.

#### Acceptance Criteria

1. THE Project_Config_System SHALL provide default item types: Epic, Story, Task, Bug, Spike, and Sub-task
2. WHEN a Project_Admin disables an item type, THE Project_Config_System SHALL prevent creation of new work items of that type
3. WHEN a Project_Admin disables an item type, THE Project_Config_System SHALL preserve existing work items of that type
4. WHEN a Project_Admin creates a custom item type, THE Project_Config_System SHALL accept type names between 2 and 50 characters
5. WHEN a Project_Admin creates a custom item type, THE Project_Config_System SHALL validate that the type name is unique within the project
6. THE Project_Config_System SHALL allow a project to have up to 20 total item types (default + custom)
7. WHEN a Project_Admin defines a custom item type, THE Project_Config_System SHALL accept an optional icon identifier and color code
8. FOR ALL item type configurations, enabling then disabling then enabling an item type SHALL result in the same enabled state (idempotence property)

### Requirement 5: Custom Fields Management

**User Story:** As a Project Admin, I want to add project-specific custom fields with role-based visibility controls, so that I can capture additional data relevant to my project while maintaining appropriate access controls.

#### Acceptance Criteria

1. WHEN a Project_Admin creates a custom field, THE Project_Config_System SHALL accept field names between 2 and 100 characters
2. THE Project_Config_System SHALL support custom field types: Text, Number, Date, Dropdown, Multi-select, Checkbox, and URL
3. WHEN a Project_Admin creates a dropdown or multi-select field, THE Project_Config_System SHALL require at least 2 options and allow up to 50 options
4. WHEN a Project_Admin sets field visibility, THE Project_Config_System SHALL accept role-based visibility rules for each project role
5. THE Project_Config_System SHALL allow a project to have up to 50 custom fields
6. WHEN a Project_Admin marks a custom field as required, THE Project_Config_System SHALL enforce the requirement during work item creation
7. WHEN a Project_Admin deletes a custom field, THE Project_Config_System SHALL archive the field data rather than permanently deleting it
8. WHEN a custom field has a default value, THE Project_Config_System SHALL validate that the default value matches the field type
9. FOR ALL custom field configurations with dropdown options, THE Project_Config_System SHALL ensure option values are unique within the field

### Requirement 6: Sprint Configuration

**User Story:** As a Project Admin, I want to configure sprint duration, naming conventions, and auto-creation settings, so that I can establish a consistent Agile iteration cadence for my team.

#### Acceptance Criteria

1. WHEN a Project_Admin sets sprint duration, THE Project_Config_System SHALL accept durations of 1, 2, 3, or 4 weeks
2. WHEN a Project_Admin configures sprint naming, THE Project_Config_System SHALL support naming patterns: Sequential (Sprint 1, Sprint 2), Quarterly (Q1 Sprint 1), and Monthly (Jan Sprint 1)
3. WHEN a Project_Admin enables auto-create next sprint, THE Project_Config_System SHALL automatically create the next sprint when the current sprint ends
4. WHEN a sprint is auto-created, THE Project_Config_System SHALL apply the configured naming convention and duration
5. WHEN a Project_Admin disables sprints, THE Project_Config_System SHALL preserve existing sprint data
6. THE Project_Config_System SHALL validate that sprint start dates do not overlap with existing active sprints
7. WHEN a sprint naming pattern includes date components, THE Project_Config_System SHALL format dates according to ISO 8601 standard
8. FOR ALL sprint configurations, THE Project_Config_System SHALL ensure sprint duration in days equals (weeks × 7)

### Requirement 7: Notification Configuration

**User Story:** As a Project Admin, I want to configure project-level notification rules and digest frequency, so that team members receive relevant updates without being overwhelmed.

#### Acceptance Criteria

1. WHEN a Project_Admin creates a notification rule, THE Project_Config_System SHALL accept rule conditions based on: item type, status change, assignment change, comment added, and due date approaching
2. WHEN a Project_Admin sets notification recipients, THE Project_Config_System SHALL support: assigned user, project members, specific roles, and custom user lists
3. THE Project_Config_System SHALL support notification channels: Email, In-app, and Both
4. WHEN a Project_Admin sets digest frequency, THE Project_Config_System SHALL accept: Real-time, Hourly, Daily, and Weekly
5. THE Project_Config_System SHALL allow a project to have up to 30 notification rules
6. WHEN multiple notification rules match an event, THE Project_Config_System SHALL consolidate notifications to prevent duplicates to the same user
7. WHEN a Project_Admin disables a notification rule, THE Project_Config_System SHALL stop sending notifications for that rule immediately
8. FOR ALL notification rules, THE Project_Config_System SHALL validate that at least one recipient and one channel are specified

### Requirement 8: Configuration Access Control

**User Story:** As a System User, I want configuration changes to be restricted based on my role, so that only authorized users can modify project settings.

#### Acceptance Criteria

1. WHEN a System_User attempts to modify project configuration, THE Project_Config_System SHALL verify the user has manager, admin, or superadmin role
2. WHEN a System_User with developer or viewer role attempts to modify configuration, THE Project_Config_System SHALL deny the request with a 403 Forbidden response
3. WHEN a System_User views project configuration, THE Project_Config_System SHALL allow users with any role to read settings for projects they are members of
4. WHEN a superadmin modifies any project configuration, THE Project_Config_System SHALL allow the modification regardless of project membership
5. THE Project_Config_System SHALL log all configuration changes to the audit_logs table with user_id, action, and timestamp
6. WHEN a Project_Admin attempts to remove themselves as the last admin, THE Project_Config_System SHALL prevent the removal and return an error
7. FOR ALL configuration modification attempts, THE Project_Config_System SHALL validate the JWT token before processing the request

### Requirement 9: Configuration Validation and Integrity

**User Story:** As a Project Admin, I want the system to validate configuration changes and maintain data integrity, so that invalid configurations cannot break project functionality.

#### Acceptance Criteria

1. WHEN a Project_Admin saves configuration changes, THE Project_Config_System SHALL validate all required fields are present
2. WHEN a Project_Admin saves configuration changes, THE Project_Config_System SHALL validate all field values are within acceptable ranges
3. IF a configuration validation fails, THEN THE Project_Config_System SHALL return a detailed error message indicating which field failed and why
4. WHEN a Project_Admin saves configuration changes, THE Project_Config_System SHALL use database transactions to ensure atomicity
5. IF a database transaction fails during configuration save, THEN THE Project_Config_System SHALL rollback all changes and return an error
6. THE Project_Config_System SHALL validate foreign key references (user_id, role_id) exist before saving
7. WHEN a configuration references a deleted entity, THE Project_Config_System SHALL handle the reference gracefully by marking it as inactive
8. FOR ALL configuration save operations, THE Project_Config_System SHALL verify data integrity constraints are satisfied before committing

### Requirement 10: Configuration History and Audit

**User Story:** As a Project Admin, I want to view the history of configuration changes, so that I can track who made changes and when, and potentially revert to previous configurations.

#### Acceptance Criteria

1. WHEN a Project_Admin modifies any configuration setting, THE Project_Config_System SHALL create an audit log entry with timestamp, user_id, and changed fields
2. WHEN a Project_Admin views configuration history, THE Project_Config_System SHALL display changes in reverse chronological order
3. THE Project_Config_System SHALL store configuration snapshots for each change to enable point-in-time recovery
4. WHEN a Project_Admin requests configuration history, THE Project_Config_System SHALL return up to 100 most recent changes with pagination support
5. THE Project_Config_System SHALL retain configuration history for at least 90 days
6. WHEN a Project_Admin views a specific configuration change, THE Project_Config_System SHALL display before and after values for changed fields
7. FOR ALL configuration changes, THE Project_Config_System SHALL include IP address and user agent in the audit log

### Requirement 11: Multi-Tenant Data Isolation

**User Story:** As a System User, I want project configurations to be isolated between projects, so that changes to one project do not affect other projects.

#### Acceptance Criteria

1. WHEN a Project_Admin modifies configuration for Project A, THE Project_Config_System SHALL ensure no changes occur to Project B's configuration
2. THE Project_Config_System SHALL enforce project_id foreign key constraints on all configuration tables
3. WHEN a System_User queries configuration, THE Project_Config_System SHALL filter results by project_id to ensure data isolation
4. WHEN a project is deleted, THE Project_Config_System SHALL cascade delete all associated configuration data
5. THE Project_Config_System SHALL prevent cross-project references in configuration settings
6. FOR ALL configuration queries, THE Project_Config_System SHALL include project_id in the WHERE clause to enforce tenant isolation

### Requirement 12: Configuration Import and Export

**User Story:** As a Project Admin, I want to export project configuration and import it into another project, so that I can replicate successful configurations across multiple projects.

#### Acceptance Criteria

1. WHEN a Project_Admin exports configuration, THE Project_Config_System SHALL generate a JSON file containing all configuration settings
2. WHEN a Project_Admin exports configuration, THE Project_Config_System SHALL exclude sensitive data such as user passwords and tokens
3. WHEN a Project_Admin imports configuration, THE Configuration_Parser SHALL validate the JSON structure before applying changes
4. IF an import validation fails, THEN THE Project_Config_System SHALL return detailed error messages without modifying existing configuration
5. WHEN a Project_Admin imports configuration, THE Project_Config_System SHALL allow selective import of specific configuration sections
6. THE Configuration_Serializer SHALL format exported JSON with proper indentation for human readability
7. FOR ALL valid configuration exports, importing the exported configuration SHALL produce an equivalent project configuration (round-trip property)
8. WHEN configuration contains user references, THE Project_Config_System SHALL map user IDs to usernames in exports and resolve usernames to IDs on import

### Requirement 13: Default Configuration Templates

**User Story:** As a Project Admin, I want to choose from predefined configuration templates when creating a new project, so that I can quickly set up projects with industry-standard workflows.

#### Acceptance Criteria

1. THE Project_Config_System SHALL provide default templates: Scrum, Kanban, Waterfall, and Bug Tracking
2. WHEN a Project_Admin selects a template, THE Project_Config_System SHALL apply the template's status columns, item types, and workflow transitions
3. WHEN a Project_Admin applies a template, THE Project_Config_System SHALL allow customization of the applied configuration
4. THE Project_Config_System SHALL store templates as JSON configuration files that can be parsed by the Configuration_Parser
5. WHEN a new template is added to the system, THE Project_Config_System SHALL validate the template structure before making it available
6. FOR ALL templates, THE Project_Config_System SHALL ensure the template contains at least one path from initial status to done status

### Requirement 14: Configuration Performance and Caching

**User Story:** As a System User, I want configuration data to load quickly, so that I can work efficiently without waiting for settings to load.

#### Acceptance Criteria

1. WHEN a System_User accesses a project, THE Project_Config_System SHALL cache the project configuration in memory
2. WHEN configuration is modified, THE Project_Config_System SHALL invalidate the cache for that project within 5 seconds
3. THE Project_Config_System SHALL respond to configuration read requests within 200 milliseconds for cached data
4. WHEN the cache is empty, THE Project_Config_System SHALL respond to configuration read requests within 1 second
5. THE Project_Config_System SHALL use database indexes on project_id, user_id, and created_at columns for efficient queries
6. WHEN multiple users access the same project configuration simultaneously, THE Project_Config_System SHALL serve requests from the shared cache

### Requirement 15: Configuration API Endpoints

**User Story:** As a Frontend Developer, I want well-defined REST API endpoints for configuration management, so that I can integrate the Angular frontend with the backend services.

#### Acceptance Criteria

1. THE Project_Config_System SHALL provide a GET /api/projects/:projectId/config endpoint that returns complete project configuration
2. THE Project_Config_System SHALL provide a PUT /api/projects/:projectId/config endpoint that updates project configuration
3. THE Project_Config_System SHALL provide a PATCH /api/projects/:projectId/config/:section endpoint that updates specific configuration sections
4. WHEN an API request is malformed, THE Project_Config_System SHALL return a 400 Bad Request response with validation errors
5. WHEN an API request is unauthorized, THE Project_Config_System SHALL return a 401 Unauthorized response
6. WHEN an API request is forbidden, THE Project_Config_System SHALL return a 403 Forbidden response
7. WHEN a requested resource is not found, THE Project_Config_System SHALL return a 404 Not Found response
8. THE Project_Config_System SHALL return appropriate HTTP status codes: 200 OK for successful reads, 201 Created for new resources, 204 No Content for successful deletes
9. FOR ALL API responses, THE Project_Config_System SHALL include appropriate CORS headers to allow Angular frontend access
10. THE Project_Config_System SHALL validate all API inputs using express-validator middleware before processing requests

## Notes

### Parser and Serializer Implementation

The Configuration_Parser and Configuration_Serializer are critical components that handle conversion between JSON and internal object representations. These components must be thoroughly tested with property-based tests to ensure:

1. **Round-trip correctness**: parse(serialize(config)) === config
2. **Error handling**: Invalid JSON structures are rejected with clear error messages
3. **Schema validation**: All required fields are present and correctly typed
4. **Backward compatibility**: Older configuration versions can be parsed and migrated

### Database Schema Considerations

The implementation will require new database tables:
- `projects` (id, name, description, icon, color, type, start_date, end_date, status, created_at, updated_at)
- `project_members` (id, project_id, user_id, role, is_default_assignee, created_at)
- `project_status_columns` (id, project_id, name, position, is_done_status, done_criteria, created_at)
- `project_status_transitions` (id, project_id, from_status_id, to_status_id, created_at)
- `project_item_types` (id, project_id, name, icon, color, is_enabled, is_custom, created_at)
- `project_custom_fields` (id, project_id, name, field_type, options, is_required, default_value, created_at)
- `project_custom_field_visibility` (id, custom_field_id, role, can_view, can_edit)
- `project_sprint_config` (id, project_id, duration_weeks, naming_pattern, auto_create_next, created_at)
- `project_notification_rules` (id, project_id, name, conditions, recipients, channels, digest_frequency, is_enabled, created_at)
- `project_config_history` (id, project_id, user_id, changed_fields, before_snapshot, after_snapshot, created_at)

All tables should include appropriate foreign key constraints, indexes, and audit triggers.

### Integration Points

This module integrates with:
1. **Authentication System**: Uses existing JWT tokens and role-based access control
2. **User Management Module** (DEPENDENCY): Requires APIs to list, search, and retrieve user details for adding project members
3. **User Management**: References users table for project members
4. **Audit System**: Logs all configuration changes to audit_logs table
5. **Frontend**: Provides REST API endpoints for Angular Material UI components

### User/Member Management Module Dependency

**CRITICAL**: Before implementing this module, a User/Member Management module must be created with the following capabilities:

**Required Backend APIs:**
```
GET /api/v1/users
- List all active users in the system
- Support pagination, filtering, and sorting
- Return: id, username, email, firstName, lastName, role, isActive

GET /api/v1/users/search?q={query}
- Search users by name, email, or username
- Return matching users with same fields as list endpoint

GET /api/v1/users/:userId
- Get detailed information about a specific user
- Return: complete user profile including role and status

POST /api/v1/users (admin/superadmin only)
- Create new user account
- Required for system administrators to add users

PUT /api/v1/users/:userId (admin/superadmin only)
- Update user information
- Includes activating/deactivating users

DELETE /api/v1/users/:userId (superadmin only)
- Soft delete user account
```

**Required Frontend Components:**
- User list component with search and filtering
- User detail view component
- User add/edit form component
- User search dialog component (for project member selection)

**Integration Flow:**
1. User Management module manages system-level user accounts
2. Project Configuration module references these users when adding project members
3. Project members are associations between users and projects with project-specific roles
4. System-level role (from users table) is separate from project-level role (from project_members table)

### Security Considerations

1. All configuration endpoints must validate JWT tokens
2. Role-based access control must be enforced at the API level
3. SQL injection prevention through parameterized queries
4. Input validation using express-validator
5. Rate limiting on configuration modification endpoints
6. Audit logging for all configuration changes
