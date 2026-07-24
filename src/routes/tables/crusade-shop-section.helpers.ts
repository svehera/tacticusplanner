import type { ResolvedShopItem } from '@/fsd/4-entities/shops';
import { UpgradesService } from '@/fsd/4-entities/upgrade';

import { FORGE_BADGE_PREFIX } from './war-shop-section.helpers';

export function filterCrusadeShopItemsByType(items: ResolvedShopItem[]): ResolvedShopItem[] {
    return items.filter(
        item =>
            item.rewardType.startsWith('shards_') ||
            item.rewardType.startsWith(FORGE_BADGE_PREFIX) ||
            !!UpgradesService.recipeExpandedUpgradeData[item.rewardType]
    );
}
