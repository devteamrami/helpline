/**
 * Department List Component
 * Displays departments in a table with create/edit dialog
 */

import {
  Component,
  OnDestroy,
  inject,
  ViewContainerRef,
  ComponentRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { DepartmentService } from '../../../core/services/department.service';
import { Department } from '../../../core/models/department.model';
import { DepartmentFormDialogComponent } from '../department-form-dialog/department-form-dialog.component';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentListComponent implements OnDestroy {
  private departmentService = inject(DepartmentService);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Dialog reference
  private dialogRef: ComponentRef<DepartmentFormDialogComponent> | null = null;

  // State
  departments: Department[] = [];
  isLoading = false;
  errorMessage = '';

  constructor() {
    afterNextRender(() => {
      this.loadDepartments();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeDialog();
  }

  /**
   * Load departments from API
   */
  loadDepartments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    this.departmentService
      .getDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          this.departments = departments;
          this.isLoading = false;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to load departments';
          this.isLoading = false;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage,
            confirmButtonColor: '#3d99fc',
          });
        },
      });
  }

  /**
   * Open create department dialog
   */
  openCreateDialog(): void {
    this.dialogRef = this.viewContainerRef.createComponent(DepartmentFormDialogComponent);
    this.dialogRef.instance.mode = 'create';
    this.dialogRef.instance.onClose = () => this.closeDialog();
    this.dialogRef.instance.onSuccess = () => {
      this.loadDepartments();
      Swal.fire({
        icon: 'success',
        title: 'Department Created',
        text: 'The department has been created successfully.',
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    };
  }

  /**
   * Open edit department dialog
   */
  openEditDialog(department: Department): void {
    this.dialogRef = this.viewContainerRef.createComponent(DepartmentFormDialogComponent);
    this.dialogRef.instance.mode = 'edit';
    this.dialogRef.instance.department = department;
    this.dialogRef.instance.onClose = () => this.closeDialog();
    this.dialogRef.instance.onSuccess = () => {
      this.loadDepartments();
      Swal.fire({
        icon: 'success',
        title: 'Department Updated',
        text: 'The department has been updated successfully.',
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    };
  }

  /**
   * Delete department with confirmation
   */
  deleteDepartment(department: Department): void {
    Swal.fire({
      icon: 'warning',
      title: 'Delete Department?',
      html: `Are you sure you want to delete <strong>"${department.name}"</strong>?<br><br><small style="color:#999;">Members will be unassigned from this department.</small>`,
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.departmentService
          .deleteDepartment(department.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadDepartments();
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: `"${department.name}" has been deleted.`,
                timer: 2500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
              });
            },
            error: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: error.message || 'Failed to delete department',
                confirmButtonColor: '#3d99fc',
              });
            },
          });
      }
    });
  }

  /**
   * Close dialog
   */
  private closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.destroy();
      this.dialogRef = null;
    }
  }

  /**
   * Get initials for avatar
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
