import { describe, it, expect, vi } from 'vitest';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { OrbAscensionCalculator } from './unit-ascension.service';

describe('OrbAscensionCalculator', () => {
    it('should return all zeros if start and end are the same', () => {
        const result = OrbAscensionCalculator.calculateOrbs(
            Rarity.Common,
            RarityStars.OneStar,
            Rarity.Common,
            RarityStars.OneStar
        );
        expect(result).toEqual({
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 0,
            [Rarity.Rare]: 0,
            [Rarity.Epic]: 0,
            [Rarity.Legendary]: 0,
            [Rarity.Mythic]: 0,
        });
    });

    it('should return all zeros if start is greater than end', () => {
        const result = OrbAscensionCalculator.calculateOrbs(
            Rarity.Rare,
            RarityStars.FiveStars,
            Rarity.Uncommon,
            RarityStars.TwoStars
        );
        expect(result).toEqual({
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 0,
            [Rarity.Rare]: 0,
            [Rarity.Epic]: 0,
            [Rarity.Legendary]: 0,
            [Rarity.Mythic]: 0,
        });
    });

    it('should calculate orbs for a single step with a cost', () => {
        const result = OrbAscensionCalculator.calculateOrbs(
            Rarity.Common,
            RarityStars.TwoStars,
            Rarity.Uncommon,
            RarityStars.TwoStars
        );
        expect(result).toEqual({
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 10,
            [Rarity.Rare]: 0,
            [Rarity.Epic]: 0,
            [Rarity.Legendary]: 0,
            [Rarity.Mythic]: 0,
        });
    });

    it('should calculate orbs for a single step with no cost', () => {
        const result = OrbAscensionCalculator.calculateOrbs(
            Rarity.Common,
            RarityStars.None,
            Rarity.Common,
            RarityStars.OneStar
        );
        expect(result).toEqual({
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 0,
            [Rarity.Rare]: 0,
            [Rarity.Epic]: 0,
            [Rarity.Legendary]: 0,
            [Rarity.Mythic]: 0,
        });
    });

    it('should calculate orbs for multiple steps across different rarities', () => {
        const result = OrbAscensionCalculator.calculateOrbs(
            Rarity.Uncommon,
            RarityStars.FourStars,
            Rarity.Epic,
            RarityStars.RedOneStar
        );
        expect(result).toEqual({
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 0,
            [Rarity.Rare]: 10,
            [Rarity.Epic]: 10,
            [Rarity.Legendary]: 0,
            [Rarity.Mythic]: 0,
        });
    });

    it('should calculate orbs for a complex multi-step ascension', () => {
        const result = OrbAscensionCalculator.calculateOrbs(
            Rarity.Rare,
            RarityStars.FiveStars,
            Rarity.Legendary,
            RarityStars.RedThreeStars
        );
        expect(result).toEqual({
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 0,
            [Rarity.Rare]: 0,
            [Rarity.Epic]: 10,
            [Rarity.Legendary]: 10,
            [Rarity.Mythic]: 0,
        });
    });

    it('should calculate orbs to the maximum level', () => {
        const result = OrbAscensionCalculator.calculateOrbs(
            Rarity.Common,
            RarityStars.None,
            Rarity.Mythic,
            RarityStars.MythicWings
        );
        expect(result).toEqual({
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 10,
            [Rarity.Rare]: 10,
            [Rarity.Epic]: 10,
            [Rarity.Legendary]: 55,
            [Rarity.Mythic]: 60,
        });
    });

    it('should stop calculation if an unknown step is encountered', () => {
        const getNextStepSpy = vi.spyOn(OrbAscensionCalculator as any, '_getNextStep');

        getNextStepSpy.mockImplementation((...args: any[]) => {
            const rarity = args[0] as Rarity;
            const stars = args[1] as RarityStars;

            // Simulate a break in the path
            if (rarity === Rarity.Rare && stars === RarityStars.RedOneStar) {
                return undefined;
            }

            // For other steps needed by the test, perform the original logic
            const key = `${rarity}:${stars}`;
            // We can access the static private property for the test
            const step = (OrbAscensionCalculator as any).UPGRADE_PATH[key];

            if (!step) {
                return undefined;
            }
            if (step.nextRarity === rarity && step.nextStars === stars) {
                return undefined;
            }
            return step;
        });

        // Let's pick a range that will cross the mocked undefined step
        const result = OrbAscensionCalculator.calculateOrbs(
            Rarity.Uncommon,
            RarityStars.FourStars,
            Rarity.Epic,
            RarityStars.RedTwoStars // Target is beyond the break
        );

        // Path: U:4* -> R:4* (10R) -> R:5* (0R) -> R:R1* (0R).
        // Next step is for R:R1*, which is mocked to be undefined.
        // Total should be 10 Rare orbs.
        expect(result).toEqual({
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 0,
            [Rarity.Rare]: 10,
            [Rarity.Epic]: 0,
            [Rarity.Legendary]: 0,
            [Rarity.Mythic]: 0,
        });

        getNextStepSpy.mockRestore();
    });
});
