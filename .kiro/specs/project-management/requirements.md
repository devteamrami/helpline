# Requirements Document: Project Management Module

## Introduction

The Project Management module provides comprehensive project administration capabilities for the Ramiscope Project Management System. This module enables administrators and managers to create, view, edit, and manage projects across the organization. The company manages 8+ projects, each with external users (5K+ users in large projects, 100-300 in smaller ones). This module serves as the foundation for project-based operations, integrating with the existing Team Management module for internal employees and providing the basis for Project Members management.

The system currently has user authentication and team management for 6 internal employees. This module extends the system to support multiple projects with distinct configurations, statuses, and member associations. Each project can have both internal team members and external project users with project-specific roles.

## Glossary

- **Project_Management_System**: The complete project administration module including backend APIs and frontend components
- **Project_List_API**: Backend API endpoint that returns paginated project lists with filtering and search
- **Project_Details_API**: Backend API endpoint that returns detailed information about a specific project
- **Project_Creation_API**: Backend API endpoint that creates new project records
- **Project_Update_API**: Backend API endpoint that modifies existing project information
- **Project_Archive_API**: Backend API endpoint that archives projects (soft delete)
- **Project_Unarchive_API**: Backend API endpoint that restores archived projects
- **Project_List_Component**: Frontend Angular component displaying projects in a table with pagination
- **Project_Detail_Component**: Frontend Angular component displaying complete project information
- **Project_Form_Dialog**: Frontend Angular dialog component for creating and editing projects
- **Project_Service**: Frontend Angular service managing API calls for project operations
- **System_Administrator**: User with admin or superadmin role who can manage all projects
- **Project_Manager**: User with manager role who can manage assigned projects
- **Active_Project**: Project with status set to "Active"
- **Completed_Project**: Project with status set to "Completed"
- **On_Hold_Project**: Project with status set to "On Hold"
- **Archived_Project**: Project with status set to "Archived" (soft deleted)
- **Project_Code**: Unique identifier code for each project (alphanumeric, 3-20 characters)
- **Project_Status**: Current state of the project (Active, On Hold, Completed, Archived)
- **Project_Member**: Association between a user (internal or external) and a project with a project-specific role
- **Internal_Team_Member**: One of the 6 company employees from the users table
- **External_Project_User**: User from the project_users table (5K+ per project)
- **Search_Query**: Text input for searching projects (minimum 2 characters)
- **Pagination_Parameters**: Page number and items per page for list endpoints
- **Filter_Parameters**: Query parameters for filtering project lists (status, date range)
- **Audit_Log**: Record of project management actions for security and compliance tracking

## Requirements

### Requirement 1: Project List Retrieval

**User Story:** As a System Administrator, I want to view all projects in the system with pagination, filtering, and search, so that I can efficiently manage and monitor project portfolios.

#### Acceptance Criteria

1. WHEN a System_Administrator requests the project list, THE Project_List_API SHALL return all projects with pagination support
2. WHEN Pagination_Parameters specify page number and limit, THE Project_List_API SHALL return the corresponding page of results
3. THE Project_List_API SHALL enforce a maximum limit of 100 projects per page
4. THE Project_List_API SHALL default to 20 projects per page when no limit is specified
5. WHEN Filter_Parameters include status filter, THE Project_List_API SHALL return only projects with the specified Project_Status
6. WHEN Filter_Parameters include date range filter, THE Project_List_API SHALL return only projects created within the specified date range
7. WHEN a Search_Query is provided, THE Project_List_API SHALL search across project name, description, and Project_Code fields
8. THE Project_List_API SHALL require a minimum of 2 characters for the Search_Query
9. THE Project_List_API SHALL perform case-insensitive partial matching on searchable fields
10. THE Project_List_API SHALL return project data including id, name, description, code, status, start date, end date, member count, and created date
11. THE Project_List_API SHALL return pagination metadata including current page, items per page, total items, and total pages
12. WHEN a Project_Manager requests the project list, THE Project_List_API SHALL return only projects where they are members
13. WHEN a non-administrator and non-manager requests the project list, THE Project_List_API SHALL return a 403 Forbidden error
14. THE Project_List_API SHALL complete the request within 500 milliseconds for lists up to 100 projects

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL valid Pagination_Parameters, the sum of returned project counts across all pages SHALL equal the total project count
- **Invariant Property**: FOR ALL filter combinations, the returned projects SHALL match all specified filter criteria
- **Metamorphic Property**: FOR ALL Search_Query values, the count of filtered results SHALL be less than or equal to the total project count
- **Metamorphic Property**: FOR ALL status filters, the count of filtered projects SHALL be less than or equal to the unfiltered count
- **Error Condition**: WHEN page number exceeds total pages, THE Project_List_API SHALL return an empty project array with valid pagination metadata
- **Error Condition**: WHEN Search_Query is less than 2 characters, THE Project_List_API SHALL return a 400 Bad Request error

### Requirement 2: Project Detail Retrieval

**User Story:** As a System Administrator, I want to view detailed information about a specific project, so that I can understand its configuration, status, and membership.

#### Acceptance Criteria

1. WHEN a valid project ID is provided, THE Project_Details_API SHALL return complete project information
2. THE Project_Details_API SHALL return project data including id, name, description, code, status, start date, end date, created by, created date, updated date, and settings
3. THE Project_Details_API SHALL return a count of project members (both internal and external)
4. THE Project_Details_API SHALL return the creator's information (name and email)
5. WHEN an invalid project ID is provided, THE Project_Details_API SHALL return a 404 Not Found error
6. WHEN a System_Administrator requests any project's details, THE Project_Details_API SHALL return the requested project's information
7. WHEN a Project_Manager requests details for their own project, THE Project_Details_API SHALL return the project information
8. WHEN a Project_Manager requests details for a project they are not a member of, THE Project_Details_API SHALL return a 403 Forbidden error
9. WHEN a non-administrator and non-manager requests project details, THE Project_Details_API SHALL return a 403 Forbidden error
10. THE Project_Details_API SHALL complete the request within 400 milliseconds

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL valid project IDs, the returned project ID SHALL match the requested project ID
- **Model-Based Property**: FOR ALL projects with members, the returned member count SHALL match the count in the project_members table
- **Error Condition**: WHEN project ID is malformed (not UUID format), THE Project_Details_API SHALL return a 400 Bad Request error

### Requirement 3: Project Creation

**User Story:** As a System Administrator, I want to create new projects, so that I can set up project structures for new initiatives.

#### Acceptance Criteria

1. WHEN a System_Administrator provides valid project data, THE Project_Creation_API SHALL create a new project record
2. THE Project_Creation_API SHALL require name, description, and Project_Code
3. THE Project_Creation_API SHALL accept optional start date, end date, and status
4. THE Project_Creation_API SHALL validate Project_Code format (alphanumeric, hyphens, underscores, 3-20 characters)
5. WHEN Project_Code format is invalid, THE Project_Creation_API SHALL return a 400 Bad Request error with descriptive message
6. THE Project_Creation_API SHALL validate Project_Code uniqueness across all projects
7. WHEN Project_Code already exists, THE Project_Creation_API SHALL return a 409 Conflict error
8. THE Project_Creation_API SHALL validate name length between 3 and 200 characters
9. WHEN name length is invalid, THE Project_Creation_API SHALL return a 400 Bad Request error
10. THE Project_Creation_API SHALL validate description length does not exceed 2000 characters
11. WHEN description exceeds limit, THE Project_Creation_API SHALL return a 400 Bad Request error
12. THE Project_Creation_API SHALL validate Project_Status is one of: Active, On Hold, Completed, Archived
13. WHEN an invalid Project_Status is provided, THE Project_Creation_API SHALL return a 400 Bad Request error
14. THE Project_Creation_API SHALL default Project_Status to "Active" when not specified
15. WHEN start date is provided, THE Project_Creation_API SHALL validate it is a valid date format (ISO 8601)
16. WHEN end date is provided, THE Project_Creation_API SHALL validate it is after the start date
17. WHEN end date is before start date, THE Project_Creation_API SHALL return a 400 Bad Request error
18. THE Project_Creation_API SHALL set created_by to the authenticated user's ID
19. THE Project_Creation_API SHALL initialize settings as an empty JSON object
20. THE Project_Creation_API SHALL return the created project data
21. WHEN a non-administrator attempts to create a project, THE Project_Creation_API SHALL return a 403 Forbidden error
22. THE Project_Creation_API SHALL log the creation action in the Audit_Log
23. THE Project_Creation_API SHALL complete the request within 800 milliseconds

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL created projects, the Project_Code SHALL be unique in the projects table
- **Invariant Property**: FOR ALL created projects, the created_by field SHALL match the authenticated user's ID
- **Invariant Property**: FOR ALL created projects with end date, the end date SHALL be greater than or equal to the start date
- **Round-Trip Property**: FOR ALL created projects, retrieving the project by ID SHALL return the same project data
- **Error Condition**: FOR ALL invalid Project_Code formats, THE Project_Creation_API SHALL reject the request
- **Error Condition**: FOR ALL duplicate Project_Code values, THE Project_Creation_API SHALL reject the request
- **Error Condition**: FOR ALL end dates before start dates, THE Project_Creation_API SHALL reject the request

### Requirement 4: Project Information Update

**User Story:** As a System Administrator, I want to update project information, so that I can keep project details current and accurate.

#### Acceptance Criteria

1. WHEN a System_Administrator provides valid update data, THE Project_Update_API SHALL modify the specified project
2. THE Project_Update_API SHALL allow updating name, description, status, start date, end date, and settings
3. THE Project_Update_API SHALL NOT allow updating Project_Code (immutable field)
4. WHEN Project_Code update is attempted, THE Project_Update_API SHALL ignore that field and update other fields
5. THE Project_Update_API SHALL validate name length between 3 and 200 characters
6. WHEN name length is invalid, THE Project_Update_API SHALL return a 400 Bad Request error
7. THE Project_Update_API SHALL validate description length does not exceed 2000 characters
8. THE Project_Update_API SHALL validate Project_Status is one of: Active, On Hold, Completed, Archived
9. WHEN an invalid Project_Status is provided, THE Project_Update_API SHALL return a 400 Bad Request error
10. WHEN end date is provided, THE Project_Update_API SHALL validate it is after the start date
11. WHEN end date is before start date, THE Project_Update_API SHALL return a 400 Bad Request error
12. WHEN a valid project ID is provided, THE Project_Update_API SHALL update the specified project
13. WHEN an invalid project ID is provided, THE Project_Update_API SHALL return a 404 Not Found error
14. THE Project_Update_API SHALL update the updated_at timestamp automatically
15. THE Project_Update_API SHALL return the updated project data
16. WHEN a non-administrator attempts to update a project, THE Project_Update_API SHALL return a 403 Forbidden error
17. THE Project_Update_API SHALL log the update action in the Audit_Log including changed fields
18. THE Project_Update_API SHALL complete the request within 500 milliseconds

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL update operations, the project ID SHALL remain unchanged
- **Invariant Property**: FOR ALL update operations, the Project_Code SHALL remain unchanged
- **Invariant Property**: FOR ALL update operations, the created_by field SHALL remain unchanged
- **Invariant Property**: FOR ALL update operations, the updated_at timestamp SHALL be greater than or equal to the previous updated_at timestamp
- **Idempotence Property**: FOR ALL update data, applying the same update twice SHALL produce the same final state as applying it once
- **Error Condition**: WHEN project ID is malformed, THE Project_Update_API SHALL return a 400 Bad Request error
- **Error Condition**: FOR ALL end dates before start dates, THE Project_Update_API SHALL reject the request

### Requirement 5: Project Archival

**User Story:** As a System Administrator, I want to archive projects, so that I can hide completed or cancelled projects while preserving their data and history.

#### Acceptance Criteria

1. WHEN a System_Administrator requests project archival, THE Project_Archive_API SHALL set the project's status to "Archived"
2. THE Project_Archive_API SHALL preserve all project data including name, description, code, dates, and settings
3. THE Project_Archive_API SHALL NOT delete the project record from the database (soft delete only)
4. THE Project_Archive_API SHALL preserve all project member associations
5. WHEN a valid project ID is provided, THE Project_Archive_API SHALL archive the specified project
6. WHEN an invalid project ID is provided, THE Project_Archive_API SHALL return a 404 Not Found error
7. WHEN a project is already archived, THE Project_Archive_API SHALL return success without error (idempotent)
8. THE Project_Archive_API SHALL update the updated_at timestamp
9. THE Project_Archive_API SHALL return the updated project data with status set to "Archived"
10. WHEN a non-administrator attempts to archive a project, THE Project_Archive_API SHALL return a 403 Forbidden error
11. THE Project_Archive_API SHALL log the archival action in the Audit_Log
12. THE Project_Archive_API SHALL complete the request within 500 milliseconds

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL archived projects, the status SHALL be "Archived"
- **Invariant Property**: FOR ALL archived projects, all project data except status SHALL remain unchanged
- **Idempotence Property**: FOR ALL projects, archiving a project multiple times SHALL produce the same result as archiving once
- **Invariant Property**: FOR ALL archived projects, the project member count SHALL remain unchanged
- **Error Condition**: WHEN project ID is malformed, THE Project_Archive_API SHALL return a 400 Bad Request error

### Requirement 6: Project Unarchival

**User Story:** As a System Administrator, I want to unarchive projects, so that I can restore access to previously archived projects.

#### Acceptance Criteria

1. WHEN a System_Administrator requests project unarchival, THE Project_Unarchive_API SHALL set the project's status to "Active"
2. WHEN a valid project ID is provided, THE Project_Unarchive_API SHALL unarchive the specified project
3. WHEN an invalid project ID is provided, THE Project_Unarchive_API SHALL return a 404 Not Found error
4. WHEN a project is not archived, THE Project_Unarchive_API SHALL return a 400 Bad Request error with message "Project is not archived"
5. THE Project_Unarchive_API SHALL update the updated_at timestamp
6. THE Project_Unarchive_API SHALL return the updated project data with status set to "Active"
7. WHEN a non-administrator attempts to unarchive a project, THE Project_Unarchive_API SHALL return a 403 Forbidden error
8. THE Project_Unarchive_API SHALL log the unarchival action in the Audit_Log
9. THE Project_Unarchive_API SHALL complete the request within 500 milliseconds

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL unarchived projects, the status SHALL be "Active"
- **Confluence Property**: FOR ALL projects, archiving then unarchiving SHALL restore the status to "Active"
- **Error Condition**: WHEN attempting to unarchive a non-archived project, THE Project_Unarchive_API SHALL return a 400 Bad Request error

### Requirement 7: Project List Display Component

**User Story:** As a System Administrator, I want to view projects in a table with sorting, filtering, and search, so that I can efficiently navigate and manage the project portfolio.

#### Acceptance Criteria

1. THE Project_List_Component SHALL display projects in a Material table with columns for name, code, status, start date, end date, member count, and actions
2. THE Project_List_Component SHALL display pagination controls at the bottom of the table
3. THE Project_List_Component SHALL support sorting by name, code, status, start date, end date, and created date
4. WHEN a column header is clicked, THE Project_List_Component SHALL sort the table by that column
5. THE Project_List_Component SHALL display a search input field above the table
6. WHEN a Search_Query is entered, THE Project_List_Component SHALL filter the table in real-time after 300 milliseconds of inactivity
7. THE Project_List_Component SHALL display a filter dropdown for Project_Status
8. WHEN a status filter is selected, THE Project_List_Component SHALL update the table to show only matching projects
9. THE Project_List_Component SHALL display an "Add Project" button for System_Administrator users
10. WHEN the "Add Project" button is clicked, THE Project_List_Component SHALL open the Project_Form_Dialog
11. THE Project_List_Component SHALL display action buttons (view, edit, archive/unarchive) for each project row
12. WHEN a project row is clicked, THE Project_List_Component SHALL navigate to the Project_Detail_Component
13. THE Project_List_Component SHALL display a loading spinner while fetching project data
14. WHEN project data fails to load, THE Project_List_Component SHALL display an error message with retry option
15. THE Project_List_Component SHALL display status badges with color coding (Active: green, On Hold: yellow, Completed: blue, Archived: gray)
16. THE Project_List_Component SHALL render the initial view within 1000 milliseconds

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL sort operations, the table SHALL display projects in the correct order based on the selected column
- **Invariant Property**: FOR ALL filter combinations, the displayed projects SHALL match all active filters
- **Metamorphic Property**: FOR ALL Search_Query values, the displayed project count SHALL be less than or equal to the unfiltered count

### Requirement 8: Project Detail Display Component

**User Story:** As a System Administrator, I want to view complete project details including configuration and member statistics, so that I can understand a project's current state and composition.

#### Acceptance Criteria

1. THE Project_Detail_Component SHALL display project information including name, description, code, status, start date, end date, created by, created date, and updated date
2. THE Project_Detail_Component SHALL display a member count showing total project members
3. THE Project_Detail_Component SHALL display the creator's name and email
4. THE Project_Detail_Component SHALL display a status badge with color coding
5. THE Project_Detail_Component SHALL display an "Edit" button for System_Administrator users
6. WHEN the "Edit" button is clicked, THE Project_Detail_Component SHALL open the Project_Form_Dialog in edit mode
7. THE Project_Detail_Component SHALL display an "Archive" button for System_Administrator users when viewing a non-archived project
8. THE Project_Detail_Component SHALL display an "Unarchive" button for System_Administrator users when viewing an Archived_Project
9. WHEN the "Archive" button is clicked, THE Project_Detail_Component SHALL show a confirmation dialog
10. WHEN archival is confirmed, THE Project_Detail_Component SHALL call the Project_Archive_API and update the display
11. THE Project_Detail_Component SHALL display a "Members" tab that navigates to the project members list
12. THE Project_Detail_Component SHALL display a loading spinner while fetching project details
13. WHEN project details fail to load, THE Project_Detail_Component SHALL display an error message with retry option
14. THE Project_Detail_Component SHALL render within 800 milliseconds

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL displayed projects, the project ID SHALL match the requested project ID from the route parameter
- **Model-Based Property**: FOR ALL projects, the displayed member count SHALL match the Project_Details_API response

### Requirement 9: Project Form Dialog Component

**User Story:** As a System Administrator, I want to create and edit projects through a form dialog, so that I can manage project records with proper validation.

#### Acceptance Criteria

1. THE Project_Form_Dialog SHALL display a reactive form with fields for name, description, code, status, start date, and end date
2. WHEN in create mode, THE Project_Form_Dialog SHALL require name, description, and code fields
3. WHEN in edit mode, THE Project_Form_Dialog SHALL hide the code field (immutable)
4. THE Project_Form_Dialog SHALL validate name length between 3 and 200 characters in real-time
5. WHEN name length is invalid, THE Project_Form_Dialog SHALL display an error message below the name field
6. THE Project_Form_Dialog SHALL validate code format (alphanumeric, hyphens, underscores, 3-20 characters) in real-time
7. WHEN code format is invalid, THE Project_Form_Dialog SHALL display an error message below the code field
8. THE Project_Form_Dialog SHALL validate description length does not exceed 2000 characters
9. WHEN description exceeds limit, THE Project_Form_Dialog SHALL display an error message
10. THE Project_Form_Dialog SHALL display a status dropdown with options: Active, On Hold, Completed, Archived
11. THE Project_Form_Dialog SHALL display date pickers for start date and end date
12. WHEN end date is before start date, THE Project_Form_Dialog SHALL display an error message
13. THE Project_Form_Dialog SHALL disable the submit button when the form is invalid
14. WHEN the submit button is clicked, THE Project_Form_Dialog SHALL call the appropriate API (create or update)
15. WHEN the API call succeeds, THE Project_Form_Dialog SHALL close and emit the created or updated project data
16. WHEN the API call fails, THE Project_Form_Dialog SHALL display an error message without closing
17. THE Project_Form_Dialog SHALL display a loading spinner on the submit button during API calls
18. WHEN the cancel button is clicked, THE Project_Form_Dialog SHALL close without saving
19. THE Project_Form_Dialog SHALL render within 500 milliseconds

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL form submissions, the form SHALL be valid before the API call is made
- **Error Condition**: FOR ALL invalid code formats, the submit button SHALL be disabled
- **Error Condition**: FOR ALL end dates before start dates, the submit button SHALL be disabled
- **Error Condition**: FOR ALL invalid name lengths, the submit button SHALL be disabled

### Requirement 10: Project Service API Integration

**User Story:** As a frontend developer, I want a centralized service for project API calls, so that I can consistently interact with the backend across all components.

#### Acceptance Criteria

1. THE Project_Service SHALL provide a getProjects method that accepts Pagination_Parameters and Filter_Parameters
2. THE Project_Service SHALL provide a getProjectById method that accepts a project ID
3. THE Project_Service SHALL provide a createProject method that accepts project creation data
4. THE Project_Service SHALL provide an updateProject method that accepts a project ID and update data
5. THE Project_Service SHALL provide an archiveProject method that accepts a project ID
6. THE Project_Service SHALL provide an unarchiveProject method that accepts a project ID
7. THE Project_Service SHALL return Observable streams for all methods
8. THE Project_Service SHALL include the JWT access token in all API request headers
9. WHEN an API call returns a 401 Unauthorized error, THE Project_Service SHALL trigger token refresh
10. WHEN an API call returns a 403 Forbidden error, THE Project_Service SHALL emit an error observable
11. WHEN an API call returns a 404 Not Found error, THE Project_Service SHALL emit an error observable
12. WHEN an API call returns a 409 Conflict error, THE Project_Service SHALL emit an error observable
13. WHEN an API call returns a 500 Internal Server error, THE Project_Service SHALL emit an error observable
14. THE Project_Service SHALL handle network errors and emit appropriate error observables

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL API methods, the returned Observable SHALL emit exactly one value or one error
- **Invariant Property**: FOR ALL API methods, the JWT token SHALL be included in the Authorization header
- **Error Condition**: FOR ALL network failures, the Observable SHALL emit an error

### Requirement 11: Audit Logging for Project Management

**User Story:** As a System Administrator, I want all project management actions logged, so that I can track changes for security and compliance purposes.

#### Acceptance Criteria

1. WHEN a project is created, THE Project_Management_System SHALL log the action in the Audit_Log with action type "project_created"
2. WHEN a project is updated, THE Project_Management_System SHALL log the action in the Audit_Log with action type "project_updated" and include changed fields
3. WHEN a project is archived, THE Project_Management_System SHALL log the action in the Audit_Log with action type "project_archived"
4. WHEN a project is unarchived, THE Project_Management_System SHALL log the action in the Audit_Log with action type "project_unarchived"
5. THE Project_Management_System SHALL include the performing user's ID in all Audit_Log entries
6. THE Project_Management_System SHALL include the target project's ID in all Audit_Log entries
7. THE Project_Management_System SHALL include the IP address of the request in all Audit_Log entries
8. THE Project_Management_System SHALL include the user agent of the request in all Audit_Log entries
9. THE Project_Management_System SHALL store changed field details in the Audit_Log details JSON field
10. THE Project_Management_System SHALL complete audit logging within 100 milliseconds

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL project management actions, an Audit_Log entry SHALL be created
- **Invariant Property**: FOR ALL Audit_Log entries, the user_id SHALL match the authenticated user
- **Invariant Property**: FOR ALL Audit_Log entries, the created_at timestamp SHALL be within 1 second of the action timestamp

### Requirement 12: Database Schema for Projects

**User Story:** As a backend developer, I want a well-structured database schema for projects, so that I can efficiently store and query project data.

#### Acceptance Criteria

1. THE Project_Management_System SHALL create a projects table with columns: id (UUID), name, description, code, status, start_date, end_date, created_by, created_at, updated_at, settings (JSONB)
2. THE projects table SHALL use UUID as the primary key with automatic generation
3. THE projects table SHALL enforce uniqueness on the code column
4. THE projects table SHALL create an index on the code column for fast lookups
5. THE projects table SHALL create an index on the status column for filtering
6. THE projects table SHALL create an index on the created_by column for creator queries
7. THE projects table SHALL create an index on the created_at column for date range queries
8. THE projects table SHALL set default value for status to "Active"
9. THE projects table SHALL set default value for created_at to current timestamp
10. THE projects table SHALL set default value for updated_at to current timestamp
11. THE projects table SHALL create a foreign key constraint on created_by referencing users(id)
12. THE projects table SHALL use ON DELETE SET NULL for the created_by foreign key
13. THE Project_Management_System SHALL create a trigger to automatically update updated_at on row updates
14. THE Project_Management_System SHALL create a view project_details that joins projects with user information

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL project records, the id SHALL be a valid UUID
- **Invariant Property**: FOR ALL project records, the code SHALL be unique
- **Invariant Property**: FOR ALL project updates, the updated_at timestamp SHALL be automatically updated
- **Error Condition**: WHEN inserting a duplicate code, the database SHALL raise a unique constraint violation

### Requirement 13: Performance Optimization for Project Queries

**User Story:** As a backend developer, I want optimized database queries for project operations, so that the system can handle large numbers of projects efficiently.

#### Acceptance Criteria

1. THE Project_List_API SHALL use parameterized queries to prevent SQL injection
2. THE Project_List_API SHALL use database indexes for filtering and sorting operations
3. THE Project_List_API SHALL use LIMIT and OFFSET clauses for pagination
4. THE Project_List_API SHALL use prepared statements for repeated queries
5. THE Project_Details_API SHALL use a single JOIN query to fetch project and creator information
6. THE Project_Details_API SHALL use a subquery or separate query to count project members
7. THE Project_Management_System SHALL use connection pooling for database connections
8. THE Project_Management_System SHALL reuse database connections across requests
9. THE Project_Management_System SHALL close database connections properly after use
10. THE Project_Management_System SHALL handle database connection errors gracefully

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL database queries, parameterized statements SHALL be used
- **Invariant Property**: FOR ALL paginated queries, the result count SHALL not exceed the specified limit
- **Error Condition**: FOR ALL SQL injection attempts, the queries SHALL safely escape input

### Requirement 14: Integration with Team Management Module

**User Story:** As a System Administrator, I want projects to integrate with the existing Team Management module, so that internal employees can be associated with projects.

#### Acceptance Criteria

1. THE Project_Management_System SHALL use the existing users table for Internal_Team_Member references
2. THE Project_Management_System SHALL reference users(id) in the created_by column
3. THE Project_Management_System SHALL display creator information from the users table
4. THE Project_Management_System SHALL allow Internal_Team_Member users to be added as Project_Member records
5. THE Project_Management_System SHALL preserve referential integrity between projects and users tables
6. WHEN a user is deactivated, THE Project_Management_System SHALL preserve their project associations
7. THE Project_Management_System SHALL display project counts in user detail views (future integration point)

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL projects, the created_by field SHALL reference a valid user in the users table
- **Invariant Property**: FOR ALL projects with creators, the creator information SHALL be retrievable from the users table

### Requirement 15: Future Integration Points for Project Members

**User Story:** As a System Administrator, I want the project module to support future integration with project members management, so that both internal and external users can be associated with projects.

#### Acceptance Criteria

1. THE Project_Management_System SHALL provide a member count field in project details for future project_members integration
2. THE Project_Management_System SHALL design the API to support future filtering by member ID
3. THE Project_Management_System SHALL design the database schema to support foreign key relationships with project_members table
4. THE Project_Management_System SHALL provide API endpoints that can be extended to include member details
5. THE Project_Detail_Component SHALL include a "Members" tab placeholder for future project members list
6. THE Project_Management_System SHALL document integration points for project_users and project_members tables

**Property-Based Testing Criteria:**

- **Invariant Property**: FOR ALL projects, the member count field SHALL be included in API responses (initially 0)
- **Invariant Property**: FOR ALL projects, the API response structure SHALL support future member data additions
