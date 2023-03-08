import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `<router-outlet (activate)="onActivate()"></router-outlet>`,
  styles: []
})
export class AppComponent {
  title = 'ark-cluster';

  onActivate() {
    window.scroll({ 
      top: 0, 
      left: 0, 
      behavior: 'smooth' 
    });
  }
}
