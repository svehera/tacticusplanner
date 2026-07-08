import { describe, expect, it } from 'vitest';

import type { GuildBossEncounter, GuildBossSeasonConfig, GuildBossSet, GuildBossTier } from './guild-boss.model';
import { findPositionByTierSet, getEncountersAtPosition, getNextEncounterPosition } from './guild-boss.service';

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

describe('getEncountersAtPosition', () => {
    it('splits the boss from the left/right primes', () => {
        const { boss, leftPrime, rightPrime } = getEncountersAtPosition(config, { tierIndex: 2, setIndex: 1 });
        expect(boss?.unitId).toBe('Boss2_1');
        expect(leftPrime?.unitId).toBe('Left2_1');
        expect(rightPrime?.unitId).toBe('Right2_1');
    });
});
