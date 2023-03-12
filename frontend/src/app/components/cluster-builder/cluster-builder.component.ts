
const component : string = "cluster-builder";
import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Profile } from 'src/app/models/database/profile';
import { Cluster, ClusterBuilder } from 'src/app/models/cluster';
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';
import { InputDate } from '../input-date-field/input-date-field.component';
import { ConfigFile } from 'src/app/models/config-file';
import { DropdownOption } from '../input-enum-field/input-enum-field.component';
import { AnalyticsService } from 'src/app/services/analytics';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ]
})
export class ClusterBuilderComponent implements OnInit{

  constructor(
    private api: ApiService, 
    private session: SessionService,
    private router: Router,
    private track: AnalyticsService
  ) {}

  @Input() show: boolean = false;
  @Output() showChange = new EventEmitter<boolean>();
  @Output() idCreated = new EventEmitter<string>();
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
  lastWipeValue: InputDate = { year: null, month: null, day: null, date: null };

  nextWipeStatus = 0;
  nextWipeValue: InputDate = { year: null, month: null, day: null, date: null }; 
  
  configIdStatus = 0;
  configIdValue = ""; 
  configIdPlaceholder = {icon: "list", display: "Configuration", value: ""};
  configIdOptions: DropdownOption[] = [];   

  platformStatus = 0;
  platformValue = "";
  platformPlaceholder = {icon: "list", display: "Cluster platform", value: ""};
  platformOptions = [
    {icon: "xbox", display: "Xbox & Windows", value: "XBOX"},
    {icon: "playStation", display: "PlayStation", value: "PLAYSTATION"},
    {icon: "steam", display: "Steam", value: "STEAM"},
  ];

  hostTypeStatus = 0;
  hostTypeValue = "";
  hostTypePlaceholder = {icon: "list", display: "Hosting Type", value: ""};
  hostTypeOptions = [
    {icon: "cloud", display: "Nitrado", value: "NITRADO"},
    {icon: "pc", display: "Self Hosted", value: "SELF_HOSTED"},
    {icon: "pc2", display: "Other", value: "OTHER"},
  ];

  async ngOnInit() {
    const profile = this.session.getProfile();
    if (!profile) this.router.navigate(["/login"]);
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

  validateConfigsExist() {
    if (this.configIdOptions.length < 1) {
      this.configIdStatus = -1
      this.errors.push("You have no configuration files. You must upload one before you can create a cluster.");
    }
  }

  reset() {
    this.resetErrors();
    this.display = 'input';
    this.profile = <Profile>this.session.getProfile();
    this.inputPage = 1;
    this.nameValue = "";
    this.descriptionValue = "";
    this.logoValue = "";
    this.pveValue = true;
    this.publicValue = true;
    this.lastWipeValue = { year: null, month: null, day: null, date: null };
    this.nextWipeValue = { year: null, month: null, day: null, date: null }; 
    this.configIdValue = "";  
    this.platformValue = "";
    this.hostTypeValue = "";
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

  generateClusterBuilderObject(): ClusterBuilder {
    return {
      name: this.nameValue,
      pvp: !this.pveValue,
      platform: <('STEAM' | 'PLAYSTATION' | 'XBOX')>this.platformValue,
      hostType: <('NITRADO' | 'SELF_HOSTED' | 'OTHER')> this.hostTypeValue,
      configId: this.configIdValue,
      description: this.descriptionValue,
      public: this.publicValue,
      lastWipe: <Date>this.lastWipeValue.date,
      nextWipe: <Date>this.nextWipeValue.date,
      body: "",
      logo: this.logoValue,
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

  async createCluster() {
    this.resetErrors();
    if (!this.validateRequiredFields()) return;
    if (!this.validateValueLengths()) return;
    if (!this.validateDates()) return;
    this.display = 'loading';
    const request = this.generateClusterBuilderObject();
    const response = await this.api.cluster.createCluster(request);
    if (response.friendlyErrors.length > 0) {
      this.errors = response.friendlyErrors;
      this.display = 'input';
      this.inputPage = 1;
      return;
    }
    this.resultingCluster = <Cluster> response.response.cluster;
    this.display = 'result';
    this.track.clusterCreated(this.resultingCluster.generalInformation.platform);
  }

  continueClicked() {
    if (!this.resultingCluster) return;
    this.idCreated.emit(this.resultingCluster._id);
    this.reset();
    this.show = false;
    this.showChange.emit(this.show);
  }

  async deleteClicked() {
    if (!this.resultingCluster) return;
    this.display = "loading";
    const result = await this.api.cluster.deleteCluster(this.resultingCluster._id);
    if (result) return this.reset();
    this.errors.push("Error while attempting to delete the cluster.");
    this.display = "result";
  }

}
