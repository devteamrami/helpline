# Requirements Document: Task Management Module

## Introduction

The Task Management module provides comprehensive task administration capabilities for the Ramiscope Project Management System. This module enables project members to create, view, edit, assign, and track tasks within projects. Each project can have multiple tasks with different statuses, priorities, and assignments.

The system currently has:
- User authentication and team management for 6 internal employees
- Project management with 8+ projects
- Project members management

This module extends the system to support task tracking within projects, enabling teams to organize work, track progress, and collaborate effectively.

## Glossary

- **Task**: A unit of work within a project with title, description, status, priority, assignee, and dates
- **Task_Status**: Current state of the task (To Do, In Progress, In Review, Done, Blocked)
- **Task_Priority**: Importance level of the task (Low, Medium, High, Critical)
- **Task_Assignee**: Project member assigned to work on the task
- **Task_Creator**: User who created the task
- **Project_Task**: Task associated with a specific project
- **Task_List_API**: Backend API endpoint that returns paginated task lists with filtering
- **Task_Details_API**: Backend API endpoint that returns detailed information about a specific task
- **Task_Creation_API**: Backend API endpoint that creates new task records
- **Task_Update_API**: Backend API endpoint that modifies existing task information
- **Task_Delete_API**: Backend API endpoint that deletes tasks (soft delete)
- **Task_Assignment_API**: Backend API endpoint that assigns tasks to project members
- **Task_List_Component**: Frontend Angular component displaying tasks in a list/board view
- **Task_Detail_Component**: Frontend Angular component displaying complete task information
- **Task_Form_Dialog**: Frontend Angular dialog component for creating and editing tasks
- **Task_Service**: Frontend Angular service managing API calls for task operations

## Requirements

### Requirement 1: Task List Retrieval

**User Story:** As a project member, I want to view all tasks in a project with filtering and search, so that I can track work progress.

#### Acceptance Criteria

1. WHEN a project member requests the task list, THE Task_List_API SHALL return all tasks for the specified project
2. THE Task_List_API SHALL support pagination with page number and limit parameters
3. THE Task_List_API SHALL support filtering by status, priority, and assignee
4. THE Task_List_API SHALL support search by title and description
5. THE Task_List_API SHALL return task data including id, title, description, status, priority, assignee, creator, due date, and created date
6. THE Task_List_API SHALL enforce access control (only project members can view tasks)
7. THE Task_List_API SHALL complete the request within 500 milliseconds

### Requirement 2: Task Detail Retrieval

**User Story:** As a project member, I want to view detailed information about a specific task, so that I can understand its requirements and progress.

#### Acceptance Criteria

1. WHEN a valid task ID is provided, THE Task_Details_API SHALL return complete task information
2. THE Task_Details_API SHALL return task data including all fields plus comments count and attachments count
3. WHEN an invalid task ID is provided, THE Task_Details_API SHALL return a 404 Not Found error
4. THE Task_Details_API SHALL enforce access control (only project members can view task details)

### Requirement 3: Task Creation

**User Story:** As a project member, I want to create new tasks, so that I can organize work within the project.

#### Acceptance Criteria

1. WHEN a project member provides valid task data, THE Task_Creation_API SHALL create a new task record
2. THE Task_Creation_API SHALL require title and project_id
3. THE Task_Creation_API SHALL accept optional description, status, priority, assignee_id, and due_date
4. THE Task_Creation_API SHALL validate title length between 3 and 200 characters
5. THE Task_Creation_API SHALL validate description length does not exceed 5000 characters
6. THE Task_Creation_API SHALL validate status is one of: To Do, In Progress, In Review, Done, Blocked
7. THE Task_Creation_API SHALL validate priority is one of: Low, Medium, High, Critical
8. THE Task_Creation_API SHALL default status to "To Do" when not specified
9. THE Task_Creation_API SHALL default priority to "Medium" when not specified
10. THE Task_Creation_API SHALL set created_by to the authenticated user's ID
11. THE Task_Creation_API SHALL log the creation action in the audit log

### Requirement 4: Task Information Update

**User Story:** As a project member, I want to update task information, so that I can keep task details current.

#### Acceptance Criteria

1. WHEN a project member provides valid update data, THE Task_Update_API SHALL modify the specified task
2. THE Task_Update_API SHALL allow updating title, description, status, priority, assignee_id, and due_date
3. THE Task_Update_API SHALL validate all fields using the same rules as creation
4. THE Task_Update_API SHALL update the updated_at timestamp automatically
5. THE Task_Update_API SHALL log the update action in the audit log

### Requirement 5: Task Assignment

**User Story:** As a project member, I want to assign tasks to team members, so that work can be distributed effectively.

#### Acceptance Criteria

1. WHEN a project member assigns a task, THE Task_Assignment_API SHALL update the assignee_id field
2. THE Task_Assignment_API SHALL validate the assignee is a member of the project
3. WHEN assignee is not a project member, THE Task_Assignment_API SHALL return a 400 Bad Request error
4. THE Task_Assignment_API SHALL allow unassigning tasks (set assignee_id to null)
5. THE Task_Assignment_API SHALL log the assignment action in the audit log

### Requirement 6: Task Deletion

**User Story:** As a project member, I want to delete tasks, so that I can remove obsolete or duplicate tasks.

#### Acceptance Criteria

1. WHEN a project member requests task deletion, THE Task_Delete_API SHALL soft delete the task
2. THE Task_Delete_API SHALL set is_deleted flag to true
3. THE Task_Delete_API SHALL preserve all task data
4. THE Task_Delete_API SHALL exclude deleted tasks from list views by default
5. THE Task_Delete_API SHALL log the deletion action in the audit log

### Requirement 7: Task List Display Component

**User Story:** As a project member, I want to view tasks in a list with filtering and sorting, so that I can efficiently manage work.

#### Acceptance Criteria

1. THE Task_List_Component SHALL display tasks in a table with columns for title, status, priority, assignee, due date, and actions
2. THE Task_List_Component SHALL support filtering by status, priority, and assignee
3. THE Task_List_Component SHALL support search by title
4. THE Task_List_Component SHALL support sorting by title, status, priority, due date, and created date
5. THE Task_List_Component SHALL display an "Add Task" button
6. THE Task_List_Component SHALL display action buttons (view, edit, delete) for each task
7. THE Task_List_Component SHALL display status badges with color coding
8. THE Task_List_Component SHALL display priority badges with color coding

### Requirement 8: Task Detail Display Component

**User Story:** As a project member, I want to view complete task details, so that I can understand all task information.

#### Acceptance Criteria

1. THE Task_Detail_Component SHALL display all task information including title, description, status, priority, assignee, creator, dates
2. THE Task_Detail_Component SHALL display an "Edit" button
3. THE Task_Detail_Component SHALL display a "Delete" button
4. THE Task_Detail_Component SHALL display an "Assign" button
5. THE Task_Detail_Component SHALL display status and priority badges with color coding

### Requirement 9: Task Form Dialog Component

**User Story:** As a project member, I want to create and edit tasks through a form dialog, so that I can manage task records with proper validation.

#### Acceptance Criteria

1. THE Task_Form_Dialog SHALL display a reactive form with fields for title, description, status, priority, assignee, and due date
2. THE Task_Form_Dialog SHALL validate title length between 3 and 200 characters
3. THE Task_Form_Dialog SHALL validate description length does not exceed 5000 characters
4. THE Task_Form_Dialog SHALL display status dropdown with all valid options
5. THE Task_Form_Dialog SHALL display priority dropdown with all valid options
6. THE Task_Form_Dialog SHALL display assignee dropdown with project members
7. THE Task_Form_Dialog SHALL display date picker for due date
8. THE Task_Form_Dialog SHALL disable the submit button when the form is invalid

### Requirement 10: Audit Logging for Task Management

**User Story:** As a system administrator, I want all task management actions logged, so that I can track changes for security and compliance.

#### Acceptance Criteria

1. WHEN a task is created, THE Task_Management_System SHALL log the action with type "task_created"
2. WHEN a task is updated, THE Task_Management_System SHALL log the action with type "task_updated"
3. WHEN a task is assigned, THE Task_Management_System SHALL log the action with type "task_assigned"
4. WHEN a task is deleted, THE Task_Management_System SHALL log the action with type "task_deleted"
5. THE Task_Management_System SHALL include the performing user's ID in all audit log entries

---

## Database Schema

### Tasks Table

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'To Do',
    priority VARCHAR(20) DEFAULT 'Medium',
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_status CHECK (status IN ('To Do', 'In Progress', 'In Review', 'Done', 'Blocked')),
    CONSTRAINT check_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    CONSTRAINT check_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
    CONSTRAINT check_description_length CHECK (description IS NULL OR char_length(description) <= 5000)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_deleted ON tasks(is_deleted);
```

---

## API Endpoints

### Backend Routes

```
GET    /api/v1/projects/:projectId/tasks              // List tasks
GET    /api/v1/projects/:projectId/tasks/:id          // Get task details
POST   /api/v1/projects/:projectId/tasks              // Create task
PUT    /api/v1/projects/:projectId/tasks/:id          // Update task
PATCH  /api/v1/projects/:projectId/tasks/:id/assign   // Assign task
DELETE /api/v1/projects/:projectId/tasks/:id          // Delete task
```

---

## Status

**Status:** Ready for Implementation  
**Priority:** High  
**Dependencies:** Project Management Module, Project Members Module  
**Estimated Effort:** 3-4 days

