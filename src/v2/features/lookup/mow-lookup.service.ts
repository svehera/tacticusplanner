import { IMow } from 'src/v2/features/characters/characters.models';
import {
    IMowLevelMaterials,
    IMowLevelUpgrade,
    IMowLevelUpgrades,
    IMowLevelUpgradesDic,
} from 'src/v2/features/lookup/lookup.models';

import mowCommonMaterial from 'src/v2/data/mow-lvl-up-common.json';
import mowUpgradesRaw from 'src/v2/data/mows-upgrades.json';
import { Rarity } from 'src/models/enums';
import { IBaseUpgrade, ICraftedUpgrade } from 'src/v2/features/goals/goals.models';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

export class MowLookupService {
    private static RarityToMaxAbilityLevel: Record<Rarity, number> = {
        [Rarity.Common]: 8,
        [Rarity.Uncommon]: 17,
        [Rarity.Rare]: 26,
        [Rarity.Epic]: 35,
        [Rarity.Legendary]: 50,
    };
    private static mowLevelUpCommon: IMowLevelUpgrade[] = mowCommonMaterial;
    private static mowUpgrades: IMowLevelUpgradesDic = mowUpgradesRaw;

    public static getMaterialsList(mow: IMow): IMowLevelMaterials[] {
        const result: IMowLevelMaterials[] = [];
        const mowUpgrades = this.mowUpgrades[mow.id] ?? [];

        for (const lvlUpgrade of this.mowLevelUpCommon) {
            const index = lvlUpgrade.lvl - 1;
            const actualLevel = lvlUpgrade.lvl + 1;
            const primaryUpgrades = this.getUpgrades(mowUpgrades[index], 'primary');
            const secondaryUpgrades = this.getUpgrades(mowUpgrades[index], 'secondary');

            result.push({
                ...lvlUpgrade,
                level: actualLevel,
                mowId: mow.id,
                mowLabel: mow.name,
                mowAlliance: mow.alliance,
                salvage: lvlUpgrade.salvage ?? 0,
                forgeBadges: lvlUpgrade.forgeBadges ?? 0,
                primaryUpgrades,
                secondaryUpgrades,
                rarity: this.getRarityFromLevel(actualLevel),
            });
        }

        return result;
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

    private static getRarityFromLevel(level: number): Rarity {
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
