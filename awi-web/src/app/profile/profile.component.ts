import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  currentPassword = '';
  newPassword = '';
  newPasswordAgain = '';
  saving = false;
  error: string | null = null;
  saved = false;

  constructor(private http: HttpClient, private authService: AuthService) {}

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  onSubmit(): void {
    this.error = null;
    this.saved = false;

    if (!this.currentPassword || !this.newPassword) {
      this.error = 'Töltsd ki mindkét mezőt.';
      return;
    }
    if (this.newPassword !== this.newPasswordAgain) {
      this.error = 'A két új jelszó nem egyezik.';
      return;
    }

    this.saving = true;
    this.http
      .put('/api/users/me/password', {
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.saved = true;
          this.currentPassword = '';
          this.newPassword = '';
          this.newPasswordAgain = '';
        },
        error: () => {
          this.saving = false;
          this.error = 'A jelenlegi jelszó helytelen, vagy a mentés nem sikerült.';
        },
      });
  }
}