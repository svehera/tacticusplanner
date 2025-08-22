import { describe, it, expect } from 'vitest';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { TacticusIntegrationService } from './tacticus-integration.service';

describe('TacticusIntegrationService', () => {
    describe('convertProgressionIndex', () => {
        it('should convert index to correct Rarity/RarityStars', () => {
            const cases: Array<[number, Rarity, RarityStars]> = [
                [0, Rarity.Common, RarityStars.None],
                [1, Rarity.Common, RarityStars.OneStar],
                [2, Rarity.Common, RarityStars.TwoStars],
                [3, Rarity.Uncommon, RarityStars.TwoStars],
                [4, Rarity.Uncommon, RarityStars.ThreeStars],
                [5, Rarity.Uncommon, RarityStars.FourStars],
                [6, Rarity.Rare, RarityStars.FourStars],
                [7, Rarity.Rare, RarityStars.FiveStars],
                [8, Rarity.Rare, RarityStars.RedOneStar],
                [9, Rarity.Epic, RarityStars.RedOneStar],
                [10, Rarity.Epic, RarityStars.RedTwoStars],
                [11, Rarity.Epic, RarityStars.RedThreeStars],
                [12, Rarity.Legendary, RarityStars.RedThreeStars],
                [13, Rarity.Legendary, RarityStars.RedFourStars],
                [14, Rarity.Legendary, RarityStars.RedFiveStars],
                [15, Rarity.Legendary, RarityStars.BlueStar],
            ];
            for (const [idx, rarity, stars] of cases) {
                expect(TacticusIntegrationService.convertProgressionIndex(idx)).toEqual([rarity, stars]);
            }
        });

        it('should clamp higher indices to Legendary Blue Wings', () => {
            // Indices 16-19 are being incrementally rolled out for Mythic, so we
            // can expect them to show up in Tacticus API responses in future.
            // These test expectations will need to be modified as we add support for them.
            const highVals = [16, 17, 18, 19, 20, 999];
            for (let i = 0; i < highVals.length; i++) {
                const result = TacticusIntegrationService.convertProgressionIndex(highVals[i]);

                expect(result).toEqual([Rarity.Legendary, RarityStars.BlueStar]);
            }
        });

        it('should clamp negative indices to Common w no stars', () => {
            const negVals = [-999, -1];
            for (let i = 0; i < negVals.length; i++) {
                const result = TacticusIntegrationService.convertProgressionIndex(negVals[i]);

                expect(result).toEqual([Rarity.Common, RarityStars.None]);
            }
        });
    });
});
