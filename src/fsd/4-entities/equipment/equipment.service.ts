/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { TacticusEquipment } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';
import { RarityString, Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { CharactersService } from '../character/characters.service';

import { newEquipmentData } from './data';
import { IEquipment, IEquipmentStatic } from './model';

export class EquipmentService {
    static readonly equipmentData: IEquipment[] = this.convertEquipmentData();

    public static isRelic(equipmentId: string): boolean {
        const equipment = this.equipmentData.find(eq => eq.id === equipmentId);
        if (!equipment) {
            console.error("Couldn't find equipment data for ID: " + equipmentId);
            return false;
        }
        return equipment.isRelic;
    }

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

    public static convertTacticusEquipmentData(tacticusData: TacticusEquipment): IEquipment | null {
        const equipment = this.equipmentData.find(eq => eq.id === tacticusData.id);
        if (!equipment) {
            console.error("Couldn't find equipment data for ID: " + tacticusData.id);
            return null;
        }
        return {
            ...equipment,
        };
    }

    // Returns the characters that can use this equipment.
    private static resolveUnits(data: IEquipmentStatic): string[] {
        if (data.allowedUnits.length > 0) return data.allowedUnits;
        const ret = CharactersService.charactersData
            .filter(char => {
                return (
                    (data.allowedFactions.includes(char.faction) || data.allowedUnits.includes(char.snowprintId!)) &&
                    [char.equipment1, char.equipment2, char.equipment3].includes(data.type)
                );
            })
            .map(char => char.snowprintId!);
        return ret;
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
        if (id == 'R_Crit_Dw02AdvancedBurstCannon') {
            // Re'vas's relic icon path is broken for some reason.
            return 'snowprint_assets/equipment/ui_icon_item_R_Crit_DW02AdvancedBurstCannon.png';
        }
        if (id == 'R_Block_DaemonfleshPlate') {
            return 'snowprint_assets/equipment/ui_icon_item_R_Block_DaemonFleshPlate.png';
        }
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
