import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.scss'],
})
export class ReportFormComponent implements OnInit {
  isEditMode = false;
  reportId: string | null = null;

  name = '';
  filenamePattern = '';
  frequencyDays = 7;

  loading = false;
  saving = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.reportId;

    if (this.isEditMode && this.reportId) {
      this.loading = true;
      this.reportService.get(this.reportId).subscribe({
        next: (report) => {
          this.name = report.name;
          this.filenamePattern = report.filenamePattern;
          this.frequencyDays = report.frequencyDays;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load report.';
          this.loading = false;
        },
      });
    }
  }

  submit(): void {
    if (!this.name.trim() || !this.filenamePattern.trim()) {
      this.errorMessage = 'Name and filename pattern are required.';
      return;
    }
    if (this.frequencyDays < 1 || this.frequencyDays > 90) {
      this.errorMessage = 'Frequency must be between 1 and 90 days.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const payload = {
      name: this.name.trim(),
      filenamePattern: this.filenamePattern.trim(),
      frequencyDays: this.frequencyDays,
    };

    const obs = this.isEditMode
      ? this.reportService.update(this.reportId!, payload)
      : this.reportService.create(payload);

    obs.subscribe({
      next: (report) => {
        this.router.navigate(['/reports', report._id]);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Save failed. Please try again.';
        this.saving = false;
      },
    });
  }

  cancel(): void {
    if (this.isEditMode && this.reportId) {
      this.router.navigate(['/reports', this.reportId]);
    } else {
      this.router.navigate(['/reports']);
    }
  }
}
