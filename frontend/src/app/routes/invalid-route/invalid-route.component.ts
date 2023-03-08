
const component : string = "invalid-route";
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class InvalidRouteComponent {

  constructor(private router: Router) {}

  showProfile() {
    this.router.navigate(["/profile"]);
  }

}
