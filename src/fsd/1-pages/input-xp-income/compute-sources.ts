import { Rarity, XP_BOOK_VALUE } from '@/fsd/5-shared/model';

import { ArenaLeague, XpIncomeState } from './models';
import { blueStarCharacters, bossesPerLoop, eliteEnergyPerRaid, nonEliteEnergyPerRaid } from './xp-income.service';

export interface SourceContribution {
    id: 'arena' | 'raid' | 'at' | 'other';
    label: string;
    /** Emoji displayed in the icon tile */
    icon: string;
    /** OKLCH color value — drives icon tile bg tint and expanded-row left border */
    color: string;
    /** Weekly codices in the user's chosen rarity units */
    weekly: number;
    /** One-line English description of the current setting */
    summary: string;
}

const epicToLegendary = 1 / 5;
const mythicToLegendary = 5;
const ATShardsPerCodex = 57;
const onslaughtCodicesWeekly = 25;
const codicesPerEliteRaid = (25 / 24 / ATShardsPerCodex) * 5;
const codicesPerNonEliteRaid = (3 / 7 / ATShardsPerCodex) * 5;
const shardsPerL10Incursion = 203;
const shardsPerL12Incursion = 231;
const shardsPerMythicIncursion = 210;
const creditsPerBoss = 1000;
const creditsPerMythicCodex = 1500;

const arenaCodicesPerWeek: Record<ArenaLeague, Partial<Record<Rarity, number>>> = {
    [ArenaLeague.honorGuard]: { [Rarity.Epic]: 18, [Rarity.Legendary]: 7 },
    [ArenaLeague.captain]: { [Rarity.Epic]: 20, [Rarity.Legendary]: 4, [Rarity.Mythic]: 1 },
    [ArenaLeague.chapterMaster]: { [Rarity.Epic]: 22, [Rarity.Legendary]: 5, [Rarity.Mythic]: 1 },
};

const arenaLeagueSummary: Record<ArenaLeague, string> = {
    [ArenaLeague.honorGuard]: 'Honor Guard league',
    [ArenaLeague.captain]: 'Captains league',
    [ArenaLeague.chapterMaster]: 'Chapter Master league',
};

const rarityName: Record<Rarity, string> = {
    [Rarity.Common]: 'Common',
    [Rarity.Uncommon]: 'Uncommon',
    [Rarity.Rare]: 'Rare',
    [Rarity.Epic]: 'Epic',
    [Rarity.Legendary]: 'Legendary',
    [Rarity.Mythic]: 'Mythic',
};

// Credits accumulated up to and including each rarity tier
const bossesPerRarity: Record<Rarity, number> = {
    [Rarity.Common]: 4,
    [Rarity.Uncommon]: 4,
    [Rarity.Rare]: 4,
    [Rarity.Epic]: 5,
    [Rarity.Legendary]: 5,
    [Rarity.Mythic]: 2,
};
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
const baseRaidCreditsPerSeason = raidCreditsByRarity[Rarity.Legendary]!;
const creditsPerLoop = bossesPerLoop * creditsPerBoss;

/**
 * Returns the per-source weekly contribution breakdown in the user's chosen-rarity units.
 * The math mirrors XpIncomeService.estimateWeeklyCodexIncome split into named buckets.
 */
export function computeSources(
    state: XpIncomeState,
    blueStarCharIds: string[],
    raidLoops: number,
    extraBossesAfterLoop: number,
    additionalBosses: number,
    eliteEnergyPerDay: number,
    nonEliteEnergyPerDay: number
): SourceContribution[] {
    const chosenRarity = state.defaultCodexToUse ?? Rarity.Legendary;
    const conv = XP_BOOK_VALUE[Rarity.Legendary] / XP_BOOK_VALUE[chosenRarity];

    // ── Arena ──
    const arenaRow = arenaCodicesPerWeek[state.arenaLeague];
    const arenaLeg =
        (arenaRow[Rarity.Epic] ?? 0) * epicToLegendary +
        (arenaRow[Rarity.Legendary] ?? 0) +
        (arenaRow[Rarity.Mythic] ?? 0) * mythicToLegendary;
    const arenaWeekly = arenaLeg * conv;

    // ── Guild Raid ──
    const credits =
        state.loopsRaids === 'yes'
            ? baseRaidCreditsPerSeason + raidLoops * creditsPerLoop + extraBossesAfterLoop * creditsPerBoss
            : (raidCreditsByRarity[state.clearRarity] ?? 0) + additionalBosses * creditsPerBoss;
    const raidLeg = Math.min(((credits / creditsPerMythicCodex) * mythicToLegendary) / 2, 90);
    const raidWeekly = raidLeg * conv;
    const raidSummary =
        state.loopsRaids === 'yes'
            ? `${raidLoops} loop${raidLoops > 1 ? 's' : ''} + ${extraBossesAfterLoop} extra boss${extraBossesAfterLoop === 1 ? '' : 'es'}`
            : `${rarityName[state.clearRarity]} cleared + ${additionalBosses} boss${additionalBosses === 1 ? '' : 'es'}`;

    // ── AT Purchases ──
    let atLeg = 0;
    let atSummary = 'Off';
    if (state.useATForCodices === 'yes') {
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

        atLeg = (weeklyShards / ATShardsPerCodex) * 5;
        if (state.onslaughtMythicWinged) atLeg += onslaughtCodicesWeekly;
        atLeg += (eliteEnergyPerDay / eliteEnergyPerRaid) * codicesPerEliteRaid * 7;
        atLeg += (nonEliteEnergyPerDay / nonEliteEnergyPerRaid) * codicesPerNonEliteRaid * 7;

        const ownedCount = blueStarCharIds.length;
        atSummary = `${ownedCount} char${ownedCount === 1 ? '' : 's'}${state.hasBlueStarMoW === 'yes' ? ` + Incursion ${state.incursionLegendaryLevel}` : ''}${state.onslaughtMythicWinged ? ' + Onslaught' : ''}`;
    }
    const atWeekly = atLeg * conv;

    // ── Other ──
    const otherWeekly = state.additionalCodicesPerWeek;

    return [
        {
            id: 'arena',
            label: 'Arena',
            /** MiscIcon key */
            icon: 'arenaToken',
            color: 'oklch(0.6 0.2 265)',
            weekly: arenaWeekly,
            summary: arenaLeagueSummary[state.arenaLeague],
        },
        {
            id: 'raid',
            label: 'Guild Raid',
            /** MiscIcon key */
            icon: 'guildRaidToken',
            color: 'oklch(0.62 0.18 165)',
            weekly: raidWeekly,
            summary: raidSummary,
        },
        {
            id: 'at',
            label: 'AT Purchases',
            /** MiscIcon key */
            icon: 'blueStar',
            color: 'oklch(0.7 0.18 35)',
            weekly: atWeekly,
            summary: atSummary,
        },
        {
            id: 'other',
            label: 'Other',
            /** MiscIcon key */
            icon: 'legendaryBook',
            color: 'oklch(0.7 0.15 320)',
            weekly: otherWeekly,
            summary: 'Unspecified sources',
        },
    ];
}
