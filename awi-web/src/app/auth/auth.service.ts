import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'editor';
}

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api/auth';
  private accessToken: string | null = null;
  private currentUser: User | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          this.accessToken = response.token;
          this.currentUser = response.user;
        })
      );
  }

  logout(): void {
    this.accessToken = null;
    this.currentUser = null;
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Ezt a metódust hiányolta a TypeScript:
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }
}