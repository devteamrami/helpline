/**
 * Activity Service
 * Handles API calls for the recent activity feature.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Activity, ActivityResponse } from './activity.model';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private http = inject(HttpClient);

  /**
   * Get paginated activities for the logged-in user (excluding dismissed ones).
   */
  getActivities(page: number = 1, limit: number = 20): Observable<ActivityResponse> {
    return this.http
      .get<{ success: boolean; data: { activities: any[]; pagination: any } }>(
        `${environment.apiUrl}/activities`,
        { params: { page: page.toString(), limit: limit.toString() } }
      )
      .pipe(
        map((res) => ({
          activities: (res.data.activities || []).map((a: any) => this.mapActivity(a)),
          pagination: res.data.pagination,
        }))
      );
  }

  /**
   * Dismiss an activity for the logged-in user.
   */
  dismissActivity(id: string): Observable<void> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${environment.apiUrl}/activities/${id}/dismiss`
      )
      .pipe(map(() => undefined));
  }

  /**
   * Map raw API response to Activity interface.
   */
  private mapActivity(a: any): Activity {
    return {
      id: a.id,
      type: a.type,
      resourceId: a.resource_id || null,
      resourceType: a.resource_type || null,
      projectId: a.project_id || null,
      actorName: a.actor_name,
      actorEmail: a.actor_email,
      message: a.message,
      createdAt: a.created_at,
    };
  }
}
