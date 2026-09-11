import { Rarity, RarityStars } from '@/fsd/5-shared/model';

const MAX_PROGRESSION_INDEX = 19;

/**
 * Forward map of `(rarity, stars)` to the game's `progressionIndex` (0..19).
 *
 * Inverse of `TacticusIntegrationService.convertProgressionIndex`, which derives
 * `rarity = highest threshold <= progressionIndex` and `stars = progressionIndex - rarity`.
 * Since the `Rarity` and `RarityStars` enums are both zero-based and contiguous, that collapses
 * to `progressionIndex = rarity + stars`.
 */
export const progressionIndexFromRarityStars = (rarity: Rarity, stars: RarityStars): number => {
    return Math.min(Math.max(rarity + stars, 0), MAX_PROGRESSION_INDEX);
};
