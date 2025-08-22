import { describe, it, expect } from 'vitest';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { TacticusIntegrationService } from './tacticus-integration.service';

describe('TacticusIntegrationService', () => {
    describe('convertProgressionIndex', () => {
        it('should convert index to correct Rarity/RarityStars', () => {
            expect(TacticusIntegrationService.convertProgressionIndex(0)).toEqual([Rarity.Common, RarityStars.None]);

            expect(TacticusIntegrationService.convertProgressionIndex(1)).toEqual([Rarity.Common, RarityStars.OneStar]);

            expect(TacticusIntegrationService.convertProgressionIndex(2)).toEqual([
                Rarity.Common,
                RarityStars.TwoStars,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(3)).toEqual([
                Rarity.Uncommon,
                RarityStars.TwoStars,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(4)).toEqual([
                Rarity.Uncommon,
                RarityStars.ThreeStars,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(5)).toEqual([
                Rarity.Uncommon,
                RarityStars.FourStars,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(6)).toEqual([Rarity.Rare, RarityStars.FourStars]);

            expect(TacticusIntegrationService.convertProgressionIndex(7)).toEqual([Rarity.Rare, RarityStars.FiveStars]);

            expect(TacticusIntegrationService.convertProgressionIndex(8)).toEqual([
                Rarity.Rare,
                RarityStars.RedOneStar,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(9)).toEqual([
                Rarity.Epic,
                RarityStars.RedOneStar,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(10)).toEqual([
                Rarity.Epic,
                RarityStars.RedTwoStars,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(11)).toEqual([
                Rarity.Epic,
                RarityStars.RedThreeStars,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(12)).toEqual([
                Rarity.Legendary,
                RarityStars.RedThreeStars,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(13)).toEqual([
                Rarity.Legendary,
                RarityStars.RedFourStars,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(14)).toEqual([
                Rarity.Legendary,
                RarityStars.RedFiveStars,
            ]);

            expect(TacticusIntegrationService.convertProgressionIndex(15)).toEqual([
                Rarity.Legendary,
                RarityStars.BlueStar,
            ]);
        });

        it('should clamp higher indices to Legendary Blue Wings', () => {
            // Indices 16-19 are being incrementally rolled out for Mythic, so we
            // can expect them to show up in Tacticus API responses in future.
            // These test expectations will need to be modified as we add support for them.
            const highVals = [16, 17, 18, 19, 20, 999];
            for (let i = 0; i < highVals.length; i++) {
                const result = TacticusIntegrationService.convertProgressionIndex(16);

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
