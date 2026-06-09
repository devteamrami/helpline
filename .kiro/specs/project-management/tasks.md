# Implementation Plan: Project Management Module

## Overview

This implementation plan creates a comprehensive project administration module for the Ramiscope Project Management System. The module enables administrators and managers to create, view, edit, and manage projects across the organization. The implementation follows the existing user-member-management module patterns and includes backend APIs, frontend components, and comprehensive testing with property-based tests.

**Technology Stack:**
- Backend: Node.js/Express (port 5000)
- Frontend: Angular 21.2.0 with standalone components
- Database: PostgreSQL with UUID primary keys
- Testing: Jest (backend), Jasmine/Karma (frontend), fast-check (property-based testing)

**Key Features:**
- Project CRUD operations with soft-delete archival
- Paginated project lists with filtering, search, and sorting
- Role-based access control (admin, manager)
- Audit logging for all operations
- 24 correctness properties validated via property-based tests

---

## Tasks

### Phase 1: Backend Foundation

- [ ] 1. Set up database schema and migrations
  - Create projects table with all required columns (id, name, description, code, status, start_date, end_date, created_by, created_at, updated_at, settings)
  - Add unique constraint on code column
  - Add check constraints for status enum, date range, name length, code format, description length
  - Create indexes on code, status, created_by, created_at, name columns
  - Create trigger for automatic updated_at timestamp updates
  - Create project_details view joining projects with users table
  - Add foreign key constraint on created_by referencing users(id) with ON DELETE SET NULL
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11, 12.12, 12.13, 12.14_

- [ ] 2. Create backend service layer
  - [ ] 2.1 Implement project service with core business logic
    - Create `src/services/project.service.js` following user.service.js pattern
    - Implement `getProjects(params)` method with pagination, filtering, and search
    - Implement `getProjectById(id, userId, userRole)` method with permission checks
    - Implement `createProject(data, userId)` method with validation
    - Implement `updateProject(id, data, userId)` method with validation
    - Implement `archiveProject(id, userId)` method
    - Implement `unarchiveProject(id, userId)` method
    - Implement `getProjectMemberCount(projectId)` helper method
    - Add audit logging for all operations (project_created, project_updated, project_archived, project_unarchived)
    - Use parameterized queries for SQL injection prevention
    - _Requirements: 1.1-1.14, 2.1-2.10, 3.1-3.23, 4.1-4.18, 5.1-5.12, 6.1-6.9, 11.1-11.10_

  - [ ]* 2.2 Write property test for pagination invariant
    - **Property 1: Pagination Invariant**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Generate random pagination parameters (page, limit)
    - Verify sum of returned project counts across all pages equals total project count
    - Verify no page exceeds specified limit (capped at 100)
    - Use fast-check with minimum 100 iterations

  - [ ]* 2.3 Write property test for filter correctness
    - **Property 2: Filter Correctness**
    - **Validates: Requirements 1.5, 1.6**
    - Generate random filter combinations (status, date range)
    - Verify all returned projects match ALL specified filter criteria
    - Use fast-check with minimum 100 iterations

  - [ ]* 2.4 Write property test for search metamorphic property
    - **Property 3: Search Metamorphic Property**
    - **Validates: Requirements 1.7, 1.8, 1.9**
    - Generate random search queries (minimum 2 characters)
    - Verify filtered result count ≤ total project count
    - Verify all results contain search query in name, description, or code (case-insensitive)
    - Use fast-check with minimum 100 iterations

  - [ ]* 2.5 Write property test for project code uniqueness
    - **Property 7: Project Code Uniqueness**
    - **Validates: Requirements 3.6, 3.7**
    - Generate random project data with duplicate codes
    - Verify first creation succeeds, second returns 409 Conflict
    - Use fast-check with minimum 100 iterations

  - [ ]* 2.6 Write property test for project code immutability
    - **Property 8: Project Code Immutability**
    - **Validates: Requirements 4.3, 4.4**
    - Generate random update data including code field
    - Verify project code remains unchanged after update
    - Use fast-check with minimum 100 iterations

  - [ ]* 2.7 Write unit tests for project service
    - Test default values (status='Active', settings={}, pagination=20)
    - Test edge cases (empty list, page exceeds total, max limit 100, min search length 2)
    - Test authorization (admin all projects, manager own projects only, non-admin/manager 403)
    - Test error conditions (invalid UUID, non-existent project, malformed input)
    - Test audit log creation for all operations
    - Mock database layer

- [ ] 3. Create backend controller layer
  - [ ] 3.1 Implement project controller with request handling
    - Create `src/controllers/project.controller.js` following user.controller.js pattern
    - Implement `getProjects(req, res)` controller method
    - Implement `getProjectById(req, res)` controller method
    - Implement `createProject(req, res)` controller method
    - Implement `updateProject(req, res)` controller method
    - Implement `archiveProject(req, res)` controller method
    - Implement `unarchiveProject(req, res)` controller method
    - Extract and validate request parameters
    - Format responses using existing response utility
    - Handle errors with appropriate HTTP status codes (400, 401, 403, 404, 409, 500)
    - _Requirements: 1.1-1.14, 2.1-2.10, 3.1-3.23, 4.1-4.18, 5.1-5.12, 6.1-6.9_

  - [ ]* 3.2 Write property test for response structure completeness
    - **Property 4: Response Structure Completeness**
    - **Validates: Requirements 1.10, 1.11**
    - Generate random pagination parameters
    - Verify all projects contain required fields (id, name, description, code, status, start_date, end_date, member_count, created_at)
    - Verify pagination metadata contains (current_page, items_per_page, total_items, total_pages)
    - Use fast-check with minimum 100 iterations

  - [ ]* 3.3 Write property test for project detail completeness
    - **Property 5: Project Detail Completeness**
    - **Validates: Requirements 2.2, 2.3, 2.4**
    - Generate random valid project IDs
    - Verify response contains all required fields including creator information and member_count
    - Use fast-check with minimum 100 iterations

  - [ ]* 3.4 Write property test for invalid ID error handling
    - **Property 6: Invalid ID Error Handling**
    - **Validates: Requirements 2.5, 4.13, 5.6, 6.3**
    - Generate random non-existent and malformed project IDs
    - Verify 404 for non-existent valid UUIDs, 400 for malformed IDs
    - Use fast-check with minimum 100 iterations

  - [ ]* 3.5 Write unit tests for project controller
    - Test request validation and parameter extraction
    - Test response formatting
    - Test HTTP status codes for all error conditions
    - Mock service layer

- [ ] 4. Create backend validation and routing
  - [ ] 4.1 Implement request validators
    - Create `src/validators/project.validator.js` following user.validator.js pattern
    - Implement validation for project creation (name, description, code, status, dates)
    - Implement validation for project update (name, description, status, dates)
    - Implement validation for pagination parameters (page, limit)
    - Implement validation for filter parameters (status, date range)
    - Implement validation for search query (minimum 2 characters)
    - Use express-validator for validation rules
    - _Requirements: 3.4-3.17, 4.5-4.11, 1.8_

  - [ ]* 4.2 Write property tests for field validation
    - **Property 9: Field Validation - Name Length**
    - **Validates: Requirements 3.8, 3.9, 4.5, 4.6**
    - Generate random names with various lengths
    - Verify 400 error for length < 3 or > 200, success for 3-200
    - Use fast-check with minimum 100 iterations

  - [ ]* 4.3 Write property test for description length validation
    - **Property 10: Field Validation - Description Length**
    - **Validates: Requirements 3.10, 3.11, 4.7**
    - Generate random descriptions with various lengths
    - Verify 400 error for length > 2000, success for ≤ 2000
    - Use fast-check with minimum 100 iterations

  - [ ]* 4.4 Write property test for project code format validation
    - **Property 11: Field Validation - Project Code Format**
    - **Validates: Requirements 3.4, 3.5**
    - Generate random codes with valid/invalid formats
    - Verify 400 error for invalid format, success for pattern ^[a-zA-Z0-9_-]{3,20}$
    - Use fast-check with minimum 100 iterations

  - [ ]* 4.5 Write property test for status enum validation
    - **Property 12: Field Validation - Status Enum**
    - **Validates: Requirements 3.12, 3.13, 4.8, 4.9**
    - Generate random status values
    - Verify 400 error for invalid status, success for ['Active', 'On Hold', 'Completed', 'Archived']
    - Use fast-check with minimum 100 iterations

  - [ ]* 4.6 Write property test for date range validation
    - **Property 13: Field Validation - Date Range**
    - **Validates: Requirements 3.16, 3.17, 4.10, 4.11**
    - Generate random start and end dates
    - Verify 400 error when end_date < start_date, success when end_date ≥ start_date
    - Use fast-check with minimum 100 iterations

  - [ ]* 4.7 Write property test for search query minimum length
    - **Property 24: Search Query Minimum Length**
    - **Validates: Requirement 1.8**
    - Generate random search queries with various lengths
    - Verify 400 error for length < 2, success for length ≥ 2
    - Use fast-check with minimum 100 iterations

  - [ ] 4.8 Implement project routes
    - Create `src/routes/project.routes.js` following user.routes.js pattern
    - Define GET /api/projects route with authenticateToken and authorizeRoles(['admin', 'superadmin', 'manager'])
    - Define GET /api/projects/:id route with authenticateToken and authorizeRoles(['admin', 'superadmin', 'manager'])
    - Define POST /api/projects route with authenticateToken and authorizeRoles(['admin', 'superadmin'])
    - Define PUT /api/projects/:id route with authenticateToken and authorizeRoles(['admin', 'superadmin'])
    - Define PATCH /api/projects/:id/archive route with authenticateToken and authorizeRoles(['admin', 'superadmin'])
    - Define PATCH /api/projects/:id/unarchive route with authenticateToken and authorizeRoles(['admin', 'superadmin'])
    - Apply validators to each route
    - _Requirements: 1.1-1.14, 2.1-2.10, 3.1-3.23, 4.1-4.18, 5.1-5.12, 6.1-6.9_

  - [ ] 4.9 Register project routes in main router
    - Update `src/routes/index.js` to include project routes
    - Mount project routes at /api/projects
    - _Requirements: All backend requirements_

- [ ] 5. Checkpoint - Backend foundation complete
  - Ensure all backend tests pass (unit tests and property tests)
  - Verify database schema created successfully
  - Verify all API endpoints accessible with proper authentication
  - Test API endpoints manually using Postman or curl
  - Ask the user if questions arise

### Phase 2: Frontend Foundation

- [ ] 6. Create frontend models and interfaces
  - [ ] 6.1 Create TypeScript models for projects
    - Create `src/app/core/models/project.model.ts`
    - Define Project interface with all fields
    - Define ProjectDetail interface extending Project
    - Define ProjectStatus type ('Active' | 'On Hold' | 'Completed' | 'Archived')
    - Define ProjectListParams interface for query parameters
    - Define ProjectListResponse interface with projects and pagination
    - Define CreateProjectRequest interface
    - Define UpdateProjectRequest interface
    - _Requirements: 1.1-1.14, 2.1-2.10, 3.1-3.23, 4.1-4.18_

  - [ ]* 6.2 Write unit tests for TypeScript models
    - Test interface type checking
    - Test type guards if implemented
    - Verify all required fields present

- [ ] 7. Create frontend service layer
  - [ ] 7.1 Implement project service with API integration
    - Create `src/app/core/services/project.service.ts` following existing service patterns
    - Implement BehaviorSubject state management (projectsSubject, loadingSubject, errorSubject)
    - Implement getProjects(params?: ProjectListParams): Observable<ProjectListResponse>
    - Implement getProjectById(id: string): Observable<ProjectDetail>
    - Implement createProject(data: CreateProjectRequest): Observable<Project>
    - Implement updateProject(id: string, data: UpdateProjectRequest): Observable<Project>
    - Implement archiveProject(id: string): Observable<Project>
    - Implement unarchiveProject(id: string): Observable<Project>
    - Include JWT access token in all request headers
    - Handle 401 errors with token refresh
    - Handle 403, 404, 409, 500 errors with appropriate error observables
    - Use inject() pattern for HttpClient and AuthService
    - _Requirements: 10.1-10.14_

  - [ ]* 7.2 Write property test for creator assignment
    - **Property 14: Creator Assignment**
    - **Validates: Requirements 3.18, 4.3**
    - Generate random project creation data
    - Verify created_by field matches authenticated user ID
    - Verify created_by never changes on update
    - Use fast-check with minimum 100 iterations

  - [ ]* 7.3 Write property test for creation round-trip
    - **Property 15: Creation Round-Trip**
    - **Validates: Requirements 3.1, 3.20**
    - Generate random valid project creation data
    - Create project, then retrieve by ID
    - Verify retrieved data matches creation data
    - Use fast-check with minimum 100 iterations

  - [ ]* 7.4 Write property test for update idempotence
    - **Property 16: Update Idempotence**
    - **Validates: Requirement 4.1**
    - Generate random update data
    - Apply same update twice
    - Verify final state identical after first and second update
    - Use fast-check with minimum 100 iterations

  - [ ]* 7.5 Write property test for timestamp monotonicity
    - **Property 17: Timestamp Monotonicity**
    - **Validates: Requirements 4.14, 5.8, 6.5**
    - Generate random update/archive/unarchive operations
    - Verify updated_at timestamp increases or stays same
    - Use fast-check with minimum 100 iterations

  - [ ]* 7.6 Write unit tests for project service
    - Test Observable streams emit exactly one value or one error
    - Test JWT token included in Authorization header
    - Test error handling for network failures
    - Test state management (BehaviorSubject updates)
    - Mock HttpClient

- [ ] 8. Create project list component
  - [ ] 8.1 Implement project list component with table and filters
    - Create `src/app/features/projects/` directory
    - Create `src/app/features/projects/project-list/project-list.component.ts` as standalone component
    - Create `src/app/features/projects/project-list/project-list.component.html` template
    - Create `src/app/features/projects/project-list/project-list.component.scss` styles
    - Implement Material table with columns (name, code, status, start date, end date, member count, actions)
    - Implement pagination controls at bottom
    - Implement sorting by name, code, status, start date, end date, created date
    - Implement search input with 300ms debounce using FormControl
    - Implement status filter dropdown
    - Implement "Add Project" button for admin users
    - Implement action buttons (view, edit, archive/unarchive) per row
    - Implement loading spinner during data fetch
    - Implement error message display with retry option
    - Implement status badges with color coding (Active: green, On Hold: yellow, Completed: blue, Archived: gray)
    - Use inject() pattern for ProjectService, Router, AuthService
    - _Requirements: 7.1-7.16_

  - [ ]* 8.2 Write unit tests for project list component
    - Test table rendering with mock data
    - Test sorting functionality
    - Test pagination controls
    - Test search debounce (300ms)
    - Test status filter
    - Test action button visibility based on user role
    - Test loading and error states
    - Test navigation on row click

- [ ] 9. Create project detail component
  - [ ] 9.1 Implement project detail component with full information display
    - Create `src/app/features/projects/project-detail/project-detail.component.ts` as standalone component
    - Create `src/app/features/projects/project-detail/project-detail.component.html` template
    - Create `src/app/features/projects/project-detail/project-detail.component.scss` styles
    - Display all project information (name, description, code, status, dates, creator, member count)
    - Display status badge with color coding
    - Implement "Edit" button for admin users
    - Implement "Archive" button for admin users (non-archived projects)
    - Implement "Unarchive" button for admin users (archived projects)
    - Implement confirmation dialog for archive/unarchive actions
    - Implement "Members" tab placeholder
    - Implement loading spinner during data fetch
    - Implement error message display with retry option
    - Use inject() pattern for ProjectService, ActivatedRoute, Router, Dialog, AuthService
    - _Requirements: 8.1-8.14_

  - [ ]* 9.2 Write property test for archival preservation
    - **Property 18: Archival Preservation**
    - **Validates: Requirements 5.1, 5.2, 5.4**
    - Generate random projects
    - Archive project
    - Verify all data unchanged except status='Archived'
    - Use fast-check with minimum 100 iterations

  - [ ]* 9.3 Write property test for archival soft delete
    - **Property 19: Archival Soft Delete**
    - **Validates: Requirement 5.3**
    - Generate random projects
    - Archive project
    - Verify project still retrievable by ID
    - Use fast-check with minimum 100 iterations

  - [ ]* 9.4 Write property test for archival idempotence
    - **Property 20: Archival Idempotence**
    - **Validates: Requirement 5.7**
    - Generate random projects
    - Archive multiple times
    - Verify same result as archiving once
    - Use fast-check with minimum 100 iterations

  - [ ]* 9.5 Write property test for unarchival state transition
    - **Property 21: Unarchival State Transition**
    - **Validates: Requirements 6.1, 6.2**
    - Generate random archived projects
    - Unarchive project
    - Verify status='Active' and all other data unchanged
    - Use fast-check with minimum 100 iterations

  - [ ]* 9.6 Write property test for unarchival precondition
    - **Property 22: Unarchival Precondition**
    - **Validates: Requirement 6.4**
    - Generate random non-archived projects
    - Attempt to unarchive
    - Verify 400 error with message "Project is not archived"
    - Use fast-check with minimum 100 iterations

  - [ ]* 9.7 Write property test for archive-unarchive round-trip
    - **Property 23: Archive-Unarchive Round-Trip**
    - **Validates: Requirements 5.1, 6.1**
    - Generate random Active projects
    - Archive then unarchive
    - Verify status restored to 'Active' and all data preserved
    - Use fast-check with minimum 100 iterations

  - [ ]* 9.8 Write unit tests for project detail component
    - Test project information display
    - Test status badge rendering
    - Test action button visibility based on user role and project status
    - Test confirmation dialog for archive/unarchive
    - Test loading and error states
    - Test route parameter extraction

- [ ] 10. Create project form dialog component
  - [ ] 10.1 Implement project form dialog for create and edit
    - Create `src/app/features/projects/project-form-dialog/project-form-dialog.component.ts` as standalone component
    - Create `src/app/features/projects/project-form-dialog/project-form-dialog.component.html` template
    - Create `src/app/features/projects/project-form-dialog/project-form-dialog.component.scss` styles
    - Implement reactive form with FormGroup and FormControls
    - Add form fields: name (required, 3-200 chars), description (required, max 2000 chars), code (required, pattern ^[a-zA-Z0-9_-]{3,20}$), status (dropdown), start date (date picker), end date (date picker)
    - Hide code field in edit mode (immutable)
    - Implement real-time validation with error messages
    - Implement end date validation (must be after start date)
    - Disable submit button when form invalid
    - Implement loading spinner on submit button during API call
    - Close dialog and emit result on success
    - Display error message without closing on failure
    - Implement cancel button to close without saving
    - Use inject() pattern for DialogRef, ProjectService, MAT_DIALOG_DATA
    - _Requirements: 9.1-9.19_

  - [ ]* 10.2 Write unit tests for project form dialog
    - Test form validation (name length, code format, description length, date range)
    - Test submit button disabled when form invalid
    - Test create mode shows all fields including code
    - Test edit mode hides code field
    - Test API call on submit
    - Test dialog close on success
    - Test error display on failure
    - Test cancel button closes dialog

- [ ] 11. Checkpoint - Frontend foundation complete
  - Ensure all frontend tests pass (unit tests and property tests)
  - Verify all components render correctly
  - Verify form validation works as expected
  - Test navigation between list and detail views
  - Test create, edit, archive, unarchive flows manually
  - Ask the user if questions arise

### Phase 3: Integration and Routing

- [ ] 12. Configure frontend routing
  - [ ] 12.1 Add project routes to application
    - Update `src/app/app.routes.ts` to include project routes
    - Add route for project list: /projects (with auth guard)
    - Add route for project detail: /projects/:id (with auth guard)
    - Configure lazy loading for project module if needed
    - _Requirements: 7.1-7.16, 8.1-8.14_

  - [ ]* 12.2 Write unit tests for routing configuration
    - Test route navigation to project list
    - Test route navigation to project detail with ID parameter
    - Test auth guard prevents unauthorized access

- [ ] 13. Add navigation menu items
  - [ ] 13.1 Update main navigation to include projects
    - Update navigation component to add "Projects" menu item
    - Add icon for projects menu item
    - Configure menu item visibility based on user role (admin, manager)
    - _Requirements: 7.1-7.16_

  - [ ]* 13.2 Write unit tests for navigation updates
    - Test menu item visibility for different roles
    - Test navigation link routing

- [ ] 14. Integration testing
  - [ ]* 14.1 Write integration tests for complete user flows
    - Test end-to-end project creation flow (list → dialog → create → detail)
    - Test end-to-end project edit flow (list → detail → dialog → update → detail)
    - Test end-to-end project archive flow (list → detail → archive → list)
    - Test end-to-end project unarchive flow (list → detail → unarchive → list)
    - Test search and filter combinations
    - Test pagination navigation
    - Test error handling and recovery

- [ ] 15. Checkpoint - Integration complete
  - Ensure all integration tests pass
  - Verify complete user flows work end-to-end
  - Test with different user roles (admin, manager)
  - Verify audit logs created for all operations
  - Ask the user if questions arise

### Phase 4: Documentation and Deployment

- [ ] 16. Create API documentation
  - [ ] 16.1 Document all project API endpoints
    - Document GET /api/projects endpoint with parameters and response format
    - Document GET /api/projects/:id endpoint with response format
    - Document POST /api/projects endpoint with request body and response
    - Document PUT /api/projects/:id endpoint with request body and response
    - Document PATCH /api/projects/:id/archive endpoint with response
    - Document PATCH /api/projects/:id/unarchive endpoint with response
    - Include authentication requirements
    - Include authorization requirements (roles)
    - Include error response formats
    - Include example requests and responses
    - _Requirements: All backend requirements_

- [ ] 17. Create user documentation
  - [ ] 17.1 Write user guide for project management
    - Document how to view project list
    - Document how to search and filter projects
    - Document how to create new projects
    - Document how to edit project information
    - Document how to archive and unarchive projects
    - Include screenshots of UI components
    - Document role-based permissions
    - _Requirements: 7.1-7.16, 8.1-8.14, 9.1-9.19_

- [ ] 18. Deployment preparation
  - [ ] 18.1 Prepare deployment artifacts
    - Run database migrations on staging environment
    - Build frontend production bundle
    - Configure environment variables for production
    - Test deployment on staging environment
    - Verify all features work in staging
    - _Requirements: All requirements_

- [ ] 19. Final checkpoint - Implementation complete
  - Ensure all tests pass (unit, property-based, integration)
  - Verify code coverage meets targets (backend 90%, frontend 85%)
  - Verify all 24 correctness properties validated
  - Verify all 15 requirements implemented
  - Verify audit logging works for all operations
  - Verify performance targets met (API response times)
  - Ask the user if questions arise before deployment

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties (24 properties total)
- Unit tests validate specific examples, edge cases, and integration points
- All property tests use fast-check with minimum 100 iterations
- Backend follows existing user-member-management module patterns
- Frontend uses Angular 21.2.0 standalone components with inject() pattern
- Database uses PostgreSQL with UUID primary keys
- Authentication uses existing JWT middleware
- All operations include audit logging for security and compliance

## Property-Based Testing Summary

This implementation includes 24 correctness properties validated through property-based testing:

1. **Pagination Invariant** - Sum across pages equals total count
2. **Filter Correctness** - All results match filter criteria
3. **Search Metamorphic Property** - Filtered count ≤ total count
4. **Response Structure Completeness** - All required fields present
5. **Project Detail Completeness** - All detail fields present
6. **Invalid ID Error Handling** - Proper error codes for invalid IDs
7. **Project Code Uniqueness** - Codes are unique across projects
8. **Project Code Immutability** - Codes never change after creation
9. **Field Validation - Name Length** - Name length constraints enforced
10. **Field Validation - Description Length** - Description length constraints enforced
11. **Field Validation - Project Code Format** - Code format pattern enforced
12. **Field Validation - Status Enum** - Status values restricted to enum
13. **Field Validation - Date Range** - End date must be after start date
14. **Creator Assignment** - Created_by set to authenticated user
15. **Creation Round-Trip** - Create then retrieve returns same data
16. **Update Idempotence** - Same update twice produces same result
17. **Timestamp Monotonicity** - Updated_at increases on changes
18. **Archival Preservation** - Archive preserves all data except status
19. **Archival Soft Delete** - Archived projects still retrievable
20. **Archival Idempotence** - Multiple archives produce same result
21. **Unarchival State Transition** - Unarchive sets status to Active
22. **Unarchival Precondition** - Cannot unarchive non-archived projects
23. **Archive-Unarchive Round-Trip** - Archive then unarchive restores Active status
24. **Search Query Minimum Length** - Search requires minimum 2 characters

Each property test uses fast-check with minimum 100 iterations and is tagged with its property number and requirement references.
