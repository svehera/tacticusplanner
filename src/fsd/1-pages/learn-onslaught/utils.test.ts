import { describe, expect, it } from 'vitest';

import type { OnslaughtKillzone, OnslaughtWave } from './data';
import {
    formatEnemyTypesAndLevels,
    indexToGreekLetter,
    indexToRomanNumeral,
    totalKillzoneBadgeRewards,
    totalKillzoneXPReward,
} from './utils';

describe('indexToRomanNumeral', () => {
    it.each([
        [0, 'I'],
        [1, 'II'],
        [2, 'III'],
        [3, 'IV'],
        [4, 'V'],
        [8, 'IX'],
        [9, 'X'],
        [13, 'XIV'],
        [29, 'XXX'],
        [30, 'XXXI'],
        [38, 'XXXIX'],
        [39, 'XL'],
        [49, 'L'],
        [99, 'C'],
        [199, 'CC'],
    ])('converts index %i to %s', (index, expected) => {
        expect(indexToRomanNumeral(index)).toBe(expected);
    });

    it('handles large values beyond 200', () => {
        expect(indexToRomanNumeral(499)).toBe('D');
        expect(indexToRomanNumeral(999)).toBe('M');
    });
});

describe('indexToGreekLetter', () => {
    it.each([
        [0, 'Alpha'],
        [1, 'Beta'],
        [2, 'Gamma'],
        [3, 'Delta'],
        [4, 'Epsilon'],
        [5, 'Zeta'],
        [6, 'Eta'],
        [7, 'Theta'],
        [8, 'Iota'],
        [9, 'Kappa'],
    ])('converts index %i to %s', (index, expected) => {
        expect(indexToGreekLetter(index)).toBe(expected);
    });

    it('returns a fallback string for out-of-range indices', () => {
        expect(indexToGreekLetter(-1)).toBe('Unknown(-1)');
        expect(indexToGreekLetter(10)).toBe('Unknown(10)');
    });
});

describe('formatEnemyTypesAndLevels', () => {
    it('formats a single enemy type', () => {
        const enemies = { 'tyranNpc3Termagant:1': 6 } satisfies OnslaughtWave['enemies'];
        expect(formatEnemyTypesAndLevels(enemies)).toEqual(['6x Termagant (Level 1)']);
    });

    it('formats multiple enemy types', () => {
        const enemies = {
            'tyranNpc3Termagant:1': 6,
            'tyranNpc2RipperSwarm:1': 2,
        } satisfies OnslaughtWave['enemies'];
        const result = formatEnemyTypesAndLevels(enemies);
        expect(result).toHaveLength(2);
        expect(result).toContain('6x Termagant (Level 1)');
        expect(result).toContain('2x Ripper Swarm (Level 1)');
    });

    it('handles higher level enemies', () => {
        const enemies = { 'tyranNpc4Warrior:50': 3 } satisfies OnslaughtWave['enemies'];
        expect(formatEnemyTypesAndLevels(enemies)).toEqual(['3x Tyranid Warrior (Level 50)']);
    });

    it('returns an empty array for an empty enemies object', () => {
        expect(formatEnemyTypesAndLevels({})).toEqual([]);
    });
});

describe('totalKillzoneXPReward', () => {
    it('sums XP across all waves in a killzone', () => {
        const killzone = {
            wave_1: { enemies: {}, wavesXp: 100, badge: 'Common_Chaos:1' },
            wave_3: { enemies: {}, wavesXp: 200, badge: 'Common_Chaos:1' },
            wave_5: { enemies: {}, wavesXp: 300, badge: 'Rare_Imperial:1' },
        } satisfies OnslaughtKillzone;
        expect(totalKillzoneXPReward(killzone)).toBe(600);
    });

    it('returns 0 for an empty killzone', () => {
        const killzone = {} satisfies OnslaughtKillzone;
        expect(totalKillzoneXPReward(killzone)).toBe(0);
    });

    it('handles a single wave', () => {
        const killzone = {
            wave_1: { enemies: {}, wavesXp: 42, badge: 'Common_Xenos:1' },
        } satisfies OnslaughtKillzone;
        expect(totalKillzoneXPReward(killzone)).toBe(42);
    });
});

describe('totalKillzoneBadgeRewards', () => {
    it('aggregates badge rewards by type across all waves', () => {
        const killzone = {
            wave_1: { enemies: {}, wavesXp: 0, badge: 'Common_Chaos:1' },
            wave_3: { enemies: {}, wavesXp: 0, badge: 'Common_Chaos:2' },
            wave_5: { enemies: {}, wavesXp: 0, badge: 'Rare_Imperial:1' },
        } satisfies OnslaughtKillzone;
        expect(totalKillzoneBadgeRewards(killzone)).toEqual({
            Common_Chaos: 3,
            Rare_Imperial: 1,
        });
    });

    it('returns an empty object for an empty killzone', () => {
        const killzone = {} satisfies OnslaughtKillzone;
        expect(totalKillzoneBadgeRewards(killzone)).toEqual({});
    });

    it('handles a single wave with a single badge', () => {
        const killzone = {
            wave_1: { enemies: {}, wavesXp: 0, badge: 'Epic_Xenos:5' },
        } satisfies OnslaughtKillzone;
        expect(totalKillzoneBadgeRewards(killzone)).toEqual({
            Epic_Xenos: 5,
        });
    });
});
