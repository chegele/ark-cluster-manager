
const component : string = "cluster";
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Cluster } from 'src/app/models/cluster';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ClusterComponent {

  private routeUpdate: Subscription;
  protected cluster: Cluster;
  protected currentView = "home";

  constructor(
    private currentRoute: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) { }

  ngOnInit() {
    this.routeUpdate = this.currentRoute.params.subscribe(params => {
      const id = params["id"];
      if (id) this.routeUpdated(id);
    })
  }

  ngOnDestroy(): void {
    this.routeUpdate.unsubscribe();
  }

  private async routeUpdated(id: string) {
    const cluster = await this.api.cluster.getCluster(id);
    if (!cluster) this.router.navigate(["/invalid-cluster-id"], { replaceUrl: true });
    else this.cluster = cluster;
  }

  protected navUpdate(view: string) {
    this.currentView = view;
  }

}
