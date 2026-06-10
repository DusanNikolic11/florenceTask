import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DocumentRecord {
  _id: string;
  Filename: string;
  FileLocation: string;
  Size: number;
  MD5: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly base = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  list(): Observable<DocumentRecord[]> {
    return this.http.get<DocumentRecord[]>(this.base);
  }

  get(id: string): Observable<DocumentRecord> {
    return this.http.get<DocumentRecord>(`${this.base}/${id}`);
  }

  create(file: File, filename?: string): Observable<DocumentRecord> {
    const form = new FormData();
    form.append('file', file);
    if (filename) form.append('filename', filename);
    return this.http.post<DocumentRecord>(this.base, form);
  }

  update(id: string, data: Partial<Omit<DocumentRecord, '_id'>>): Observable<DocumentRecord> {
    return this.http.patch<DocumentRecord>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getDownloadUrl(id: string): string {
    return `${this.base}/${id}/file`;
  }

  download(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/file`, { responseType: 'blob' });
  }
}
