import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService, DocumentRecord } from '../../services/document.service';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss'],
})
export class DocumentDetailComponent implements OnInit {
  document: DocumentRecord | null = null;
  loading = true;
  saving = false;
  deleting = false;
  downloading = false;
  errorMessage = '';
  successMessage = '';
  editMode = false;

  editFilename = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadDocument(id);
  }

  loadDocument(id: string): void {
    this.loading = true;
    this.documentService.get(id).subscribe({
      next: (doc) => {
        this.document = doc;
        this.editFilename = doc.Filename;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load document.';
        this.loading = false;
      },
    });
  }

  startEdit(): void {
    this.editMode = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.editMode = false;
    if (this.document) this.editFilename = this.document.Filename;
  }

  saveEdit(): void {
    if (!this.document) return;
    this.saving = true;
    this.documentService.update(this.document._id, { Filename: this.editFilename }).subscribe({
      next: (updated) => {
        this.document = updated;
        this.editMode = false;
        this.saving = false;
        this.successMessage = 'Document updated successfully.';
      },
      error: () => {
        this.errorMessage = 'Update failed. Please try again.';
        this.saving = false;
      },
    });
  }

  deleteDocument(): void {
    if (!this.document) return;
    if (!confirm(`Delete "${this.document.Filename}"? This cannot be undone.`)) return;

    this.deleting = true;
    this.documentService.delete(this.document._id).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorMessage = 'Delete failed. Please try again.';
        this.deleting = false;
      },
    });
  }

  downloadDocument(): void {
    if (!this.document) return;
    this.downloading = true;
    this.documentService.download(this.document._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = this.document!.Filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: () => {
        this.errorMessage = 'Download failed. Please try again.';
        this.downloading = false;
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
