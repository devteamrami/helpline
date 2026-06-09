/**
 * Task List Component
 * Displays and manages tasks for a project
 */

import { Component, Input, OnInit, OnDestroy, inject, ViewContainerRef, ComponentRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskStatus, TaskPriority, TaskListParams } from '../../../core/models/task.model';
import { TaskFormDialogComponent } from '../task-form-dialog/task-form-dialog.component';
import { TaskDetailDialogComponent } from '../task-detail-dialog/task-detail-dialog.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  @Input() projectId!: string;

  // Data
  tasks: Task[] = [];
  isLoading = false;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  totalPages = 0;

  // Filters
  searchControl = new FormControl('');
  statusFilter = new FormControl<TaskStatus | ''>('');
  priorityFilter = new FormControl<TaskPriority | ''>('');
  assigneeFilter = new FormControl('');

  // Sorting
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Permissions
  canManageTasks = false;

  // Dialog reference
  private dialogRef: ComponentRef<TaskFormDialogComponent> | null = null;

  // Options
  statusOptions: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'];
  priorityOptions: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];

  ngOnInit(): void {
    this.checkPermissions();
    this.setupSearchDebounce();
    this.setupFilterListeners();
    this.loadTasks();
    this.subscribeToTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check user permissions
   */
  private checkPermissions(): void {
    const currentUser = this.authService.currentUserValue;
    const userRole = currentUser?.role || '';
    this.canManageTasks = ['superadmin', 'admin', 'manager'].includes(userRole);
  }

  /**
   * Setup search debounce
   */
  private setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTasks();
      });
  }

  /**
   * Setup filter listeners
   */
  private setupFilterListeners(): void {
    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTasks();
      });

    this.priorityFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTasks();
      });

    this.assigneeFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTasks();
      });
  }

  /**
   * Subscribe to tasks state
   */
  private subscribeToTasks(): void {
    this.taskService.tasks$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.tasks = tasks;
      });
  }

  /**
   * Load tasks
   */
  loadTasks(): void {
    if (!this.projectId) return;

    this.isLoading = true;
    this.errorMessage = '';

    const params: TaskListParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    const search = this.searchControl.value;
    if (search && search.length >= 2) {
      params.search = search;
    }

    const status = this.statusFilter.value;
    if (status) {
      params.status = status;
    }

    const priority = this.priorityFilter.value;
    if (priority) {
      params.priority = priority;
    }

    const assigneeId = this.assigneeFilter.value;
    if (assigneeId) {
      params.assigneeId = assigneeId;
    }

    this.taskService.getTasks(this.projectId, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.totalItems = response.pagination.totalItems;
          this.totalPages = response.pagination.totalPages;
          this.currentPage = response.pagination.currentPage;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Sort by column
   */
  sortByColumn(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.loadTasks();
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadTasks();
  }

  /**
   * Open create task dialog
   */
  openCreateDialog(): void {
    this.dialogRef = this.viewContainerRef.createComponent(TaskFormDialogComponent);
    
    document.body.appendChild(this.dialogRef.location.nativeElement);
    
    this.dialogRef.instance.data = {
      mode: 'create',
      projectId: this.projectId
    };

    this.dialogRef.instance.onClose = () => {
      this.closeDialog();
    };

    this.dialogRef.instance.onSuccess = () => {
      this.loadTasks();
    };
  }

  /**
   * Open edit task dialog
   */
  openEditDialog(task: Task): void {
    this.dialogRef = this.viewContainerRef.createComponent(TaskFormDialogComponent);
    
    document.body.appendChild(this.dialogRef.location.nativeElement);
    
    this.dialogRef.instance.data = {
      mode: 'edit',
      projectId: this.projectId,
      task: task
    };

    this.dialogRef.instance.onClose = () => {
      this.closeDialog();
    };

    this.dialogRef.instance.onSuccess = () => {
      this.loadTasks();
    };
  }

  /**
   * Close dialog
   */
  private closeDialog(): void {
    if (this.dialogRef) {
      const element = this.dialogRef.location.nativeElement;
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.dialogRef.destroy();
      this.dialogRef = null;
    }
  }

  /**
   * Delete task
   */
  deleteTask(task: Task): void {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    this.taskService.deleteTask(this.projectId, task.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (error) => {
          alert(`Failed to delete task: ${error.message}`);
        }
      });
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: TaskStatus): string {
    const statusClasses: Record<TaskStatus, string> = {
      'To Do': 'status-todo',
      'In Progress': 'status-in-progress',
      'In Review': 'status-in-review',
      'Done': 'status-done',
      'Blocked': 'status-blocked'
    };
    return statusClasses[status] || '';
  }

  /**
   * Get priority badge class
   */
  getPriorityClass(priority: TaskPriority): string {
    const priorityClasses: Record<TaskPriority, string> = {
      'Low': 'priority-low',
      'Medium': 'priority-medium',
      'High': 'priority-high',
      'Critical': 'priority-critical'
    };
    return priorityClasses[priority] || '';
  }

  /**
   * Get assignee display name
   */
  getAssigneeName(task: Task): string {
    if (!task.assignee) return 'Unassigned';
    const { firstName, lastName, username } = task.assignee;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return username;
  }

  /**
   * Get assignee display name from TaskAssignee
   */
  getAssigneeDisplayName(assignee: { firstName?: string; lastName?: string; username: string }): string {
    if (assignee.firstName && assignee.lastName) {
      return `${assignee.firstName} ${assignee.lastName}`;
    }
    return assignee.username;
  }

  /**
   * Get assignee initials
   */
  getAssigneeInitials(assignee: { firstName?: string; lastName?: string; username: string }): string {
    if (assignee.firstName && assignee.lastName) {
      return `${assignee.firstName[0]}${assignee.lastName[0]}`.toUpperCase();
    }
    return assignee.username.substring(0, 2).toUpperCase();
  }

  /**
   * Get more assignees text
   */
  getMoreAssigneesText(task: Task): string {
    if (!task.assignees || task.assignees.length <= 3) return '';
    const remaining = task.assignees.slice(3);
    return remaining.map(a => this.getAssigneeDisplayName(a)).join(', ');
  }

  /**
   * Format date for display
   */
  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(task: Task): number {
    if (!task.estimatedHours || task.estimatedHours === 0) return 0;
    const percentage = (task.actualHours / task.estimatedHours) * 100;
    return Math.min(Math.round(percentage), 100);
  }

  /**
   * Get progress bar class
   */
  getProgressClass(task: Task): string {
    const percentage = this.getProgressPercentage(task);
    if (percentage >= 100) return 'progress-complete';
    if (percentage >= 75) return 'progress-high';
    if (percentage >= 50) return 'progress-medium';
    return 'progress-low';
  }

  /**
   * Retry loading tasks
   */
  retry(): void {
    this.loadTasks();
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusFilter.setValue('');
    this.priorityFilter.setValue('');
    this.assigneeFilter.setValue('');
    this.currentPage = 1;
    this.loadTasks();
  }

  /**
   * Open task detail dialog
   */
  openTaskDetailDialog(task: Task): void {
    const dialogRef = this.dialog.open(TaskDetailDialogComponent, {
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'task-detail-dialog-container',
      data: {
        projectId: this.projectId,
        taskId: task.id
      },
      disableClose: false,
      autoFocus: false
    });

    // Reload tasks when dialog closes (in case task was updated)
    dialogRef.afterClosed().subscribe(() => {
      this.loadTasks();
    });
  }
}
