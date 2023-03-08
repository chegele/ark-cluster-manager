
const component : string = "testing";
import { Component, OnInit } from '@angular/core';
import { Cluster } from 'src/app/models/cluster';
import { LootTable } from 'src/app/models/database/loot-table';
import { Profile } from 'src/app/models/database/profile';
import { Property } from 'src/app/models/database/setting';
import { ApiService } from 'src/app/services/api/api.service';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class TestingRouteComponent implements OnInit {

  protected profile: Profile | null;
  protected cluster: Cluster | null;
  protected settings: Property[] | null;
  protected tables: LootTable[] | null;
  protected filter = "";

  constructor(
    private session: SessionService,
    private api: ApiService
  ) {}

  async ngOnInit() {
    this.profile = this.session.getProfile();
    //this.cluster = await this.api.cluster.getCluster("63bc52a23986ce1a6c862169");
    //const test1 = await this.api.config.getGeneral("63f6a7308ef731f86f107603");
    const test2 = await this.api.config.getLootTable("63f7f6baa0955f00d2bac673");
    this.tables = test2;
    setTimeout(() => {
      this.filter = "pike";
    }, 500);
  }

}
