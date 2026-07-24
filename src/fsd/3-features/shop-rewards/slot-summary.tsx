import { Package } from 'lucide-react';
import { JSX } from 'react';

import { RarityMapper } from '@/fsd/5-shared/model';
import { MiscIcon, tacticusIcons } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentService } from '@/fsd/4-entities/equipment';
import type { ResolvedShopItem } from '@/fsd/4-entities/shops';

export interface SlotSummary {
    icon: JSX.Element;
    label: string;
}

const EQUIPMENT_FRAME_BY_RARITY_STRING: Record<string, keyof typeof tacticusIcons> = {
    Common: 'commonEquipmentFrame',
    Uncommon: 'uncommonEquipmentFrame',
    Rare: 'rareEquipmentFrame',
    Epic: 'epicEquipmentFrame',
    Legendary: 'legendaryEquipmentFrame',
    Mythic: 'mythicEquipmentFrame',
    Relic: 'relicEquipmentFrame',
};

const EQUIPMENT_TYPE_PATTERN = /^(I_|R_|items(?:Common|Uncommon|Rare|Epic|Legendary|Mythic)_)/;
const GENERIC_EQUIPMENT_RARITY_PATTERN = /^items(Common|Uncommon|Rare|Epic|Legendary|Mythic)_/;

/** Resolves the rarity label for one equipment-family reward type, or `undefined` if unknown. */
function equipmentRarityLabel(rewardType: string): string | undefined {
    const genericMatch = GENERIC_EQUIPMENT_RARITY_PATTERN.exec(rewardType);
    if (genericMatch) return genericMatch[1];
    if (rewardType.startsWith('R_')) return 'Relic';
    if (rewardType.startsWith('I_')) {
        const equip = EquipmentService.equipmentData.find(equipment => equipment.id === rewardType);
        return equip ? RarityMapper.rarityToRarityString(equip.rarity) : undefined;
    }
    return undefined;
}

/**
 * Summarizes a shop slot with many mutually-exclusive reward options (e.g. "pick one of 60
 * character shards") into a single representative icon + label, for slots too large to list
 * individually. Detects a uniform character/equipment rarity across the options when one exists.
 */
export function summarizeSlotItems(items: ResolvedShopItem[]): SlotSummary {
    const allShards = items.every(
        item => item.rewardType.startsWith('shards_') || item.rewardType.startsWith('mythicShards_')
    );
    if (allShards) {
        const allMythicTier = items.every(item => item.rewardType.startsWith('mythicShards_'));
        if (allMythicTier) {
            return {
                icon: <MiscIcon icon="mythicShard" width={40} height={40} />,
                label: 'Random Mythic Character Shards',
            };
        }

        const rarities = new Set<number>();
        let allResolved = true;
        for (const item of items) {
            const charId = item.rewardType.replace(/^(mythicShards_|shards_)/, '');
            // MoW shards have no comparable "initial rarity" field, so a MoW in the mix just
            // falls through to the generic (non-rarity-qualified) label below.
            const char = CharactersService.charactersBySnowprintId[charId];
            if (!char) {
                allResolved = false;
                break;
            }
            rarities.add(char.initialRarity);
        }
        const label =
            allResolved && rarities.size === 1
                ? `Random ${RarityMapper.rarityToRarityString([...rarities][0])} Character Shards`
                : 'Random Character Shards';
        return { icon: <MiscIcon icon="shard" width={40} height={40} />, label };
    }

    const allEquipment = items.every(item => EQUIPMENT_TYPE_PATTERN.test(item.rewardType));
    if (allEquipment) {
        const rarityLabels = new Set<string>();
        let allResolved = true;
        for (const item of items) {
            const rarityLabel = equipmentRarityLabel(item.rewardType);
            if (rarityLabel === undefined) {
                allResolved = false;
                break;
            }
            rarityLabels.add(rarityLabel);
        }
        if (allResolved && rarityLabels.size === 1) {
            const rarityString = [...rarityLabels][0];
            const frameKey = EQUIPMENT_FRAME_BY_RARITY_STRING[rarityString] ?? 'commonEquipmentFrame';
            return {
                icon: <MiscIcon icon={frameKey} width={40} height={40} />,
                label: `Random ${rarityString} Equipment`,
            };
        }
        return { icon: <MiscIcon icon="commonEquipmentFrame" width={40} height={40} />, label: 'Random Equipment' };
    }

    return { icon: <Package className="text-(--soft-fg)" size={32} />, label: 'Random Reward' };
}
