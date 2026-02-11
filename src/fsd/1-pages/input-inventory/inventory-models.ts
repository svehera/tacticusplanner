import { FactionId, Rarity } from '@/fsd/5-shared/model';

export interface IInventoryUpgrade {
    material: string;
    snowprintId: string;
    label: string;
    rarity: Rarity;
    craftable: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
    quantity: number;
    iconPath: string;
    faction?: FactionId;
    alphabet: string;
}

interface IUpgradesAlphabetGroup {
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
