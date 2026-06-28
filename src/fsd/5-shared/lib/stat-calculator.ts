import { Rank, RarityStars } from '../model';

const RANK_RATIO = 1.252;
const ADAMANTINE_LINEAR_STEP = 5;

/**
 * Calculate a character stat given its value at Stone I, zero stars.
 *
 * Formula:
 *   - For Stone I through Diamond III: stat = base * RANK_RATIO^rankIndex
 *   - For Adamantine I and II: stat = base * (RANK_RATIO^17 + 5 * ranksPastDiamond3)
 *   - Then multiplied by star multiplier (1 + stars * 0.1)
 */
export function calculateStat(stoneOneBase: number, rank: Rank, stars: RarityStars): number {
    if (rank === Rank.Locked) {
        return 0;
    }

    const rankIndex = rank - Rank.Stone1;
    const diamond3Index = Rank.Diamond3 - Rank.Stone1; // 17

    let rankMultiplier: number;
    if (rankIndex <= diamond3Index) {
        rankMultiplier = Math.pow(RANK_RATIO, rankIndex);
    } else {
        const diamond3Multiplier = Math.pow(RANK_RATIO, diamond3Index);
        rankMultiplier = diamond3Multiplier + ADAMANTINE_LINEAR_STEP * (rankIndex - diamond3Index);
    }

    // None=0 → 1.0, FiveStars=5 → 1.5, RedFiveStars=10 → 2.0, MythicWings=14 → 2.4
    const starMultiplier = 1 + stars * 0.1;

    return Math.round(stoneOneBase * rankMultiplier * starMultiplier);
}
