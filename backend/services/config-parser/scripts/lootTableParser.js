
import ArkIdRepository from "../../ark-id-repository/index.js";

export default class LootTableParser {

    // ARE YOU ADDING MISSING FIELDS? 
    // The schema was reduced to show the minimum information
    // This parser is already adding everything to the object. 
    // The object is then being reduced by the schema when saved. 

    static parse(supplyCrateItems) {
        if (!supplyCrateItems) return {lootTables: []};
        if (typeof(supplyCrateItems) != "object") throw new Error("You must parse the configuration into a js object first.");
        const lootTables = [];
        for (const item of supplyCrateItems) lootTables.push({
            container: ArkIdRepository.getContainer("containerId", item.supplyCrateClassString),
            quantity: {
                min: item.minItemSets,
                max: item.minItemSets,
            },
            multiRoll: !item.bSetsRandomWithoutReplacement,
            collections: LootTableParser.#parseItemCollections(item.itemSets)
        });
        for (const table of lootTables) LootTableParser.#appendLootChance(table, "collections");
        return {lootTables};
    }

    static #parseItemCollections(itemCollections) {
        const parsedCollections = []; 
        for (const collection of itemCollections) parsedCollections.push({
            name: collection.setName,
            quantity: {
                min: collection.minNumItems,
                max: collection.maxNumItems
            },
            weight: collection.setWeight,
            multiRoll: !collection.bItemsRandomWithoutReplacement,
            sets: LootTableParser.#parseEntries(collection.itemEntries)
        });
        for (const collection of parsedCollections) LootTableParser.#appendLootChance(collection, "sets");
        return parsedCollections;
    }

    static #parseEntries(itemEntries) {
        const parsedEntries = [];
        for (const entry of itemEntries) parsedEntries.push({
            weight: entry.entryWeight,
            quantity: {
                min: entry.minQuantity,
                max: entry.maxQuantity
            },
            applyToOne: entry.bApplyQuantityToSingleItem,
            items: LootTableParser.#parseItems(entry)
        });
        for (const entry of parsedEntries) LootTableParser.#appendLootChance(entry, "items");
        return parsedEntries;
    }

    static #parseItems(entry) {
        const items = [];
        for (let i=0; i<entry.itemClassStrings.length; i++) {
            const item = ArkIdRepository.getItem("class", entry.itemClassStrings[i]);
            if (!item) continue;
            item.weight = entry.itemsWeights[i];
            item.quality = {
                min: entry.minQuality,
                max: entry.maxQuality
            },
            item.blueprintPercent = entry.bForceBlueprint ? 100 : entry.chanceToBeBlueprintOverride
            items.push(item);
        }
        return items;
    }

    static #appendLootChance(parent, childProperty) {
        let totalWeight = 0;
        //let quantity = parent.quantity;
        for (const child of parent[childProperty]) totalWeight += child.weight;
        for (const child of parent[childProperty]) {
            child.chance = totalWeight == 0 ? 0 : child.weight * 100 / totalWeight;
        }
    }

}