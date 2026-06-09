/**
 * Project Detail Component
 * Displays complete project information with actions
 */

import { Component, OnInit, OnDestroy, inject, ViewContainerRef, ComponentRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectDetail, ProjectStatus } from '../../../core/models/project.model';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';
import { ProjectMembersListComponent } from '../project-members-list/project-members-list.component';
import { TaskListComponent } from '../../tasks/task-list/task-list.component';
import { AddMemberDialogComponent } from '../add-member-dialog/add-member-dialog.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProjectMembersListComponent,
    TaskListComponent
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Data
  project: ProjectDetail | null = null;
  isLoading = false;
  errorMessage = '';

  // Permissions
  canEdit = false;
  canArchive = false;

  // Dialog references
  private dialogRef: ComponentRef<ProjectFormDialogComponent> | null = null;
  private memberDialogRef: ComponentRef<AddMemberDialogComponent> | null = null;
  
  // Child component reference
  private membersListComponent: ProjectMembersListComponent | null = null;

  ngOnInit(): void {
    this.checkPermissions();
    this.loadProject();
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
    this.canEdit = ['superadmin', 'admin'].includes(userRole);
    this.canArchive = ['superadmin', 'admin'].includes(userRole);
  }

  /**
   * Load project details
   */
  loadProject(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    
    if (!projectId) {
      this.errorMessage = 'Invalid project ID';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getProjectById(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.project = project;
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
   * Open edit dialog
   */
  openEditDialog(): void {
    if (!this.project) return;

    this.dialogRef = this.viewContainerRef.createComponent(ProjectFormDialogComponent);
    
    // Append to document body for proper overlay positioning
    document.body.appendChild(this.dialogRef.location.nativeElement);
    
    // Set dialog data
    this.dialogRef.instance.data = {
      mode: 'edit',
      project: this.project
    };

    // Set callbacks
    this.dialogRef.instance.onClose = () => {
      this.closeDialog();
    };

    this.dialogRef.instance.onSuccess = () => {
      this.loadProject(); // Reload project after update
    };
  }

  /**
   * Close dialog
   */
  private closeDialog(): void {
    if (this.dialogRef) {
      // Remove from document body
      const element = this.dialogRef.location.nativeElement;
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.dialogRef.destroy();
      this.dialogRef = null;
    }
  }

  /**
   * Archive project
   */
  archiveProject(): void {
    if (!this.project) return;

    if (!confirm(`Are you sure you want to archive "${this.project.name}"?`)) {
      return;
    }

    this.projectService.archiveProject(this.project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadProject();
        },
        error: (error) => {
          alert(`Failed to archive project: ${error.message}`);
        }
      });
  }

  /**
   * Unarchive project
   */
  unarchiveProject(): void {
    if (!this.project) return;

    if (!confirm(`Are you sure you want to unarchive "${this.project.name}"?`)) {
      return;
    }

    this.projectService.unarchiveProject(this.project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadProject();
        },
        error: (error) => {
          alert(`Failed to unarchive project: ${error.message}`);
        }
      });
  }

  /**
   * Navigate back to project list
   */
  goBack(): void {
    this.router.navigate(['/projects']);
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: ProjectStatus): string {
    const statusClasses: Record<ProjectStatus, string> = {
      'Active': 'status-active',
      'On Hold': 'status-on-hold',
      'Completed': 'status-completed',
      'Archived': 'status-archived'
    };
    return statusClasses[status] || '';
  }

  /**
   * Retry loading project
   */
  retry(): void {
    this.loadProject();
  }

  /**
   * Format date for display
   */
  formatDate(date: string | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Open add member dialog
   */
  openAddMemberDialog(): void {
    if (!this.project) return;

    this.memberDialogRef = this.viewContainerRef.createComponent(AddMemberDialogComponent);
    
    // Append to document body for proper overlay positioning
    document.body.appendChild(this.memberDialogRef.location.nativeElement);
    
    // Set dialog data
    this.memberDialogRef.instance.projectId = this.project.id;

    // Set callbacks
    this.memberDialogRef.instance.onClose = () => {
      this.closeMemberDialog();
    };

    this.memberDialogRef.instance.onSuccess = () => {
      // Reload project to get updated member count
      this.loadProject();
      // Trigger member list reload if component is available
      if (this.membersListComponent) {
        this.membersListComponent.loadMembers();
      }
    };
  }

  /**
   * Close member dialog
   */
  private closeMemberDialog(): void {
    if (this.memberDialogRef) {
      // Remove from document body
      const element = this.memberDialogRef.location.nativeElement;
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.memberDialogRef.destroy();
      this.memberDialogRef = null;
    }
  }

  /**
   * Set members list component reference
   */
  setMembersListComponent(component: ProjectMembersListComponent): void {
    this.membersListComponent = component;
  }
}
