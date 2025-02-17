import { Rarity } from 'src/models/enums';

export interface IInventoryUpgrade {
    material: string;
    label: string;
    rarity: Rarity;
    craftable: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
    quantity: number;
    iconPath: string;
    faction: string;
    alphabet: string;
}

export interface IUpgradesAlphabetGroup {
    letter: string;
    subItems: IInventoryUpgrade[];
}

export interface IUpgradesGroup {
    label: string;
    rarity: Rarity;
    items: IUpgradesAlphabetGroup[];
    itemsCrafted: IUpgradesAlphabetGroup[];
    itemsAll: IInventoryUpgrade[];
    itemsAllCrafted: IInventoryUpgrade[];
}
