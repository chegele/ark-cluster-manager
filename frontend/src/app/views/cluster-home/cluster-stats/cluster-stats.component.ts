
const component : string = "cluster-stats";
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigFile } from 'src/app/models/config-file';
import { Cluster } from 'src/app/models/cluster';
import { Profile } from 'src/app/models/database/profile';
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';

interface ClusterStat {
  icon: string;
  displayText: string;
  hoverText: string;
  onClick?: Function;
}

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ClusterStatsViewComponent implements OnInit {

  @Input() cluster: Cluster;
  protected profile: Profile;
  protected clusterStats: ClusterStat[] = [];
  protected isGuest = true;
  protected isOwner = false;
  protected isMember = false;
  protected joinToggleValue = true;
  protected showEditor = false;
  protected showCopySuccess = false;
  private toggleCooldownActive = false;
  private toggleCooldownTimer = 5000;

  constructor(
    private api: ApiService,
    private session: SessionService,
    private router: Router
  ) { } 

  ngOnInit(): void {
    const profile = this.session.getProfile();
    this.profileUpdate(profile);
    this.session.profileChange.subscribe(this.profileUpdate.bind(this));
    this.populateStats();
  }

  private profileUpdate(profile: Profile | null) {
    if (!profile) return 
    this.profile = profile;
    this.isGuest = false;
    this.isOwner = this.cluster.owner == profile.username;
    this.isMember = profile.membershipClusterIds.includes(this.cluster._id);
    this.joinToggleValue = !this.isMember;
  }

  protected async populateStats() {
    const created = new Date(this.cluster.created).toLocaleDateString();
    const owner = this.cluster.owner;
    const response = await this.api.config.getSummary(this.cluster.configId);
    const config = <ConfigFile | null> response?.response?.file;
    const configDate = config ? new Date(config.uploaded).toLocaleDateString() : "n/a";
    const configName = config ? config.name : "n/a";
    const members = this.cluster.memberCount.toString();
    const lastWipe = new Date(this.cluster.generalInformation.lastWipe).toLocaleDateString();
    const nextWipe = new Date(this.cluster.generalInformation.nextWipe).toLocaleDateString();
    this.clusterStats = [
      { icon: "person", displayText: owner, hoverText: `Owner: ${owner}` },
      { icon: "calendar-plus", displayText: created, hoverText: `Created: ${created}` },
      { icon: "database-gear", displayText: configName, hoverText: `Configuration: ${configName}` },
      { icon: "database-up", displayText: configDate, hoverText: `Updated: ${configDate}` },
      this.cluster.generalInformation.public
        ? {icon: 'eye', displayText: 'Public', hoverText: 'Public Cluster' }
        : {icon: 'eye-slash', displayText: 'Private', hoverText: 'Private Cluster' },
      this.cluster.generalInformation.pvp
        ? {icon: 'emoji-dizzy', displayText: 'PVP', hoverText: 'PVP Enabled' }
        : {icon: 'emoji-heart-eyes', displayText: 'PVE', hoverText: 'PVP Disabled' },
      this.getPlatformStats(),
      this.getHostStats(),
      { icon: "calendar-x", displayText: lastWipe, hoverText: `Last Wipe: ${lastWipe}` },
      { icon: "calendar-event", displayText: nextWipe, hoverText: `Next Wipe: ${nextWipe}` },
      { icon: "people", displayText: members, hoverText: `Members: ${members}` },
      { icon: "share", displayText: "Share link", hoverText: `Copy Cluster Link`, onClick: this.copyLinkToCluster.bind(this) }
    ];
  }

  protected copyLinkToCluster() {
    const url = window.location.href;
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = url;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.showCopySuccess = true;
    setTimeout( () => this.showCopySuccess = false, 5000 );
  }

  private getPlatformStats() {
    switch (this.cluster.generalInformation.platform) {
      case "XBOX": return { icon: "xbox", displayText: "Xbox", hoverText: `Platform: Xbox / Win 10` };
      case "PLAYSTATION": return { icon: "playstation", displayText: "PlayStation", hoverText: `Platform: PlayStation` };
      case "STEAM": return { icon: "steam", displayText: "Steam", hoverText: `Platform: Steam` };
    }
  }

  private getHostStats() {
    switch (this.cluster.generalInformation.hostType) {
      case "NITRADO": return { icon: "cloud-arrow-up", displayText: "Nitrado", hoverText: `Hosting: Nitrado` };
      case "SELF_HOSTED": return { icon: "pc", displayText: "Self Hosted", hoverText: `Hosting: Self Hosted` };
      case "OTHER": return { icon: "pc-horizontal", displayText: "Other", hoverText: `Hosting: Other` };
    }
  }

  private revertToggle() {
    const component = this;
    if (this.joinToggleValue == this.isMember) setTimeout(() => { 
      component.joinToggleValue = !component.isMember
    }, 1000);
  }

  protected async toggleMembership() {
    const component = this;
    if (this.isGuest) {
      const redirect = { queryParams:{'redirect': '/clusters/' + this.cluster._id} };
      this.router.navigate(["/login"], redirect);
    }
    if (this.toggleCooldownActive) return this.revertToggle();
    let success = false;
    if (this.joinToggleValue) success = await this.leaveCluster();
    else success = await this.joinCluster();
    if (!success) return this.revertToggle();
    this.toggleCooldownActive = true;
    setTimeout(() => { component.toggleCooldownActive = false }, this.toggleCooldownTimer);
    this.toggleCooldownTimer = this.toggleCooldownTimer * 2;
    this.populateStats();
  }

  async joinCluster() {
    const joined  = await this.api.cluster.joinCluster(this.cluster._id);
    if (joined) {
      this.isMember = true;
      this.cluster.memberCount++;
    }
    return joined;
  }

  async leaveCluster() {
    const left = await this.api.cluster.leaveCluster(this.cluster._id);
    if (left) {
      this.isMember = false;
      this.cluster.memberCount--;
    }
    return left;
  }

}
