/**
 * Add Member Dialog Component
 * Dialog for adding members to a project
 */

import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProjectMemberService } from '../../../core/services/project-member.service';
import { AvailableUser, ProjectRole } from '../../../core/models/project.model';

@Component({
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-member-dialog.component.html',
  styleUrls: ['./add-member-dialog.component.scss']
})
export class AddMemberDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private projectMemberService = inject(ProjectMemberService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Input data
  projectId!: string;

  // Callbacks
  onClose!: () => void;
  onSuccess!: () => void;

  // Form
  memberForm!: FormGroup;

  // Data
  availableUsers: AvailableUser[] = [];
  isLoadingUsers = false;
  isSubmitting = false;
  errorMessage = '';

  // Project roles
  projectRoles: ProjectRole[] = [
    'Project Admin',
    'Project Manager',
    'Project Member',
    'Project Viewer'
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadAvailableUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form
   */
  private initForm(): void {
    this.memberForm = this.fb.group({
      userId: ['', [Validators.required]],
      projectRole: ['Project Member', [Validators.required]]
    });
  }

  /**
   * Load available users
   */
  private loadAvailableUsers(): void {
    this.isLoadingUsers = true;
    this.errorMessage = '';

    this.projectMemberService.getAvailableUsers(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.availableUsers = users;
          this.isLoadingUsers = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.isLoadingUsers = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.memberForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.memberForm.value;

    this.projectMemberService.addProjectMember(this.projectId, {
      userId: formValue.userId,
      projectRole: formValue.projectRole
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        if (this.onSuccess) {
          this.onSuccess();
        }
        this.close();
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isSubmitting = false;
        this.cdr.detectChanges();
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
   * Get user display name
   */
  getUserDisplayName(user: AvailableUser): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName} (${user.email})`;
    }
    return `${user.username} (${user.email})`;
  }

  /**
   * Get form control error message
   */
  getErrorMessage(controlName: string): string {
    const control = this.memberForm.get(controlName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(controlName)} is required`;
    }

    return 'Invalid value';
  }

  /**
   * Get field label
   */
  private getFieldLabel(controlName: string): string {
    const labels: Record<string, string> = {
      userId: 'User',
      projectRole: 'Project Role'
    };
    return labels[controlName] || controlName;
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string): boolean {
    const control = this.memberForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }
}
