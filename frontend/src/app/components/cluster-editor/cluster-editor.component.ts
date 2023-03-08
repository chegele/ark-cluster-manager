
const component : string = "cluster-editor";
import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { Profile } from 'src/app/models/database/profile';
import { Cluster, ClusterBuilder } from 'src/app/models/cluster';
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';
import { InputDate } from '../input-date-field/input-date-field.component';
import { ConfigFile } from 'src/app/models/config-file';
import { DropdownOption } from '../input-enum-field/input-enum-field.component';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ]
})
export class ClusterEditorComponent implements OnInit {

  constructor(
    private api: ApiService, 
    private session: SessionService
  ) {}

  @Input() cluster: Cluster;
  @Input() show: boolean = false;
  @Output() showChange = new EventEmitter<boolean>();
  @Output() clusterUpdated = new EventEmitter();
  display: ('input' | 'loading' | 'result') = 'input';
  profile: Profile;
  resultingCluster: Cluster | null = null;
  errors: string[] = [];
  inputPage = 1;

  nameValue = "";         nameStatus = 0;
  descriptionValue = "";  descriptionStatus = 0;
  logoValue = "";         logoStatus = 0;
  pveValue = true;       pveStatus = 0;
  publicValue = true;    publicStatus = 0;

  lastWipeStatus = 0;
  lastWipeInitialDate: Date | null = null;
  lastWipeValue: InputDate = { year: null, month: null, day: null, date: null };

  nextWipeStatus = 0;
  nextWipeInitialDate: Date | null = null;
  nextWipeValue: InputDate = { year: null, month: null, day: null, date: null }; 
  
  configIdStatus = 0;
  configIdValue = ""; 
  configIdPlaceholder = {icon: "list", display: "Configuration", value: ""};
  configIdInitialOption: DropdownOption | null = null;
  configIdOptions: DropdownOption[] = [];   

  platformStatus = 0;
  platformValue = "";
  platformPlaceholder = {icon: "list", display: "Cluster platform", value: ""};
  platformInitialOption: DropdownOption | null = null;
  platformOptions = [
    {icon: "xbox", display: "Xbox & Windows", value: "XBOX"},
    {icon: "playStation", display: "PlayStation", value: "PLAYSTATION"},
    {icon: "steam", display: "Steam", value: "STEAM"},
  ];

  hostTypeStatus = 0;
  hostTypeValue = "";
  hostTypePlaceholder = {icon: "list", display: "Hosting Type", value: ""};
  hostTypeInitialOption: DropdownOption | null = null;
  hostTypeOptions = [
    {icon: "cloud", display: "Nitrado", value: "NITRADO"},
    {icon: "pc", display: "Self Hosted", value: "SELF_HOSTED"},
    {icon: "pc2", display: "Other", value: "OTHER"},
  ];

  async ngOnInit() {
    const profile = this.session.getProfile();
    if (!profile) this.show = false;
    else {
      this.profile = profile;
      for (const configId of profile.configurations) {
        const response = await this.api.config.getSummary(configId);
        if (response.status != 200) continue;
        const config: ConfigFile = response.response.file;
        this.configIdOptions.push({
          icon: "gearFill",
          display: config.name,
          value: config._id
        });
      }
      this.validateConfigsExist();
      this.syncClusterProperties();
    }
  }

  pageInput(direction: number) {
    if (direction != -1 && direction != 1) return;
    if (direction == 1 && this.inputPage > 2) return;
    if (direction == -1 && this.inputPage < 2) return;
    this.inputPage = this.inputPage + direction;
  }
  
  close() {
    this.show = false;
    this.showChange.emit(this.show);
  }

  syncClusterProperties() {
    this.nameValue = this.cluster.generalInformation.name;
    this.descriptionValue = this.cluster.generalInformation.shortDescription;
    this.logoValue = this.cluster.homepage.logo;
    const config = this.getDropdownOption(this.cluster.configId, this.configIdOptions);
    if (config) this.configIdInitialOption = config;
    const platform = this.getDropdownOption(this.cluster.generalInformation.platform, this.platformOptions);
    if (platform) this.platformInitialOption = platform;
    const hostType = this.getDropdownOption(this.cluster.generalInformation.hostType, this.hostTypeOptions);
    if (hostType) this.hostTypeInitialOption = hostType;
    this.lastWipeInitialDate = this.cluster.generalInformation.lastWipe;
    this.nextWipeInitialDate = this.cluster.generalInformation.nextWipe;
    this.pveValue = !this.cluster.generalInformation.pvp;
    this.publicValue = this.cluster.generalInformation.public;
  }

  validateConfigsExist() {
    if (this.configIdOptions.length < 1) {
      this.configIdStatus = -1
      this.errors.push("You have no configuration files. You must upload one before you can create a cluster.");
    }
  }

  getDropdownOption(value: string, options: DropdownOption[]) {
    return options.find(option => option.value == value);
  }

  resetErrors() {
    this.errors = [];
    this.nameStatus = 0;
    this.descriptionStatus = 0;
    this.logoStatus = 0;
    this.pveStatus = 0;
    this.publicStatus = 0;
    this.configIdStatus = 0;
    this.platformStatus = 0;
    this.hostTypeStatus = 0;
    this.lastWipeStatus = 0;
    this.nextWipeStatus = 0;
    this.validateConfigsExist();
  }

  generateUpdatedCluster(): Cluster {
    const update = JSON.parse(JSON.stringify(this.cluster));
    update.generalInformation.name = this.nameValue;
    update.homepage.title = this.nameValue;
    update.generalInformation.shortDescription = this.descriptionValue;
    update.homepage.logo = this.logoValue;
    update.configId = this.configIdValue;
    update.generalInformation.platform = <("STEAM" | "XBOX" | "PLAYSTATION")> this.platformValue;
    update.generalInformation.hostType = <("NITRADO" | "SELF_HOSTED" | "OTHER")> this.hostTypeValue;
    update.generalInformation.lastWipe = this.lastWipeValue.date?.toUTCString();
    update.generalInformation.nextWipe = this.nextWipeValue.date?.toUTCString();
    update.generalInformation.pvp = !this.pveValue;
    update.generalInformation.public = this.publicValue;
    return update;
  }

  deepObjectUpdate(target: object, updates: object) {
    const properties = Object.keys(updates);
    for (const prop of properties) {
      // @ts-ignore
      const value = updates[prop];
      const type = typeof(value);
      // @ts-ignore
      if (type == "object" && !Array.isArray(value)) this.deepObjectUpdate(target[prop], value);
      // @ts-ignore
      else target[prop] = value;
    }
  }

  validateRequiredFields() {
    let validated = true;
    type ComponentKey = keyof typeof this;
    const requiredProperties = ["name", "description", "configId", "platform", "hostType"];
    for (const prop of requiredProperties) {
      const valueKey = <ComponentKey>(prop + "Value");
      const statusKey = <ComponentKey>(prop + "Status");
      if (!this[valueKey] || this[valueKey] == "") {
        const name = prop.replace("configId", "configuration").replace("hostType", "host type");
        validated = false;
        // @ts-ignore
        this[statusKey] = -1;
        this.errors.push(`You must provide a ${name} for this cluster.`);
      }
    }
    if (this.lastWipeValue.date == null) {
      validated = false;
      this.lastWipeStatus = -1;
      this.errors.push("You must provide a former wipe date for this cluster.");
    }
    if (this.nextWipeValue.date == null) {
      validated = false;
      this.nextWipeStatus = -1;
      this.errors.push("You must provide the next wipe date for this cluster.");
    }
    return validated;
  }

  validateValueLengths() {
    let validated = true;
    const nameLength = this.nameValue.length;
    const descriptionLength = this.descriptionValue.length;
    const imageLength = this.logoValue.length;
    if (nameLength < 4 || nameLength > 30) {
      validated = false;
      this.nameStatus = -1;
      this.errors.push("The cluster name is expected to be between 4 and 30 characters long.");
    }
    if (descriptionLength < 10 || descriptionLength > 100) {
      validated = false;
      this.descriptionStatus = -1;
      this.errors.push("The cluster description is expected to be between 10 and 100 characters long.");
    }
    if (imageLength != 0 && (imageLength < 5 || imageLength > 100)) {
      validated = false;
      this.logoStatus = -1;
      this.errors.push("The image link is expected to be empty OR between 5 and 100 characters long.");
    }
    return validated;
  }

  validateDates() {
    let validated = true;
    const now = new Date();
    if (<Date>this.lastWipeValue.date > now) {
      validated = false;
      this.lastWipeStatus = -1;
      this.errors.push("The last wipe date is expected to be in the past.");
    }   
    if (<Date>this.nextWipeValue.date < now) {
      validated = false;
      this.nextWipeStatus = -1;
      this.errors.push("The next wipe date is expected to be in the future.");
    }
    return validated;
  }

  async updateCluster() {
    this.resetErrors();
    if (!this.validateRequiredFields()) return;
    if (!this.validateValueLengths()) return;
    if (!this.validateDates()) return;
    this.display = 'loading';
    const update = this.generateUpdatedCluster();
    const errors = await this.api.cluster.updateCluster(update);
    if (errors && errors.length > 0) {
      this.errors = errors;
      this.display = 'input';
      this.inputPage = 1;
      return;
    }
    this.resultingCluster = update;
    this.display = 'result';
  }

  continueClicked() {
    if (!this.resultingCluster) return;
    this.deepObjectUpdate(this.cluster, this.resultingCluster);
    this.clusterUpdated.emit();
    this.show = false;
    this.display = "input";
    this.showChange.emit(this.show);
  }

  async revertClicked() {
    if (!this.resultingCluster) return;
    this.display = "loading";
    const errors = await this.api.cluster.updateCluster(this.cluster);
    if (errors && errors.length > 0) {
      this.errors.push("Error while attempting to revert the changes.");
      this.display = "result";
    } else {
      this.display = "input";
      this.show = false;
    }

  }

}
