import { describe, expect, it } from 'vitest';

/* eslint-disable import-x/no-internal-modules -- matches the sibling spec's import style */
import {
    TacticusDamageType,
    TacticusEncounterType,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity } from '@/fsd/5-shared/model';

import {
    buildPlayerSummaryText,
    slotLabel,
    damageVsAvgPct,
    DEFAULT_HIT_FILTERS,
    filterHitEntries,
    hasHitFilters,
} from './damage-tab.utils';

/**
 * One hit, described by the three axes the grid filters on. `isBoss` maps to `encounterType` so the
 * tests read in domain terms rather than in enum values.
 */
function hitEntry({
    damageType = TacticusDamageType.Battle,
    remainingHp = 500,
    isBoss = true,
    damageDealt = 100,
}: {
    damageType?: TacticusDamageType;
    remainingHp?: number;
    isBoss?: boolean;
    damageDealt?: number;
} = {}): TacticusGuildRaidEntry {
    return makeEntry({
        userId: `u-${damageType}-${remainingHp}-${isBoss}-${damageDealt}`,
        damageType,
        remainingHp,
        damageDealt,
        encounterType: isBoss ? TacticusEncounterType.Boss : TacticusEncounterType.SideBoss,
        encounterIndex: isBoss ? 0 : 1,
    });
}

/** Discord rejects a message over 2000 characters, which is what the chunking exists to respect. */
const DISCORD_HARD_LIMIT = 2000;

function makeEntry(overrides: Partial<TacticusGuildRaidEntry> & Pick<TacticusGuildRaidEntry, 'userId'>) {
    return {
        unitId: 'GuildBoss9Boss1ThousMagnus',
        tier: 0,
        set: 0,
        encounterIndex: 0,
        remainingHp: 500,
        maxHp: 1000,
        encounterType: TacticusEncounterType.Boss,
        type: 'test',
        rarity: Rarity.Mythic,
        damageDealt: 1_234_567,
        damageType: TacticusDamageType.Battle,
        startedOn: 0,
        completedOn: 0,
        heroDetails: [],
        globalConfigHash: 'hash',
        ...overrides,
    } satisfies TacticusGuildRaidEntry;
}

describe('buildPlayerSummaryText', () => {
    it('abbreviates the max target as a rarity code plus 1-based set index', () => {
        const { text } = buildPlayerSummaryText([makeEntry({ userId: 'a', set: 0 })], new Map([['a', 'Alice']]), ['a']);
        expect(text).toContain('Magnus (M1)');
        expect(text).not.toContain('Mythic');
    });

    it('marks primes and carries the set through', () => {
        const entry = makeEntry({
            userId: 'a',
            set: 2,
            encounterIndex: 1,
            encounterType: TacticusEncounterType.SideBoss,
            rarity: Rarity.Legendary,
        });
        const { text } = buildPlayerSummaryText([entry], new Map([['a', 'Alice']]), ['a']);
        expect(text).toContain('Magnus prime (L3)');
    });

    it('wraps the table in a fence and aligns every column to a single width', () => {
        const names = new Map([
            ['a', 'Al'],
            ['b', 'Bartholomew'],
        ]);
        const { text } = buildPlayerSummaryText(
            [makeEntry({ userId: 'a' }), makeEntry({ userId: 'b', damageDealt: 42 })],
            names,
            ['a', 'b']
        );

        const lines = text.split('\n');
        expect(lines[0]).toBe('```');
        expect(lines.at(-1)).toBe('```');
        expect(lines[1].startsWith('Player')).toBe(true);

        // header, rule, then the two data rows
        const body = lines.slice(1, -1);
        expect(body).toHaveLength(4);
        expect(body[1]).toMatch(/^-+$/);

        // Player is padded to its widest cell — 'Bartholomew' is 11, under NAME_CAP (12) — and
        // every line must then carry the 2-space gutter at the same offset. This is what the old
        // tab-and-pad output got wrong.
        const dataLines = [body[0], body[2], body[3]];
        expect(dataLines.map(row => row.slice(0, 11))).toEqual(['Player     ', 'Al         ', 'Bartholomew']);
        for (const row of dataLines) {
            expect(row.slice(11, 13)).toBe('  ');
        }

        // And the last column starts at one offset across the whole block.
        const targetStarts = dataLines.map(row => row.lastIndexOf('  ') + 2);
        expect(new Set(targetStarts).size).toBe(1);
    });

    it('splits into multiple fenced blocks so each fits one Discord message', () => {
        const ids = Array.from({ length: 60 }, (_, index) => `user-${index}`);
        const names = new Map(ids.map((id, index) => [id, `Player${index}`]));
        const { text } = buildPlayerSummaryText(
            ids.map(userId => makeEntry({ userId })),
            names,
            ids
        );

        const blocks = text.split('\n\n');
        expect(blocks.length).toBeGreaterThan(1);
        for (const block of blocks) {
            expect(block.length).toBeLessThan(DISCORD_HARD_LIMIT);
            // Every block repeats the header so it reads standalone.
            expect(block.split('\n')[1]).toContain('Player');
        }
        // No row is dropped by the chunking.
        expect(text.match(/Player\d+/g)).toHaveLength(60);
    });

    it('keeps every block of a realistic 31-player guild inside one Discord message', () => {
        // Mirrors a real roster: mostly unshared names, so obfuscated 15-char ids, and a spread of
        // boss targets. This is the case the header/name trimming exists to make fit — before it,
        // the same roster came to ~2,290 characters and had to be split across two messages.
        const targets = [
            'GuildBoss3Boss1NecroSilentKing',
            'GuildBoss5Boss1DeathMortarion',
            'GuildBoss8Boss1EldarAvatar',
        ];
        const ids = Array.from({ length: 31 }, (_, index) => `${String(index).padStart(4, '0')}abcd-efgh-ijkl-mnop`);
        const names = new Map<string, string>(); // nobody has shared a name — the common case
        const entries = ids.map((userId, index) =>
            makeEntry({
                userId,
                unitId: targets[index % targets.length],
                set: index % 5,
                damageDealt: 14_400_000 - index * 100_000,
            })
        );

        const { text } = buildPlayerSummaryText(entries, names, ids);

        // Whether a roster fits a single message depends on how long its boss names run, so the
        // guarantee is per block, not "exactly one block". Every block must be sendable and must
        // repeat the header + rule so it reads standalone.
        const blocks = text.split('\n\n');
        for (const block of blocks) {
            expect(block.length).toBeLessThan(DISCORD_HARD_LIMIT);
            const lines = block.split('\n');
            expect(lines[1]).toContain('Player');
            expect(lines[2]).toMatch(/^-+$/);
        }
        // Nothing is dropped by the chunking.
        expect(text.match(/\(M\d\)/g)).toHaveLength(31);
    });

    it('returns empty content when there is nothing to report', () => {
        expect(buildPlayerSummaryText([], new Map(), [])).toEqual({ text: '', html: '' });
    });
});

describe('filterHitEntries', () => {
    const battleBossKill = hitEntry({ damageType: TacticusDamageType.Battle, remainingHp: 0, isBoss: true });
    const battleBossAlive = hitEntry({ damageType: TacticusDamageType.Battle, remainingHp: 500, isBoss: true });
    const bombPrime = hitEntry({ damageType: TacticusDamageType.Bomb, remainingHp: 200, isBoss: false });
    const battlePrimeKill = hitEntry({ damageType: TacticusDamageType.Battle, remainingHp: 0, isBoss: false });
    const all = [battleBossKill, battleBossAlive, bombPrime, battlePrimeKill];

    it('passes everything through by default', () => {
        expect(filterHitEntries(all, DEFAULT_HIT_FILTERS)).toHaveLength(4);
        expect(hasHitFilters(DEFAULT_HIT_FILTERS)).toBe(false);
    });

    it('separates battle hits from bombs', () => {
        expect(filterHitEntries(all, { ...DEFAULT_HIT_FILTERS, damage: 'battle' })).not.toContain(bombPrime);
        expect(filterHitEntries(all, { ...DEFAULT_HIT_FILTERS, damage: 'bomb' })).toEqual([bombPrime]);
    });

    it('separates the boss from each prime slot', () => {
        expect(filterHitEntries(all, { ...DEFAULT_HIT_FILTERS, slot: 'boss' })).toEqual([
            battleBossKill,
            battleBossAlive,
        ]);
        expect(filterHitEntries(all, { ...DEFAULT_HIT_FILTERS, slot: 'left' })).toEqual([bombPrime, battlePrimeKill]);
    });

    it('combines axes', () => {
        // A bomb is never a battle hit, so this pair can only ever be empty.
        expect(filterHitEntries(all, { damage: 'bomb', slot: 'boss' })).toEqual([]);
        expect(filterHitEntries(all, { damage: 'battle', slot: 'left' })).toEqual([battlePrimeKill]);
    });

    it('reports when any axis is narrowed', () => {
        expect(hasHitFilters({ ...DEFAULT_HIT_FILTERS, slot: 'left' })).toBe(true);
    });
});

describe('damageVsAvgPct', () => {
    it('refuses a verdict where none is meaningful', () => {
        // A bomb spends no token; a killing blow is capped by the HP left, not by the player.
        expect(damageVsAvgPct(hitEntry({ damageType: TacticusDamageType.Bomb, remainingHp: 5 }), 100)).toBeUndefined();
        expect(damageVsAvgPct(hitEntry({ remainingHp: 0 }), 100)).toBeUndefined();
        expect(damageVsAvgPct(hitEntry({ remainingHp: 5 }), 0)).toBeUndefined();
    });

    it('reads as a signed percentage against the average', () => {
        expect(damageVsAvgPct(hitEntry({ remainingHp: 5, damageDealt: 120 }), 100)).toBeCloseTo(20, 5);
        expect(damageVsAvgPct(hitEntry({ remainingHp: 5, damageDealt: 80 }), 100)).toBeCloseTo(-20, 5);
    });
});

describe('slotLabel', () => {
    it('names the boss and each prime by its encounter index', () => {
        expect(slotLabel(0)).toBe('Boss');
        expect(slotLabel(1)).toBe('Left prime');
        expect(slotLabel(2)).toBe('Right prime');
    });

    it('labels an unexpected index positionally rather than guessing a side', () => {
        expect(slotLabel(3)).toBe('Prime 3');
    });
});
