import { groupBy, mapValues, orderBy, sum } from 'lodash';

import { Rarity } from '@/fsd/5-shared/model';

import { IMowLevelMaterials } from '@/fsd/4-entities/mow';
import { IBaseUpgrade, ICraftedUpgrade, IUpgradeRecipe, UpgradesService } from '@/fsd/4-entities/upgrade';

import { IMowMaterialsTotal, IMowUpgrade } from './lookup.models';

export class MowLookupService {
    public static getTotals(materials: IMowLevelMaterials[], multiplier: 1 | 2 = 1): IMowMaterialsTotal {
        const components = sum(materials.map(x => x.components)) * multiplier;
        const gold = sum(materials.map(x => x.gold)) * multiplier;
        const salvage = sum(materials.map(x => x.salvage)) * multiplier;

        const badges: Record<Rarity, number> = {};
        const forgeBadges = new Map<Rarity, number>();
        for (const material of materials) {
            badges[material.rarity] = (badges[material.rarity] ?? 0) + material.badges;
            forgeBadges.set(material.rarity, (forgeBadges.get(material.rarity) ?? 0) + material.forgeBadges);
        }

        return {
            salvage,
            components,
            gold,
            badges,
            forgeBadges,
        };
    }

    public static getUpgradesList(upgrades: Array<IBaseUpgrade | ICraftedUpgrade>): IMowUpgrade[] {
        const baseMaterials: IUpgradeRecipe[] = [];

        for (const upgrade of upgrades) {
            if ('baseUpgrades' in upgrade) {
                baseMaterials.push(...upgrade.baseUpgrades);
            } else {
                baseMaterials.push({ id: upgrade.id, count: 1 });
            }
        }

        const baseTotal = mapValues(groupBy(baseMaterials, 'id'), x => sum(x.map(y => y.count))) as Record<
            string,
            number
        >;

        const result = Object.entries(baseTotal).map(([upgradeId, requiredTotal]) => {
            const baseUpgrade = UpgradesService.baseUpgradesData[upgradeId];

            return { ...baseUpgrade, requiredTotal };
        });

        return orderBy(result, ['rarity', 'requiredTotal'], ['desc', 'desc']);
    }
}
