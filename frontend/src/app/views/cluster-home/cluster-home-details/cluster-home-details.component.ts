
const component : string = "cluster-home-details";
import { Component, Input, OnInit } from '@angular/core';
import { Cluster } from 'src/app/models/cluster';
import { AnalyticsService } from 'src/app/services/analytics';
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ClusterHomeDetailsComponent implements OnInit {

  @Input() cluster: Cluster;
  protected isOwner: boolean;
  protected body: string;
  protected defaultBody: string;
  protected displayEditor = false;
  protected loading = false;

  constructor(
    private session: SessionService,
    private api: ApiService,
    private track: AnalyticsService
  ) {}

  ngOnInit(): void {
    if (!this.cluster) throw new Error("No cluster provided");
    const currentUser = this.session.getProfile();
    this.isOwner = currentUser?.username == this.cluster.owner;
    this.body = this.cluster.homepage.body;
    this.setDefaultBody();
  }

  private setDefaultBody() {
    this.defaultBody = `# ${this.cluster.homepage.title}\n` +
    `This cluster does not yet have a homepage created.\n\n`
  }

  protected validateChanges(markdown: string) {
    if (!markdown) return "You must enter some markdown text.";
    if (markdown.trim().length < 30) return "Your homepage should have more details.";
    return null;
  }

  protected async updateHomepage(markdown: string) {
    this.displayEditor = false;
    this.loading = true;
    this.cluster.homepage.body = markdown;
    const errors = await this.api.cluster.updateCluster(this.cluster);
    if (errors) console.log(errors);
    else {
      this.body = markdown;
      this.track.clusterHomepageUpdate(this.cluster.generalInformation.platform);
    }
    this.loading = false;
  }

}
