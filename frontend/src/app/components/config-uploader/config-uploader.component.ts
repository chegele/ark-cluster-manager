
const component : string = "config-uploader";
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics';
import { ApiService } from 'src/app/services/api/api.service';

interface convertResult { category: string, percent: number }

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ]
})
export class ConfigUploaderComponent {

  constructor(private api: ApiService, private track: AnalyticsService) {}

  @Input() show: boolean = false;
  @Output() showChange = new EventEmitter<boolean>();
  @Output() idCreated = new EventEmitter<string>();
  display: ('input' | 'loading' | 'result') = 'input';
  errors: string[] = [];
  id: string = "";
  results: convertResult[] = [];
  nameValue = "";
  nameStatus = 0;
  descriptionValue = "";
  descriptionStatus = 0;
  gameFile1Value: File | null = null;
  gameFile1Status = 0;
  gameFile2Value: File | null = null;
  gameFile2Status = 0;

  capitalize(str: string) {
    return str[0].toUpperCase() + str.substr(1).toLowerCase();
  }

  percentColor(percent: number) {
    if (percent > 80) return 'var(--success-text-color)';
    else if (percent > 60) return 'var(--warning-text-color)'
    else return 'var(--error-text-color)'; 
  }

  // Click event is coming from the backdrop
  // Since the backdrop contains the close button, it sends events for both
  closeClick(event: any) {
    const closeIds = ['backdrop', 'closeIcon'];
    const target: HTMLElement = event.target;
    if (closeIds.includes(target.id) || target.parentElement?.id == 'closeIcon') {
      this.show = false;
      this.showChange.emit(this.show);
    }
  }

  continueClicked() {
    this.idCreated.emit(this.id);
    this.reset();
    this.show = false;
    this.showChange.emit(this.show);
  }

  async deleteClicked() {
    this.display = "loading";
    const result = await this.api.config.delete(this.id);
    if (result.status == 200) return this.reset();
    this.errors = result.verboseErrors;
    this.display = "result";
  }

  async uploadClicked() {
    this.reset();
    this.validateInput();
    if (this.errors.length > 0) return;
    const result = await this.uploadConfiguration();
  }

  private reset() {
    this.nameStatus = 0;
    this.descriptionStatus = 0;
    this.gameFile1Status = 0;
    this.gameFile2Status = 0;
    this.errors = [];
    this.results = [];
    this.id = "";
    this.display = 'input';
  }

  private validateInput() {
    if (!this.nameValue || this.nameValue == "") {
      this.errors.push("You must enter a name for the configuration.");
      this.nameStatus = -1;
    }
    if (!this.descriptionValue || this.descriptionValue == "") {
      this.errors.push("You must enter a description for the configuration.");
      this.descriptionStatus = -1;
    }
    if (this.gameFile1Value == null) {
      this.errors.push("You must select a game.ini configuration file.");
      this.gameFile1Status = -1;
    }
    if (this.gameFile2Value == null) {
      this.errors.push("You must select a gameUserSettings.ini configuration file.");
      this.gameFile2Status = -1;
    }
  }

  private async uploadConfiguration() {
    this.display = 'loading';
    const name = this.nameValue;
    const description = this.descriptionValue;
    const file1 = <File>this.gameFile1Value;
    const file2 = <File>this.gameFile2Value;
    const result = await this.api.config.upload(name, description, file1, file2);
    if (result && result.friendlyErrors.length > 0) {
      this.errors = result.friendlyErrors;
      this.display = 'input';
      return;
    }
    this.id = result.response.id;
    this.results = result.response.stats;
    this.display = "result";
    this.track.configCreated();
  }

}
