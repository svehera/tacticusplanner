import { Faction, RarityString, Rarity, RarityMapper, parseFaction } from '@/fsd/5-shared/model';

// eslint-disable-next-line boundaries/element-types
import { CharactersService } from '../character';

import { newEquipmentData } from './data';
import { IEquipment, IEquipmentStatic } from './model';

export class EquipmentService {
    static readonly equipmentData: IEquipment[] = this.convertEquipmentData();

    /**
     * Converts the raw equipment data from JSON into something *slightly* more
     * strongly typed.
     */
    private static convertEquipmentData(): IEquipment[] {
        return Object.entries(newEquipmentData).map(([id, data]) => {
            return {
                id: id,
                name: data.name,
                rarity: this.parseEquipmentRarity(data.rarity),
                type: data.type,
                abilityId: data.abilityId,
                isRelic: data.isRelic,
                isUniqueRelic: data.isUniqueRelic,
                allowedUnits: this.resolveUnits(data),
                levels: data.levels,
                icon: this.getEquipmentIconPathFromId(id),
            };
        });
    }

    private static resolveUnits(data: IEquipmentStatic): string[] {
        if (data.allowedUnits.length > 0) return data.allowedUnits;
        return CharactersService.charactersData
            .filter(char => data.allowedFactions.includes(char.faction))
            .filter(char =>
                [char.equipment1, char.equipment2, char.equipment3].includes(
                    CharactersService.parseEquipmentType(data.type)
                )
            )
            .map(char => char.snowprintId!);
    }

    private static parseEquipmentRarity(rarity: string): Rarity {
        const parsed = RarityMapper.stringToNumber[rarity as RarityString];
        if (parsed == undefined) {
            console.error("Couldn't parse equipment rarity: " + rarity);
            return Rarity.Common;
        }
        return parsed;
    }

    private static getEquipmentIconPathFromId(id: string): string {
        return `snowprint_assets/equipment/ui_icon_item_${id}.png`;
    }

    public static getEquipmentSlotDisplayName(slot: string): string {
        switch (slot) {
            case 'I_Block':
                return 'Block';
            case 'I_Booster_Block':
                return 'Block Booster';
            case 'I_Crit':
                return 'Crit';
            case 'I_Booster_Crit':
                return 'Crit Booster';
            case 'I_Defensive':
                return 'Defense';
            default:
                return 'Unknown Slot';
        }
    }
}
