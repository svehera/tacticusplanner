import { Rarity, XP_BOOK_VALUE } from '@/fsd/5-shared/model';

import { ArenaLeague, BlueStarCharacter, XpIncomeState } from './models';

/** AT shards cost per legendary book purchase */
const shardsPerAtBook = 57;
const onslaughtBooksDaily = (10.5 / shardsPerAtBook) * 5;
export const eliteEnergyPerRaid = 10;
const booksPerEliteRaid = (25 / 24 / shardsPerAtBook) * 5;
export const nonEliteEnergyPerRaid = 6;
const booksPerNonEliteRaid = (3 / 7 / shardsPerAtBook) * 5;
const shardsPerL10Incursion = 203;
const shardsPerL12Incursion = 231;
const shardsPerMythicIncursion = 210;
/** Legendary-equivalent value: 1 Epic book = 1/5 Legendary book */
const epicToLegendary = 1 / 5;
/** Legendary-equivalent value: 1 Mythic book = 5 Legendary books */
const mythicToLegendary = 5;

const arenaBooksPerWeek: Record<ArenaLeague, Partial<Record<Rarity, number>>> = {
    [ArenaLeague.honorGuard]: { [Rarity.Epic]: 18, [Rarity.Legendary]: 7 },
    [ArenaLeague.captain]: { [Rarity.Epic]: 20, [Rarity.Legendary]: 4, [Rarity.Mythic]: 1 },
    [ArenaLeague.chapterMaster]: { [Rarity.Epic]: 22, [Rarity.Legendary]: 5, [Rarity.Mythic]: 1 },
};

/** Number of bosses available at each rarity tier per raid season */
const bossesPerRarity: Record<Rarity, number> = {
    [Rarity.Common]: 4,
    [Rarity.Uncommon]: 4,
    [Rarity.Rare]: 4,
    [Rarity.Epic]: 5,
    [Rarity.Legendary]: 5,
    [Rarity.Mythic]: 2,
};
const creditsPerBoss = 1000;
/** Guild shop cost for 1 Mythic XP book (= 5 legendary-equivalent) */
const creditsPerMythicBook = 1500;

/** Cumulative credits when clearing all bosses up to and including each rarity */
const raidCreditsByRarity = (() => {
    const order: Rarity[] = [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary, Rarity.Mythic];
    let cumulative = 0;
    const result: Partial<Record<Rarity, number>> = {};
    for (const rarity of order) {
        cumulative += bossesPerRarity[rarity];
        result[rarity] = cumulative * creditsPerBoss;
    }
    return result;
})();

/** Credits from the initial clear through all Legendary bosses (= loop restart point) */
const baseRaidCreditsPerSeason = raidCreditsByRarity[Rarity.Legendary]!; // 22,000
/** Bosses per loop: Legendary + Mythic (loop restarts at Legendary 1) */
export const bossesPerLoop = bossesPerRarity[Rarity.Legendary] + bossesPerRarity[Rarity.Mythic]; // 7
/** Credits per loop: Legendary + Mythic bosses (loop restarts at Legendary 1) */
const creditsPerLoop = bossesPerLoop * creditsPerBoss; // 7,000

export const blueStarCharacters: BlueStarCharacter[] = [
    { id: 'orksRuntherd', shardsPerWeek: 4 * 7 }, // Snot – salvage (4/day)
    { id: 'deathBlightlord', shardsPerWeek: 17 }, // Maladus – 17 bi-weekly raid bosses, each granting 2× shards (= 1 shard/boss/week)
    { id: 'orksKillaKan', shardsPerWeek: 17 }, // Snappa – arena crates
    { id: 'eldarAutarch', shardsPerWeek: 3 * 7 }, // Aethana – daily missions (3/day)
    { id: 'orksBigMek', shardsPerWeek: 6 }, // Gibba – 2× weekly event, 3 shards each
    { id: 'eldarRanger', shardsPerWeek: 6 }, // Calandis – Tournament Arena (TA)
];

export class XpIncomeService {
    private static estimateArenaBooks(arenaLeague: ArenaLeague): number {
        const row = arenaBooksPerWeek[arenaLeague];
        return (
            (row[Rarity.Epic] ?? 0) * epicToLegendary +
            (row[Rarity.Legendary] ?? 0) +
            (row[Rarity.Mythic] ?? 0) * mythicToLegendary
        );
    }

    private static estimateRaidBooks(
        loopsRaids: XpIncomeState['loopsRaids'],
        raidLoops: number,
        extraBossesAfterLoop: number,
        clearRarity: Rarity,
        additionalBosses: number
    ): number {
        const credits =
            loopsRaids === 'yes'
                ? baseRaidCreditsPerSeason + raidLoops * creditsPerLoop + extraBossesAfterLoop * creditsPerBoss
                : (raidCreditsByRarity[clearRarity] ?? 0) + additionalBosses * creditsPerBoss;
        // Raid seasons run every 2 weeks; convert credits to weekly legendary-equivalent books
        return ((credits / creditsPerMythicBook) * mythicToLegendary) / 2;
    }

    private static estimateAtBooks(
        state: XpIncomeState,
        blueStarCharIds: string[],
        eliteEnergyPerDay: number,
        nonEliteEnergyPerDay: number
    ): number {
        if (state.useATForBooks !== 'yes') return 0;

        let weeklyShards = blueStarCharacters
            .filter(char => blueStarCharIds.includes(char.id))
            .reduce((sum, char) => sum + char.shardsPerWeek, 0);

        if (state.hasBlueStarMoW === 'yes') {
            const shardsPerMonth =
                state.incursionLegendaryLevel === 'M'
                    ? shardsPerMythicIncursion
                    : state.incursionLegendaryLevel === 'L12'
                      ? shardsPerL12Incursion
                      : shardsPerL10Incursion;
            weeklyShards += shardsPerMonth / 5;
        }

        let books = (weeklyShards / shardsPerAtBook) * 5;

        if (state.onslaughtBlueStar === 'yes') {
            books += onslaughtBooksDaily * 7;
        }

        books += (eliteEnergyPerDay / eliteEnergyPerRaid) * booksPerEliteRaid * 7;
        books += (nonEliteEnergyPerDay / nonEliteEnergyPerRaid) * booksPerNonEliteRaid * 7;

        return books;
    }

    /** @returns The number of books of the user's chosen rarity they can expect to earn per week. */
    public static estimateWeeklyBookIncome(
        state: XpIncomeState,
        blueStarCharIds: string[],
        raidLoops: number,
        extraBossesAfterLoop: number,
        additionalBosses: number,
        eliteEnergyPerDay: number,
        nonEliteEnergyPerDay: number
    ): number {
        const legendaryBooksPerWeek =
            this.estimateArenaBooks(state.arenaLeague) +
            this.estimateRaidBooks(
                state.loopsRaids,
                raidLoops,
                extraBossesAfterLoop,
                state.clearRarity,
                additionalBosses
            ) +
            this.estimateAtBooks(state, blueStarCharIds, eliteEnergyPerDay, nonEliteEnergyPerDay) +
            state.additionalBooksPerWeek;
        // Convert from Legendary-equivalent to the player's chosen display rarity
        const chosenRarity = state.defaultBookToUse ?? Rarity.Legendary;
        return legendaryBooksPerWeek * (XP_BOOK_VALUE[Rarity.Legendary] / XP_BOOK_VALUE[chosenRarity]);
    }
}
