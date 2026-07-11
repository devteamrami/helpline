/**
 * Department Form Dialog Component
 * Form dialog for creating and editing departments
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { DepartmentService } from '../../../core/services/department.service';
import { Department } from '../../../core/models/department.model';

@Component({
  selector: 'app-department-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './department-form-dialog.component.html',
  styleUrls: ['./department-form-dialog.component.scss'],
})
export class DepartmentFormDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private departmentService = inject(DepartmentService);
  private destroy$ = new Subject<void>();

  // Dialog data (passed from parent)
  mode: 'create' | 'edit' = 'create';
  department?: Department;

  // Form
  departmentForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  // Callback functions (set by parent)
  onClose?: () => void;
  onSuccess?: (department: Department) => void;

  ngOnInit(): void {
    this.initForm();

    if (this.mode === 'edit' && this.department) {
      this.loadDepartmentData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form
   */
  initForm(): void {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      is_active: [true],
    });
  }

  /**
   * Load department data for editing
   */
  loadDepartmentData(): void {
    if (!this.department) return;

    this.departmentForm.patchValue({
      name: this.department.name || '',
      description: this.department.description || '',
      is_active: this.department.is_active,
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.departmentForm.invalid) {
      this.markFormGroupTouched(this.departmentForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    if (this.mode === 'create') {
      this.createDepartment();
    } else {
      this.updateDepartment();
    }
  }

  /**
   * Create new department
   */
  createDepartment(): void {
    const data = {
      name: this.departmentForm.value.name,
      description: this.departmentForm.value.description || undefined,
    };

    this.departmentService
      .createDepartment(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (department) => {
          this.isSubmitting = false;
          if (this.onSuccess) {
            this.onSuccess(department);
          }
          this.close();
        },
        error: (error) => {
          this.isSubmitting = false;
          const msg = error.message || 'Failed to create department';

          if (msg.toLowerCase().includes('already exists')) {
            this.errorMessage = 'A department with this name already exists. Please choose a different name.';
            Swal.fire({
              icon: 'warning',
              title: 'Duplicate Name',
              text: 'A department with this name already exists. Please choose a different name.',
              confirmButtonColor: '#3d99fc',
            });
          } else {
            this.errorMessage = msg;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: msg,
              confirmButtonColor: '#3d99fc',
            });
          }
        },
      });
  }

  /**
   * Update existing department
   */
  updateDepartment(): void {
    if (!this.department) return;

    const data = {
      name: this.departmentForm.value.name,
      description: this.departmentForm.value.description,
      is_active: this.departmentForm.value.is_active,
    };

    this.departmentService
      .updateDepartment(this.department.id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (department) => {
          this.isSubmitting = false;
          if (this.onSuccess) {
            this.onSuccess(department);
          }
          this.close();
        },
        error: (error) => {
          this.isSubmitting = false;
          const msg = error.message || 'Failed to update department';

          if (msg.toLowerCase().includes('already exists')) {
            this.errorMessage = 'A department with this name already exists. Please choose a different name.';
            Swal.fire({
              icon: 'warning',
              title: 'Duplicate Name',
              text: 'Another department with this name already exists. Please choose a different name.',
              confirmButtonColor: '#3d99fc',
            });
          } else {
            this.errorMessage = msg;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: msg,
              confirmButtonColor: '#3d99fc',
            });
          }
        },
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
   * Mark all form fields as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.departmentForm.get(fieldName);
    return !!(field?.hasError(errorType) && field?.touched);
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.departmentForm.get(fieldName);

    if (!field || !field.touched) return '';

    if (field.hasError('required')) {
      return `${fieldName === 'name' ? 'Department name' : 'Field'} is required`;
    }

    if (field.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `Must not exceed ${maxLength} characters`;
    }

    return 'Invalid value';
  }
}
