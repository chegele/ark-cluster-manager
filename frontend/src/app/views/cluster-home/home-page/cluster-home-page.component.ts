
const component : string = "cluster-home-page";
import { AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import { Cluster } from 'src/app/models/cluster';
import { PageMessageComponent } from 'src/app/components/page-message/page-message.component';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ClusterHomePageViewComponent implements AfterViewInit {

  protected ready = false;
  @ViewChild(PageMessageComponent, {static: false}) notify: PageMessageComponent;
  @Input() cluster: Cluster;

  ngAfterViewInit() {
    setTimeout(() => this.ready = true, 500);
  }

}
