import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteContent } from './site-content.model';
import { SiteContentService } from './site-content.service';

@Component({
  selector: 'app-site-content-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './site-content-editor.component.html',
  styleUrl: './site-content-editor.component.scss',
})
export class SiteContentEditorComponent implements OnInit {
  content: SiteContent = {
    heroTitle: '',
    heroLead: '',
    heroImageUrl: '',
    contactPhone: '',
    contactEmail: '',
    services: [],
    weldTypes: [],
    pricing: [],
  };

  loading = true;
  saving = false;
  uploading = false;
  error: string | null = null;
  saved = false;

  constructor(private siteContentService: SiteContentService) {}

  ngOnInit(): void {
    console.log('DEBUG: ngOnInit elindult');

    this.siteContentService.get().subscribe({
      next: (data) => {
        console.log('DEBUG: adatok megérkeztek a komponensbe:', data);
        if (data) {
          this.content = data;
        }
        this.loading = false; // ITT ÁLLÍTJA KI A BETÖLTÉS ÁLLAPOTOT
      },
      error: (err) => {
        console.error('DEBUG: hiba történt:', err);
        this.error = 'Nem sikerült betölteni az adatokat.';
        this.loading = false;
      },
    });
  }

  onSave(): void {
    this.error = null;
    this.saved = false;

    if (!this.content.heroTitle || !this.content.heroLead) {
      this.error = 'A cím és a bevezető szöveg kitöltése kötelező.';
      return;
    }

    this.saving = true;
    this.siteContentService.update(this.content).subscribe({
      next: (updated) => {
        this.content = updated;
        this.saved = true;
        this.saving = false;
      },
      error: () => {
        this.error = 'A mentés nem sikerült.';
        this.saving = false;
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.siteContentService.uploadImage(file).subscribe({
      next: (res) => {
        this.content.heroImageUrl = res.url;
        this.uploading = false;
      },
      error: () => {
        this.error = 'A kép feltöltése sikertelen.';
        this.uploading = false;
      },
    });
  }
}