import { Component } from '@angular/core';
import { LocalFile } from 'src/app/camera/camera.page';
import { AlertController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';



@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage {
  favoriteImages: LocalFile[] = [];

  constructor(
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private router: Router) { }

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    // Retrieve favorite images from local storage
    const favoritesData = localStorage.getItem('favorites');
    if (favoritesData) {
      this.favoriteImages = JSON.parse(favoritesData);
    }
  }

  async deleteAllImages() {
    const confirm = await this.alertCtrl.create({
      header: 'Delete Confirmation',
      message: 'Are you sure you want to delete all images?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          handler: () => {
            this.favoriteImages = []; // Clear the array
            localStorage.removeItem('favorites'); // Remove from local storage
          },
        },
      ],
    });

    await confirm.present();
  }

  goBack() {
    this.router.navigateByUrl('/home');
  }
}