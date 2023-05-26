import { Component } from '@angular/core';
import { LocalFile } from 'src/app/camera/camera.page';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.page.html',
  styleUrls: ['./gallery.page.scss'],
})
export class GalleryPage {
  images: LocalFile[] = []; // Add the images property to hold the selected and captured images

  constructor() { }

  ionViewDidEnter() {
    this.images = JSON.parse(localStorage.getItem('selectedImages') || '[]');
  }
}
