import { describe, expect, it } from 'vitest';

import type { GuildBossEncounter, GuildBossSeasonConfig, GuildBossSet, GuildBossTier } from './guild-boss.model';
import {
    findEncounterLocation,
    findEncounterLocationByRarity,
    findPositionByBossUnitSetId,
    findPositionByTierSet,
    findPositionByUnitSetId,
    findPositionByUnitSetIdAndRarity,
    getBossUnitSetIds,
    getEncountersAtPosition,
    getKnownEncounterAvailability,
    getMaxKnownProgressionIndex,
    getNextEncounterPosition,
    getProgressionIndexFromUnitId,
    getSeasonConfig,
    getSeasonIds,
    getUnitSetId,
} from './guild-boss.service';

function makeEncounters(tier: number, set: number): GuildBossEncounter[] {
    return [
        {
            encounterIndex: 0,
            guildBossEncounterType: 'Boss',
            boardId: 'b',
            maxNrOfTurns: 5,
            unitId: `Boss${tier}_${set}`,
        },
        {
            encounterIndex: 1,
            guildBossEncounterType: 'Crystal',
            boardId: 'b',
            maxNrOfTurns: 5,
            unitId: `Left${tier}_${set}`,
        },
        {
            encounterIndex: 2,
            guildBossEncounterType: 'Crystal',
            boardId: 'b',
            maxNrOfTurns: 5,
            unitId: `Right${tier}_${set}`,
        },
    ];
}

function makeTier(tier: number, setCount: number): GuildBossTier {
    const sets: GuildBossSet[] = [];
    for (let set = 0; set < setCount; set++) {
        sets.push({ set, chestId: 'chest', guildXp: 10, encounters: makeEncounters(tier, set) });
    }
    return { tier, sets };
}

// Matches the real data's shape: tiers 0-3 (Common-Epic) climbed once, tiers 4-5 (Legendary/Mythic) loop.
const config: GuildBossSeasonConfig = {
    guildBossSeasonConfigId: 'test_config',
    tiers: [makeTier(0, 4), makeTier(1, 4), makeTier(2, 4), makeTier(3, 5), makeTier(4, 5), makeTier(5, 2)],
};

describe('getNextEncounterPosition', () => {
    it('starts at the first set when there is no current position', () => {
        expect(getNextEncounterPosition(config)).toEqual({ tierIndex: 0, setIndex: 0 });
    });

    it('advances within a tier', () => {
        expect(getNextEncounterPosition(config, { tierIndex: 0, setIndex: 0 })).toEqual({
            tierIndex: 0,
            setIndex: 1,
        });
    });

    it('advances across a tier boundary once the current tier is exhausted', () => {
        expect(getNextEncounterPosition(config, { tierIndex: 0, setIndex: 3 })).toEqual({
            tierIndex: 1,
            setIndex: 0,
        });
    });

    it('loops from the last Mythic set back to the first Legendary set', () => {
        expect(getNextEncounterPosition(config, { tierIndex: 5, setIndex: 1 })).toEqual({
            tierIndex: 4,
            setIndex: 0,
        });
    });

    it('continues the Legendary/Mythic loop across repeated cycles', () => {
        const afterFirstLoop = getNextEncounterPosition(config, { tierIndex: 5, setIndex: 1 });
        expect(getNextEncounterPosition(config, afterFirstLoop)).toEqual({ tierIndex: 4, setIndex: 1 });
    });
});

describe('findPositionByTierSet', () => {
    it('finds a position by tier/set field value, not raw array index', () => {
        expect(findPositionByTierSet(config, 3, 2)).toEqual({ tierIndex: 3, setIndex: 2 });
    });

    it('returns undefined for an unknown tier or set', () => {
        expect(findPositionByTierSet(config, 9, 0)).toBeUndefined();
        expect(findPositionByTierSet(config, 0, 99)).toBeUndefined();
    });
});

describe('findPositionByBossUnitSetId', () => {
    it('finds a boss position by unitSetId when the rarity filter matches its tier', () => {
        expect(findPositionByBossUnitSetId(config, 'Boss3_2', 3)).toEqual({ tierIndex: 3, setIndex: 2 });
    });

    it('finds a boss position by unitSetId with no rarity filter', () => {
        expect(findPositionByBossUnitSetId(config, 'Boss3_2')).toEqual({ tierIndex: 3, setIndex: 2 });
    });

    it('returns undefined when the rarity filter excludes the matching tier', () => {
        expect(findPositionByBossUnitSetId(config, 'Boss3_2', 4)).toBeUndefined();
    });

    it('returns undefined for an unknown unitSetId', () => {
        expect(findPositionByBossUnitSetId(config, 'BossUnknown_99')).toBeUndefined();
    });
});

describe('getEncountersAtPosition', () => {
    it('splits the boss from the left/right primes', () => {
        const { boss, leftPrime, rightPrime } = getEncountersAtPosition(config, { tierIndex: 2, setIndex: 1 });
        expect(boss?.unitId).toBe('Boss2_1');
        expect(leftPrime?.unitId).toBe('Left2_1');
        expect(rightPrime?.unitId).toBe('Right2_1');
    });
});

describe('findPositionByUnitSetId', () => {
    it('finds any encounter type (not just Boss) by unitSetId', () => {
        expect(findPositionByUnitSetId(config, 'Left2_1')).toEqual({ tierIndex: 2, setIndex: 1 });
    });

    it('respects the progression-index filter', () => {
        // makeEncounters gives unitIds with no `:N` suffix, so getProgressionIndexFromUnitId defaults to 1.
        expect(findPositionByUnitSetId(config, 'Left2_1', 1)).toEqual({ tierIndex: 2, setIndex: 1 });
        expect(findPositionByUnitSetId(config, 'Left2_1', 2)).toBeUndefined();
    });

    it('returns undefined for an unknown unitSetId', () => {
        expect(findPositionByUnitSetId(config, 'Unknown_99')).toBeUndefined();
    });

    it('disambiguates two sets at the same rarity by their exact progression index', () => {
        const multiSetConfig: GuildBossSeasonConfig = {
            guildBossSeasonConfigId: 'multi',
            tiers: [
                {
                    tier: 4,
                    sets: [
                        {
                            set: 0,
                            chestId: 'c',
                            guildXp: 1,
                            encounters: [
                                {
                                    encounterIndex: 0,
                                    guildBossEncounterType: 'Boss',
                                    boardId: 'b',
                                    maxNrOfTurns: 5,
                                    unitId: 'Lion:20',
                                },
                            ],
                        },
                        {
                            set: 1,
                            chestId: 'c',
                            guildXp: 1,
                            encounters: [
                                {
                                    encounterIndex: 0,
                                    guildBossEncounterType: 'Boss',
                                    boardId: 'b',
                                    maxNrOfTurns: 5,
                                    unitId: 'Lion:21',
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(findPositionByUnitSetId(multiSetConfig, 'Lion', 20)).toEqual({ tierIndex: 0, setIndex: 0 });
        expect(findPositionByUnitSetId(multiSetConfig, 'Lion', 21)).toEqual({ tierIndex: 0, setIndex: 1 });
        expect(findPositionByUnitSetId(multiSetConfig, 'Lion', 22)).toBeUndefined();
    });
});

describe('findPositionByUnitSetIdAndRarity', () => {
    it('finds any encounter type (not just Boss) by unitSetId', () => {
        expect(findPositionByUnitSetIdAndRarity(config, 'Left2_1')).toEqual({ tierIndex: 2, setIndex: 1 });
    });

    it('respects the rarity filter', () => {
        expect(findPositionByUnitSetIdAndRarity(config, 'Left2_1', 2)).toEqual({ tierIndex: 2, setIndex: 1 });
        expect(findPositionByUnitSetIdAndRarity(config, 'Left2_1', 3)).toBeUndefined();
    });

    it('returns undefined for an unknown unitSetId', () => {
        expect(findPositionByUnitSetIdAndRarity(config, 'Unknown_99')).toBeUndefined();
    });

    it('is lenient across multiple sets at the same rarity — returns the first found, not an exact match', () => {
        const multiSetConfig: GuildBossSeasonConfig = {
            guildBossSeasonConfigId: 'multi',
            tiers: [
                {
                    tier: 4,
                    sets: [
                        {
                            set: 0,
                            chestId: 'c',
                            guildXp: 1,
                            encounters: [
                                {
                                    encounterIndex: 0,
                                    guildBossEncounterType: 'Boss',
                                    boardId: 'b',
                                    maxNrOfTurns: 5,
                                    unitId: 'Lion:20',
                                },
                            ],
                        },
                        {
                            set: 1,
                            chestId: 'c',
                            guildXp: 1,
                            encounters: [
                                {
                                    encounterIndex: 0,
                                    guildBossEncounterType: 'Boss',
                                    boardId: 'b',
                                    maxNrOfTurns: 5,
                                    unitId: 'Lion:21',
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(findPositionByUnitSetIdAndRarity(multiSetConfig, 'Lion', 4)).toEqual({ tierIndex: 0, setIndex: 0 });
    });
});

describe('findEncounterLocationByRarity (real data)', () => {
    it('finds a real boss at one of its known rarities', () => {
        const [unitSetId] = getBossUnitSetIds();
        const availability = getKnownEncounterAvailability(unitSetId);
        expect(availability.length).toBeGreaterThan(0);
        expect(findEncounterLocationByRarity(unitSetId, availability[0].rarity)).toBeDefined();
    });

    it('returns undefined for a rarity the boss never occupies', () => {
        const [unitSetId] = getBossUnitSetIds();
        const occupiedRarities = new Set(getKnownEncounterAvailability(unitSetId).map(a => a.rarity));
        const missingRarity = [0, 1, 2, 3, 4, 5].find(r => !occupiedRarities.has(r));
        if (missingRarity !== undefined) {
            expect(findEncounterLocationByRarity(unitSetId, missingRarity)).toBeUndefined();
        }
    });

    it('returns undefined for a completely unknown unitSetId', () => {
        expect(findEncounterLocationByRarity('TotallyNotARealUnitSetId')).toBeUndefined();
    });
});

describe('findEncounterLocation (real data)', () => {
    it('finds a real boss using its exact known progression index', () => {
        const [unitSetId] = getBossUnitSetIds();
        const progressionIndex = getMaxKnownProgressionIndex(unitSetId);
        expect(findEncounterLocation(unitSetId, progressionIndex)).toBeDefined();
    });

    it('returns undefined for a progression index with no matching encounter', () => {
        const [unitSetId] = getBossUnitSetIds();
        const progressionIndex = getMaxKnownProgressionIndex(unitSetId);
        expect(findEncounterLocation(unitSetId, progressionIndex + 1000)).toBeUndefined();
    });

    it('returns undefined for a completely unknown unitSetId', () => {
        expect(findEncounterLocation('TotallyNotARealUnitSetId')).toBeUndefined();
    });
});

describe('getMaxKnownProgressionIndex (real data)', () => {
    it('returns the highest known real progression index for a specific boss', () => {
        expect(getMaxKnownProgressionIndex('GuildBoss12Boss1DarkaLion')).toBe(25);
    });

    it('falls back to 1 for a unit with no known encounters', () => {
        expect(getMaxKnownProgressionIndex('TotallyNotARealUnitSetId')).toBe(1);
    });
});

describe('getKnownEncounterAvailability (real data)', () => {
    it('returns a deduped list sorted by rarity then set for a real boss', () => {
        const [unitSetId] = getBossUnitSetIds();
        const availability = getKnownEncounterAvailability(unitSetId);
        expect(availability.length).toBeGreaterThan(0);
        const sorted = availability.toSorted((a, b) => a.rarity - b.rarity || a.set - b.set);
        expect(availability).toEqual(sorted);
        const keys = availability.map(a => `${a.rarity}:${a.set}`);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('returns an empty array for an unknown unitSetId', () => {
        expect(getKnownEncounterAvailability('TotallyNotARealUnitSetId')).toEqual([]);
    });

    it('includes the exact progression index for each known position', () => {
        // Bosses rotate between ladder positions as the season config is resynced, so a hardcoded
        // (rarity, set, progressionIndex) snapshot goes stale. Instead, verify each reported entry
        // against the real data: some season must have an encounter at that (rarity, set) whose
        // unitId both resolves to this unitSetId and carries the reported progression index.
        const [unitSetId] = getBossUnitSetIds();
        const availability = getKnownEncounterAvailability(unitSetId);
        expect(availability.length).toBeGreaterThan(0);

        for (const { rarity, set, progressionIndex } of availability) {
            const matchesSomeSeason = getSeasonIds().some(seasonId => {
                const config = getSeasonConfig(seasonId);
                if (!config) return false;
                const position = findPositionByTierSet(config, rarity, set);
                if (!position) return false;
                const encounters = config.tiers[position.tierIndex]?.sets[position.setIndex]?.encounters ?? [];
                return encounters.some(
                    enc =>
                        getUnitSetId(enc.unitId) === unitSetId &&
                        getProgressionIndexFromUnitId(enc.unitId) === progressionIndex
                );
            });
            expect(matchesSomeSeason).toBe(true);
        }
    });
});
