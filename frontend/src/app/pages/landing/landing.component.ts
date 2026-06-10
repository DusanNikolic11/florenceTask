import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type Tab = 'login' | 'register';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent {
  activeTab: Tab = 'login';
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  setTab(tab: Tab): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.email = '';
    this.password = '';
  }

  submit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const obs =
      this.activeTab === 'login'
        ? this.auth.login(this.email, this.password)
        : this.auth.register(this.email, this.password);

    obs.subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Something went wrong. Please try again.';
        this.loading = false;
      },
    });
  }
}
