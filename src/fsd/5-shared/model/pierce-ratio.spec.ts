import { describe, expect, it } from 'vitest';

import { DamageType } from './enums';
import { getPierceRatio } from './pierce-ratio';

describe('getPierceRatio', () => {
    it('resolves every DamageType enum member to a ratio between 0 and 1', () => {
        for (const damageType of Object.values(DamageType)) {
            const ratio = getPierceRatio(damageType);
            expect(ratio, damageType).toBeGreaterThanOrEqual(0);
            expect(ratio, damageType).toBeLessThanOrEqual(1);
        }
    });

    it('treats "HeavyRound" (no space, as used in the raw character data) as DamageType.HeavyRound', () => {
        expect(getPierceRatio('HeavyRound')).toBe(getPierceRatio(DamageType.HeavyRound));
        expect(getPierceRatio('HeavyRound')).toBe(0.55);
    });

    it('treats "Gauss" (as used in the raw character data) as DamageType.Molecular', () => {
        expect(getPierceRatio('Gauss')).toBe(getPierceRatio(DamageType.Molecular));
        expect(getPierceRatio('Gauss')).toBe(0.6);
    });

    it('returns -1 for a genuinely unrecognized damage type', () => {
        expect(getPierceRatio('NotARealDamageType')).toBe(-1);
    });
});
