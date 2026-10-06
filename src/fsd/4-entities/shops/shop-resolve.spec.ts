import { describe, expect, it } from 'vitest';

import { RarityStars } from '@/fsd/5-shared/model';

import { lockIsActive, resolveEventLockId } from './shop-resolve';

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

describe('crusade season 2 locks', () => {
    const before = Date.UTC(2026, 9, 19, 23, 59, 59);
    const after = Date.UTC(2026, 9, 20);
    const blueStar = RarityStars.OneBlueStar;

    it.each(['lock_crusade_shop_slot4_relic_season1', 'lock_crusade_shop_slot14_season1'])(
        'serves %s only before season 2',
        lockId => {
            expect(lockIsActive(lockId, before)).toBe(true);
            expect(lockIsActive(lockId, after)).toBe(false);
            expect(resolveEventLockId(lockId, {}, before)).toBe(true);
            expect(resolveEventLockId(lockId, {}, after)).toBe(false);
        }
    );

    it.each(['lock_crusade_shop_slot5_relic_season2', 'lock_crusade_shop_slot14_season2'])(
        'serves %s only from season 2',
        lockId => {
            expect(lockIsActive(lockId, before)).toBe(false);
            expect(lockIsActive(lockId, after)).toBe(true);
            expect(resolveEventLockId(lockId, {}, before)).toBe(false);
            expect(resolveEventLockId(lockId, {}, after)).toBe(true);
        }
    );

    it('shows slot 14 ammo from season 2 and never the dust fallback', () => {
        const ammo = 'lock_crusade_shop_slot14_season2_ammo';
        const fallback = 'lock_crusade_shop_slot14_season2_fallback';
        for (const check of [
            (id: string, now: number) => lockIsActive(id, now),
            (id: string, now: number) => resolveEventLockId(id, {}, now),
        ]) {
            expect(check(ammo, before)).toBe(false);
            expect(check(ammo, after)).toBe(true);
            expect(check(fallback, before)).toBe(false);
            expect(check(fallback, after)).toBe(false);
        }
    });

    it('gates the war shop season 2 start lock', () => {
        expect(lockIsActive('lock_daily_deals_crusadeSeason2start', before)).toBe(false);
        expect(lockIsActive('lock_daily_deals_crusadeSeason2start', after)).toBe(true);
    });

    it('swaps slot hero locks by season and stars', () => {
        const context = { starsByUnitId: { eldarLhykhis: blueStar, custoTrajann: 0 } };
        const mythic = 'lock_crusade_shop_slot1_eldarLhykhis_shards_mythic';
        const regular = 'lock_crusade_shop_slot1_eldarLhykhis_shards_regular';
        expect(resolveEventLockId(mythic, context, before)).toBe(true);
        expect(resolveEventLockId(regular, context, before)).toBe(false);
        expect(resolveEventLockId(mythic, context, after)).toBe(false);
        expect(resolveEventLockId('lock_crusade_shop_slot1_custoTrajann_shards_regular', context, after)).toBe(true);
        expect(resolveEventLockId('lock_crusade_shop_slot1_custoTrajann_shards_mythic', context, after)).toBe(false);
        // Lhykhis moves to slot 2 in season 2.
        expect(resolveEventLockId('lock_crusade_shop_slot2_eldarLhykhis_shards_mythic', context, after)).toBe(true);
    });

    it('hides slot hero locks in the strict resolver', () => {
        expect(lockIsActive('lock_crusade_shop_slot1_eldarLhykhis_shards_mythic', before)).toBe(false);
    });
});

describe('war shop epic rotation locks', () => {
    it.each(['lock_daily_deals_character_rotation_epic_current', 'lock_daily_deals_character_rotation_epic_next'])(
        'serves %s from BP season 42 start (2026-10-11)',
        lockId => {
            const before = Date.UTC(2026, 9, 10, 23, 59, 59);
            const after = Date.UTC(2026, 9, 11);
            expect(lockIsActive(lockId, before)).toBe(false);
            expect(lockIsActive(lockId, after)).toBe(true);
            expect(resolveEventLockId(lockId, {}, before)).toBe(false);
            expect(resolveEventLockId(lockId, {}, after)).toBe(true);
        }
    );
});
