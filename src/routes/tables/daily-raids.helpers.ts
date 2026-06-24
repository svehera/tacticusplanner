import { sum } from 'lodash';

import { PersonalGoalType } from 'src/models/enums';

import { Alliance, Rarity } from '@/fsd/5-shared/model';

import { MowsService } from '@/fsd/4-entities/mow';

import { ICharacterUpgradeMow, ICharacterUpgradeRankGoal } from '@/fsd/3-features/goals/goals.models';

interface Counts {
    acquired: number;
    required: number;
}

export function computeMowCounts(
    upgradeRankOrMowGoals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>,
    components: Record<Alliance, number>,
    forgeBadges: Record<Rarity, number>
): {
    componentsByAlliance: Record<Alliance, Counts>;
    forgeBadgeCounts: Record<Rarity, Counts>;
} {
    const componentsByAlliance: Record<Alliance, Counts> = {
        [Alliance.Imperial]: { acquired: components[Alliance.Imperial] ?? 0, required: 0 },
        [Alliance.Xenos]: { acquired: components[Alliance.Xenos] ?? 0, required: 0 },
        [Alliance.Chaos]: { acquired: components[Alliance.Chaos] ?? 0, required: 0 },
    };
    const forgeBadgeCounts: Record<Rarity, Counts> = {
        [Rarity.Common]: { acquired: forgeBadges[Rarity.Common] ?? 0, required: 0 },
        [Rarity.Uncommon]: { acquired: forgeBadges[Rarity.Uncommon] ?? 0, required: 0 },
        [Rarity.Rare]: { acquired: forgeBadges[Rarity.Rare] ?? 0, required: 0 },
        [Rarity.Epic]: { acquired: forgeBadges[Rarity.Epic] ?? 0, required: 0 },
        [Rarity.Legendary]: { acquired: forgeBadges[Rarity.Legendary] ?? 0, required: 0 },
        [Rarity.Mythic]: { acquired: forgeBadges[Rarity.Mythic] ?? 0, required: 0 },
    };

    const mowGoals = upgradeRankOrMowGoals.filter(
        g => g.type === PersonalGoalType.MowAbilities
    ) as ICharacterUpgradeMow[];

    for (const goal of mowGoals) {
        const allMaterials = MowsService.getMaterialsList(goal.unitId, goal.unitName, goal.unitAlliance);
        const filtered = [];
        for (let index = goal.primaryStart - 1; index < goal.primaryEnd - 1; index++) {
            if (allMaterials[index]) filtered.push(allMaterials[index]);
        }
        for (let index = goal.secondaryStart - 1; index < goal.secondaryEnd - 1; index++) {
            if (allMaterials[index]) filtered.push(allMaterials[index]);
        }
        componentsByAlliance[goal.unitAlliance].required += sum(filtered.map(m => m.components));
        for (const m of filtered) {
            forgeBadgeCounts[m.rarity].required += m.forgeBadges;
        }
    }

    return { componentsByAlliance, forgeBadgeCounts };
}
