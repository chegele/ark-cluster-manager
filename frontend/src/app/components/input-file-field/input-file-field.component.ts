
const component : string = "input-file-field";
import { Component, Input, EventEmitter, Output, OnInit} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ]
})
export class InputFileFieldComponent implements OnInit {

  @Input() icon?: string = "folder";
  @Input() placeholder?: string = "Select a file";
  @Input() status?: number = 0;
  @Input() value: File | null = null;
  @Output() valueChange = new EventEmitter<File>
  displayValue: string = ""

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.valueChange.subscribe(file => {
      this.displayValue = file.name;
    });
  }

  fileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList?.length > 0) this.valueChange.emit(fileList[0]);
  }

}
