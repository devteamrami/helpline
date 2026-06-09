/**
 * Task Form Dialog Component
 * Dialog for creating and editing tasks
 */

import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';

import { TaskService } from '../../../core/services/task.service';
import { ProjectMemberService } from '../../../core/services/project-member.service';
import { Task, TaskStatus, TaskPriority } from '../../../core/models/task.model';
import { AvailableUser } from '../../../core/models/project.model';

@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatOptionModule
  ],
  templateUrl: './task-form-dialog.component.html',
  styleUrls: ['./task-form-dialog.component.scss']
})
export class TaskFormDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private projectMemberService = inject(ProjectMemberService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Input data
  data!: {
    mode: 'create' | 'edit';
    projectId: string;
    task?: Task;
  };

  // Callbacks
  onClose!: () => void;
  onSuccess!: () => void;

  // Form
  taskForm!: FormGroup;

  // Data
  projectMembers: AvailableUser[] = [];
  isLoadingMembers = false;
  isSubmitting = false;
  errorMessage = '';

  // Options
  statusOptions: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'];
  priorityOptions: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];

  ngOnInit(): void {
    this.initForm();
    this.loadProjectMembers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form
   */
  private initForm(): void {
    const task = this.data.task;

    this.taskForm = this.fb.group({
      title: [task?.title || '', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: [task?.description || '', [Validators.maxLength(5000)]],
      status: [task?.status || 'To Do', [Validators.required]],
      priority: [task?.priority || 'Medium', [Validators.required]],
      assigneeIds: [task?.assignees?.map(a => a.id) || [], []],  // Changed to array
      dueDate: [task?.dueDate || ''],
      estimatedHours: [task?.estimatedHours || '', [Validators.min(0), Validators.max(9999)]]
    });
  }

  /**
   * Load project members
   */
  private loadProjectMembers(): void {
    this.isLoadingMembers = true;

    this.projectMemberService.getProjectMembers(this.data.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (members) => {
          this.projectMembers = members.map(m => ({
            id: m.userId,
            email: m.user.email,
            username: m.user.username,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            role: m.user.systemRole
          }));
          this.isLoadingMembers = false;
          this.cdr.detectChanges();
          console.log('✅ Loaded project members:', this.projectMembers);
        },
        error: (error) => {
          console.error('Failed to load project members:', error);
          this.isLoadingMembers = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.taskForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.taskForm.value;
    
    // Debug: Log the form value
    console.log('📝 Form value:', formValue);
    console.log('📝 AssigneeIds:', formValue.assigneeIds);
    console.log('📝 Project members:', this.projectMembers);
    
    // Ensure assigneeIds are valid UUIDs
    const assigneeIds = Array.isArray(formValue.assigneeIds) 
      ? formValue.assigneeIds.filter((id: any) => {
          const isValid = typeof id === 'string' && id.length > 0 && !id.includes('/');
          if (!isValid) {
            console.error('❌ Invalid assignee ID:', id);
          }
          return isValid;
        })
      : [];
    
    console.log('✅ Filtered assigneeIds:', assigneeIds);
    
    const taskData = {
      title: formValue.title,
      description: formValue.description || undefined,
      status: formValue.status,
      priority: formValue.priority,
      assigneeIds: assigneeIds,  // Use filtered array
      dueDate: formValue.dueDate || undefined,
      estimatedHours: formValue.estimatedHours || undefined
    };
    
    console.log('📤 Sending task data:', taskData);

    const operation = this.data.mode === 'create'
      ? this.taskService.createTask(this.data.projectId, taskData)
      : this.taskService.updateTask(this.data.projectId, this.data.task!.id, taskData);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          if (this.onSuccess) {
            this.onSuccess();
          }
          this.close();
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.isSubmitting = false;
        }
      });
  }

  /**
   * Close dialog
   */
  close(): void {
    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * Get member display name
   */
  getMemberDisplayName(member: AvailableUser): string {
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    return member.username;
  }

  /**
   * Get member initials for avatar
   */
  getMemberInitials(member: AvailableUser): string {
    if (member.firstName && member.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    }
    return member.username.substring(0, 2).toUpperCase();
  }

  /**
   * Get selected assignee name by ID
   */
  getSelectedAssigneeName(userId: string): string {
    const member = this.projectMembers.find(m => m.id === userId);
    return member ? this.getMemberDisplayName(member) : 'Unknown';
  }

  /**
   * Get form control error message
   */
  getErrorMessage(controlName: string): string {
    const control = this.taskForm.get(controlName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(controlName)} is required`;
    }

    if (control.errors['minlength']) {
      return `${this.getFieldLabel(controlName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }

    if (control.errors['maxlength']) {
      return `${this.getFieldLabel(controlName)} must not exceed ${control.errors['maxlength'].requiredLength} characters`;
    }

    if (control.errors['min']) {
      return `${this.getFieldLabel(controlName)} must be at least ${control.errors['min'].min}`;
    }

    if (control.errors['max']) {
      return `${this.getFieldLabel(controlName)} must not exceed ${control.errors['max'].max}`;
    }

    return 'Invalid value';
  }

  /**
   * Get field label
   */
  private getFieldLabel(controlName: string): string {
    const labels: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      status: 'Status',
      priority: 'Priority',
      assigneeIds: 'Assignees',
      dueDate: 'End Date',
      estimatedHours: 'Estimated Hours'
    };
    return labels[controlName] || controlName;
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string): boolean {
    const control = this.taskForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }
}
