
const component : string = "input-enum-field";
import { Component, Input, EventEmitter, Output, OnInit} from '@angular/core';

export interface DropdownOption {
  icon: string, display: string, value: string
}

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ]
})
export class InputEnumFieldComponent implements OnInit {

  @Input() placeholder: DropdownOption;
  @Input() options: DropdownOption [];
  @Input() status?: number = 0;
  @Output() selectionChange = new EventEmitter<DropdownOption>

  currentValue: DropdownOption;
  showDropdown = false;

  constructor() {}

  ngOnInit() {
    if (!this.placeholder) this.placeholder = {icon: 'list', display: "Select an option", value: ""}
    if (typeof this.placeholder == 'string') this.placeholder = {icon: 'list', display: this.placeholder, value: ""}
    this.currentValue = this.placeholder;
  }

  @Input() set setOption(option: DropdownOption | null) {
    if (!option) return;
    this.selectOption(option);
  }

  selectOption(option: DropdownOption) {
    this.currentValue = option;
    this.selectionChange.emit(option);
    this.showDropdown = false;
  }

}
