# Implementation Plan: Task Tracking & Collaboration Enhancement

## Overview

This implementation plan enhances the existing Task Management module with advanced time tracking, collaboration features, and activity logging.

**Technology Stack:**
- Backend: Node.js/Express (port 5000)
- Frontend: Angular 21.2.0 with standalone components
- Database: PostgreSQL with UUID primary keys

**Key Features:**
- Start/Pause/Complete time tracking with UTC timestamps
- Estimated vs Actual hours tracking
- Multi-user support (multiple employees on same task)
- Activity/Comments system
- Complete audit history
- Enhanced UI with time metrics

---

## Tasks

### Phase 1: Database & Backend Foundation

#### Task 1: Database Schema Updates
- [x] Add estimated_hours and actual_hours columns to tasks table
- [x] Create task_time_logs table
- [x] Create task_comments table
- [x] Create task_history table
- [ ] Run database migrations
- [ ] Verify constraints and indexes

#### Task 2: Time Tracking Service
- [ ] Create `taskTimeTracking.service.js`
- [ ] Implement `startTask(taskId, userId, auditInfo)` - Create active time log
- [ ] Implement `pauseTask(taskId, userId, pauseReason, auditInfo)` - Stop active time log
- [ ] Implement `completeTask(taskId, userId, completionNotes, auditInfo)` - Stop all logs, mark done
- [ ] Implement `getTimeLogs(taskId)` - Get all time logs for task
- [ ] Implement `getActiveWorkers(taskId)` - Get users with active time logs
- [ ] Implement `calculateActualHours(taskId)` - Sum all durations
- [ ] Implement `getUserActiveTimeLog(userId)` - Check if user has active log
- [ ] Add audit logging for all operations

#### Task 3: Comments Service
- [ ] Create `taskComments.service.js`
- [ ] Implement `getComments(taskId, params)` - Get comments with pagination
- [ ] Implement `addComment(taskId, userId, comment, commentType, auditInfo)` - Create comment
- [ ] Implement `updateComment(commentId, userId, comment, auditInfo)` - Update own comment
- [ ] Implement `deleteComment(commentId, userId, auditInfo)` - Soft delete own comment
- [ ] Add audit logging for all operations

#### Task 4: History Service
- [ ] Create `taskHistory.service.js`
- [ ] Implement `getHistory(taskId, params)` - Get history with pagination
- [ ] Implement `logAction(taskId, userId, action, fieldName, oldValue, newValue)` - Create history entry
- [ ] Implement helper methods for common actions

#### Task 5: Update Task Service
- [ ] Update `createTask` to accept estimated_hours
- [ ] Update `updateTask` to accept estimated_hours
- [ ] Update `getTasks` to include estimated_hours, actual_hours, active_workers_count
- [ ] Update `getTaskById` to include time tracking details
- [ ] Add method to recalculate actual_hours from time logs

#### Task 6: Controllers
- [ ] Create `taskTimeTracking.controller.js` with 5 endpoints
- [ ] Create `taskComments.controller.js` with 4 endpoints
- [ ] Create `taskHistory.controller.js` with 1 endpoint
- [ ] Update `task.controller.js` to include new fields

#### Task 7: Validators
- [ ] Create `taskTimeTracking.validator.js`
- [ ] Create `taskComments.validator.js`
- [ ] Update `task.validator.js` to validate estimated_hours

#### Task 8: Routes
- [ ] Create `taskTimeTracking.routes.js` with 5 routes
- [ ] Create `taskComments.routes.js` with 4 routes
- [ ] Create `taskHistory.routes.js` with 1 route
- [ ] Register all routes in main router

### Phase 2: Frontend Models & Services

#### Task 9: Update Models
- [ ] Update `task.model.ts` to include estimated_hours, actual_hours
- [ ] Create `task-time-log.model.ts` with TimeLog interface
- [ ] Create `task-comment.model.ts` with Comment interface
- [ ] Create `task-history.model.ts` with History interface

#### Task 10: Time Tracking Service
- [ ] Create `task-time-tracking.service.ts`
- [ ] Implement `startTask(projectId, taskId)` method
- [ ] Implement `pauseTask(projectId, taskId, pauseReason)` method
- [ ] Implement `completeTask(projectId, taskId, completionNotes)` method
- [ ] Implement `getTimeLogs(projectId, taskId)` method
- [ ] Implement `getActiveWorkers(projectId, taskId)` method
- [ ] Add BehaviorSubject for active time log state

#### Task 11: Comments Service
- [ ] Create `task-comments.service.ts`
- [ ] Implement `getComments(projectId, taskId, params)` method
- [ ] Implement `addComment(projectId, taskId, comment)` method
- [ ] Implement `updateComment(projectId, taskId, commentId, comment)` method
- [ ] Implement `deleteComment(projectId, taskId, commentId)` method
- [ ] Add BehaviorSubject for comments state

#### Task 12: History Service
- [ ] Create `task-history.service.ts`
- [ ] Implement `getHistory(projectId, taskId, params)` method
- [ ] Add BehaviorSubject for history state

#### Task 13: Update Task Service
- [ ] Update `getTasks` to handle new fields
- [ ] Update `createTask` to accept estimated_hours
- [ ] Update `updateTask` to accept estimated_hours
- [ ] Update state management for new fields

### Phase 3: Frontend Components

#### Task 14: Enhanced Task List Component
- [ ] Update `task-list.component.ts` to display new columns
- [ ] Add "Estimated Hours" column
- [ ] Add "Actual Hours" column
- [ ] Add "Progress" column with visual indicator
- [ ] Add "Active Workers" badge
- [ ] Update sorting to include new columns
- [ ] Update styles for new columns

#### Task 15: Time Tracking Widget Component
- [ ] Create `time-tracking-widget.component.ts`
- [ ] Create HTML template with Start/Pause/Complete buttons
- [ ] Create SCSS styles
- [ ] Show current timer if active
- [ ] Show elapsed time counter
- [ ] Handle button states based on user's active log
- [ ] Show pause reason dialog
- [ ] Show completion notes dialog

#### Task 16: Task Detail Enhancement
- [ ] Update `task-detail.component.ts`
- [ ] Add time tracking section
- [ ] Add estimated vs actual hours display
- [ ] Add progress indicator
- [ ] Add active workers list
- [ ] Integrate time tracking widget
- [ ] Add tabs for Comments and History

#### Task 17: Time Logs Component
- [ ] Create `task-time-logs.component.ts`
- [ ] Create HTML template with time logs table
- [ ] Create SCSS styles
- [ ] Display all time logs with user, start, end, duration
- [ ] Show active logs differently
- [ ] Group by user
- [ ] Show total hours per user

#### Task 18: Comments Component
- [ ] Create `task-comments.component.ts`
- [ ] Create HTML template
- [ ] Create SCSS styles
- [ ] Display comment input with type selector
- [ ] Display comments list with pagination
- [ ] Show comment type badges
- [ ] Show user avatar and name
- [ ] Show timestamp
- [ ] Add edit/delete actions for own comments
- [ ] Handle comment types with different icons/colors

#### Task 19: History Component
- [ ] Create `task-history.component.ts`
- [ ] Create HTML template
- [ ] Create SCSS styles
- [ ] Display history timeline
- [ ] Show action icons
- [ ] Show user and timestamp
- [ ] Show old/new values for changes
- [ ] Add pagination

#### Task 20: Update Task Form Dialog
- [ ] Update `task-form-dialog.component.ts`
- [ ] Add estimated_hours field
- [ ] Add validation for estimated_hours
- [ ] Update form submission

### Phase 4: Integration & Polish

#### Task 21: Integration Testing
- [ ] Test start/pause/complete flow
- [ ] Test multi-user time tracking
- [ ] Test comments CRUD operations
- [ ] Test history tracking
- [ ] Test actual hours calculation
- [ ] Test progress indicators
- [ ] Test permissions

#### Task 22: UI/UX Polish
- [ ] Ensure consistent styling
- [ ] Add smooth animations
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success notifications
- [ ] Ensure responsive design
- [ ] Add tooltips and help text

#### Task 23: Performance Optimization
- [ ] Optimize time log queries
- [ ] Optimize comment queries
- [ ] Optimize history queries
- [ ] Add caching where appropriate
- [ ] Test with large datasets

#### Task 24: Documentation
- [ ] Update API documentation
- [ ] Create user guide for time tracking
- [ ] Create user guide for comments
- [ ] Document new database tables
- [ ] Update architecture documentation

---

## Implementation Order

### Week 1: Backend Foundation
- Days 1-2: Database schema, migrations, time tracking service
- Days 3-4: Comments service, history service, update task service
- Day 5: Controllers, validators, routes

### Week 2: Frontend Implementation
- Days 1-2: Models, services, enhanced task list
- Days 3-4: Time tracking widget, task detail enhancement
- Day 5: Time logs component, comments component

### Week 3: Integration & Polish
- Days 1-2: History component, task form updates, integration
- Days 3-4: Testing, bug fixes, UI/UX polish
- Day 5: Performance optimization, documentation

---

## Key Features Summary

### Time Tracking
✅ Start task - Creates active time log  
✅ Pause task - Stops time log, calculates duration  
✅ Complete task - Stops all logs, marks task done  
✅ Multi-user support - Multiple users can work simultaneously  
✅ UTC timestamps - All times stored in UTC  
✅ Actual hours - Auto-calculated from time logs  

### Estimated vs Actual
✅ Estimated hours field - Set during create/edit  
✅ Actual hours display - Auto-calculated  
✅ Progress indicator - Visual representation  
✅ Variance tracking - Compare estimated vs actual  

### Comments/Activity
✅ Add comments - With type selection  
✅ Comment types - general, work_update, blocker, pause_reason, testing, manual_hours  
✅ Edit/delete - Own comments only  
✅ Pagination - 20 comments per page  

### History/Audit
✅ Complete audit trail - All actions logged  
✅ Field-level tracking - Old and new values  
✅ User attribution - Who did what  
✅ Timestamp tracking - When it happened  

### Enhanced UI
✅ Time metrics in list - Estimated, actual, progress  
✅ Active workers badge - Show who's working  
✅ Time tracking widget - Prominent buttons  
✅ Comments section - Easy communication  
✅ History timeline - Visual audit trail  

---

## Notes

- All timestamps must be in UTC
- Only assigned team members can start/pause tasks
- Users can only have one active time log at a time
- Actual hours are auto-calculated, not manually editable
- Comments support markdown formatting (future enhancement)
- History is append-only, never deleted
- All operations are audited
- Frontend uses modern Angular 21.2.0 patterns
- Backend follows existing service/controller/route patterns

