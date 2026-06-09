/**
 * Project Form Dialog Component
 * Modal dialog for creating and editing projects
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectStatus, CreateProjectRequest, UpdateProjectRequest } from '../../../core/models/project.model';

export interface ProjectFormDialogData {
  mode: 'create' | 'edit';
  project?: Project;
}

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './project-form-dialog.component.html',
  styleUrls: ['./project-form-dialog.component.scss']
})
export class ProjectFormDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private destroy$ = new Subject<void>();

  // Dialog data (will be set from parent)
  data: ProjectFormDialogData = { mode: 'create' };

  // Form
  projectForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  // Status options
  statusOptions: ProjectStatus[] = ['Active', 'On Hold', 'Completed', 'Archived'];

  // Callbacks
  onClose?: () => void;
  onSuccess?: (project: Project) => void;

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form with validators
   */
  private initializeForm(): void {
    this.projectForm = this.fb.group({
      name: [
        this.data.project?.name || '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(200)
        ]
      ],
      description: [
        this.data.project?.description || '',
        [
          Validators.required,
          Validators.maxLength(2000)
        ]
      ],
      code: [
        {
          value: this.data.project?.code || '',
          disabled: this.data.mode === 'edit' // Code is immutable in edit mode
        },
        [
          Validators.required,
          Validators.pattern(/^[a-zA-Z0-9_-]{3,20}$/)
        ]
      ],
      status: [
        this.data.project?.status || 'Active',
        [Validators.required]
      ],
      startDate: [this.data.project?.startDate || ''],
      endDate: [this.data.project?.endDate || '']
    }, {
      validators: this.dateRangeValidator.bind(this)
    });
  }

  /**
   * Custom validator for date range
   */
  private dateRangeValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const startDate = formGroup.get('startDate')?.value;
    const endDate = formGroup.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        return { dateRangeInvalid: true };
      }
    }

    return null;
  }

  /**
   * Get form control error message
   */
  getErrorMessage(controlName: string): string {
    const control = this.projectForm.get(controlName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(controlName)} is required`;
    }

    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `${this.getFieldLabel(controlName)} must be at least ${minLength} characters`;
    }

    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `${this.getFieldLabel(controlName)} must not exceed ${maxLength} characters`;
    }

    if (control.errors['pattern']) {
      return 'Project code must be 3-20 characters (alphanumeric, hyphens, underscores only)';
    }

    return 'Invalid value';
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Project name',
      description: 'Description',
      code: 'Project code',
      status: 'Status',
      startDate: 'Start date',
      endDate: 'End date'
    };
    return labels[controlName] || controlName;
  }

  /**
   * Check if form has date range error
   */
  hasDateRangeError(): boolean {
    return this.projectForm.errors?.['dateRangeInvalid'] && 
           this.projectForm.get('endDate')?.touched || false;
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.projectForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.projectForm.controls).forEach(key => {
        this.projectForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    if (this.data.mode === 'create') {
      this.createProject();
    } else {
      this.updateProject();
    }
  }

  /**
   * Create new project
   */
  private createProject(): void {
    const formValue = this.projectForm.getRawValue(); // getRawValue includes disabled fields
    
    const projectData: CreateProjectRequest = {
      name: formValue.name,
      description: formValue.description,
      code: formValue.code,
      status: formValue.status,
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined
    };

    this.projectService.createProject(projectData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.isSubmitting = false;
          if (this.onSuccess) {
            this.onSuccess(project);
          }
          this.close();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message;
        }
      });
  }

  /**
   * Update existing project
   */
  private updateProject(): void {
    if (!this.data.project) {
      return;
    }

    const formValue = this.projectForm.value;
    
    const updateData: UpdateProjectRequest = {
      name: formValue.name,
      description: formValue.description,
      status: formValue.status,
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined
    };

    this.projectService.updateProject(this.data.project.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.isSubmitting = false;
          if (this.onSuccess) {
            this.onSuccess(project);
          }
          this.close();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message;
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
   * Get dialog title
   */
  getTitle(): string {
    return this.data.mode === 'create' ? 'Create New Project' : 'Edit Project';
  }

  /**
   * Get submit button text
   */
  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      return this.data.mode === 'create' ? 'Creating...' : 'Updating...';
    }
    return this.data.mode === 'create' ? 'Create Project' : 'Update Project';
  }
}
