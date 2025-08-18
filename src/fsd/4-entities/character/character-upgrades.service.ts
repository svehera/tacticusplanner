import { getEnumValues } from '@/fsd/5-shared/lib';
import { Rank, rankToString } from '@/fsd/5-shared/model';

import { CharactersService } from './characters.service';
import { rankUpData } from './data';
import { IRankLookup, IUnitUpgradeRank } from './model';

export class CharacterUpgradesService {
    static readonly rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);

    /**
     * @param rankLookup The start and end rank of the goal, as well as any
     *                   materials that have already been applied.
     * @returns The number of each upgrade material necessary to hit the
     *          upgrade rank.
     */
    public static getCharacterUpgradeRank(rankLookup: IRankLookup): IUnitUpgradeRank[] {
        // The goal could have an old character ID (name), let's try to convert it to the snowprint ID.
        const unitId = CharactersService.canonicalName(rankLookup.unitId);
        const characterRankUpData = rankUpData[unitId] ?? {};

        const ranksRange = this.rankEntries.filter(r => r >= rankLookup.rankStart && r < rankLookup.rankEnd);
        const upgradeRanks: IUnitUpgradeRank[] = [];

        for (const rank of ranksRange) {
            const upgrades = characterRankUpData[rankToString(rank)] ?? [];
            console.log('processing rank', rank, rankToString(rank), 'with upgrades', upgrades);
            upgradeRanks.push({
                rankStart: rank,
                rankEnd: rank + 1,
                rankPoint5: false,
                upgrades: upgrades,
            });
        }

        if (rankLookup.rankPoint5) {
            const lastRankUpgrades = characterRankUpData[rankToString(rankLookup.rankEnd)] ?? [];
            // select every even upgrade (top row in game)
            const rankPoint5Upgrades = lastRankUpgrades.filter((_, index) => (index + 1) % 2 !== 0);

            upgradeRanks.push({
                rankStart: rankLookup.rankEnd,
                rankEnd: rankLookup.rankEnd,
                rankPoint5: true,
                upgrades: rankPoint5Upgrades,
            });
        }

        if (rankLookup.appliedUpgrades.length && upgradeRanks.length) {
            const currentRank = upgradeRanks[0];
            currentRank.upgrades = currentRank.upgrades.filter(
                upgrade => upgrade && !rankLookup.appliedUpgrades.includes(upgrade)
            );
        }
        return upgradeRanks;
    }
}
