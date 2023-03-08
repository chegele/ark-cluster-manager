import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UGCValidationService {

  public imageExists(url: string) {
    return new Promise(resolve => {
      var img = new Image()
      img.addEventListener('load', () => resolve(true))
      img.addEventListener('error', () => resolve(false))
      img.src = url
    });
  }
  
}
