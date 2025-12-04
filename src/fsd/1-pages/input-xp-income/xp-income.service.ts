import { Rarity } from '@/fsd/5-shared/model';

import { ArenaLeague, BlueStarCharacter } from './models';

const kDaysPerWeek = 7;
const kOnslaughtBooksDaily = (10.5 / 57) * 5;
export const kEliteEnergyPerRaid = 10;
const kBooksPerEliteRaid = (25 / 24 / 57) * 5;
export const kNonEliteEnergyPerRaid = 6;
const kBooksPerNonEliteRaid = (3 / 7 / 57) * 5;
const kShardsPerL10Incursion = 203;
const kShardsPerL12Incursion = 231;
const kShardsPerMythicIncursion = 210;

const kArenaBooksPerWeek: Record<ArenaLeague, Partial<Record<Rarity, number>>> = {
    [ArenaLeague.kHonorGuard]: { [Rarity.Epic]: 18, [Rarity.Legendary]: 7 },
    [ArenaLeague.kCaptain]: { [Rarity.Epic]: 20, [Rarity.Legendary]: 4, [Rarity.Mythic]: 1 },
    [ArenaLeague.kChapterMaster]: { [Rarity.Epic]: 22, [Rarity.Legendary]: 5, [Rarity.Mythic]: 1 },
};

export const kBlueStarCharacters: BlueStarCharacter[] = [
    { id: 'orksRuntherd', shardsPerWeek: 4 * 7 },
    { id: 'deathBlightlord', shardsPerWeek: (17 * 2) / 2 },
    { id: 'orksKillaKan', shardsPerWeek: (17 * 2) / 2 },
    { id: 'eldarAutarch', shardsPerWeek: 3 * 7 },
    { id: 'orksBigMek', shardsPerWeek: 6 },
    { id: 'eldarRanger', shardsPerWeek: 6 },
];

export class XpIncomeService {
    /** @returns The number of legendary books the user can expect to earn per week. */
    public static estimateWeeklyBookIncome(
        arenaLeague: ArenaLeague,
        loopsRaids: 'yes' | 'no',
        raidLoops: number,
        extraBossesAfterLoop: number,
        clearRarity: Rarity,
        additionalBosses: number,
        useAtForBooks: 'yes' | 'no',
        blueStarCharIds: string[],
        hasBlueStarMoW: 'yes' | 'no',
        incursionLegendaryLevel: 'L10' | 'L12' | 'M',
        onslaughtBlueStar: 'yes' | 'no',
        eliteEnergyPerDay: number,
        nonEliteEnergyPerDay: number,
        additionalBooksPerWeek: number
    ): number {
        let weeklyEstimate = 0;

        weeklyEstimate +=
            (kArenaBooksPerWeek[arenaLeague][Rarity.Epic] ?? 0) / 5 +
            (kArenaBooksPerWeek[arenaLeague][Rarity.Legendary] ?? 0) +
            (kArenaBooksPerWeek[arenaLeague][Rarity.Mythic] ?? 0) * 5;

        let totalGuildCreditsPerRaidSeason = 0;
        if (loopsRaids === 'yes') {
            totalGuildCreditsPerRaidSeason = 22000 + raidLoops * 6000 + extraBossesAfterLoop * 1000;
        } else {
            totalGuildCreditsPerRaidSeason = additionalBosses * 1000; // Uses debounced variable
            switch (clearRarity) {
                case Rarity.Common:
                    totalGuildCreditsPerRaidSeason += 4000;
                    break;
                case Rarity.Uncommon:
                    totalGuildCreditsPerRaidSeason += 8000;
                    break;
                case Rarity.Rare:
                    totalGuildCreditsPerRaidSeason += 12000;
                    break;
                case Rarity.Epic:
                    totalGuildCreditsPerRaidSeason += 17000;
                    break;
                default:
                    totalGuildCreditsPerRaidSeason += 0;
            }
        }
        weeklyEstimate += totalGuildCreditsPerRaidSeason / 300 / 2;

        if (useAtForBooks === 'yes') {
            let mowWeeklyShards = 0;
            if (hasBlueStarMoW === 'yes') {
                mowWeeklyShards =
                    (incursionLegendaryLevel === 'M'
                        ? kShardsPerMythicIncursion
                        : incursionLegendaryLevel === 'L12'
                          ? kShardsPerL12Incursion
                          : kShardsPerL10Incursion) / 5;
            }

            const totalWeeklyAt =
                kBlueStarCharacters
                    .filter(char => blueStarCharIds.includes(char.id))
                    .reduce((sum, char) => sum + char.shardsPerWeek, 0) + mowWeeklyShards;
            console.log('Total Weekly AT from Blue Star chars and MoW:', totalWeeklyAt);

            weeklyEstimate += (totalWeeklyAt / 57) * 5;

            if (onslaughtBlueStar === 'yes') {
                weeklyEstimate += kOnslaughtBooksDaily * kDaysPerWeek;
            }

            const eliteIncrements = eliteEnergyPerDay / kEliteEnergyPerRaid;
            weeklyEstimate += eliteIncrements * kBooksPerEliteRaid * kDaysPerWeek;

            const nonEliteIncrements = nonEliteEnergyPerDay / kNonEliteEnergyPerRaid;
            weeklyEstimate += nonEliteIncrements * kBooksPerNonEliteRaid * kDaysPerWeek;
        }

        weeklyEstimate += additionalBooksPerWeek;

        return weeklyEstimate;
    }
}
