import { describe, expect, it } from 'vitest';

/* eslint-disable import-x/no-internal-modules -- matches the sibling specs' import style */
import {
    TacticusDamageType,
    TacticusEncounterType,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity } from '@/fsd/5-shared/model';

import { getAvailableBossPrefixes, orderBossPrefixesByEncounter } from './guild-performance.utils';

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

        expect(getAvailableBossPrefixes(entries)).toEqual([
            'GuildBoss2', // Epic 2  — met first
            'GuildBoss1', // Epic 3
            'GuildBoss7', // Legendary 1
            'GuildBoss9', // Legendary 5
            'GuildBoss12', // Mythic 1
            'GuildBoss5', // Mythic 2 — met last
        ]);
    });

    it('restricts to the selected rarities when given a set', () => {
        const entries = [
            makeEntry('GuildBoss1Boss1TyranTervigon', Rarity.Epic, 0),
            makeEntry('GuildBoss7Boss1AstraRogaldorn', Rarity.Legendary, 0),
            makeEntry('GuildBoss5Boss1DeathMortarion', Rarity.Mythic, 0),
        ];
        const prefixes = getAvailableBossPrefixes(entries, new Set([Rarity.Legendary, Rarity.Mythic]));
        expect(prefixes).toEqual(['GuildBoss7', 'GuildBoss5']);
    });

    it('keeps a family listed when only its primes were hit, without changing the order', () => {
        // A prime shares its boss's rarity and set, so including primes never reorders anything.
        const entries = [
            makeEntry('GuildBoss9MiniBoss1ThousSorcerer', Rarity.Legendary, 4, false),
            makeEntry('GuildBoss7Boss1AstraRogaldorn', Rarity.Legendary, 0),
        ];
        expect(getAvailableBossPrefixes(entries)).toEqual(['GuildBoss7', 'GuildBoss9']);
    });

    it('takes the earliest occurrence when a family appears in more than one tier', () => {
        // Legendary/Mythic loops revisit the same boss; the filter should place it at first meeting.
        const occurrences = [
            { prefix: 'GuildBoss9', rarity: Rarity.Mythic, set: 0 },
            { prefix: 'GuildBoss9', rarity: Rarity.Legendary, set: 4 },
            { prefix: 'GuildBoss7', rarity: Rarity.Mythic, set: 1 },
        ];
        expect(orderBossPrefixesByEncounter(occurrences)).toEqual(['GuildBoss9', 'GuildBoss7']);
    });
});
