
const component : string = "side-navigation";
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Cluster } from 'src/app/models/cluster';
import { AnalyticsService } from 'src/app/services/analytics';
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';
import { UGCValidationService } from 'src/app/services/ugcValidation';

export type NavItem = "home" | "general" | "drops";

interface NavOption {
  display: String
  navigation: NavItem
}

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class SideNavigationViewComponent implements OnInit {

  @Input() cluster: Cluster;
  @Input() initialNav: NavItem;
  @Output() onNavigation = new EventEmitter<NavItem>();
  protected isOwner = false;
  protected iconUrl = "assets/img/icon-3.png";
  protected showEditor = false;
  protected currentSelection:NavItem;
  protected updateErrors: string[] = [];
  protected clusterNameUpdate = "";
  protected clusterIconUpdate = "";
  protected clusterDescriptionUpdate = "";
  protected navItems: NavOption[] = [
    {display: "Home", navigation: "home"},
    {display: "General", navigation: "general"},
    {display: "Loot Tables", navigation: "drops"}
  ];

  constructor(
    private ugc: UGCValidationService,
    private api: ApiService,
    private session: SessionService,
    private track: AnalyticsService
  ) {}

  ngOnInit() {
    if (!this.initialNav) this.initialNav = "home";
    this.currentSelection = this.initialNav;
    this.clusterNameUpdate = this.cluster.homepage.title;
    this.clusterIconUpdate = this.cluster.homepage.logo;
    this.clusterDescriptionUpdate = this.cluster.generalInformation.shortDescription;
    this.setIcon();
    const currentUser = this.session.getProfile();
    this.isOwner = currentUser?.username == this.cluster.owner;
  }

  navClick(item: NavItem) {
    this.currentSelection = item;
    this.onNavigation.emit(item);
    this.track.pageVisit(`clusters/${this.cluster._id}/${item}`);
  }

  private async setIcon() {
    const url = this.cluster.homepage.logo;
    if (!url || url.trim().length < 5) return;
    const exists = await this.ugc.imageExists(url);
    if (exists) this.iconUrl = url;
  }

  protected async updateClusterClicked() {
    const valid = await this.validateUpdates();
    const oldName = this.cluster.homepage.title;
    const oldUrl = this.cluster.homepage.logo;
    if (!valid) return;
    this.cluster.homepage.title = this.clusterNameUpdate
    this.cluster.generalInformation.name = this.clusterNameUpdate;
    this.cluster.homepage.logo = this.clusterIconUpdate;
    this.cluster.generalInformation.shortDescription = this.clusterDescriptionUpdate;
    const errors = await this.api.cluster.updateCluster(this.cluster);
    if (errors) {
      this.updateErrors.push(...errors);
      this.cluster.homepage.title = oldName
      this.cluster.generalInformation.name = oldName;
      this.cluster.homepage.logo = oldUrl;
    }
    else {
      this.iconUrl = this.clusterIconUpdate;
      this.showEditor = false;
    }
  }

  private async validateUpdates() {
    this.updateErrors = [];
    let validated = true;
    const nameLength = this.clusterNameUpdate.length;
    const imageLength = this.clusterIconUpdate.length;
    const descriptionLength = this.clusterDescriptionUpdate.length;
    if (nameLength < 4 || nameLength > 30) {
      validated = false;
      this.updateErrors.push("The cluster name is expected to be between 4 and 30 characters long.");
    }
    if (descriptionLength < 10 || descriptionLength > 100) {
      validated = false;
      this.updateErrors.push("The cluster description is expected to be between 10 and 100 characters long.");
    }
    if (imageLength != 0 && (imageLength < 5 || imageLength > 200)) {
      validated = false;
      this.updateErrors.push("The image link is expected to be empty OR between 5 and 100 characters long.");
    }
    if (imageLength > 0) {
      const validImage = await this.ugc.imageExists(this.clusterIconUpdate);
      if (!validImage) {
        validated = false;
        this.updateErrors.push("The provided link could not be used to load an image.");
      }
    }
    return validated;
  }
  
}
