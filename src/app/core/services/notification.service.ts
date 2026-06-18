import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private pollingSubscription: Subscription | null = null;
  private audioContext: AudioContext | null = null;

  unseenCount$ = new BehaviorSubject<number>(0);
  shouldJiggle$ = new BehaviorSubject<boolean>(false);

  private lastKnownCount = -1;
  private isPolling = false;

  startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;

    // Check immediately on start
    this.checkUnseen();

    // Then poll every 30 seconds
    this.pollingSubscription = interval(30000).subscribe(() => {
      this.checkUnseen();
    });
  }

  stopPolling(): void {
    this.isPolling = false;
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }

  private checkUnseen(): void {
    this.http
      .get<{ success: boolean; data: { count: number } }>(`${environment.apiUrl}/activities/unseen-count`)
      .subscribe({
        next: (res) => {
          const newCount = res.data?.count || 0;

          // If count increased, play sound and trigger jiggle
          if (newCount > this.lastKnownCount && this.lastKnownCount >= 0) {
            this.playNotificationSound();
            this.triggerJiggle();
          }

          // On first check (lastKnownCount === -1), if there are unseen, trigger jiggle + sound
          if (this.lastKnownCount === -1 && newCount > 0) {
            this.playNotificationSound();
            this.triggerJiggle();
          }

          this.lastKnownCount = newCount;
          this.unseenCount$.next(newCount);
        },
        error: () => {
          // Silently fail — don't break the app
        },
      });
  }

  markAsSeen(): void {
    this.http
      .patch<any>(`${environment.apiUrl}/activities/mark-seen`, {})
      .subscribe(() => {
        this.unseenCount$.next(0);
        this.lastKnownCount = 0;
        this.shouldJiggle$.next(false);
      });
  }

  private triggerJiggle(): void {
    this.shouldJiggle$.next(true);
    // Stop jiggle after 3 seconds
    setTimeout(() => this.shouldJiggle$.next(false), 3000);
  }

  private playNotificationSound(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioContext;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio not available — fail silently
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
