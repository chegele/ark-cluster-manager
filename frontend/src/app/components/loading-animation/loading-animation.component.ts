
const component : string = "loading-animation";
import { Component, Input } from '@angular/core';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class LoadingAnimationComponent {

  @Input() active = true;
  @Input() width = 200;
  @Input() height = 100;

}
