/* eslint-disable import-x/no-internal-modules -- matches guild-performance.utils.ts's own import style */
import { describe, expect, it } from 'vitest';

import {
    TacticusDamageType,
    TacticusEncounterType,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity } from '@/fsd/5-shared/model';

import { getEncountersAtPosition, getSeasonConfig, getUnitSetId } from '@/fsd/4-entities/guild_boss';

import {
    bossIconFor,
    bossPrefixDisplayNames,
    getBossPrefix,
    getBossSlotKey,
    resolveBossOverviewDisplay,
    sortTokenEntriesBy,
    unitDisplayLabel,
    type GuildTokenEntryWithDisplay,
} from './guild-performance.utils';

// Bosses rotate between ladder positions as Snowprint updates the season config, so these are
// derived from whichever boss/primes occupy the first Mythic set in the live data rather than a
// hardcoded boss identity - the position is stable, the boss occupying it is not.
const SEASON_CONFIG_ID = 'guild_boss_season_config_5';
const config = getSeasonConfig(SEASON_CONFIG_ID)!;
const mythicTierIndex = config.tiers.findIndex(t => t.tier === Rarity.Mythic);
const { boss, leftPrime, rightPrime } = getEncountersAtPosition(config, { tierIndex: mythicTierIndex, setIndex: 0 });
// Raid entries report the stripped unitSetId (no `:N` progression suffix), unlike the season
// config's own encounter.unitId, so mock TacticusGuildRaidEntry.unitId values must be stripped too.
const BOSS_UNIT_ID = getUnitSetId(boss!.unitId);
const LEFT_PRIME_UNIT_ID = getUnitSetId(leftPrime!.unitId);
const RIGHT_PRIME_UNIT_ID = getUnitSetId(rightPrime!.unitId);
const PREVIOUS_BOSS_UNIT_ID = 'SomeEarlierPositionBoss';

function makeEntry(
    overrides: Partial<TacticusGuildRaidEntry> & Pick<TacticusGuildRaidEntry, 'unitId'>
): TacticusGuildRaidEntry {
    return {
        userId: 'user-1',
        tier: 0,
        set: 0,
        encounterIndex: 0,
        remainingHp: 0,
        maxHp: 1_000_000,
        encounterType: TacticusEncounterType.SideBoss,
        type: 'test',
        rarity: Rarity.Mythic,
        damageDealt: 0,
        damageType: TacticusDamageType.Battle,
        startedOn: 0,
        completedOn: 0,
        heroDetails: [],
        globalConfigHash: 'hash',
        ...overrides,
    };
}

describe('resolveBossOverviewDisplay', () => {
    it('shows a prime as dead when it was killed before the still-alive boss its most recent hit', () => {
        const entries: TacticusGuildRaidEntry[] = [
            // The boss that occupied the previous position died first.
            makeEntry({
                unitId: PREVIOUS_BOSS_UNIT_ID,
                encounterType: TacticusEncounterType.Boss,
                remainingHp: 0,
                maxHp: 1_000_000,
                startedOn: 40,
                completedOn: 50,
            }),
            // Both primes for the current position get killed well before the boss's latest hit.
            makeEntry({
                unitId: RIGHT_PRIME_UNIT_ID,
                remainingHp: 500_000,
                maxHp: 2_100_000,
                startedOn: 90,
                completedOn: 100,
            }),
            makeEntry({
                unitId: RIGHT_PRIME_UNIT_ID,
                remainingHp: 0,
                maxHp: 2_100_000,
                startedOn: 190,
                completedOn: 200,
            }),
            makeEntry({
                unitId: LEFT_PRIME_UNIT_ID,
                remainingHp: 800_000,
                maxHp: 1_800_000,
                startedOn: 290,
                completedOn: 300,
            }),
            makeEntry({
                unitId: LEFT_PRIME_UNIT_ID,
                remainingHp: 0,
                maxHp: 1_800_000,
                startedOn: 390,
                completedOn: 400,
            }),
            // The boss itself is still alive — its latest hit starts well after both prime kills.
            makeEntry({
                unitId: BOSS_UNIT_ID,
                encounterType: TacticusEncounterType.Boss,
                remainingHp: 28_000_000,
                maxHp: 30_000_000,
                startedOn: 490,
                completedOn: 500,
            }),
        ];

        const display = resolveBossOverviewDisplay(entries, SEASON_CONFIG_ID);

        expect(display?.isNextBoss).toBe(false);
        expect(display?.boss.hp).toEqual({ kind: 'actual', remaining: 28_000_000, max: 30_000_000 });
        expect(display?.leftPrime?.hp).toEqual({ kind: 'actual', remaining: 0, max: 1_800_000 });
        expect(display?.rightPrime?.hp).toEqual({ kind: 'actual', remaining: 0, max: 2_100_000 });
    });

    it('advances to the next position once the current boss dies (isNextBoss)', () => {
        const entries: TacticusGuildRaidEntry[] = [
            makeEntry({
                unitId: BOSS_UNIT_ID,
                encounterType: TacticusEncounterType.Boss,
                remainingHp: 0,
                maxHp: 30_000_000,
                startedOn: 490,
                completedOn: 500,
            }),
        ];

        const display = resolveBossOverviewDisplay(entries, SEASON_CONFIG_ID);

        expect(display?.isNextBoss).toBe(true);
        expect(display?.boss.unitId).not.toBe(BOSS_UNIT_ID);
    });

    it('shows full health for a boss/primes never fought before', () => {
        const display = resolveBossOverviewDisplay([], SEASON_CONFIG_ID);

        expect(display?.isNextBoss).toBe(false);
        expect(display?.boss.hp.kind).not.toBe('actual');
    });
});

describe('unitDisplayLabel', () => {
    it('names a boss after its family', () => {
        expect(unitDisplayLabel(BOSS_UNIT_ID)).toBe(bossPrefixDisplayNames[getBossPrefix(BOSS_UNIT_ID)]);
    });

    it('names a prime after itself, not after the boss it flanks', () => {
        // Regression: every prime used to be labelled with its boss family name, so both primes
        // read the same as the boss in tooltips and filter buttons.
        const bossLabel = unitDisplayLabel(BOSS_UNIT_ID);
        for (const primeUnitId of [LEFT_PRIME_UNIT_ID, RIGHT_PRIME_UNIT_ID]) {
            const label = unitDisplayLabel(primeUnitId);
            expect(label).not.toBe(bossLabel);
            expect(label).not.toBe(primeUnitId);
        }
        expect(unitDisplayLabel(LEFT_PRIME_UNIT_ID)).not.toBe(unitDisplayLabel(RIGHT_PRIME_UNIT_ID));
    });

    it('never leaks a raw unitId for a known encounter', () => {
        for (const unitId of [BOSS_UNIT_ID, LEFT_PRIME_UNIT_ID, RIGHT_PRIME_UNIT_ID]) {
            expect(unitDisplayLabel(unitId)).not.toContain('GuildBoss');
        }
    });
});

describe('bossIconFor', () => {
    it('resolves a distinct icon per boss variant, even when two variants share a GuildBoss{N} family number', () => {
        // Regression: this season's two Hive Tyrant reskins (Leviathan and Kronos) used to both
        // show Leviathan's icon, because the old prefix-keyed icon map always resolved a shared
        // family prefix to whichever unitId happened to be listed first.
        const leviathan = bossIconFor({
            key: getBossSlotKey('GuildBoss2Boss1TyranHiveTyrantLeviathan', Rarity.Legendary, 2),
            unitId: 'GuildBoss2Boss1TyranHiveTyrantLeviathan',
            rarity: Rarity.Legendary,
            set: 2,
        });
        const kronos = bossIconFor({
            key: getBossSlotKey('GuildBoss2Boss2TyranHiveTyrantKronos', Rarity.Legendary, 4),
            unitId: 'GuildBoss2Boss2TyranHiveTyrantKronos',
            rarity: Rarity.Legendary,
            set: 4,
        });

        expect(leviathan.icon).toBeDefined();
        expect(kronos.icon).toBeDefined();
        expect(leviathan.icon).not.toBe(kronos.icon);
        // Both are still "Hive Tyrant" by family name — only the icon (and rarity/tier label
        // shown alongside it) needs to disambiguate them.
        expect(leviathan.name).toBe('Hive Tyrant');
        expect(kronos.name).toBe('Hive Tyrant');
    });
});

describe('sortTokenEntriesBy', () => {
    const ann: GuildTokenEntryWithDisplay = {
        userId: 'ann',
        displayName: 'Ann',
        tokens: 1,
        nextTokenAtUtc: 300,
        bombAvailableAtUtc: 900, // bomb on cooldown → "used"
    };
    const bob: GuildTokenEntryWithDisplay = {
        userId: 'bob',
        displayName: 'Bob',
        tokens: 3,
        nextTokenAtUtc: undefined, // "Full"
        bombAvailableAtUtc: undefined, // bomb ready now
    };
    const cid: GuildTokenEntryWithDisplay = {
        userId: 'cid',
        displayName: 'Cid',
        tokens: 1,
        nextTokenAtUtc: 100,
        bombAvailableAtUtc: undefined, // bomb ready now
    };
    const dan: GuildTokenEntryWithDisplay = {
        userId: 'dan',
        displayName: 'Dan',
        tokens: undefined, // no readiness data at all
        nextTokenAtUtc: undefined,
        bombAvailableAtUtc: undefined,
    };
    const all = [dan, cid, bob, ann];
    const order = (column: 'tokens' | 'nextToken' | 'bomb' | 'bombReady', direction: 'asc' | 'desc') =>
        sortTokenEntriesBy(all, column, direction).map(entry => entry.displayName);

    it('sorts by token count ascending, no-data rows last, ties broken by name A→Z', () => {
        expect(order('tokens', 'asc')).toEqual(['Ann', 'Cid', 'Bob', 'Dan']);
    });

    it('sorts by token count descending, no-data rows still last, ties still A→Z', () => {
        expect(order('tokens', 'desc')).toEqual(['Bob', 'Ann', 'Cid', 'Dan']);
    });

    it('sorts by next-token time, treating "Full" (undefined) as zero wait', () => {
        expect(order('nextToken', 'asc')).toEqual(['Bob', 'Cid', 'Ann', 'Dan']);
        expect(order('nextToken', 'desc')).toEqual(['Ann', 'Cid', 'Bob', 'Dan']);
    });

    it('sorts by bomb-ready time, treating ready-now (undefined) as zero', () => {
        expect(order('bombReady', 'asc')).toEqual(['Bob', 'Cid', 'Ann', 'Dan']);
        expect(order('bombReady', 'desc')).toEqual(['Ann', 'Bob', 'Cid', 'Dan']);
    });

    it('sorts by bomb readiness — used before ready ascending, ready before used descending', () => {
        expect(order('bomb', 'asc')).toEqual(['Ann', 'Bob', 'Cid', 'Dan']);
        expect(order('bomb', 'desc')).toEqual(['Bob', 'Cid', 'Ann', 'Dan']);
    });

    it('keeps rows with no readiness data at the bottom for every column and direction', () => {
        for (const column of ['tokens', 'nextToken', 'bomb', 'bombReady'] as const) {
            for (const direction of ['asc', 'desc'] as const) {
                expect(order(column, direction).at(-1)).toBe('Dan');
            }
        }
    });

    it('does not mutate its input', () => {
        const input = [...all];
        sortTokenEntriesBy(input, 'tokens', 'desc');
        expect(input).toEqual(all);
    });
});
