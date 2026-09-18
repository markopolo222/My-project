import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NewOrder, Order } from './order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = '/api/orders';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  create(order: NewOrder): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  updateDetails(
    id: string,
    changes: Partial<Pick<Order, 'status' | 'dueDate' | 'internalNote'>>
  ): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}`, changes);
  }

  uploadAttachment(id: string, file: File): Observable<{ attachmentUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ attachmentUrl: string }>(`${this.apiUrl}/${id}/attachment`, formData);
  }

  // PDF letöltése memóriában lévő tokennel (Blob válaszként)
  downloadQuotePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/quote-pdf`, {
      responseType: 'blob',
    });
  }

  // CSV export letöltése memóriában lévő tokennel (Blob válaszként)
  downloadExportCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export.csv`, {
      responseType: 'blob',
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}