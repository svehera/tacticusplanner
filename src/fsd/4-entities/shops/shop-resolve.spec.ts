import { describe, expect, it } from 'vitest';

import { resolveEventLockId } from './shop-resolve';

describe('resolveEventLockId - elder shop featured-legendary rotation', () => {
    const beforeRotation = Date.UTC(2026, 8, 5);
    const afterRotation = Date.UTC(2026, 8, 6);

    it('serves the "currently featured" locks before the rotation boundary', () => {
        expect(resolveEventLockId('lock_elder_shop_leg_featured_currently', {}, beforeRotation)).toBe(true);
        expect(resolveEventLockId('lock_elder_shop_leg_featured_currently_mythic', {}, beforeRotation)).toBe(true);
        expect(resolveEventLockId('lock_elder_shop_leg_featured_next', {}, beforeRotation)).toBe(false);
        expect(resolveEventLockId('lock_elder_shop_leg_featured_next_mythic', {}, beforeRotation)).toBe(false);
    });

    it('serves the "next featured" locks on/after the rotation boundary', () => {
        expect(resolveEventLockId('lock_elder_shop_leg_featured_currently', {}, afterRotation)).toBe(false);
        expect(resolveEventLockId('lock_elder_shop_leg_featured_currently_mythic', {}, afterRotation)).toBe(false);
        expect(resolveEventLockId('lock_elder_shop_leg_featured_next', {}, afterRotation)).toBe(true);
        expect(resolveEventLockId('lock_elder_shop_leg_featured_next_mythic', {}, afterRotation)).toBe(true);
    });
});
