import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReportService, ReportRecord, ReportInstance } from '../../services/report.service';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss'],
})
export class ReportDetailComponent implements OnInit {
  report: ReportRecord | null = null;
  instances: ReportInstance[] = [];
  loading = true;
  toggling = false;
  deleting = false;
  subscribed = false;
  subscribing = false;
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
    forkJoin({
      report: this.reportService.get(id),
      instances: this.reportService.getInstances(id),
      subscription: this.reportService.getSubscription(id),
    }).subscribe({
      next: ({ report, instances, subscription }) => {
        this.report = report;
        this.instances = instances.data;
        this.subscribed = subscription.subscribed;
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

  toggleSubscription(): void {
    if (!this.report) return;
    this.subscribing = true;
    const obs = this.subscribed
      ? this.reportService.unsubscribe(this.report._id)
      : this.reportService.subscribe(this.report._id);

    obs.subscribe({
      next: (res) => {
        this.subscribed = res.subscribed;
        this.subscribing = false;
      },
      error: () => {
        this.errorMessage = 'Failed to update subscription.';
        this.subscribing = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}
