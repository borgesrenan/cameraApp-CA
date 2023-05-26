import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LocalFile } from './camera/camera.page';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private imagesSubject = new BehaviorSubject<LocalFile[]>([]);
  public images$ = this.imagesSubject.asObservable();

  constructor() { }

  updateImages(images: LocalFile[]) {
    this.imagesSubject.next(images);
  }
}