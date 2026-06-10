import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReportService, ReportRecord } from '../../services/report.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.scss'],
})
export class ReportsListComponent implements OnInit {
  reports: ReportRecord[] = [];
  subscribedIds = new Set<string>();
  loading = true;
  errorMessage = '';
  togglingId: string | null = null;
  deletingId: string | null = null;
  subscribingId: string | null = null;

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      reports: this.reportService.list(),
      subscribedIds: this.reportService.getMySubscribedReportIds(),
    }).subscribe({
      next: ({ reports, subscribedIds }) => {
        this.reports = reports;
        this.subscribedIds = new Set(subscribedIds);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load reports.';
        this.loading = false;
      },
    });
  }

  isSubscribed(reportId: string): boolean {
    return this.subscribedIds.has(reportId);
  }

  openDetail(id: string): void {
    this.router.navigate(['/reports', id]);
  }

  createNew(): void {
    this.router.navigate(['/reports/new']);
  }

  toggleEnabled(report: ReportRecord, event: MouseEvent): void {
    event.stopPropagation();
    this.togglingId = report._id;
    this.reportService.update(report._id, { enabled: !report.enabled }).subscribe({
      next: (updated) => {
        const idx = this.reports.findIndex((r) => r._id === updated._id);
        if (idx !== -1) this.reports[idx] = updated;
        this.togglingId = null;
      },
      error: () => {
        this.errorMessage = 'Failed to update report.';
        this.togglingId = null;
      },
    });
  }

  deleteReport(report: ReportRecord, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm(`Delete report "${report.name}"? This cannot be undone.`)) return;
    this.deletingId = report._id;
    this.reportService.delete(report._id).subscribe({
      next: () => {
        this.reports = this.reports.filter((r) => r._id !== report._id);
        this.deletingId = null;
      },
      error: () => {
        this.errorMessage = 'Failed to delete report.';
        this.deletingId = null;
      },
    });
  }

  toggleSubscription(report: ReportRecord, event: MouseEvent): void {
    event.stopPropagation();
    this.subscribingId = report._id;
    const obs = this.isSubscribed(report._id)
      ? this.reportService.unsubscribe(report._id)
      : this.reportService.subscribe(report._id);

    obs.subscribe({
      next: (res) => {
        if (res.subscribed) {
          this.subscribedIds.add(report._id);
        } else {
          this.subscribedIds.delete(report._id);
        }
        this.subscribingId = null;
      },
      error: () => {
        this.errorMessage = 'Failed to update subscription.';
        this.subscribingId = null;
      },
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
