import { Component, inject, PLATFORM_ID } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../auth/auth.service";

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  get isAdmin(): boolean {
    // Szerver oldalon automatikusan hamissal térünk vissza, hogy ne dobjon hibát hiányzó token esetén
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return this.authService.isAdmin();
  }

  logout(): void {
    // Kijelentkezés és átirányítás kizárólag a böngészőben futhat le
    if (isPlatformBrowser(this.platformId)) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}