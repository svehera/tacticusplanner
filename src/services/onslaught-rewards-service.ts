import { Rarity, Alliance } from '@/fsd/5-shared/model';

import onslaughtRewardsData from './onslaught-rewards-data.json';

/**
 * Interfaces to match the Onslaught reward structure
 */
export interface RewardTier {
    tier: number;
    maxProgressionIndex: number;
    rewards: readonly string[];
}

export interface OnslaughtData {
    honorYourHeroesRewards: readonly RewardTier[];
}

/**
 * Maps progression indices to the maximum allowed rarity.
 * This prevents overestimating rewards for lower-rarity heroes.
 */
const RARITY_PROGRESSION_LIMITS: Partial<Record<Rarity, number>> = {
    [Rarity.Common]: 3,
    [Rarity.Uncommon]: 7,
    [Rarity.Rare]: 11,
    [Rarity.Epic]: 14,
    [Rarity.Legendary]: 18,
    [Rarity.Mythic]: 19,
};

/**
 * Human-readable mapping for Tiers
 */
export const TIER_NAME_MAP: Record<number, string> = {
    1: 'Common Stone Sector 1',
    2: 'Common Stone Sector 2',
    3: 'Common Stone Sector 3 (Challenge)',
    4: 'Uncommon Iron Sector 1',
    5: 'Uncommon Iron Sector 2',
    6: 'Uncommon Iron Sector 3 (Challenge)',
    7: 'Rare Bronze Sector 1',
    8: 'Rare Bronze Sector 2',
    9: 'Rare Bronze Sector 3 (Challenge)',
    10: 'Epic Silver Sector 1',
    11: 'Epic Silver Sector 2',
    12: 'Epic Silver Sector 3 (Challenge)',
    13: 'Legendary Gold Sector 1',
    14: 'Legendary Gold Sector 2',
    15: 'Legendary Gold Sector 3 (Challenge)',
    16: 'Diamond Sector 1',
    17: 'Diamond Sector 2',
    18: 'Diamond Sector 3 (Challenge)',
    19: 'Mythic Sector 1',
    20: 'Mythic Sector 2',
    21: 'Mythic Sector 3 (Challenge)',
};

/**
 * Options for Onslaught sector selection in UI.
 */
export const ONSLAUGHT_SECTOR_OPTIONS = Object.entries(TIER_NAME_MAP).map(([value, label]) => ({
    value: Number(value),
    label,
}));

/**
 * Parses reward strings (e.g., "shards_hero:2-4" or "shards_hero%1/10") into a mean value.
 * Supports probability-weighted rewards and ranges found in game config.
 */
function parseRewardMean(rewardString: string): number {
    // 1. Extract the value/logic part of the string (after ':' or '#')
    const parts = rewardString.split(/[:#]/);
    const valuePart = parts.at(-1);

    if (!valuePart) return 0;

    // 2. Handle Probability-Weighted Rewards (e.g., "1%2/10" -> 0.2)
    if (valuePart.includes('%')) {
        const [amountString, chanceString] = valuePart.split('%');
        const amount = Number.parseFloat(amountString.replaceAll(/[^\d.]/g, '')) || 0;

        if (chanceString.includes('/')) {
            const [number_, den] = chanceString.split('/').map(Number);
            const probability = number_ / den;
            return amount * probability;
        }
        return amount;
    }

    // 3. Handle Ranges (e.g., "18-22" -> 20)
    if (valuePart.includes('-')) {
        const [min, max] = valuePart.split('-').map(Number);
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            return 0;
        }
        return (min + max) / 2;
    }
    // 4. Handle Fixed Values (e.g., "5")
    return Number.parseFloat(valuePart.replaceAll(/[^\d.]/g, '') || '0') || 0;
}
/**
 * Calculates the total mean shards for a chosen tier and hero rarity.
 * Logic:
 * 1. Filter by Tier.
 * 2. Filter by maxProgressionIndex (based on Hero Rarity).
 * 3. Match reward type (Standard vs Mythic).
 */
export function getMeanShardsForSelectedTier(
    data: OnslaughtData,
    tierId: number,
    rarity: Rarity,
    type: 'shards' | 'mythicShards'
): number {
    const rewardsForTier = data.honorYourHeroesRewards.filter(r => r.tier === tierId);
    const maxIndexForRarity = RARITY_PROGRESSION_LIMITS[rarity] ?? 18;

    let totalMean = 0;
    let highestProgressionIndexForType = -1;
    let selectedMilestoneForType: RewardTier | undefined;

    // Filter milestones that are within the rarity's progression limit
    const eligibleMilestones = rewardsForTier.filter(r => r.maxProgressionIndex <= maxIndexForRarity);

    // Find the highest progression index that contains the specific reward type
    for (const milestone of eligibleMilestones) {
        const hasRewardType = milestone.rewards.some(rewardString => {
            const lowerReward = rewardString.toLowerCase();
            const isMythicMatch = lowerReward.includes('mythicshards_') || lowerReward.includes('mythicshards:');
            return type === 'mythicShards'
                ? isMythicMatch
                : (lowerReward.includes('shards_') || lowerReward.includes('shards:')) && !isMythicMatch;
        });

        if (hasRewardType && milestone.maxProgressionIndex > highestProgressionIndexForType) {
            highestProgressionIndexForType = milestone.maxProgressionIndex;
            selectedMilestoneForType = milestone;
        }
    }

    if (selectedMilestoneForType) {
        for (const rewardString of selectedMilestoneForType.rewards) {
            const lowerReward = rewardString.toLowerCase();
            const isMythicMatch = lowerReward.includes('mythicshards_') || lowerReward.includes('mythicshards:');
            const isMatch =
                type === 'mythicShards'
                    ? isMythicMatch
                    : (lowerReward.includes('shards_') || lowerReward.includes('shards:')) && !isMythicMatch;

            if (isMatch) {
                totalMean += parseRewardMean(rewardString);
            }
        }
    }
    return Math.round(totalMean);
}

export class OnslaughtRewardsService {
    public static readonly data: OnslaughtData = onslaughtRewardsData;

    /**
     * Retrieves the selected Onslaught sector for a specific alliance from preferences.
     */
    public static getAllianceSector(
        preferences: { onslaughtSectors?: Partial<Record<Alliance, number>> } | null | undefined,
        alliance: Alliance
    ): number {
        if (!preferences?.onslaughtSectors) return 1;
        return preferences.onslaughtSectors[alliance] ?? 1;
    }

    /**
     * Public accessor for computing shard expectations.
     */
    public static getMeanShards(
        data: OnslaughtData | undefined,
        tierId: number,
        rarity: Rarity = Rarity.Legendary,
        type: 'shards' | 'mythicShards' = 'shards'
    ): number {
        if (!data?.honorYourHeroesRewards) {
            console.warn('Onslaught data or honorYourHeroesRewards is missing.');
            return 0;
        }

        return getMeanShardsForSelectedTier(data, tierId, rarity, type);
    }
}
