/* eslint-disable import-x/no-internal-modules */
import { describe, expect, it } from 'vitest';

import { calculateStat } from '@/fsd/5-shared/lib/stat-calculator';
import { DamageType, getPierceRatio, Rank, RarityStars } from '@/fsd/5-shared/model';

import { charactersData2 } from '@/fsd/4-entities/character';

import { buildRadarStats, percentileOf, RadarAxisId } from './unit-stat-radar.utils';

const ALL_AXES: RadarAxisId[] = [
    'health',
    'armor',
    'meleeVsInfArmor',
    'meleeVsZeroArmor',
    'rangedVsInfArmor',
    'rangedVsZeroArmor',
];

describe('percentileOf', () => {
    it('is less than 100 when the value ties for the maximum of the population (strict, not inclusive)', () => {
        // 10, 20, 50, 80 are < 100 -> 4 of 5 -> 80%, not 100% (100 itself doesn't count toward its own percentile)
        expect(percentileOf(100, [10, 20, 50, 80, 100])).toBe(80);
    });

    it('is the fraction of the population strictly below the value', () => {
        // 10, 20 are < 50 -> 2 of 5 -> 40%
        expect(percentileOf(50, [10, 20, 50, 80, 100])).toBe(40);
    });

    it('is 0 when the value is below every population member', () => {
        expect(percentileOf(0, [10, 20, 50, 80, 100])).toBe(0);
    });

    it('is 0 for an empty population rather than dividing by zero', () => {
        expect(percentileOf(50, [])).toBe(0);
    });

    it("is 0 when the value ties for the population's floor, no matter how many others share it", () => {
        // Mirrors the real bug: melee-only characters all score 0 on ranged damage, and over half
        // the roster ties there — none of them should look like they're beating the others.
        expect(percentileOf(0, [0, 0, 0, 5, 10])).toBe(0);
    });
});

describe('buildRadarStats', () => {
    it('returns undefined for an unknown snowprintId', () => {
        expect(buildRadarStats('not-a-real-character')).toBeUndefined();
    });

    it('returns exactly the 6 expected axes, each with a percentile in [0, 100]', () => {
        const [firstCharacter] = charactersData2;
        const stats = buildRadarStats(firstCharacter.id)!;

        expect(stats).toBeDefined();
        expect(stats.map(stat => stat.axis).toSorted()).toEqual(ALL_AXES.toSorted());
        for (const stat of stats) {
            expect(stat.percentile).toBeGreaterThanOrEqual(0);
            expect(stat.percentile).toBeLessThanOrEqual(100);
        }
    });

    it('matches calculateStat + getPierceRatio composed by hand, for a real character (Tigurius)', () => {
        const tigurius = charactersData2.find(c => c.id === 'ultraTigurius')!;
        expect(tigurius).toBeDefined();

        const stats = buildRadarStats('ultraTigurius')!;
        const byAxis = new Map(stats.map(stat => [stat.axis, stat.value]));

        const expectedHealth = calculateStat(tigurius.initialStats.health, Rank.Adamantine2, RarityStars.MythicWings);
        const expectedArmor = calculateStat(tigurius.initialStats.armor, Rank.Adamantine2, RarityStars.MythicWings);
        const expectedDamage = calculateStat(tigurius.initialStats.damage, Rank.Adamantine2, RarityStars.MythicWings);
        const meleePierce = getPierceRatio(tigurius.meleeAttack.pierce as DamageType);
        const rangedPierce = getPierceRatio(tigurius.rangedAttack!.pierce as DamageType);

        expect(byAxis.get('health')).toBe(expectedHealth);
        expect(byAxis.get('armor')).toBe(expectedArmor);
        expect(byAxis.get('meleeVsZeroArmor')).toBe(expectedDamage * tigurius.meleeAttack.hitCount);
        expect(byAxis.get('meleeVsInfArmor')).toBe(expectedDamage * tigurius.meleeAttack.hitCount * meleePierce);
        expect(byAxis.get('rangedVsZeroArmor')).toBe(expectedDamage * tigurius.rangedAttack!.hitCount);
        expect(byAxis.get('rangedVsInfArmor')).toBe(expectedDamage * tigurius.rangedAttack!.hitCount * rangedPierce);
    });

    it('vs-0-armor is never less than vs-infinite-armor for the same character, on every character in the game', () => {
        for (const entry of charactersData2) {
            const stats = buildRadarStats(entry.id)!;
            const byAxis = new Map(stats.map(stat => [stat.axis, stat.value]));
            expect(byAxis.get('meleeVsZeroArmor')).toBeGreaterThanOrEqual(byAxis.get('meleeVsInfArmor')!);
            expect(byAxis.get('rangedVsZeroArmor')).toBeGreaterThanOrEqual(byAxis.get('rangedVsInfArmor')!);
        }
    });

    it('a character with no ranged attack gets 0 on both ranged axes', () => {
        const meleeOnly = charactersData2.find(c => !c.rangedAttack);
        expect(meleeOnly).toBeDefined();

        const stats = buildRadarStats(meleeOnly!.id)!;
        const byAxis = new Map(stats.map(stat => [stat.axis, stat.value]));
        expect(byAxis.get('rangedVsZeroArmor')).toBe(0);
        expect(byAxis.get('rangedVsInfArmor')).toBe(0);
    });

    it('Macer (rangedAttack: null in the raw data, not merely absent) gets 0 on both ranged axes and 0th percentile', () => {
        const macer = charactersData2.find(c => c.id === 'worldJakhal')!;
        expect(macer).toBeDefined();
        expect(macer.rangedAttack).toBeFalsy();

        const stats = buildRadarStats('worldJakhal')!;
        const byAxis = new Map(stats.map(stat => [stat.axis, stat]));
        expect(byAxis.get('rangedVsZeroArmor')?.value).toBe(0);
        expect(byAxis.get('rangedVsInfArmor')?.value).toBe(0);
        expect(byAxis.get('rangedVsInfArmor')?.percentile).toBe(0);
    });

    it("resolves the 'Gauss'/'HeavyRound' data-naming mismatches to a real, positive vs-infinite-armor value instead of a poisoned negative one", () => {
        // Makhotep's ranged attack pierce is "Gauss" (an alias for Molecular, 0.6) in the raw data.
        const makhotep = charactersData2.find(c => c.id === 'necroWarden')!;
        expect(makhotep?.rangedAttack?.pierce).toBe('Gauss');

        const stats = buildRadarStats('necroWarden')!;
        const rangedVsInf = stats.find(stat => stat.axis === 'rangedVsInfArmor')!;
        expect(rangedVsInf.value).toBeGreaterThan(0);

        const damage = calculateStat(makhotep.initialStats.damage, Rank.Adamantine2, RarityStars.MythicWings);
        expect(rangedVsInf.value).toBe(damage * makhotep.rangedAttack!.hitCount * 0.6);
    });

    it('no character in the game has a negative raw value on any axis', () => {
        for (const entry of charactersData2) {
            const stats = buildRadarStats(entry.id)!;
            for (const stat of stats) {
                expect(stat.value, `${entry.id}.${stat.axis}`).toBeGreaterThanOrEqual(0);
            }
        }
    });
});
