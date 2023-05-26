import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LocalFile } from '../camera/camera.page'; // Import LocalFile interface from CameraPage
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.page.html',
  styleUrls: ['./gallery.page.scss'],
})
export class GalleryPage implements OnInit {
  images: LocalFile[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController

  ) { }

  ngOnInit() {

  }

goBack() {
  this.navCtrl.back();
}
}
