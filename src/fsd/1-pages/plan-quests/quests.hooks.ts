/* eslint-disable import-x/no-internal-modules */
import { useCallback } from 'react';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { IMow2 } from '@/fsd/4-entities/mow';

import { IEstimatedUpgrades } from '@/fsd/3-features/goals/goals.models';

interface UpgradeNeed {
    acquired: number;
    required: number;
    units: Array<ICharacter2 | IMow2>;
}

export function useUpgradeNeeds(
    estimatedUpgradesTotal: IEstimatedUpgrades,
    chars: ICharacter2[],
    mows: IMow2[]
): (upgradeId: string) => UpgradeNeed {
    return useCallback(
        (upgradeId: string): UpgradeNeed => {
            const inProgressMat = estimatedUpgradesTotal.inProgressMaterials.find(upgrade => upgrade.id === upgradeId);
            const blockedMat = estimatedUpgradesTotal.blockedMaterials.find(upgrade => upgrade.id === upgradeId);
            const acquired = (inProgressMat?.acquiredCount ?? 0) + (blockedMat?.acquiredCount ?? 0);
            const required = (inProgressMat?.requiredCount ?? 0) + (blockedMat?.requiredCount ?? 0);
            if (required === 0) return { acquired, required, units: [] };
            const units = [
                estimatedUpgradesTotal.inProgressMaterials.find(upgrade => upgrade.id === upgradeId)?.relatedCharacters,
                estimatedUpgradesTotal.blockedMaterials.find(upgrade => upgrade.id === upgradeId)?.relatedCharacters,
            ]
                .flat()
                .filter(x => x !== undefined);
            const resolvedChars = units
                .flat()
                .filter(x => x !== undefined)
                .map(charName => chars.find(c => c.shortName === charName))
                .filter(x => x !== undefined);
            const resolvedMows = units
                .flat()
                .filter(x => x !== undefined)
                .map(mowName => mows.find(m => m.name === mowName))
                .filter(x => x !== undefined);
            return { acquired, required, units: [...resolvedChars, ...resolvedMows] as Array<ICharacter2 | IMow2> };
        },
        [estimatedUpgradesTotal, chars, mows]
    );
}
