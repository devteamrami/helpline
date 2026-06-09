/**
 * Project Members List Component
 * Displays and manages project members
 */

import { Component, Input, OnInit, OnDestroy, inject, ViewContainerRef, ComponentRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProjectMemberService } from '../../../core/services/project-member.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectMember, ProjectRole } from '../../../core/models/project.model';
import { AddMemberDialogComponent } from '../add-member-dialog/add-member-dialog.component';

@Component({
  selector: 'app-project-members-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-members-list.component.html',
  styleUrls: ['./project-members-list.component.scss']
})
export class ProjectMembersListComponent implements OnInit, OnDestroy {
  private projectMemberService = inject(ProjectMemberService);
  private authService = inject(AuthService);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  @Input() projectId!: string;

  // Data
  members: ProjectMember[] = [];
  isLoading = false;
  errorMessage = '';

  // Permissions
  canManageMembers = false;

  // Dialog reference
  private dialogRef: ComponentRef<AddMemberDialogComponent> | null = null;

  // Project roles for dropdown
  projectRoles: ProjectRole[] = [
    'Project Admin',
    'Project Manager',
    'Project Member',
    'Project Viewer'
  ];

  ngOnInit(): void {
    this.checkPermissions();
    this.loadMembers();
    this.subscribeToMembers();
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
    this.canManageMembers = ['superadmin', 'admin'].includes(userRole);
  }

  /**
   * Subscribe to members state
   */
  private subscribeToMembers(): void {
    this.projectMemberService.members$
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => {
        this.members = members;
      });
  }

  /**
   * Load project members
   */
  loadMembers(): void {
    if (!this.projectId) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.projectMemberService.getProjectMembers(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
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
   * Open add member dialog
   */
  openAddMemberDialog(): void {
    this.dialogRef = this.viewContainerRef.createComponent(AddMemberDialogComponent);
    
    // Append to document body for proper overlay positioning
    document.body.appendChild(this.dialogRef.location.nativeElement);
    
    // Set dialog data
    this.dialogRef.instance.projectId = this.projectId;

    // Set callbacks
    this.dialogRef.instance.onClose = () => {
      this.closeDialog();
    };

    this.dialogRef.instance.onSuccess = () => {
      // Reload members list after adding
      this.loadMembers();
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
   * Update member role
   */
  updateMemberRole(member: ProjectMember, newRole: ProjectRole): void {
    if (member.projectRole === newRole) return;

    if (!confirm(`Change ${this.getMemberName(member)}'s role to ${newRole}?`)) {
      return;
    }

    this.projectMemberService.updateProjectMemberRole(
      this.projectId,
      member.id,
      { projectRole: newRole }
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        // Success - state updated automatically
      },
      error: (error) => {
        alert(`Failed to update role: ${error.message}`);
      }
    });
  }

  /**
   * Remove member from project
   */
  removeMember(member: ProjectMember): void {
    if (!confirm(`Remove ${this.getMemberName(member)} from this project?`)) {
      return;
    }

    this.projectMemberService.removeProjectMember(this.projectId, member.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Success - state updated automatically
        },
        error: (error) => {
          alert(`Failed to remove member: ${error.message}`);
        }
      });
  }

  /**
   * Get member display name
   */
  getMemberName(member: ProjectMember): string {
    const { firstName, lastName, username } = member.user;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return username;
  }

  /**
   * Get role badge class
   */
  getRoleBadgeClass(role: ProjectRole): string {
    const roleClasses: Record<ProjectRole, string> = {
      'Project Admin': 'role-admin',
      'Project Manager': 'role-manager',
      'Project Member': 'role-member',
      'Project Viewer': 'role-viewer'
    };
    return roleClasses[role] || '';
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Retry loading members
   */
  retry(): void {
    this.loadMembers();
  }
}
