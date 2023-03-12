
const component : string = "cluster-summary";
import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Cluster } from 'src/app/models/cluster';
import { AnalyticsService } from 'src/app/services/analytics';
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';
import { UGCValidationService } from 'src/app/services/ugcValidation';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ClusterSummaryComponent {

  @Input() id: string = "";
  @Input() type: ('ownership' | 'membership') = 'membership';
  @Output() onClusterChange = new EventEmitter();
  cluster: Cluster;
  members = 0;
  platformIcon = "xbox";
  platformText = "Platform: Xbox / Windows";
  hostingIcon = "cloud";
  hostingText = "Hosting Type: Nitrado";
  error: string; 
  iconSrc: String;
  loading: boolean = true;
  showDeletionPrompt = false;
  showClusterBuilder = false;

  constructor(
    private api: ApiService, 
    private element: ElementRef,
    private ugc: UGCValidationService,
    private router: Router,
    private track: AnalyticsService
  ) {}

  async ngOnInit() {
    if (!this.id) return;
    const cluster = await this.api.cluster.getCluster(this.id);
    if (!cluster) {
      this.error = `Failed to identify a cluster with an id of ${this.id}.`;
    } else {
      this.cluster = cluster;
      const exists = await this.ugc.imageExists(cluster.homepage.logo);
      this.iconSrc = exists ? cluster.homepage.logo : "/assets/img/icon-3.png";
      this.members = cluster.memberCount;
      this.setHosting();
      this.setPlatform();
    }
    this.loading = false;
  }

  clusterClicked() {
    this.router.navigate(["/clusters/" + this.id]);
  }

  async deleteClicked() {
    this.showDeletionPrompt = false;
    this.loading = true;
    const result = await this.api.cluster.deleteCluster(this.id);
    if (result) {
      this.track.clusterDeleted(this.cluster.generalInformation.platform);
      const self = <HTMLElement>this.element.nativeElement;
      self.parentElement?.removeChild(self);
    } else {
      this.loading = false;
      this.error = "Failed to delete the cluster.";
    }
  }

  async leaveClicked() {
    this.showDeletionPrompt = false;
    this.loading = true;
    const result = await this.api.cluster.leaveCluster(this.id);
    if (result) {
      this.track.clusterLeft(this.cluster.generalInformation.name);
      const self = <HTMLElement>this.element.nativeElement;
      self.parentElement?.removeChild(self);
    } else {
      this.loading = false;
      this.error = "Failed to leave the cluster.";
    }
  }

  private setPlatform() {
    switch(this.cluster.generalInformation.platform) {
      case "XBOX": {
        this.platformIcon = "xbox";
        this.platformText = "Platform: Xbox / Windows";
        break;
      }
      case "PLAYSTATION": {
        this.platformIcon = "playStation";
        this.platformText = "Platform: PlayStation";
        break;
      }
      case "STEAM": {
        this.platformIcon = "steam";
        this.platformText = "Platform: Steam";
        break;
      }
    }
  }

  private setHosting() {
    switch(this.cluster.generalInformation.hostType) {
      case "NITRADO": {
        this.hostingIcon = "cloud";
        this.hostingText = "Hosting Type: Nitrado";
        break;
      }
      case "SELF_HOSTED": {
        this.hostingIcon = "pc";
        this.hostingText = "Hosting Type: Self-Hosted";
        break;
      }
      case "OTHER": {
        this.hostingIcon = "pc2";
        this.hostingText = "Hosting Type: Other";
        break;
      }
    }
  }

}
