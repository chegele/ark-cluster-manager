
const component : string = "input-text-field";
import { Component, Input, EventEmitter, Output, OnInit} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ]
})
export class InputTextFieldComponent implements OnInit {

  @Input() inputType: ('username' | 'password' | 'email' | 'key' | 'other');
  @Input() icon?: string;
  @Input() placeholder?: string;
  @Input() status?: number = 0;
  @Input() value: string = "";
  @Output() valueChange = new EventEmitter<string>
  iconHtml: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}

  populateDefaults() {
    switch(this.inputType) {
      case "username": {
        if (this.icon == undefined) this.icon = "person";
        if (this.placeholder == undefined) this.placeholder = "Username";
        break;
      }
      case "password": {
        if (this.icon == undefined) this.icon = "unlock";
        if (this.placeholder == undefined) this.placeholder = "Password";
        break;
      }
      case "email": {
        if (this.icon == undefined) this.icon = "envelope";
        if (this.placeholder == undefined) this.placeholder = "Email Address";
        break;
      }
      case "key": {
        if (this.icon == undefined) this.icon = "key";
        if (this.placeholder == undefined) this.placeholder = "Verification key";
        break;
      }
      default: {
        if (this.icon == undefined) throw new Error("Other input type with no icon provided.");
        if (this.placeholder == undefined) throw new Error("Other input type provided with no placeholder text.");
      }
    }
  }

  ngOnInit() {
    this.populateDefaults();
  }

}
