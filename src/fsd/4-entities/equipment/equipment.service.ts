import { Faction, RarityString, Rarity, RarityMapper, parseFaction } from '@/fsd/5-shared/model';

import { equipmentData } from './data';
import { EquipmentClass, EquipmentType } from './enums';
import { IEquipment } from './model';

export class EquipmentService {
    static readonly equipmentData: IEquipment[] = this.convertEquipmentData();

    /**
     * Converts the raw equipment data from JSON into something that more
     * strongly typed.
     */
    private static convertEquipmentData(): IEquipment[] {
        const ret: IEquipment[] = [];
        Object.entries(equipmentData).forEach(([_, equipment]) => {
            const slot = this.parseEquipmentType(equipment.slot);
            const clazz = this.parseEquipmentClass(equipment.clazz);
            const snowprintId = equipment.snowprintId;
            const displayName = equipment.displayName;
            const rarity = this.parseEquipmentRarity(equipment.rarity);
            const chance: number | undefined = equipment.chance;
            const factions: Faction[] = [];
            equipment.factions.forEach((faction: string) => {
                const parsedFaction = parseFaction(faction);
                if (parsedFaction == undefined) {
                    console.log("couldn't parse faction: " + faction);
                } else {
                    factions.push(parsedFaction!);
                }
            });
            const boost1: number[] = [];
            equipment.boost1.forEach((boost: number) => {
                boost1.push(boost);
            });
            const boost2: number[] = [];
            equipment.boost2.forEach((boost: number) => {
                boost2.push(boost);
            });
            ret.push({
                slot,
                clazz,
                snowprintId,
                displayName,
                rarity,
                chance,
                factions,
                boost1,
                boost2,
            } as IEquipment);
        });
        return ret;
    }

    private static parseEquipmentType(type: string): EquipmentType {
        const parsed = EquipmentType[type as keyof typeof EquipmentType];
        if (parsed == undefined) {
            if (type == 'Defense') return EquipmentType.Defensive;
            console.error("Couldn't parse equipment type: " + type);
            return EquipmentType.Block;
        }
        return parsed;
    }

    private static parseEquipmentClass(clazz: string): EquipmentClass {
        const parsed = EquipmentClass[clazz as keyof typeof EquipmentClass];
        if (parsed == undefined) {
            console.error("Couldn't parse equipment class: " + clazz);
            return EquipmentClass.BoltPistol;
        }
        return parsed;
    }

    private static parseEquipmentRarity(rarity: string): Rarity {
        const parsed = RarityMapper.stringToNumber[rarity as RarityString];
        if (parsed == undefined) {
            console.error("Couldn't parse equipment rarity: " + rarity);
            return Rarity.Common;
        }
        return parsed;
    }

    private static getEquipmentTypeIconPathComponent(slot: EquipmentType): string {
        switch (slot) {
            case EquipmentType.Block:
            case EquipmentType.Crit:
            case EquipmentType.Defensive:
                return EquipmentType[slot as keyof typeof EquipmentType];
            case EquipmentType.BlockBooster:
                return 'Booster_Block';
            case EquipmentType.CritBooster:
                return 'Booster_Crit';
        }
    }

    public static getEquipmentIconPath(equipment: IEquipment): string {
        const prefix = 'equipment/ui_icon_item_I';
        const type = this.getEquipmentTypeIconPathComponent(equipment.slot);
        const rarity = RarityString[Rarity[equipment.rarity] as keyof typeof RarityString].substring(0, 1);
        const id = equipment.snowprintId.toString().padStart(3, '0');
        return [prefix, type, rarity].join('_') + id + '.png';
    }

    public static getEquipmentTypeIconPath(slot: EquipmentType): string {
        let icon: string = '';
        switch (slot) {
            case EquipmentType.Block:
            case EquipmentType.Crit:
            case EquipmentType.Defensive:
                icon = EquipmentType[slot as keyof typeof EquipmentType] + '_Item';
                break;
            case EquipmentType.BlockBooster:
                icon = 'Block_Booster';
                break;
            case EquipmentType.CritBooster:
                icon = 'Crit_Booster';
                break;
        }
        return 'equipment/' + icon + '_Icon.webp';
    }
}
