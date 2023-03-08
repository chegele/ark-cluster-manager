
const component : string = "landing-page";
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class LandingRouteComponent {

  constructor(private router: Router) {}

  login() {
    this.router.navigate(["/login"]);
  }

  register() {
    this.router.navigate(['/register']);
  }

  details() {

  }

}
