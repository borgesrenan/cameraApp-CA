import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CameraPage } from '../camera/camera.page';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private navCtrl: NavController) {}

  goToCameraPage() {
    this.navCtrl.navigateForward('camera');
  }

  goToGalleryPage() {
    this.navCtrl.navigateForward('gallery');
  }

  goToFavoritesPage() {
    this.navCtrl.navigateForward('favorites');
  }

}