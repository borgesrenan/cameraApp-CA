import { Component, OnInit } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { HttpClient } from '@angular/common/http';
import { LoadingController, Platform, ToastController, NavController } from '@ionic/angular';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

import { finalize } from 'rxjs/operators';

import { Router } from '@angular/router';


const IMAGE_DIR = 'stored-images';

export interface LocalFile {
  name: string;
  path: string;
  data: string;
}

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
})
export class CameraPage implements OnInit {
  images: LocalFile[] = []; // Created a array to to hold the images

  constructor(
    private plt: Platform,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private router: Router


  ) {
    this.favorites = []; // Here I initialize the favorites array 
  }

  async ngOnInit() {
    this.loadFiles();
  }

  async loadFiles() {
    this.images = [];

    const loading = await this.loadingCtrl.create({
      message: 'Loading data...'
    });
    await loading.present();

    // Check if the image directory exists
    const dirExists = await Filesystem.readdir({
      path: IMAGE_DIR,
      directory: Directory.Data
    }).then(() => true).catch(() => false);

    if (dirExists) {
      // If the directory exists, load the file data
      Filesystem.readdir({
        path: IMAGE_DIR,
        directory: Directory.Data
      })
        .then((result) => {
          this.loadFileData(result.files.map((x) => x.name));
        })
        .catch((err) => {
          console.error('Error reading image directory:', err);
        })
        .finally(() => {
          loading.dismiss();
        });
    } else {
      // If the directory does not exist, create it
      Filesystem.mkdir({
        path: IMAGE_DIR,
        directory: Directory.Data,
        recursive: false
      })
        .then(() => {
          loading.dismiss();
        })
        .catch((err) => {
          console.error('Error creating image directory:', err);
          loading.dismiss();
        });
    }
  }

  // Get the actual base64 data of an image based on the name of the file
  async loadFileData(fileNames: string[]) {
    for (let f of fileNames) {
      const filePath = `${IMAGE_DIR}/${f}`;

      const readFile = await Filesystem.readFile({
        path: filePath,
        directory: Directory.Data
      });

      this.images.push({
        name: f,
        path: filePath,
        data: `data:image/jpeg;base64,${readFile.data}`
      });
    }
  }

  // A helper function to give a toast message
  async presentToast(text: string) {
    const toast = await this.toastCtrl.create({
      message: text,
      duration: 3000
    });
    toast.present();
  }

  //Take a photo using my camera
  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      const newImage: LocalFile = {
        name: new Date().getTime().toString(),
        data: 'data:image/jpeg;base64,' + image.base64String,
        path: '',
      };

      // Add the newImage object to my images array
      this.images.push(newImage);
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  }

  // prompt the user to select a image from the file input.
  async selectImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.saveImage(file); // Here I save the image
      }
    };
    input.click();
  }

  // Create a new file from a captured image or a selected file
  async saveImage(photo: Photo | File) {
    let base64Data: string;

    if ('base64String' in photo) {
      // Photo from Camera Plugin
      base64Data = 'data:image/jpeg;base64,' + photo.base64String;
    } else {
      // Photo from File input
      const file = photo as File;
      base64Data = await this.readAsBase64FromFile(file);
    }

    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: `${IMAGE_DIR}/${fileName}`,
      data: base64Data,
      directory: Directory.Data
    });

    // Reload the file list
    await this.loadFiles();
  }

  openGallery() {
    this.router.navigate(['/gallery'], {
      state: {
        images: this.images
      }
    });
  }

  // Helper function to read the selected file as base64
  private async readAsBase64FromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // https://ionicframework.com/docs/angular/your-first-app/3-saving-photos
  private async readAsBase64(photo: Photo): Promise<string> {
    if (this.plt.is('hybrid')) {
      if (photo.path) {
        const file = await Filesystem.readFile({
          path: photo.path
        });

        return file.data;
      } else {
        console.error("Path of the photo is undefined.");
        return '';
      }
    } else {
      if (photo.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        return await this.convertBlobToBase64(blob) as string;
      } else {
        console.error("Web path of the photo is undefined.");
        return '';
      }
    }
  }

  // Helper function to read the base64 data
  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  //Start the upload process 
  async startUpload(file: LocalFile) {
    const response = await fetch(file.data);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('file', blob, file.name);
    this.uploadData(formData);
  }

  // Here I tried to upload the formData to the server
  async uploadData(formData: FormData) {
    const loading = await this.loadingCtrl.create({
      message: 'Uploading image...',
    });
    await loading.present();

    const url = 'http://localhost:8888/images/upload.php'; // using a API

    this.http.post(url, formData)
      .pipe(
        finalize(() => {
          loading.dismiss();
        })
      )
      .subscribe(res => {
        const uploadResponse = res as { success: boolean };
        if (uploadResponse.success) {
          this.presentToast('File upload complete.');
        } else {
          this.presentToast('File upload failed.');
        }
      });
  }

  // Delete the file from the camera page
  async deleteImage(file: LocalFile) {
    await Filesystem.deleteFile({
      directory: Directory.Data,
      path: file.path
    });

    // Remove the image from the images array
    const index = this.images.findIndex((image) => image.name === file.name);
    if (index !== -1) {
      this.images.splice(index, 1);
    }

    this.presentToast('File removed.');

    // Check if the file is in the favorites
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const updatedFavorites = favorites.filter((favorite: LocalFile) => favorite.name !== file.name);

    // If the favorites list has changed, update the local storage
    if (favorites.length !== updatedFavorites.length) {
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    }
  }


  goBack() {
    this.navCtrl.back();
  }

  // Add the favories property to hold the favorite photos
  favorites: LocalFile[] = [];

  // Check if a file is marked as a favorite
  isFavorite(file: LocalFile): boolean {
    return this.favorites.some((favorite) => favorite.name === file.name);
  }

  // Add a photo to favorites or remove it if already a favorite
  async addToFavorites(file: LocalFile) {
    const index = this.favorites.findIndex((favorite) => favorite.name === file.name);

    if (index !== -1) {
      // File already exists in favorites, remove it
      this.favorites.splice(index, 1);
    } else {
      // File does not exist in favorites, add it
      this.favorites.push(file);
    }

    // Update the local storage with the updated favorites array
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
  }
  openFavorites() {
    this.navCtrl.navigateForward('/favorites');
  }

  goToHomePage() {
    this.navCtrl.navigateForward('/home');
  }
  
} 