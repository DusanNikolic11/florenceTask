import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReportRecord {
  _id: string;
  userId: string;
  name: string;
  filenamePattern: string;
  frequencyDays: number;
  enabled: boolean;
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportInstance {
  _id: string;
  reportId: string;
  s3Location: string;
  documentCount: number;
  generatedAt: string;
}

export interface CreateReportPayload {
  name: string;
  filenamePattern: string;
  frequencyDays?: number;
}

export interface UpdateReportPayload {
  name?: string;
  filenamePattern?: string;
  frequencyDays?: number;
  enabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  list(): Observable<ReportRecord[]> {
    return this.http.get<ReportRecord[]>(this.base);
  }

  get(id: string): Observable<ReportRecord> {
    return this.http.get<ReportRecord>(`${this.base}/${id}`);
  }

  create(payload: CreateReportPayload): Observable<ReportRecord> {
    return this.http.post<ReportRecord>(this.base, payload);
  }

  update(id: string, payload: UpdateReportPayload): Observable<ReportRecord> {
    return this.http.patch<ReportRecord>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getInstances(reportId: string): Observable<ReportInstance[]> {
    return this.http.get<ReportInstance[]>(`${this.base}/${reportId}/instances`);
  }
}
