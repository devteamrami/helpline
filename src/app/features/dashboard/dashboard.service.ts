import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  projects: { total: number; active: number; onHold: number; completed: number; archived: number };
  tasks: { total: number; inActiveProjects: number; toDo: number; inProgress: number; inReview: number; done: number; archived: number; active: number; onHold: number; completed: number };
  tickets: { total: number; open: number; inProgress: number; resolved: number; closed: number };
  teamMembers: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getStats(): Observable<DashboardStats | null> {
    return this.http.get<{ success: boolean; data: DashboardStats }>(`${environment.apiUrl}/dashboard/stats`).pipe(
      map((res) => res.data),
      catchError(() => of(null))
    );
  }

  getTodoTickets(): Observable<any[]> {
    return this.http.get<{ success: boolean; data: { tickets: any[] } }>(
      `${environment.apiUrl}/tickets?status=open&limit=10&page=1`
    ).pipe(
      map((res) => res.data?.tickets || []),
      catchError(() => of([]))
    );
  }
}
