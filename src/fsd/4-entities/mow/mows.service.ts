import { Alliance, RarityMapper } from '@/fsd/5-shared/model';

import { IBaseUpgrade, ICraftedUpgrade, UpgradesService } from '@/fsd/4-entities/upgrade/@x/mow';

import { mowLevelUpCommonData, mowUpgradesData } from './data';
import { IMowLevelMaterials, IMowLevelUpgrades } from './model';

export class MowsService {
    public static getMaterialsList(
        mowId: string,
        mowLabel: string,
        mowAlliance: Alliance,
        levels: number[] = []
    ): IMowLevelMaterials[] {
        const result: IMowLevelMaterials[] = [];
        const mowUpgrades = mowUpgradesData[mowId] ?? [];

        for (const lvlUpgrade of mowLevelUpCommonData) {
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
                rarity: RarityMapper.getRarityFromLevel(actualLevel),
            });
        }

        return result;
    }

    public static getUpgradesRaw(
        mowId: string,
        levelStart: number,
        levelEnd: number,
        key: 'primary' | 'secondary'
    ): Array<string> {
        const mowUpgrades = (mowUpgradesData[mowId] ?? []).slice(levelStart - 1, levelEnd - 1);

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
}
