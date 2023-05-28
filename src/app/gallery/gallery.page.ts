import { Component, OnInit, Inject} from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageService } from '../../service/image.service';

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
    private navCtrl: NavController,
    @Inject(ImageService) private imageService: ImageService) { }

  ngOnInit() {
    this.images = this.imageService.getImages();
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      const newImages = navigation.extras.state['images'] || [];
      this.images = [...this.images, ...newImages];
      this.imageService.setImages(this.images);
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
    this.imageService.clearImages();
  }
}
