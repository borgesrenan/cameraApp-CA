import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.page.html',
  styleUrls: ['./gallery.page.scss'],
})
export class GalleryPage implements OnInit {
  images: { data: string; location: string; description: string; }[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.images = navigation.extras.state['images'] || [];
    }
  }

  goBack() {
    this.router.navigateByUrl('/home');
  }

  openFavorites() {
    this.router.navigateByUrl('/favorites');
  }

  takePhoto() {
    this.router.navigateByUrl('/camera');
  }

  deleteAll() {
    // Delete all photos from the gallery page
    this.images = [];
  }
}
