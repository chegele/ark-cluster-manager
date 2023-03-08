
const component : string = "cluster-loot-tables";
import { Component, Input } from '@angular/core';
import { DropdownOption } from 'src/app/components/input-enum-field/input-enum-field.component';
import { Cluster } from 'src/app/models/cluster';
import { LootTable } from 'src/app/models/database/loot-table';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ClusterLootTables {

  @Input() cluster: Cluster;
  protected ready = false;
  protected tables: LootTable[] | null;
  protected filteredTables: LootTable[] = [];
  protected currentTable: LootTable | null;
  protected filterValue = "";
  protected filterStatus = 0;
  protected mapOptions: DropdownOption[] = [];
  protected mapPlaceholder: DropdownOption = {icon: "map", display: "Filter Maps", value: ""};
  protected mapStatus = 0;

  constructor(private api: ApiService) {}

  async ngOnInit() {
    const maps: string[] = [];
    this.tables = await this.api.config.getLootTable(this.cluster.configId);
    if (!this.tables || this.tables.length < 1) return;
    for (const table of this.tables)
    if (!maps.includes(table.container.map)) maps.push(table.container.map);
    this.mapOptions.push({icon: "list", display: "All Maps", value: "all-maps"});
    for (const map of maps) this.mapOptions.push({
      icon: "map", display: map, value: map
    });
    this.filteredTables = [...this.tables];
    this.ready = true;
  }

  protected filterMaps(map: string) {
    if (!this.tables) return;
    this.filteredTables = [];
    if (map == "all-maps") this.filteredTables = [...this.tables];
    else for (let table of this.tables) {
      if (table.container.map == map) this.filteredTables.push(table);
    }
  }

}
