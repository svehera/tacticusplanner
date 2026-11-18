import { describe, expect, it } from 'vitest';

import { Rarity } from '@/fsd/5-shared/model';

import { computeXpBooksTotals } from './models';

const books = { 0: 10, 1: 0, 2: 0, 3: 0, 4: 5, 5: 2 } as Record<Rarity, number>;

describe('computeXpBooksTotals', () => {
    it('sums all enabled rarities', () => {
        const t = computeXpBooksTotals(books, [true, true, true, true, true, true]);
        expect(t.xp).toBe(10 * 20 + 5 * 12_500 + 2 * 62_500);
        expect(t.mythicBooks).toBeCloseTo(t.xp / 62_500);
    });
    it('skips deselected rarities', () => {
        const t = computeXpBooksTotals(books, [false, true, true, true, false, true]);
        expect(t.xp).toBe(125_000);
        expect(t.mythicBooks).toBe(2);
    });
});
