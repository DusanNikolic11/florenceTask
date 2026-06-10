import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  loading = true;
  errorMessage = '';
  togglingId: string | null = null;
  deletingId: string | null = null;

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
    this.reportService.list().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load reports.';
        this.loading = false;
      },
    });
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

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
