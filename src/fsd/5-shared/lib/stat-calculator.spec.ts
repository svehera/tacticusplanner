import { describe, expect, it } from 'vitest';

import { Rank, RarityStars } from '../model';

import { calculateStat } from './stat-calculator';

describe('calculateStat', () => {
    it('Locked returns 0 regardless of base and stars', () => {
        expect(calculateStat(1000, Rank.Locked, RarityStars.None)).toBe(0);
        expect(calculateStat(1000, Rank.Locked, RarityStars.FiveStars)).toBe(0);
    });

    it('Stone1 with no stars returns the base value unchanged', () => {
        expect(calculateStat(1000, Rank.Stone1, RarityStars.None)).toBe(1000);
    });

    it('Diamond3 uses the exponential formula', () => {
        expect(calculateStat(1000, Rank.Diamond3, RarityStars.None)).toBe(45_632);
    });

    it('Diamond3 star multiplier scales correctly', () => {
        expect(calculateStat(1000, Rank.Diamond3, RarityStars.FiveStars)).toBe(68_449);
    });

    it('Adamantine1 adds one linear step past Diamond3', () => {
        expect(calculateStat(1000, Rank.Adamantine1, RarityStars.None)).toBe(50_632);
    });

    it('Adamantine2 adds two linear steps past Diamond3', () => {
        expect(calculateStat(1000, Rank.Adamantine2, RarityStars.None)).toBe(55_632);
    });
});
