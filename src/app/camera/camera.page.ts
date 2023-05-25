import { Component, OnInit } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { HttpClient } from '@angular/common/http';
import { LoadingController, Platform, ToastController, NavController } from '@ionic/angular';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

import { finalize } from 'rxjs/operators';


const IMAGE_DIR = 'stored-images';

interface LocalFile {
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
    private navCtrl: NavController
  ) { }

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
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos // Camera, Photos or Prompt!
    });

    if (image) {
      this.saveImage(image)
    }
  }

  // Create a new file from a capture image
  async saveImage(photo: Photo) {
    const base64Data = await this.readAsBase64(photo);

    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: `${IMAGE_DIR}/${fileName}`,
      data: base64Data,
      directory: Directory.Data
    });

    // Reload the file list
    // Improve by only loading for the new image and unshifting array!
    this.loadFiles();
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
    await Filesystem.deleteFile({
      directory: Directory.Data,
      path: file.path
    });
    this.loadFiles();
    this.presentToast('File removed.');
  }

  goBack() {
    this.navCtrl.back();
  }
}