import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { SiteContent } from './site-content.model';

@Injectable({
  providedIn: 'root',
})
export class SiteContentService {
  // Helyes Express API végpont prefix
  private apiUrl = 'http://localhost:3000/api/site-content';

  constructor(private http: HttpClient) {}

  get(): Observable<SiteContent> {
    return this.http.get<SiteContent>(this.apiUrl).pipe(
      timeout(4000),
      map((data) => {
        console.log('SITE CONTENT VALASZ:', data);
        return {
          heroTitle: data?.heroTitle || '',
          heroLead: data?.heroLead || '',
          heroImageUrl: data?.heroImageUrl || '',
          contactPhone: data?.contactPhone || '',
          contactEmail: data?.contactEmail || '',
          services: Array.isArray(data?.services) ? data.services : [],
          weldTypes: Array.isArray(data?.weldTypes) ? data.weldTypes : [],
          pricing: Array.isArray(data?.pricing) ? data.pricing : [],
        };
      }),
      catchError((err) => {
        console.error('API hiba vagy időtúllépés (SiteContentService):', err);
        return of({
          heroTitle: '',
          heroLead: '',
          heroImageUrl: '',
          contactPhone: '',
          contactEmail: '',
          services: [],
          weldTypes: [],
          pricing: [],
        });
      })
    );
  }

  update(content: SiteContent): Observable<SiteContent> {
    return this.http.put<SiteContent>(this.apiUrl, content).pipe(
      timeout(5000)
    );
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<{ url: string }>(`${this.apiUrl}/image`, formData).pipe(
      timeout(10000)
    );
  }
}