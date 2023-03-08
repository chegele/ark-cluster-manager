
const component : string = "config-loot-summary";
import { Component, HostBinding, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Container, LootTable } from 'src/app/models/database/loot-table';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ConfigLootSummaryComponent implements OnInit, OnChanges {

  @Input() lootTable: LootTable;
  @Input() filter: string;
  protected container: Container;
  protected items: string[] = [];
  protected rewards = "";
  @HostBinding('hidden')
  protected hidden = false;

  ngOnInit(): void {
    this.container = this.lootTable.container;
    const rewards = this.lootTable.quantity;
    this.rewards = rewards.min == rewards.max ? rewards.min + "" : `${rewards.min} - ${rewards.max}`;
    for (const collection of this.lootTable.collections) {
      for (const sets of collection.sets) {
        for (const item of sets.items) this.items.push(item.name.toLowerCase());
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const filter = <string | null> changes["filter"]?.currentValue;
    if (!filter && filter !== "") return;
    if (filter.trim() == "") this.hidden = false;
    else {
      this.hidden = !this.filterInItems(filter);
    }
  }

  private filterInItems(filter: string) {
    for (const item of this.items) {
      if (item.toLowerCase().includes(filter.toLowerCase()))
      return true;
    }
    return false;
  }

}
