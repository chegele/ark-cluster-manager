
export interface LootTable {
    container: Container;
    quantity: Range;
    collections: Collection[];
}

export interface Container {
    map: string;
    name: string;
    image: string;
}

export interface Collection {
    name: string;
    quantity: Range;
    chance: number;
    sets: Set[];
}

export interface Set {
    quantity: Range;
    chance: number;
    items: Item[];
}

export interface Item {
    name: string;
    quality: Range;
    link: string;
    image: string;
    blueprintPercent: number;
    chance: number;
    quantity?: Range;
}

export interface Range {
    min: number;
    max: number;
}
