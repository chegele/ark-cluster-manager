
const component : string = "cluster-general";
import { Component, Input, OnInit } from '@angular/core';
import { Cluster } from 'src/app/models/cluster';
import { Property } from 'src/app/models/database/setting';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ClusterGeneralViewComponent implements OnInit {

  @Input() cluster: Cluster;
  protected allSettings: Property[] = [];
  protected filteredSettings: Property[] = [];
  protected sections: string[] = [];

  constructor(private api: ApiService) {}

  async ngOnInit() {
    const configId = this.cluster.configId;
    let settings = await this.api.config.getGeneral(configId);
    if (!settings || settings.length < 1) return;
    settings = settings.filter(this.filterAllSettings.bind(this));
    this.allSettings = settings.sort(this.sortSettings.bind(this));
    this.filteredSettings = [...this.allSettings];
    this.sections.sort();
  }

  protected filterSearchResults(value: string) {
    value = value.toLowerCase();
    if (!value || value == "") this.filteredSettings = [...this.allSettings];
    this.filteredSettings = this.allSettings.filter(setting => {
      if (setting.description.toLowerCase().includes(value)) return true;
      if (setting.key.toLowerCase().includes(value)) return true;
      if (setting.label.toLowerCase().includes(value)) return true;
      return false;
    });
  }

  private filterAllSettings(setting: Property) {
    if (setting.value === "" || setting.value === undefined) return false;
    if (setting.label === "" || setting.label === undefined) {
      if (setting.key !== undefined && setting.key !== "") setting.label = setting.key;
      else return false;
    }
    return true;
  }

  private sortSettings(a: Property, b: Property) {
    if (a.category && !this.sections.includes(a.category)) this.sections.push(a.category);
    var textA = a.label || a.key;
    var textB = b.label || b.key
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
  } 

}
