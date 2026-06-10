import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService, ReportRecord } from '../../services/report.service';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss'],
})
export class ReportDetailComponent implements OnInit {
  report: ReportRecord | null = null;
  loading = true;
  toggling = false;
  deleting = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/reports']);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading = true;
    this.reportService.get(id).subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.status === 403 ? 'You do not have access to this report.' : 'Failed to load report.';
        this.loading = false;
      },
    });
  }

  edit(): void {
    this.router.navigate(['/reports', this.report!._id, 'edit']);
  }

  toggleEnabled(): void {
    if (!this.report) return;
    this.toggling = true;
    this.reportService.update(this.report._id, { enabled: !this.report.enabled }).subscribe({
      next: (updated) => {
        this.report = updated;
        this.toggling = false;
      },
      error: () => {
        this.errorMessage = 'Failed to update report.';
        this.toggling = false;
      },
    });
  }

  delete(): void {
    if (!this.report) return;
    if (!confirm(`Delete report "${this.report.name}"? This cannot be undone.`)) return;
    this.deleting = true;
    this.reportService.delete(this.report._id).subscribe({
      next: () => this.router.navigate(['/reports']),
      error: () => {
        this.errorMessage = 'Failed to delete report.';
        this.deleting = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}
