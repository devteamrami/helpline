# Requirements Document: Task Tracking & Collaboration Enhancement

## Introduction

This document outlines the enhancements to the existing Task Management module to add advanced time tracking, collaboration features, and activity logging. The enhancements enable team members to track actual work time, collaborate on tasks, and maintain a complete audit trail of all task activities.

## Overview

The enhanced system will support:
- **Time Tracking:** Start/Pause/Complete functionality with UTC timestamps
- **Estimated vs Actual Hours:** Track estimated hours and auto-calculate actual hours
- **Multi-user Support:** Multiple employees can work on the same task simultaneously
- **Activity/Comments:** Task updates, blockers, pause reasons, work logs
- **Audit History:** Complete tracking of all changes and actions
- **Enhanced UI:** Display time metrics in list view for quick monitoring

## Database Schema Changes

### 1. Tasks Table Enhancements
**New Columns:**
- `estimated_hours` DECIMAL(10, 2) - Estimated hours to complete
- `actual_hours` DECIMAL(10, 2) DEFAULT 0 - Auto-calculated from time logs

### 2. New Table: task_time_logs
**Purpose:** Track time spent by users on tasks

**Columns:**
- `id` UUID PRIMARY KEY
- `task_id` UUID (FK to tasks)
- `user_id` UUID (FK to users)
- `start_time` TIMESTAMP WITH TIME ZONE (UTC)
- `end_time` TIMESTAMP WITH TIME ZONE (UTC, nullable)
- `duration_minutes` INTEGER (calculated)
- `is_active` BOOLEAN (indicates if currently working)
- `created_at` TIMESTAMP WITH TIME ZONE

**Constraints:**
- Only one active time log per user at a time
- end_time must be after start_time
- duration_minutes must be non-negative

### 3. New Table: task_comments
**Purpose:** Store task activity updates and comments

**Columns:**
- `id` UUID PRIMARY KEY
- `task_id` UUID (FK to tasks)
- `user_id` UUID (FK to users)
- `comment` TEXT (1-5000 characters)
- `comment_type` VARCHAR(50)
- `created_at` TIMESTAMP WITH TIME ZONE
- `updated_at` TIMESTAMP WITH TIME ZONE
- `is_deleted` BOOLEAN

**Comment Types:**
- `general` - General comments
- `work_update` - Work progress updates
- `blocker` - Blockers or issues
- `pause_reason` - Reason for pausing work
- `testing` - Testing updates
- `manual_hours` - Manually logged hours

### 4. New Table: task_history
**Purpose:** Audit trail for all task changes

**Columns:**
- `id` UUID PRIMARY KEY
- `task_id` UUID (FK to tasks)
- `user_id` UUID (FK to users)
- `action` VARCHAR(50)
- `field_name` VARCHAR(100)
- `old_value` TEXT
- `new_value` TEXT
- `created_at` TIMESTAMP WITH TIME ZONE

**Actions:**
- `created`, `updated`, `status_changed`, `assigned`, `unassigned`
- `started`, `paused`, `completed`, `comment_added`, `time_logged`

## Functional Requirements

### FR1: Time Tracking - Start Task
**User Story:** As a team member assigned to a task, I want to start working on it so that my time is tracked automatically.

**Acceptance Criteria:**
1. Only assigned team members can start a task
2. Starting a task creates a new time log entry with start_time (UTC)
3. Time log is marked as active (is_active = true)
4. User can only have one active time log at a time
5. Task status automatically changes to "In Progress" if not already
6. Action is logged in task_history
7. System notification/comment is added

### FR2: Time Tracking - Pause Task
**User Story:** As a team member working on a task, I want to pause my work so that inactive time is not counted.

**Acceptance Criteria:**
1. Only the user with an active time log can pause
2. Pausing sets end_time (UTC) on the active time log
3. Duration is calculated: (end_time - start_time) in minutes
4. Time log is marked as inactive (is_active = false)
5. Actual hours on task are updated (sum of all durations)
6. User can optionally provide a pause reason (creates comment)
7. Action is logged in task_history

### FR3: Time Tracking - Resume Task
**User Story:** As a team member who paused a task, I want to resume work so that I can continue time tracking.

**Acceptance Criteria:**
1. Resuming creates a new time log entry with current start_time
2. Previous time log remains closed with its duration
3. New time log is marked as active
4. Action is logged in task_history

### FR4: Time Tracking - Complete Task
**User Story:** As a team member, I want to mark a task as complete so that my final time is recorded.

**Acceptance Criteria:**
1. Completing stops any active time logs for the user
2. Task status changes to "Done"
3. Final actual hours are calculated
4. User can add completion notes (creates comment)
5. Action is logged in task_history
6. All team members' time logs are preserved

### FR5: Estimated Hours
**User Story:** As a project manager, I want to set estimated hours for tasks so that I can track progress against estimates.

**Acceptance Criteria:**
1. Estimated hours can be set during task creation
2. Estimated hours can be updated during task editing
3. Estimated hours must be non-negative
4. Estimated hours are displayed in task list view
5. System shows variance (actual vs estimated)

### FR6: Actual Hours Calculation
**User Story:** As a project manager, I want to see actual hours worked so that I can monitor task progress.

**Acceptance Criteria:**
1. Actual hours are auto-calculated from time logs
2. Calculation: SUM(duration_minutes) / 60 for all time logs
3. Actual hours update when time logs are stopped
4. Actual hours are displayed in task list view
5. System shows progress percentage (actual / estimated * 100)

### FR7: Multi-user Time Tracking
**User Story:** As a team member, I want to work on a task while others are also working so that we can collaborate.

**Acceptance Criteria:**
1. Multiple users can have active time logs on the same task
2. Each user's time is tracked separately
3. Total actual hours = sum of all users' time
4. Task detail shows all active workers
5. Each user can only start/pause their own time log

### FR8: Task Comments - Add Comment
**User Story:** As a team member, I want to add comments to tasks so that I can communicate updates.

**Acceptance Criteria:**
1. Any project member can add comments
2. Comments have types (general, work_update, blocker, etc.)
3. Comments are timestamped (UTC)
4. Comments support 1-5000 characters
5. Comments are displayed in chronological order
6. Action is logged in task_history

### FR9: Task Comments - View Comments
**User Story:** As a team member, I want to view all task comments so that I can see the activity history.

**Acceptance Criteria:**
1. Comments are displayed with user info and timestamp
2. Comments show comment type badge
3. Comments are paginated (20 per page)
4. Most recent comments appear first
5. Deleted comments are hidden

### FR10: Task Comments - Edit/Delete Comment
**User Story:** As a comment author, I want to edit or delete my comments so that I can correct mistakes.

**Acceptance Criteria:**
1. Only comment author can edit/delete their own comments
2. Editing updates the comment text and updated_at timestamp
3. Deleting is soft delete (is_deleted = true)
4. Edit history is tracked in task_history

### FR11: Task History - View History
**User Story:** As a project manager, I want to view complete task history so that I can audit changes.

**Acceptance Criteria:**
1. History shows all actions chronologically
2. History includes user who performed action
3. History shows old and new values for changes
4. History is paginated
5. History includes time tracking actions

### FR12: Enhanced Task List View
**User Story:** As a project manager, I want to see estimated and actual hours in the task list so that I can monitor progress quickly.

**Acceptance Criteria:**
1. Task list displays estimated hours column
2. Task list displays actual hours column
3. Task list shows progress indicator (actual/estimated)
4. Progress indicator is color-coded (green: on track, yellow: near estimate, red: over estimate)
5. Task list shows active workers count

### FR13: Enhanced Task Detail View
**User Story:** As a team member, I want to see detailed time tracking info so that I can understand task progress.

**Acceptance Criteria:**
1. Task detail shows estimated vs actual hours prominently
2. Task detail shows all time logs with user and duration
3. Task detail shows currently active workers
4. Task detail shows Start/Pause/Complete buttons based on state
5. Task detail shows comments/activity section
6. Task detail shows history section

## Non-Functional Requirements

### NFR1: Performance
- Time log queries must complete within 200ms
- Comment queries must complete within 300ms
- History queries must complete within 500ms
- Actual hours calculation must be efficient (use database aggregation)

### NFR2: Data Integrity
- All timestamps must be stored in UTC
- Time log constraints must be enforced at database level
- Actual hours must always match sum of time logs
- One active time log per user constraint must be enforced

### NFR3: Security
- Only assigned team members can start/pause tasks
- Only comment authors can edit/delete their comments
- All actions must be authenticated
- All actions must be audited

### NFR4: Usability
- UI must be clean and modern
- Time tracking buttons must be prominent and easy to use
- Progress indicators must be intuitive
- Comments section must be easy to navigate

### NFR5: Scalability
- System must support 1000+ tasks per project
- System must support 100+ time logs per task
- System must support 500+ comments per task
- Pagination must be implemented for all lists

## API Endpoints

### Time Tracking
```
POST   /api/v1/projects/:projectId/tasks/:taskId/start
POST   /api/v1/projects/:projectId/tasks/:taskId/pause
POST   /api/v1/projects/:projectId/tasks/:taskId/complete
GET    /api/v1/projects/:projectId/tasks/:taskId/time-logs
GET    /api/v1/projects/:projectId/tasks/:taskId/active-workers
```

### Comments
```
GET    /api/v1/projects/:projectId/tasks/:taskId/comments
POST   /api/v1/projects/:projectId/tasks/:taskId/comments
PUT    /api/v1/projects/:projectId/tasks/:taskId/comments/:commentId
DELETE /api/v1/projects/:projectId/tasks/:taskId/comments/:commentId
```

### History
```
GET    /api/v1/projects/:projectId/tasks/:taskId/history
```

## UI Components

### Enhanced Task List
- Add "Estimated Hours" column
- Add "Actual Hours" column
- Add "Progress" column with visual indicator
- Add "Active Workers" badge

### Enhanced Task Detail
- Add time tracking section with Start/Pause/Complete buttons
- Add estimated vs actual hours display
- Add active workers list
- Add time logs section
- Add comments/activity section
- Add history section

### Time Tracking Widget
- Show current timer if active
- Show elapsed time
- Show pause button if active
- Show start button if not active
- Show complete button

### Comments Section
- Comment input with type selector
- Comment list with pagination
- Comment actions (edit, delete)
- Comment type badges

## Success Metrics

1. **Time Tracking Adoption:** 80% of tasks have time logs
2. **Accuracy:** Actual hours within 20% of estimated hours
3. **Collaboration:** Average 2+ users per task
4. **Communication:** Average 5+ comments per task
5. **Performance:** All queries under target response times

## Status

**Status:** Ready for Implementation  
**Priority:** High  
**Dependencies:** Task Management Module (Complete)  
**Estimated Effort:** 5-7 days

