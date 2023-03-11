import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AnalyticsService } from './services/analytics';

@Component({
  selector: 'app-root',
  template: `<router-outlet (activate)="onActivate()"></router-outlet>`,
  styles: []
})
export class AppComponent {
  title = 'ark-cluster';

  constructor(router: Router, track: AnalyticsService) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) track.pageVisit();
    });
  }

  onActivate() {
    window.scroll({ 
      top: 0, 
      left: 0, 
      behavior: 'smooth' 
    });
  }
}
