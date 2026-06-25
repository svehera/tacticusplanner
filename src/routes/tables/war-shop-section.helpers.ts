import { Alliance, Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';

import type { ResolvedShopItem } from '@/fsd/4-entities/shops';

export const FORGE_BADGE_PREFIX = 'itemAscensionResource_';

interface Counts {
    acquired: number;
    required: number;
}

export function parseForgeBadgeRarity(rewardType: string): Rarity | undefined {
    if (!rewardType.startsWith(FORGE_BADGE_PREFIX)) return undefined;
    const rarityString = rewardType.slice(FORGE_BADGE_PREFIX.length) as RarityString;
    return RarityMapper.stringToNumber[rarityString];
}

export function filterWarShopItemsByType(items: ResolvedShopItem[]): ResolvedShopItem[] {
    return items.filter(
        item =>
            item.rewardType.startsWith('shards_') ||
            item.rewardType === 'draft_machinesOfWarTokens' ||
            item.rewardType.startsWith(FORGE_BADGE_PREFIX)
    );
}

export function filterWarShopItemsByGoalNeed(
    items: ResolvedShopItem[],
    shardsCountsMap: Map<string, Counts>,
    componentsByAlliance: Record<Alliance, Counts>,
    forgeBadgeCounts: Record<Rarity, Counts>
): ResolvedShopItem[] {
    return items.filter(item => {
        if (item.rewardType.startsWith('shards_')) {
            const c = shardsCountsMap.get(item.rewardType);
            const needsShard = c !== undefined && c.acquired < c.required;
            const needsMowViaBundl =
                item.freeOfferType === 'draft_machinesOfWarTokens' &&
                Object.values(componentsByAlliance).some(ca => ca.acquired < ca.required);
            return needsShard || needsMowViaBundl;
        }
        if (item.rewardType === 'draft_machinesOfWarTokens') {
            return Object.values(componentsByAlliance).some(c => c.acquired < c.required);
        }
        const rarity = parseForgeBadgeRarity(item.rewardType);
        if (rarity === undefined) return false;
        const c = forgeBadgeCounts[rarity];
        return c.acquired < c.required;
    });
}
