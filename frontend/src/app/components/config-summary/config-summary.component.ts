
const component : string = "config-summary";
import { Component, Input, Output, OnInit, EventEmitter, ElementRef } from '@angular/core';
import { ConfigFile } from 'src/app/models/config-file';
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ConfigSummaryComponent implements OnInit {

  @Input() id: string = "";
  @Output() onConfigChange = new EventEmitter();
  config: ConfigFile;
  error: string; 
  loading: boolean = true;
  showDeletionPrompt = false;
  showConfigUploader = false;

  constructor(
    private api: ApiService, 
    private session: SessionService,
    private element: ElementRef) {}

  async ngOnInit() {
    if (!this.id) return;
    const response = await this.api.config.getSummary(this.id);
    if (response.status != 200) {
      this.error = "Error " + response.status + " encountered.";
    } else {
      this.config = <ConfigFile>response.response.file;
      this.config.uploaded = new Date(this.config.uploaded);
    }
    this.loading = false;
  }

  async deleteClicked() {
    this.showDeletionPrompt = false;
    this.loading = true;
    const result = await this.api.config.delete(this.id);
    if (result.status == 200) {
      const self = <HTMLElement>this.element.nativeElement;
      self.parentElement?.removeChild(self);
    } else if (result.status == 409){
      this.loading = false;
      this.error = "Configuration in use!";
    } else {
      this.loading = false;
      this.error = "Error " + result.status + " encountered.";
    }
  }

}
