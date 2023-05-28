import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly localStorageKey = 'galleryImages';

  constructor() { }

  getImages(): { data: string; location: string; description: string; }[] {
    const imagesString = localStorage.getItem(this.localStorageKey);
    return imagesString ? JSON.parse(imagesString) : [];
  }

  setImages(images: { data: string; location: string; description: string; }[]): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(images));
  }

  clearImages(): void {
    localStorage.removeItem(this.localStorageKey);
  }
}
