
const component : string = "input-boolean-field";
import { Component, Input, EventEmitter, Output} from '@angular/core';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ]
})
export class InputBooleanFieldComponent {

  @Input() icon?: string = "unlock";
  @Input() iconFalse?: string | null = null;
  @Input() status?: number = 0;
  @Input() displayTrue: string = "True";
  @Input() displayFalse: string = "False";
  @Input() value: boolean = true;
  @Output() valueChange = new EventEmitter<boolean>

  constructor() {}

  toggle() {
    this.value = !this.value;
    this.valueChange.emit(this.value);
  }

}
