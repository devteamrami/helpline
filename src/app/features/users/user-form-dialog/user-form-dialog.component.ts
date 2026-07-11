/**
 * User Form Dialog Component
 * Form dialog for creating and editing users
 */

import { Component, OnInit, OnDestroy, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { UserService } from '../../../core/services/user.service';
import { DepartmentService } from '../../../core/services/department.service';
import { Department } from '../../../core/models/department.model';
import { User, CreateUserRequest, UpdateUserRequest } from '../../../core/models/user.model';

// Simple dialog data interface
export interface UserFormDialogData {
  mode: 'create' | 'edit';
  user?: User;
}

// Simple dialog result interface
export interface UserFormDialogResult {
  success: boolean;
  user?: User;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
})
export class UserFormDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private departmentService = inject(DepartmentService);
  private destroy$ = new Subject<void>();

  // Dialog data (passed from parent)
  mode: 'create' | 'edit' = 'create';
  user?: User;

  // Form
  userForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  // Password strength
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';

  // Departments
  departments: Department[] = [];

  // Callback functions (set by parent)
  onClose?: () => void;
  onSuccess?: (user: User) => void;

  ngOnInit(): void {
    this.initForm();
    this.loadDepartments();

    // Load user data if in edit mode
    if (this.mode === 'edit' && this.user) {
      this.loadUserData();
    }

    // Watch password changes for strength indicator
    if (this.mode === 'create') {
      this.userForm.get('password')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((password) => {
          this.updatePasswordStrength(password);
        });
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
    if (this.mode === 'create') {
      this.userForm = this.fb.group({
        email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
            Validators.pattern(/^[a-zA-Z0-9._-]+$/),
          ],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/),
          ],
        ],
        firstName: ['', [Validators.maxLength(100), Validators.pattern(/^[a-zA-Z\s]*$/)]],
        lastName: ['', [Validators.maxLength(100), Validators.pattern(/^[a-zA-Z\s]*$/)]],
        departmentId: ['', Validators.required],
      });
    } else {
      // Edit mode - email, username, password are immutable
      this.userForm = this.fb.group({
        firstName: ['', [Validators.maxLength(100), Validators.pattern(/^[a-zA-Z\s]*$/)]],
        lastName: ['', [Validators.maxLength(100), Validators.pattern(/^[a-zA-Z\s]*$/)]],
        departmentId: ['', Validators.required],
      });
    }
  }

  /**
   * Load user data for editing
   */
  loadUserData(): void {
    if (!this.user) return;

    this.userForm.patchValue({
      firstName: this.user.firstName || '',
      lastName: this.user.lastName || '',
      departmentId: this.user.departmentId || '',
    });
  }

  /**
   * Load departments for dropdown
   */
  loadDepartments(): void {
    this.departmentService
      .getDepartments({ isActive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          this.departments = departments;
        },
        error: () => {
          this.departments = [];
        },
      });
  }

  /**
   * Update password strength indicator
   */
  updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 'weak';
      return;
    }

    let strength = 0;

    // Length
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Character types
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      this.passwordStrength = 'weak';
    } else if (strength <= 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    if (this.mode === 'create') {
      this.createUser();
    } else {
      this.updateUser();
    }
  }

  /**
   * Create new user
   */
  createUser(): void {
    const userData: CreateUserRequest = this.userForm.value;

    this.userService.createUser(userData).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: 'User Created',
          text: 'The user has been created successfully.',
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
        if (this.onSuccess) {
          this.onSuccess(user);
        }
        this.close();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Failed to create user';
        Swal.fire({
          icon: 'error',
          title: 'User Creation Failed',
          text: this.errorMessage,
          confirmButtonColor: '#3d99fc',
        });
      },
    });
  }

  /**
   * Update existing user
   */
  updateUser(): void {
    if (!this.user) return;

    const updateData: UpdateUserRequest = this.userForm.value;

    this.userService.updateUser(this.user.id, updateData).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: 'User Updated',
          text: 'The user has been updated successfully.',
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
        if (this.onSuccess) {
          this.onSuccess(user);
        }
        this.close();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Failed to update user';
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: this.errorMessage,
          confirmButtonColor: '#3d99fc',
        });
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
    const field = this.userForm.get(fieldName);
    return !!(field?.hasError(errorType) && field?.touched);
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.userForm.get(fieldName);

    if (!field || !field.touched) return '';

    if (field.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (field.hasError('email')) {
      return 'Please enter a valid email address';
    }

    if (field.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }

    if (field.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must not exceed ${maxLength} characters`;
    }

    if (field.hasError('pattern')) {
      if (fieldName === 'username') {
        return 'Username can only contain letters, numbers, dots, underscores, and hyphens';
      }
      if (fieldName === 'password') {
        return 'Password must contain uppercase, lowercase, number, and special character';
      }
      if (fieldName === 'firstName' || fieldName === 'lastName') {
        return 'Name can only contain letters and spaces';
      }
    }

    return 'Invalid value';
  }

  /**
   * Get field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      username: 'Username',
      password: 'Password',
      firstName: 'First Name',
      lastName: 'Last Name',
      departmentId: 'Department',
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Get password strength class
   */
  getPasswordStrengthClass(): string {
    return `strength-${this.passwordStrength}`;
  }

  /**
   * Get password strength text
   */
  getPasswordStrengthText(): string {
    const texts: { [key: string]: string } = {
      weak: 'Weak',
      medium: 'Medium',
      strong: 'Strong',
    };
    return texts[this.passwordStrength] || 'Weak';
  }
}
