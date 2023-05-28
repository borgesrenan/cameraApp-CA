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
  images: LocalFile[] = [];

  constructor(
    private plt: Platform,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private router: Router


  ) {
    this.favorites = [];
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

    Filesystem.readdir({
      path: IMAGE_DIR,
      directory: Directory.Data
    })
      .then(
        (result) => {
          this.loadFileData(result.files.map((x) => x.name));
        },
        async (err) => {
          // Folder does not yet exists!
          await Filesystem.mkdir({
            path: IMAGE_DIR,
            directory: Directory.Data
          });
        }
      )
      .then((_) => {
        loading.dismiss();
      });
  }

  // Get the actual base64 data of an image
  // base on the name of the file
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

  // Little helper
  async presentToast(text: string) {
    const toast = await this.toastCtrl.create({
      message: text,
      duration: 3000
    });
    toast.present();
  }

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
        path: '', // Add a default or placeholder value for the path property
      };

      // Add the newImage object to your images array or perform any other required logic
      this.images.push(newImage);
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  }

  async selectImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.saveImage(file);
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
    // Navigate to the GalleryPage when the button is clicked
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
        return ''; // Handle the undefined case appropriately, e.g., return an empty string or null.
      }
    } else {
      if (photo.webPath) {
        const response = await fetch(photo.webPath);
        // Rest of your code to handle the response
        const blob = await response.blob();
        return await this.convertBlobToBase64(blob) as string;
      } else {
        console.error("Web path of the photo is undefined.");
        return ''; // Handle the undefined case appropriately, e.g., return an empty string or null.
      }
    }
  }

  // Helper function
  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  // Convert the base64 to blob data
  // and create  formData with it
  async startUpload(file: LocalFile) {
    const response = await fetch(file.data);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('file', blob, file.name);
    this.uploadData(formData);
  }

  // Upload the formData to our API
  async uploadData(formData: FormData) {
    const loading = await this.loadingCtrl.create({
      message: 'Uploading image...',
    });
    await loading.present();

    // Use your own API!
    const url = 'http://localhost:8888/images/upload.php';

    this.http.post(url, formData)
      .pipe(
        finalize(() => {
          loading.dismiss();
        })
      )
      .subscribe(res => {
        const uploadResponse = res as { success: boolean }; // Type assertion
        if (uploadResponse.success) {
          this.presentToast('File upload complete.');
        } else {
          this.presentToast('File upload failed.');
        }
      });
  }

  async deleteImage(file: LocalFile) {
    // Delete the file from the camera page
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

  // Add the 'favorites' property to hold the favorite photos
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