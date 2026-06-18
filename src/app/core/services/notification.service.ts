import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private pollingTimer: any = null;
  private audioContext: AudioContext | null = null;

  unseenCount$ = new BehaviorSubject<number>(0);
  shouldJiggle$ = new BehaviorSubject<boolean>(false);

  private lastKnownCount = -1;
  private isPolling = false;

  startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;

    // Check immediately
    this.checkUnseen();

    // Poll every 30 seconds
    this.pollingTimer = setInterval(() => this.checkUnseen(), 15000);
  }

  stopPolling(): void {
    this.isPolling = false;
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private checkUnseen(): void {
    this.http
      .get<{ success: boolean; data: { count: number } }>(`${environment.apiUrl}/activities/unseen-count`)
      .subscribe({
        next: (res) => {
          const newCount = res.data?.count || 0;

          if (newCount > this.lastKnownCount && this.lastKnownCount >= 0) {
            this.playNotificationSound();
            this.shouldJiggle$.next(true);
          }

          if (this.lastKnownCount === -1 && newCount > 0) {
            this.playNotificationSound();
            this.shouldJiggle$.next(true);
          }

          this.lastKnownCount = newCount;
          this.unseenCount$.next(newCount);
        },
        error: () => {},
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

  private playNotificationSound(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioContext;
      const notes = [880, 1046, 1318, 1046, 880, 1046, 1318, 1568, 1318, 1046];
      notes.forEach((freq, i) => {
        const startTime = ctx.currentTime + i * 0.5;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, startTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch (e) {}
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
