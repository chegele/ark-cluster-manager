
const component : string = "input-date-field";
import { Component, Input, EventEmitter, Output} from '@angular/core';

export interface InputDate {
  year: string | null,
  month: string | null, 
  day: string | null,
  date: Date | null
}

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ]
})
export class InputDateFieldComponent {

  @Input() icon?: string = 'calendar';
  @Input() placeholder?: string = 'Date';
  @Input() status?: number = 0;
  @Input() value: InputDate;
  @Output() valueChange = new EventEmitter<InputDate>();
  showPlaceholder = true;

  constructor() {}

  private parseInput() {
    this.value.day = this.value.day?.replace(/\D/g,'') || null;
    this.value.month = this.value.month?.replace(/\D/g,'') || null;
    this.value.year = this.value.year?.replace(/\D/g,'') || null;
    if (this.value.day && this.value.month && this.value.year) {
      const dateString = `${this.value.month}/${this.value.day}/${this.value.year}`;
      this.value.date = new Date(dateString);
      if (this.value.date) this.valueChange.emit(this.value);
    }
  }

  @Input() set setDate(value: Date | string | null) {
    if (!value) return;
    if (typeof value == "string") value = new Date(value);
    this.value.date = value;
    this.value.month = (value.getMonth() + 1).toString();
    this.value.day = value.getDate().toString();
    this.value.year = value.getFullYear().toString();
    this.showPlaceholder = false;
  } 

  onFocusBegin() {
    this.showPlaceholder = false;
  }

  onFocusEnd() {
    const {month, day, year} = this.value;
    if (!month && !day && !year) this.showPlaceholder = true;
    else if (month && day && year) this.parseInput();
  }

}
