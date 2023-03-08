
const component : string = "config-loot-table";
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Collection, Container, Item, LootTable, Range, Set } from 'src/app/models/database/loot-table';

interface Table extends Collection {
  items: Item[];
}

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
})
export class ConfigLootTableComponent implements OnInit {

  @Output() closeClick = new EventEmitter();
  @Input() lootTable: LootTable;
  protected container: Container;
  protected quantity: Range;
  protected tables : Table[] = [];
  protected activeCollection = "";

  ngOnInit() {
    this.deconstruct();
  }

  private deconstruct() {
    this.container = this.lootTable.container;
    this.quantity = this.lootTable.quantity;
    const collections = this.lootTable.collections;
    for (const collection of collections) this.tables.push(this.buildTable(collection)); 
  }

  //TODO: Percents are off... Need to figure that out
  private buildTable(collection: Collection) {
    const sets: Set[] = [];
    const items: Item[] = [];
    for (const set of collection.sets) {
      if (set.items.length == 1) {
        const item = set.items[0];
        item.chance = set.chance;
        item.quantity = set.quantity;
        items.push(item);
      } else sets.push(set);
    }
    const result: Table = {...collection, sets, items};
    return result;
  }

}
