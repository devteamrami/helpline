# Design Document: Project Management Module

## Overview

The Project Management module provides comprehensive project administration capabilities for the Ramiscope Project Management System. This module enables administrators and managers to create, view, edit, and manage projects across the organization. The system manages 8+ projects, each with external users (5K+ users in large projects, 100-300 in smaller ones).

### Purpose

This module serves as the foundation for project-based operations, integrating with the existing Team Management module for internal employees and providing the basis for future Project Members management. The module implements a complete CRUD (Create, Read, Update, Delete) interface for projects with soft-delete archival functionality.

### Key Features

- **Project List Management**: Paginated project lists with filtering, search, and sorting
- **Project Details**: Comprehensive project information display with member statistics
- **Project CRUD Operations**: Create, update, archive, and unarchive projects
- **Role-Based Access Control**: Different permissions for administrators and managers
- **Audit Logging**: Complete tracking of all project management actions
- **Integration Points**: Designed for future integration with project members and tasks modules

### Technology Stack

- **Backend**: Node.js/Express (port 5000)
- **Frontend**: Angular 21.2.0 with standalone components
- **Database**: PostgreSQL with UUID primary keys
- **Authentication**: JWT with existing middleware
- **State Management**: RxJS BehaviorSubject pattern
- **UI Framework**: Angular Material with gradient theme (#667eea to #764ba2)

---

## Architecture

### System Architecture

The Project Management module follows a three-tier architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Angular)                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ List Component │  │Detail Component│  │ Form Dialog    ││
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘│
│           │                   │                    │         │
│           └───────────────────┴────────────────────┘         │
│                              │                               │
│                    ┌─────────▼─────────┐                    │
│                    │  Project Service  │                    │
│                    │  (State Mgmt)     │                    │
│                    └─────────┬─────────┘                    │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTP/REST
                               │ JWT Auth
┌──────────────────────────────▼──────────────────────────────┐
│                     Backend (Express)                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ Auth Middleware│  │Project Router  │  │ Error Handler  ││
│  └────────┬───────┘  └────────┬───────┘  └────────────────┘│
│           │                   │                              │
│           └───────────────────┘                              │
│                              │                               │
│                    ┌─────────▼─────────┐                    │
│                    │Project Controller │                    │
│                    └─────────┬─────────┘                    │
│                              │                               │
│                    ┌─────────▼─────────┐                    │
│                    │ Project Service   │                    │
│                    └─────────┬─────────┘                    │
└──────────────────────────────┼──────────────────────────────┘
                               │ SQL Queries
                               │ Connection Pool
┌──────────────────────────────▼──────────────────────────────┐
│                     Database (PostgreSQL)                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ projects table │  │  users table   │  │audit_logs table││
│  └────────────────┘  └────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Backend Architecture Pattern

Following the existing user-member-management module pattern:

**Controller → Service → Database**

1. **Controller Layer** (`projectController.js`)
   - Request validation
   - Response formatting
   - Error handling
   - HTTP status codes

2. **Service Layer** (`projectService.js`)
   - Business logic
   - Database queries
   - Transaction management
   - Audit logging

3. **Database Layer** (`schema.sql`)
   - Table definitions
   - Indexes
   - Constraints
   - Triggers

### Frontend Architecture Pattern

Following the existing user management module pattern:

**Component → Service → HTTP Client**

1. **Components**
   - Standalone components with inject() pattern
   - Reactive forms
   - Material Design UI
   - Loading and error states

2. **Service Layer** (`project.service.ts`)
   - BehaviorSubject state management
   - Observable streams
   - HTTP calls with JWT
   - Error handling

3. **Models** (`project.model.ts`)
   - TypeScript interfaces
   - Type safety
   - API response types

---

## Components and Interfaces

### Backend Components

#### 1. Project Router (`/routes/projectRoutes.js`)

```javascript
// Route definitions
GET    /api/projects              // List projects with pagination
GET    /api/projects/:id          // Get project details
POST   /api/projects              // Create new project
PUT    /api/projects/:id          // Update project
PATCH  /api/projects/:id/archive  // Archive project
PATCH  /api/projects/:id/unarchive // Unarchive project
```

**Middleware Stack:**
- `authenticateToken`: JWT validation
- `authorizeRoles(['admin', 'superadmin'])`: Role-based access
- `validateRequest`: Input validation

#### 2. Project Controller (`/controllers/projectController.js`)

**Responsibilities:**
- Request parameter extraction
- Input validation
- Service method invocation
- Response formatting
- Error handling

**Key Methods:**
```javascript
async getProjects(req, res)      // List with pagination/filters
async getProjectById(req, res)   // Get single project
async createProject(req, res)    // Create new project
async updateProject(req, res)    // Update existing project
async archiveProject(req, res)   // Soft delete project
async unarchiveProject(req, res) // Restore archived project
```

#### 3. Project Service (`/services/projectService.js`)

**Responsibilities:**
- Database query execution
- Business logic implementation
- Transaction management
- Audit log creation

**Key Methods:**
```javascript
async getProjects(params)        // Query with filters
async getProjectById(id, userId, userRole) // Get with permissions
async createProject(data, userId) // Insert with validation
async updateProject(id, data, userId) // Update with validation
async archiveProject(id, userId) // Soft delete
async unarchiveProject(id, userId) // Restore
async getProjectMemberCount(projectId) // Count members
```

### Frontend Components

#### 1. Project Service (`/services/project.service.ts`)

**State Management:**
```typescript
private projectsSubject = new BehaviorSubject<Project[]>([]);
public projects$ = this.projectsSubject.asObservable();

private loadingSubject = new BehaviorSubject<boolean>(false);
public loading$ = this.loadingSubject.asObservable();

private errorSubject = new BehaviorSubject<string | null>(null);
public error$ = this.errorSubject.asObservable();
```

**API Methods:**
```typescript
getProjects(params?: ProjectListParams): Observable<ProjectListResponse>
getProjectById(id: string): Observable<ProjectDetail>
createProject(data: CreateProjectRequest): Observable<Project>
updateProject(id: string, data: UpdateProjectRequest): Observable<Project>
archiveProject(id: string): Observable<Project>
unarchiveProject(id: string): Observable<Project>
```

#### 2. Project List Component (`/components/project-list/project-list.component.ts`)

**Features:**
- Material table with sorting
- Pagination controls
- Search with debounce (300ms)
- Status filter dropdown
- Create/Edit/Archive actions
- Loading and error states

**Key Properties:**
```typescript
projects: Project[] = [];
currentPage = 1;
itemsPerPage = 20;
totalItems = 0;
totalPages = 0;
searchControl = new FormControl('');
statusFilter = new FormControl('');
sortBy = 'createdAt';
sortOrder: 'asc' | 'desc' = 'desc';
```

#### 3. Project Detail Component (`/components/project-detail/project-detail.component.ts`)

**Features:**
- Project information display
- Status badge with color coding
- Member count display
- Edit/Archive/Unarchive actions
- Creator information
- Members tab placeholder

**Key Properties:**
```typescript
project: ProjectDetail | null = null;
isLoading = false;
errorMessage = '';
canEdit = false;
canArchive = false;
```

#### 4. Project Form Dialog Component (`/components/project-form-dialog/project-form-dialog.component.ts`)

**Features:**
- Reactive form with validation
- Create and edit modes
- Real-time validation feedback
- Date pickers for start/end dates
- Status dropdown
- Loading state on submit

**Form Structure:**
```typescript
projectForm = new FormGroup({
  name: new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(200)
  ]),
  description: new FormControl('', [
    Validators.required,
    Validators.maxLength(2000)
  ]),
  code: new FormControl('', [
    Validators.required,
    Validators.pattern(/^[a-zA-Z0-9_-]{3,20}$/)
  ]),
  status: new FormControl('Active'),
  startDate: new FormControl(null),
  endDate: new FormControl(null)
});
```

---

## Data Models

### Database Schema

#### Projects Table

```sql
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT check_status CHECK (status IN ('Active', 'On Hold', 'Completed', 'Archived')),
    CONSTRAINT check_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT check_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 200),
    CONSTRAINT check_code_format CHECK (code ~ '^[a-zA-Z0-9_-]{3,20}$'),
    CONSTRAINT check_description_length CHECK (char_length(description) <= 2000)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Trigger for automatic updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### Project Details View

```sql
CREATE OR REPLACE VIEW project_details AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.code,
    p.status,
    p.start_date,
    p.end_date,
    p.created_at,
    p.updated_at,
    p.settings,
    u.id as creator_id,
    u.email as creator_email,
    u.username as creator_username,
    u.first_name as creator_first_name,
    u.last_name as creator_last_name,
    COALESCE(
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id AND pm.is_active = true),
        0
    ) as member_count
FROM projects p
LEFT JOIN users u ON p.created_by = u.id;
```

### TypeScript Interfaces

#### Frontend Models (`project.model.ts`)

```typescript
export interface Project {
  id: string;
  name: string;
  description: string;
  code: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  settings: Record<string, any>;
  creator: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Archived';

export interface ProjectListParams {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectListResponse {
  projects: Project[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  code: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  settings?: Record<string, any>;
}
```

### API Response Format

Following the existing pattern:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

**Success Response Example:**
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": {
    "projects": [...],
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 20,
      "totalItems": 45,
      "totalPages": 3
    }
  }
}
```

**Error Response Example:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "code",
      "message": "Project code already exists"
    }
  ]
}
```

---

## Security

### Authentication

**JWT Token Validation:**
- All API endpoints require valid JWT access token
- Token included in `Authorization: Bearer <token>` header
- Token validation via `authenticateToken` middleware
- Automatic token refresh on 401 responses

### Authorization

**Role-Based Access Control:**

| Operation | Superadmin | Admin | Manager | Developer | Viewer |
|-----------|------------|-------|---------|-----------|--------|
| List All Projects | ✓ | ✓ | Own Only | ✗ | ✗ |
| View Project Details | ✓ | ✓ | Own Only | ✗ | ✗ |
| Create Project | ✓ | ✓ | ✗ | ✗ | ✗ |
| Update Project | ✓ | ✓ | ✗ | ✗ | ✗ |
| Archive Project | ✓ | ✓ | ✗ | ✗ | ✗ |
| Unarchive Project | ✓ | ✓ | ✗ | ✗ | ✗ |

**Permission Checks:**
```javascript
// Middleware for admin-only operations
authorizeRoles(['admin', 'superadmin'])

// Service-level permission checks
if (userRole === 'manager') {
  // Check if user is member of project
  const isMember = await checkProjectMembership(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('Access denied');
  }
}
```

### Input Validation

**Backend Validation:**
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization
- Length validation on all text fields
- Format validation on codes and dates
- Uniqueness validation on project codes

**Frontend Validation:**
- Real-time form validation
- Pattern matching for project codes
- Date range validation
- Length constraints
- Required field validation

### Audit Logging

**Logged Actions:**
- `project_created`: New project creation
- `project_updated`: Project information changes
- `project_archived`: Project archival
- `project_unarchived`: Project restoration

**Audit Log Entry:**
```javascript
{
  user_id: userId,
  action: 'project_created',
  resource: 'project',
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  status: 'success',
  details: {
    project_id: projectId,
    project_code: code,
    changed_fields: ['name', 'status'] // For updates
  }
}
```

---

## Error Handling

### Backend Error Handling

**Error Types:**

1. **Validation Errors (400 Bad Request)**
   - Invalid input format
   - Missing required fields
   - Length constraints violated
   - Date range errors

2. **Authentication Errors (401 Unauthorized)**
   - Missing JWT token
   - Invalid JWT token
   - Expired JWT token

3. **Authorization Errors (403 Forbidden)**
   - Insufficient permissions
   - Not a project member (for managers)

4. **Not Found Errors (404 Not Found)**
   - Project ID does not exist
   - Invalid UUID format

5. **Conflict Errors (409 Conflict)**
   - Duplicate project code
   - Unarchive non-archived project

6. **Server Errors (500 Internal Server Error)**
   - Database connection failures
   - Unexpected exceptions

**Error Response Format:**
```javascript
{
  success: false,
  message: "Validation failed",
  errors: [
    {
      field: "code",
      message: "Project code already exists"
    }
  ]
}
```

### Frontend Error Handling

**Error Display:**
- Toast notifications for transient errors
- Inline form validation messages
- Error banners with retry buttons
- Loading states during operations

**Error Recovery:**
```typescript
catchError((error) => {
  this.loadingSubject.next(false);
  const errorMessage = this.extractErrorMessage(error);
  this.errorSubject.next(errorMessage);
  return throwError(() => new Error(errorMessage));
})
```

### Database Error Handling

**Constraint Violations:**
- Unique constraint on `code`: Return 409 Conflict
- Foreign key constraint on `created_by`: Allow NULL on user deletion
- Check constraint on `status`: Return 400 Bad Request
- Check constraint on dates: Return 400 Bad Request

**Connection Errors:**
- Connection pool exhaustion: Retry with exponential backoff
- Query timeout: Return 500 with retry suggestion
- Transaction rollback: Ensure data consistency

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following areas of potential redundancy:

1. **Validation Properties**: Many criteria test the same validation rules (e.g., 3.4 and 3.5 both test code format validation). These have been consolidated into single comprehensive properties.

2. **Error Response Properties**: Multiple criteria test that specific errors return specific status codes (e.g., 3.5, 3.7, 3.9, 3.11, 3.13). These have been consolidated into error condition properties.

3. **Timestamp Properties**: Multiple criteria test that updated_at is automatically updated (4.14, 5.8, 6.5). These have been consolidated into a single invariant property.

4. **Authorization Properties**: Multiple criteria test the same authorization rules for different operations. These have been consolidated where the logic is identical.

5. **Response Structure Properties**: Multiple criteria test that responses contain required fields (1.10, 1.11, 2.2). These have been consolidated into comprehensive response structure properties.

The following properties represent the unique, non-redundant set of correctness properties for this module:

### Property 1: Pagination Invariant

*For any* valid pagination parameters (page number and limit), the sum of returned project counts across all pages SHALL equal the total project count, and no page SHALL exceed the specified limit (capped at 100).

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Filter Correctness

*For any* combination of filter parameters (status, date range), all returned projects SHALL match ALL specified filter criteria.

**Validates: Requirements 1.5, 1.6**

### Property 3: Search Metamorphic Property

*For any* search query (minimum 2 characters), the count of filtered results SHALL be less than or equal to the total project count, and all results SHALL contain the search query (case-insensitive) in name, description, or code fields.

**Validates: Requirements 1.7, 1.8, 1.9**

### Property 4: Response Structure Completeness

*For any* project returned by the list API, the response SHALL contain all required fields: id, name, description, code, status, start_date, end_date, member_count, created_at. The pagination metadata SHALL contain: current_page, items_per_page, total_items, total_pages.

**Validates: Requirements 1.10, 1.11**

### Property 5: Project Detail Completeness

*For any* valid project ID, the detail API response SHALL contain all required fields: id, name, description, code, status, start_date, end_date, created_by, created_at, updated_at, settings, creator information (id, email, username, first_name, last_name), and member_count.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 6: Invalid ID Error Handling

*For any* non-existent or malformed project ID, the detail, update, archive, and unarchive APIs SHALL return a 404 Not Found error (for non-existent valid UUIDs) or 400 Bad Request error (for malformed IDs).

**Validates: Requirements 2.5, 4.13, 5.6, 6.3**

### Property 7: Project Code Uniqueness

*For any* created project, the project code SHALL be unique across all projects in the database. Attempting to create a project with a duplicate code SHALL return a 409 Conflict error.

**Validates: Requirements 3.6, 3.7**

### Property 8: Project Code Immutability

*For any* project update operation, the project code SHALL remain unchanged regardless of whether a code value is provided in the update request.

**Validates: Requirements 4.3, 4.4**

### Property 9: Field Validation - Name Length

*For any* project creation or update request, if the name length is less than 3 characters or greater than 200 characters, the API SHALL return a 400 Bad Request error. If the name length is between 3 and 200 characters (inclusive), the operation SHALL succeed (assuming other validations pass).

**Validates: Requirements 3.8, 3.9, 4.5, 4.6**

### Property 10: Field Validation - Description Length

*For any* project creation or update request, if the description length exceeds 2000 characters, the API SHALL return a 400 Bad Request error. If the description length is 2000 characters or less, the operation SHALL succeed (assuming other validations pass).

**Validates: Requirements 3.10, 3.11, 4.7**

### Property 11: Field Validation - Project Code Format

*For any* project creation request, if the project code does not match the pattern `^[a-zA-Z0-9_-]{3,20}$`, the API SHALL return a 400 Bad Request error with a descriptive message. If the code matches the pattern, the operation SHALL succeed (assuming other validations pass).

**Validates: Requirements 3.4, 3.5**

### Property 12: Field Validation - Status Enum

*For any* project creation or update request, if the status is not one of ['Active', 'On Hold', 'Completed', 'Archived'], the API SHALL return a 400 Bad Request error. If the status is one of the valid values, the operation SHALL succeed (assuming other validations pass).

**Validates: Requirements 3.12, 3.13, 4.8, 4.9**

### Property 13: Field Validation - Date Range

*For any* project creation or update request where both start_date and end_date are provided, if end_date is before start_date, the API SHALL return a 400 Bad Request error. If end_date is equal to or after start_date, the operation SHALL succeed (assuming other validations pass).

**Validates: Requirements 3.16, 3.17, 4.10, 4.11**

### Property 14: Creator Assignment

*For any* created project, the created_by field SHALL be set to the authenticated user's ID, and this value SHALL never change even when the project is updated.

**Validates: Requirements 3.18, 4.3**

### Property 15: Creation Round-Trip

*For any* valid project creation request, after creating the project, retrieving it by its returned ID SHALL return a project with the same name, description, code, status, start_date, end_date, and settings values that were provided in the creation request.

**Validates: Requirements 3.1, 3.20**

### Property 16: Update Idempotence

*For any* project and any valid update data, applying the same update twice SHALL produce the same final state as applying it once (the second update returns the same data as the first).

**Validates: Requirement 4.1**

### Property 17: Timestamp Monotonicity

*For any* project update, archive, or unarchive operation, the updated_at timestamp SHALL be greater than or equal to the previous updated_at timestamp.

**Validates: Requirements 4.14, 5.8, 6.5**

### Property 18: Archival Preservation

*For any* project, after archiving, all project data (name, description, code, dates, settings, member_count) SHALL remain unchanged except for the status field, which SHALL be set to "Archived".

**Validates: Requirements 5.1, 5.2, 5.4**

### Property 19: Archival Soft Delete

*For any* archived project, the project record SHALL still exist in the database and SHALL be retrievable by its ID (though it may be filtered from list views by default).

**Validates: Requirement 5.3**

### Property 20: Archival Idempotence

*For any* project, archiving it multiple times SHALL produce the same result as archiving it once. Each archival operation SHALL succeed and return the project with status "Archived".

**Validates: Requirement 5.7**

### Property 21: Unarchival State Transition

*For any* archived project, after unarchiving, the status SHALL be set to "Active" and all other project data SHALL remain unchanged.

**Validates: Requirements 6.1, 6.2**

### Property 22: Unarchival Precondition

*For any* project that is not archived (status is Active, On Hold, or Completed), attempting to unarchive it SHALL return a 400 Bad Request error with the message "Project is not archived".

**Validates: Requirement 6.4**

### Property 23: Archive-Unarchive Round-Trip

*For any* project with status "Active", archiving then immediately unarchiving SHALL restore the status to "Active" while preserving all other project data.

**Validates: Requirements 5.1, 6.1**

### Property 24: Search Query Minimum Length

*For any* search query with fewer than 2 characters, the list API SHALL return a 400 Bad Request error. For any search query with 2 or more characters, the API SHALL process the search (assuming other parameters are valid).

**Validates: Requirement 1.8**

---

## Testing Strategy

### Dual Testing Approach

This module requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property Tests**: Verify universal properties across all inputs using randomized testing

### Property-Based Testing

**Library Selection**: **fast-check** (JavaScript/TypeScript property-based testing library)

**Why fast-check?**
- Native TypeScript support
- Excellent integration with Jest/Mocha
- Rich set of built-in generators
- Shrinking support for minimal failing examples
- Active maintenance and community

**Configuration**:
- Minimum **100 iterations** per property test
- Each property test must reference its design document property
- Tag format: `Feature: project-management, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check';

describe('Feature: project-management, Property 7: Project Code Uniqueness', () => {
  it('should enforce unique project codes across all projects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 200 }),
          description: fc.string({ maxLength: 2000 }),
          code: fc.string({ minLength: 3, maxLength: 20 })
            .filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        }),
        async (projectData) => {
          // Create first project
          const project1 = await createProject(projectData);
          expect(project1).toBeDefined();
          
          // Attempt to create second project with same code
          const result = await createProject(projectData);
          expect(result.status).toBe(409);
          expect(result.error).toContain('already exists');
          
          // Cleanup
          await deleteProject(project1.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

**Backend Unit Tests** (Jest):

1. **Controller Tests**
   - Request validation
   - Response formatting
   - Error handling
   - HTTP status codes
   - Mock service layer

2. **Service Tests**
   - Business logic
   - Database query construction
   - Transaction handling
   - Audit logging
   - Mock database layer

3. **Integration Tests**
   - Full request/response cycle
   - Database interactions
   - Authentication/authorization
   - Audit log verification
   - Real database (test instance)

**Frontend Unit Tests** (Jasmine/Karma):

1. **Service Tests**
   - HTTP client mocking
   - Observable streams
   - State management
   - Error handling
   - Token refresh logic

2. **Component Tests**
   - Template rendering
   - User interactions
   - Form validation
   - Event emissions
   - Loading/error states

3. **Integration Tests**
   - Component + Service integration
   - Routing
   - Dialog interactions
   - End-to-end user flows

### Test Coverage Goals

- **Backend**: 90% code coverage
  - Controllers: 95%
  - Services: 90%
  - Routes: 100%

- **Frontend**: 85% code coverage
  - Services: 90%
  - Components: 80%
  - Models: 100%

### Testing Pyramid

```
        /\
       /  \
      / E2E \          10% - End-to-end tests
     /______\
    /        \
   /Integration\       30% - Integration tests
  /____________\
 /              \
/   Unit + PBT   \     60% - Unit tests + Property-based tests
/__________________\
```

### Specific Test Scenarios

**Unit Test Examples**:

1. **Default Values**
   - Status defaults to "Active" when not specified
   - Settings defaults to empty object
   - Pagination defaults to 20 items per page

2. **Edge Cases**
   - Empty project list
   - Page number exceeds total pages
   - Maximum pagination limit (100)
   - Minimum search query length (2 characters)

3. **Authorization**
   - Admin can access all projects
   - Manager can only access member projects
   - Non-admin/manager receives 403 error

4. **Integration Points**
   - Creator information from users table
   - Member count from project_members table (future)
   - Audit log entries created correctly

**Property Test Examples**:

1. **Pagination Invariant** (Property 1)
   - Generate random pagination parameters
   - Verify sum across pages equals total
   - Verify no page exceeds limit

2. **Filter Correctness** (Property 2)
   - Generate random filter combinations
   - Verify all results match filters

3. **Validation Properties** (Properties 9-13)
   - Generate random valid/invalid inputs
   - Verify validation rules enforced

4. **Idempotence** (Properties 16, 20)
   - Generate random operations
   - Verify repeated operations produce same result

5. **Round-Trip** (Properties 15, 23)
   - Generate random data
   - Verify create-then-read returns same data
   - Verify archive-then-unarchive restores state

### Test Data Management

**Test Database**:
- Separate test database instance
- Automated schema migrations
- Transaction rollback after each test
- Seed data for integration tests

**Test Fixtures**:
- Factory functions for test data generation
- Realistic test data (names, codes, descriptions)
- Edge case data (boundary values, special characters)

**Cleanup Strategy**:
- Automatic cleanup after each test
- Transaction rollback for unit tests
- Explicit cleanup for integration tests
- Isolated test data per test suite

### Continuous Integration

**CI Pipeline**:
1. Lint code (ESLint, TSLint)
2. Run unit tests (backend + frontend)
3. Run property-based tests (100 iterations)
4. Run integration tests
5. Generate coverage reports
6. Run E2E tests (smoke tests)

**Quality Gates**:
- All tests must pass
- Code coverage ≥ 85%
- No critical linting errors
- Property tests pass 100/100 iterations

---

## Performance Considerations

### Backend Performance

**Database Query Optimization**:
- Parameterized queries for SQL injection prevention
- Indexes on frequently queried columns (code, status, created_at, created_by)
- Connection pooling (min: 5, max: 20 connections)
- Query result caching for list operations (5-minute TTL)
- Prepared statements for repeated queries

**API Response Times** (Target):
- List API: < 500ms for 100 projects
- Detail API: < 400ms
- Create API: < 800ms
- Update API: < 500ms
- Archive/Unarchive API: < 500ms

**Pagination Strategy**:
- Offset-based pagination for simplicity
- Maximum 100 items per page
- Default 20 items per page
- Consider cursor-based pagination for very large datasets (future)

### Frontend Performance

**State Management**:
- BehaviorSubject for reactive state
- Debounced search (300ms)
- Lazy loading for large lists
- Virtual scrolling for 100+ items (future)

**Caching Strategy**:
- Cache project list for 5 minutes
- Invalidate cache on create/update/archive/unarchive
- Cache project details for 10 minutes
- Invalidate detail cache on update

**Bundle Optimization**:
- Lazy load project module
- Tree shaking for unused code
- AOT compilation
- Minification and compression

### Scalability Considerations

**Current Scale**:
- 8+ projects
- 6 internal team members
- 5K+ external users per project

**Future Scale** (Design for):
- 100+ projects
- 50 internal team members
- 10K+ external users per project

**Scaling Strategies**:
- Database read replicas for read-heavy operations
- Redis caching for frequently accessed data
- CDN for static assets
- Horizontal scaling of API servers
- Database partitioning by project (if needed)

---

## Deployment Considerations

### Database Migrations

**Migration Strategy**:
- Version-controlled migration scripts
- Automated migration on deployment
- Rollback scripts for each migration
- Test migrations on staging environment

**Initial Migration**:
```sql
-- Create projects table
-- Create indexes
-- Create triggers
-- Create views
-- Insert seed data (if needed)
```

### Environment Configuration

**Backend Environment Variables**:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<secret>
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
PORT=5000
NODE_ENV=production
LOG_LEVEL=info
```

**Frontend Environment Variables**:
```
API_URL=http://localhost:5000/api
ENVIRONMENT=production
```

### Monitoring and Logging

**Application Logging**:
- Request/response logging
- Error logging with stack traces
- Performance metrics (response times)
- Audit log for all project operations

**Monitoring Metrics**:
- API response times
- Error rates
- Database query performance
- Active user sessions
- Cache hit rates

**Alerting**:
- API response time > 1s
- Error rate > 5%
- Database connection pool exhaustion
- Failed authentication attempts > 10/minute

---

## Future Enhancements

### Phase 1 Enhancements (Next 3 months)

1. **Project Members Management**
   - Create project_users table
   - Add/remove members per project
   - Assign project-specific roles
   - Bulk member import (CSV/Excel)

2. **Advanced Filtering**
   - Filter by creator
   - Filter by member
   - Filter by date range (start/end dates)
   - Saved filter presets

3. **Project Templates**
   - Create projects from templates
   - Template library
   - Custom template creation

### Phase 2 Enhancements (3-6 months)

1. **Project Analytics**
   - Project activity dashboard
   - Member activity tracking
   - Task completion metrics
   - Custom reports

2. **Project Settings**
   - Custom fields per project
   - Project-specific configurations
   - Notification preferences
   - Integration settings

3. **Bulk Operations**
   - Bulk archive/unarchive
   - Bulk status updates
   - Bulk export (CSV/Excel)

### Phase 3 Enhancements (6-12 months)

1. **Advanced Search**
   - Full-text search
   - Elasticsearch integration
   - Search filters and facets
   - Search history

2. **Project Collaboration**
   - Project comments
   - Activity feed
   - @mentions
   - Real-time updates (WebSocket)

3. **API Enhancements**
   - GraphQL API
   - Webhook support
   - API rate limiting
   - API versioning

---

## Appendix

### API Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/projects` | List projects | Required | Admin, Manager |
| GET | `/api/projects/:id` | Get project details | Required | Admin, Manager |
| POST | `/api/projects` | Create project | Required | Admin |
| PUT | `/api/projects/:id` | Update project | Required | Admin |
| PATCH | `/api/projects/:id/archive` | Archive project | Required | Admin |
| PATCH | `/api/projects/:id/unarchive` | Unarchive project | Required | Admin |

### Database Indexes Summary

| Table | Index Name | Columns | Purpose |
|-------|------------|---------|---------|
| projects | idx_projects_code | code | Unique constraint, fast lookup |
| projects | idx_projects_status | status | Filter by status |
| projects | idx_projects_created_by | created_by | Filter by creator |
| projects | idx_projects_created_at | created_at | Date range queries, sorting |
| projects | idx_projects_name | name | Search by name |

### Status Transition Diagram

```
┌─────────┐
│ Active  │◄─────────────────────┐
└────┬────┘                      │
     │                           │
     │ Update                    │ Unarchive
     ▼                           │
┌─────────┐                 ┌────┴────┐
│On Hold  │                 │Archived │
└────┬────┘                 └────▲────┘
     │                           │
     │ Update                    │ Archive
     ▼                           │
┌─────────┐                      │
│Completed├──────────────────────┘
└─────────┘
```

### Error Code Reference

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid input, validation failure |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Project not found |
| 409 | Conflict | Duplicate project code |
| 500 | Internal Server Error | Unexpected server error |

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-20  
**Status**: Ready for Implementation  
**Next Phase**: Task Creation
