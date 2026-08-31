import { describe, expect, it } from 'vitest';

/* eslint-disable import-x/no-internal-modules -- matches the sibling specs' import style */
import {
    TacticusDamageType,
    TacticusEncounterType,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity } from '@/fsd/5-shared/model';

import { getAvailableBosses, orderBossesByEncounter } from './guild-performance.utils';

function makeEntry(unitId: string, rarity: Rarity, set: number, isBoss = true): TacticusGuildRaidEntry {
    return {
        userId: 'u',
        unitId,
        tier: 0,
        set,
        encounterIndex: isBoss ? 0 : 1,
        remainingHp: 100,
        maxHp: 1000,
        encounterType: isBoss ? TacticusEncounterType.Boss : TacticusEncounterType.SideBoss,
        type: 't',
        rarity,
        damageDealt: 1,
        damageType: TacticusDamageType.Battle,
        startedOn: 0,
        completedOn: 0,
        heroDetails: [],
        globalConfigHash: 'h',
    };
}

describe('boss filter ordering', () => {
    it('orders by encounter — ascending rarity then set, not by GuildBoss number', () => {
        // Season 106's actual run: Epic 2-3, Legendary 1-5, Mythic 1-2. Deliberately supplied in a
        // shuffled order, and with GuildBoss numbers that disagree with the encounter order.
        const entries = [
            makeEntry('GuildBoss5Boss1DeathMortarion', Rarity.Mythic, 1),
            makeEntry('GuildBoss2Boss1TyranHiveTyrant', Rarity.Epic, 1),
            makeEntry('GuildBoss9Boss1ThousMagnus', Rarity.Legendary, 4),
            makeEntry('GuildBoss12Boss1Lion', Rarity.Mythic, 0),
            makeEntry('GuildBoss1Boss1TyranTervigon', Rarity.Epic, 2),
            makeEntry('GuildBoss7Boss1AstraRogaldorn', Rarity.Legendary, 0),
        ];

        expect(getAvailableBosses(entries).map(option => option.unitId)).toEqual([
            'GuildBoss2Boss1TyranHiveTyrant', // Epic 2  — met first
            'GuildBoss1Boss1TyranTervigon', // Epic 3
            'GuildBoss7Boss1AstraRogaldorn', // Legendary 1
            'GuildBoss9Boss1ThousMagnus', // Legendary 5
            'GuildBoss12Boss1Lion', // Mythic 1
            'GuildBoss5Boss1DeathMortarion', // Mythic 2 — met last
        ]);
    });

    it('restricts to the selected rarities when given a set', () => {
        const entries = [
            makeEntry('GuildBoss1Boss1TyranTervigon', Rarity.Epic, 0),
            makeEntry('GuildBoss7Boss1AstraRogaldorn', Rarity.Legendary, 0),
            makeEntry('GuildBoss5Boss1DeathMortarion', Rarity.Mythic, 0),
        ];
        const options = getAvailableBosses(entries, new Set([Rarity.Legendary, Rarity.Mythic]));
        expect(options.map(option => option.unitId)).toEqual([
            'GuildBoss7Boss1AstraRogaldorn',
            'GuildBoss5Boss1DeathMortarion',
        ]);
    });

    it('keeps a family listed when only its primes were hit, without changing the order', () => {
        // A prime shares its boss's rarity and set, so including primes never reorders anything.
        // With no boss entry ever seen for its slot, the prime's own unitId is the representative.
        const entries = [
            makeEntry('GuildBoss9MiniBoss1ThousSorcerer', Rarity.Legendary, 4, false),
            makeEntry('GuildBoss7Boss1AstraRogaldorn', Rarity.Legendary, 0),
        ];
        expect(getAvailableBosses(entries).map(option => option.unitId)).toEqual([
            'GuildBoss7Boss1AstraRogaldorn',
            'GuildBoss9MiniBoss1ThousSorcerer',
        ]);
    });

    it('collapses the same boss revisited at the same rarity and set across multiple loop passes', () => {
        // A loop revisit reuses the exact same (rarity, set) slot — a new loop lap doesn't advance
        // `set`, so multiple raid-log entries for the same slot must still collapse to one option.
        const occurrences = [
            { unitId: 'GuildBoss9Boss1ThousMagnus', rarity: Rarity.Mythic, set: 0, encounterIndex: 0 },
            { unitId: 'GuildBoss9Boss1ThousMagnus', rarity: Rarity.Mythic, set: 0, encounterIndex: 0 },
            { unitId: 'GuildBoss7Boss1AstraRogaldorn', rarity: Rarity.Mythic, set: 1, encounterIndex: 0 },
        ];
        expect(orderBossesByEncounter(occurrences).map(option => option.unitId)).toEqual([
            'GuildBoss9Boss1ThousMagnus',
            'GuildBoss7Boss1AstraRogaldorn',
        ]);
    });

    it('keeps the same character at two different rarities as two separate slots (e.g. a Legendary and a Mythic Riptide this season)', () => {
        const occurrences = [
            { unitId: 'GuildBoss11Boss1TauRiptide', rarity: Rarity.Mythic, set: 4, encounterIndex: 0 },
            { unitId: 'GuildBoss11Boss1TauRiptide', rarity: Rarity.Legendary, set: 3, encounterIndex: 0 },
        ];
        const options = orderBossesByEncounter(occurrences);
        expect(options).toHaveLength(2);
        expect(options[0]).toMatchObject({ unitId: 'GuildBoss11Boss1TauRiptide', rarity: Rarity.Legendary });
        expect(options[1]).toMatchObject({ unitId: 'GuildBoss11Boss1TauRiptide', rarity: Rarity.Mythic });
        expect(options[0].key).not.toBe(options[1].key);
    });

    it("keeps two boss variants that share a GuildBoss{N} family number as two separate slots (e.g. this season's two Hive Tyrant reskins)", () => {
        const occurrences = [
            { unitId: 'GuildBoss2Boss1TyranHiveTyrantLeviathan', rarity: Rarity.Legendary, set: 2, encounterIndex: 0 },
            { unitId: 'GuildBoss2Boss2TyranHiveTyrantKronos', rarity: Rarity.Legendary, set: 4, encounterIndex: 0 },
        ];
        const options = orderBossesByEncounter(occurrences);
        expect(options.map(option => option.unitId)).toEqual([
            'GuildBoss2Boss1TyranHiveTyrantLeviathan',
            'GuildBoss2Boss2TyranHiveTyrantKronos',
        ]);
        expect(options[0].key).not.toBe(options[1].key);
    });

    it("prefers the boss's own occurrence over a prime's as the slot's representative unitId", () => {
        // A prime encountered before its boss in the input must not "win" the icon/name lookup.
        const occurrences = [
            { unitId: 'GuildBoss2MiniBoss1TyranWarrior', rarity: Rarity.Legendary, set: 2, encounterIndex: 1 },
            { unitId: 'GuildBoss2Boss1TyranHiveTyrantLeviathan', rarity: Rarity.Legendary, set: 2, encounterIndex: 0 },
        ];
        expect(orderBossesByEncounter(occurrences)).toEqual([
            {
                key: 'GuildBoss2:4:2',
                unitId: 'GuildBoss2Boss1TyranHiveTyrantLeviathan',
                rarity: Rarity.Legendary,
                set: 2,
            },
        ]);
    });
});
