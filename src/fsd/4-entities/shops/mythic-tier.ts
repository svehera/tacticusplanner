import { RarityStars } from '@/fsd/5-shared/model';

import type { ShopLockContext } from './shop-resolve';

export const MYTHIC_UNCRAFTABLE_UPGRADES = [
    {
        id: 'upgHpM001',
        material: 'Imperial Aquila',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM001.png',
    },
    {
        id: 'upgHpM002',
        material: 'Mutant Form',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM002.png',
    },
    {
        id: 'upgHpM003',
        material: 'Ancient Inscription',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM003.png',
    },
    {
        id: 'upgHpM004',
        material: 'Venerable Battle Mark',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM004.png',
    },
] as const;

export const PL_MEDIUM = 20;
// < PL_MEDIUM → low; >= PL_MEDIUM without blue-star unit → medium; >= PL_MEDIUM with blue-star unit → high

// "Max legendary" = first blue star or higher (includes mythic)
export const MAX_LEGENDARY_THRESHOLD = RarityStars.OneBlueStar;

export function plTier(pl: number, hasBlueStarUnit: boolean): 'high' | 'medium' | 'low' {
    if (pl >= PL_MEDIUM && hasBlueStarUnit) return 'high';
    if (pl >= PL_MEDIUM) return 'medium';
    return 'low';
}

interface RosterUnit {
    snowprintId: string;
    stars: number;
}

/**
 * True if the roster owns at least one character or MoW at Legendary rarity with a blue star or
 * higher, or at Mythic rarity (both share the `OneBlueStar` floor, so a single stars threshold
 * check covers both cases).
 */
export function hasBlueStarUnit(units: RosterUnit[]): boolean {
    return units.some(u => u.stars >= MAX_LEGENDARY_THRESHOLD);
}

/**
 * Builds the roster/PL context used by `resolveEventLockId`/`eventProductMatches` to gate mythic
 * shop content: only shown once PL >= 20 and the player owns a blue-star-or-above unit.
 */
export function computeShopLockContext(pl: number, characters: RosterUnit[], mows: RosterUnit[]): ShopLockContext {
    const starsByUnitId: Record<string, number> = {};
    for (const unit of [...characters, ...mows]) {
        starsByUnitId[unit.snowprintId] = unit.stars;
    }

    return { tier: plTier(pl, hasBlueStarUnit([...characters, ...mows])), starsByUnitId };
}
