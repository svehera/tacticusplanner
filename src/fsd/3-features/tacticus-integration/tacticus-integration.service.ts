// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import xpData from 'src/data/xp.json';

import { mutableCopy } from '@/fsd/5-shared/lib';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TacticusUpgrade } from '@/fsd/5-shared/lib/tacticus-api';
import { RarityStars, Rarity, Rank, Alliance } from '@/fsd/5-shared/model';

import { CharacterUpgradesService } from '@/fsd/4-entities/character';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IXpLevel } from '@/fsd/3-features/characters/characters.models';

// Mythic Wings
const MAX_PROGRESSION_INDEX = 19;

export class TacticusIntegrationService {
    static convertProgressionIndex(progressionIndex: number): [Rarity, RarityStars] {
        // Clamp negative indices to 0 (Common No Stars) and out-of-range positive indices to
        // highest supported level.
        const clampedIndex = Math.min(Math.max(progressionIndex, 0), MAX_PROGRESSION_INDEX);
        const rarityThresholds = [0, 3, 6, 9, 12, 16];
        let rarity: Rarity = Rarity.Common;

        // We count down from rarest to most-common, so any progressionIndex values higher than maxSupportedIndex
        // will be clamped to the rarest we currently support. This is relevant to the 2025 staged rollout of Mythic
        // rarity, which adds a new rarity with 4 new ranks (but only 1 rank was released initially)
        for (let i = rarityThresholds.length - 1; i >= 0; i--) {
            if (clampedIndex >= rarityThresholds[i]) {
                rarity = i as Rarity;
                break;
            }
        }

        const rarityStars: RarityStars = (clampedIndex - rarity) as RarityStars;

        return [rarity, rarityStars];
    }

    static convertXp(xp: number, xpLevel: number): number {
        const xpLevelThresholds = mutableCopy(xpData.xpLevelThresholds) satisfies IXpLevel[];
        const currLevel = xpLevelThresholds[xpLevel - 1];

        return xp - currLevel.totalXp;
    }

    public static getAllianceFromString(allianceStr: string): Alliance | undefined {
        switch (allianceStr.toLowerCase()) {
            case 'imperial':
                return Alliance.Imperial;
            case 'xenos':
                return Alliance.Xenos;
            case 'chaos':
                return Alliance.Chaos;
            default:
                return undefined;
        }
    }

    static convertUpgrades(unitId: string, unitName: string, rank: Rank, upgradesIndexes: number[]): string[] {
        const [rankUp] = CharacterUpgradesService.getCharacterUpgradeRank({
            unitId,
            unitName,
            rankStart: rank,
            rankEnd: rank + 1,
            rankPoint5: false,
            rankStartPoint5: false,
            upgradesRarity: [],
            appliedUpgrades: [],
        });

        if (rankUp) {
            return rankUp.upgrades.filter((_, index) => upgradesIndexes.includes(index));
        }

        return [];
    }

    static getUpgradeId(upgrade: TacticusUpgrade): string | null {
        return upgrade.id;
    }
}
