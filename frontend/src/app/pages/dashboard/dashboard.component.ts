import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentService, DocumentRecord } from '../../services/document.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  documents: DocumentRecord[] = [];
  loading = true;
  errorMessage = '';
  uploading = false;
  selectedFile: File | null = null;
  customFilename = '';

  constructor(
    private documentService: DocumentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    this.documentService.list().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load documents.';
        this.loading = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.customFilename = this.selectedFile.name;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.documentService.create(this.selectedFile, this.customFilename || undefined).subscribe({
      next: () => {
        this.selectedFile = null;
        this.customFilename = '';
        this.uploading = false;
        this.loadDocuments();
      },
      error: () => {
        this.errorMessage = 'Upload failed. Please try again.';
        this.uploading = false;
      },
    });
  }

  openDocument(id: string): void {
    this.router.navigate(['/documents', id]);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
