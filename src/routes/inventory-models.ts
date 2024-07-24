import { Rarity } from 'src/models/enums';

export interface ITableRow {
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
