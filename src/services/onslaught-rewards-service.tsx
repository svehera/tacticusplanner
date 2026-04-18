/**
 * OnslaughtRewardsService manages calculations for expected shard income from the Onslaught "Honor Your Heroes" system.
 *
 * The calculation depends on:
 * - Tier: The specific Onslaught sector (e.g., Common Stone vs. Mythic).
 * - maxProgressionIndex: Milestones within a sector. A character's rarity caps which milestones they can access,
 *   preventing lower-rarity heroes from receiving rewards associated with higher progression indices.
 */
import React from 'react';

import { Rarity, Alliance } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

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
const RARITY_PROGRESSION_LIMITS: Record<Rarity, number> = {
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
const renderTierLabel = (rarity: Rarity, label: string) => {
    const isSectorClear = label.includes('Sector Clear');
    return (
        <div className="flex items-center gap-2">
            <RarityIcon rarity={rarity} />
            <span className={isSectorClear ? 'font-bold' : ''}>{label}</span>
        </div>
    );
};
/* eslint-disable-next-line react-refresh/only-export-components */
export const TIER_NAME_MAP: Record<number, React.ReactNode> = {
    1: renderTierLabel(Rarity.Common, 'Stone Sector I'),
    2: renderTierLabel(Rarity.Common, 'Stone Sector II'),
    3: renderTierLabel(Rarity.Common, 'Stone Sector (Sector Clear)'),
    4: renderTierLabel(Rarity.Uncommon, 'Iron Sector I'),
    5: renderTierLabel(Rarity.Uncommon, 'Iron Sector II'),
    6: renderTierLabel(Rarity.Uncommon, 'Iron Sector (Sector Clear)'),
    7: renderTierLabel(Rarity.Rare, 'Bronze Sector I'),
    8: renderTierLabel(Rarity.Rare, 'Bronze Sector II'),
    9: renderTierLabel(Rarity.Rare, 'Bronze Sector (Sector Clear)'),
    10: renderTierLabel(Rarity.Epic, 'Silver Sector I'),
    11: renderTierLabel(Rarity.Epic, 'Silver Sector II'),
    12: renderTierLabel(Rarity.Epic, 'Silver Sector (Sector Clear)'),
    13: renderTierLabel(Rarity.Legendary, 'Gold Sector I'),
    14: renderTierLabel(Rarity.Legendary, 'Gold Sector II'),
    15: renderTierLabel(Rarity.Legendary, 'Gold Sector (Sector Clear)'),
    16: renderTierLabel(Rarity.Legendary, 'Diamond I'),
    17: renderTierLabel(Rarity.Legendary, 'Diamond II'),
    18: renderTierLabel(Rarity.Legendary, 'Diamond III+ (Sector Clear)'),
    19: renderTierLabel(Rarity.Mythic, 'Adamantine I'),
    20: renderTierLabel(Rarity.Mythic, 'Adamantine II'),
    21: renderTierLabel(Rarity.Mythic, 'Adamantine III+ (Sector Clear)'),
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
            const probability = Number.isFinite(number_) && Number.isFinite(den) && den > 0 ? number_ / den : 0;
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
function isShardReward(rewardString: string, type: 'shards' | 'mythicShards'): boolean {
    const lowerReward = rewardString.toLowerCase();
    const isMythicMatch = lowerReward.includes('mythicshards_') || lowerReward.includes('mythicshards:');
    return type === 'mythicShards'
        ? isMythicMatch
        : (lowerReward.includes('shards_') || lowerReward.includes('shards:')) && !isMythicMatch;
}
/* eslint-disable-next-line react-refresh/only-export-components */
export function getMeanShardsForSelectedTier(
    data: OnslaughtData,
    tierId: number,
    rarity: Rarity,
    type: 'shards' | 'mythicShards'
): number {
    const rewardsForTier = data.honorYourHeroesRewards.filter(r => r.tier === tierId);
    const maxIndexForRarity = RARITY_PROGRESSION_LIMITS[rarity];

    let totalMean = 0;
    let highestProgressionIndexForType = -1;
    let selectedMilestoneForType: RewardTier | undefined;

    // Filter milestones that are within the rarity's progression limit
    const eligibleMilestones = rewardsForTier.filter(r => r.maxProgressionIndex <= maxIndexForRarity);

    // Find the highest progression index that contains the specific reward type
    for (const milestone of eligibleMilestones) {
        const hasRewardType = milestone.rewards.some(rewardString => isShardReward(rewardString, type));

        if (hasRewardType && milestone.maxProgressionIndex > highestProgressionIndexForType) {
            highestProgressionIndexForType = milestone.maxProgressionIndex;
            selectedMilestoneForType = milestone;
        }
    }

    if (selectedMilestoneForType) {
        for (const rewardString of selectedMilestoneForType.rewards) {
            if (isShardReward(rewardString, type)) {
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
