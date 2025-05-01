import { groupBy, mapValues, orderBy, sum } from 'lodash';

import { Alliance, Rarity } from 'src/models/enums';
import mowCommonMaterial from 'src/v2/data/mow-lvl-up-common.json';
import mowUpgradesRaw from 'src/v2/data/mows-upgrades.json';
import { IMow } from 'src/v2/features/characters/characters.models';
import { IBaseUpgrade, ICraftedUpgrade, IUpgradeRecipe } from 'src/v2/features/goals/goals.models';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';
import {
    IMowLevelMaterials,
    IMowLevelUpgrade,
    IMowLevelUpgrades,
    IMowLevelUpgradesDic,
    IMowMaterialsTotal,
    IMowUpgrade,
} from 'src/v2/features/lookup/lookup.models';

export class MowLookupService {
    private static mowLevelUpCommon: IMowLevelUpgrade[] = mowCommonMaterial;
    private static mowUpgrades: IMowLevelUpgradesDic = mowUpgradesRaw;

    public static getMaterialsList(
        mowId: string,
        mowLabel: string,
        mowAlliance: Alliance,
        levels: number[] = []
    ): IMowLevelMaterials[] {
        const result: IMowLevelMaterials[] = [];
        const mowUpgrades = this.mowUpgrades[mowId] ?? [];

        for (const lvlUpgrade of this.mowLevelUpCommon) {
            const index = lvlUpgrade.lvl - 1;
            const actualLevel = lvlUpgrade.lvl + 1;
            if (levels.length && !levels.includes(actualLevel)) {
                continue;
            }

            const primaryUpgrades = this.getUpgrades(mowUpgrades[index], 'primary');
            const secondaryUpgrades = this.getUpgrades(mowUpgrades[index], 'secondary');

            result.push({
                ...lvlUpgrade,
                level: actualLevel,
                mowId,
                mowLabel,
                mowAlliance,
                salvage: lvlUpgrade.salvage ?? 0,
                forgeBadges: lvlUpgrade.forgeBadges ?? 0,
                primaryUpgrades,
                secondaryUpgrades,
                rarity: this.getRarityFromLevel(actualLevel),
            });
        }

        return result;
    }

    public static getTotals(materials: IMowLevelMaterials[], multiplier: 1 | 2 = 1): IMowMaterialsTotal {
        const components = sum(materials.map(x => x.components)) * multiplier;
        const gold = sum(materials.map(x => x.gold)) * multiplier;

        const badges = mapValues(groupBy(materials, 'rarity'), x => sum(x.map(y => y.badges)) * multiplier) as Record<
            Rarity,
            number
        >;

        const forgeBadges = mapValues(
            groupBy(materials, 'rarity'),
            x => sum(x.map(y => y.forgeBadges)) * multiplier
        ) as Record<Rarity, number>;

        return {
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

    public static getUpgradesRaw(
        mowId: string,
        levelStart: number,
        levelEnd: number,
        key: 'primary' | 'secondary'
    ): Array<string> {
        const mowUpgrades = (this.mowUpgrades[mowId] ?? []).slice(levelStart - 1, levelEnd - 1);

        return mowUpgrades.flatMap(upgrades => upgrades[key] ?? upgrades.primary);
    }

    private static getUpgrades(
        upgrades: IMowLevelUpgrades | undefined,
        key: 'primary' | 'secondary'
    ): Array<IBaseUpgrade | ICraftedUpgrade> {
        if (!upgrades) {
            return [];
        }
        const rawUpgrades = upgrades[key] ?? upgrades.primary;

        return rawUpgrades.map(upgrade => UpgradesService.getUpgrade(upgrade)).filter(x => !!x);
    }

    public static getRarityFromLevel(level: number): Rarity {
        if (level <= 8) {
            return Rarity.Common;
        }

        if (level <= 17) {
            return Rarity.Uncommon;
        }

        if (level <= 26) {
            return Rarity.Rare;
        }

        if (level <= 35) {
            return Rarity.Epic;
        }

        return Rarity.Legendary;
    }
}
