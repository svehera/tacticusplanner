import { Alliance, Rarity, RarityMapper, RarityString, XP_BOOK_VALUE } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { MYTHIC_UNCRAFTABLE_UPGRADES, plTier } from '@/fsd/4-entities/shops';
import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { rewardInfo } from '@/fsd/3-features/shop-rewards';

import { isDraftRewardType, resolveDraftAllianceType } from './draft-alliance';
import { ICON_SIZE } from './shop-events.constants';
import type { Day } from './shop-events.constants';
import type { CoverageRow } from './shop-events.types';

export function cartKey(week: number, slotIndex: number, day: Day): string {
    return `${week}-${slotIndex}-${day}`;
}

export function getNeededForRewardType(
    type: string,
    neededBadges: Record<Alliance, Record<Rarity, number>>,
    neededOrbs: Record<Alliance, Record<Rarity, number>>,
    neededForgeBadges: Record<Rarity, number>,
    neededComponents: Record<Alliance, number>
): number {
    const badgeMatch = type.match(/^abilityToken(Common|Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Xenos|Chaos)$/);
    if (badgeMatch) {
        const rarity = RarityMapper.stringToNumber[badgeMatch[1] as RarityString];
        return neededBadges[badgeMatch[2] as Alliance]?.[rarity] ?? 0;
    }
    const orbMatch = type.match(/^heroAscensionOrb(Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Xenos|Chaos)$/);
    if (orbMatch) {
        const rarity = RarityMapper.stringToNumber[orbMatch[1] as RarityString];
        return neededOrbs[orbMatch[2] as Alliance]?.[rarity] ?? 0;
    }
    const mowComponentMatch = type.match(/^mowComponent_(Imperial|Xenos|Chaos)$/);
    if (mowComponentMatch) {
        return neededComponents[mowComponentMatch[1] as Alliance] ?? 0;
    }
    const forgeMatch = type.match(/^itemAscensionResource_(Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (forgeMatch) {
        const rarity = RarityMapper.stringToNumber[forgeMatch[1] as RarityString];
        return neededForgeBadges[rarity] ?? 0;
    }
    return 0;
}

export function formatGold(amount: number): string {
    if (amount < 1_000_000) {
        return `${Math.round(amount / 1000)}K`;
    }
    return `${(Math.round(amount / 100_000) / 10).toFixed(1)}M`;
}

export function coverageRowSortPriority(rewardType: string): number {
    if (rewardType === 'gold') return 0;
    if (rewardType.startsWith('xp')) return 1;
    if (rewardType.startsWith('abilityToken')) return 2;
    if (rewardType.startsWith('heroAscensionOrb')) return 3;
    if (rewardType.startsWith('mowComponent_')) return 3.5;
    if (rewardType.startsWith('itemAscensionResource_')) return 4;
    if (['upgHpM001', 'upgHpM002', 'upgHpM003', 'upgHpM004'].includes(rewardType)) return 5;
    if (rewardType.startsWith('shards_') || rewardType.startsWith('mythicShards_')) return 6;
    return 7;
}

interface ComputeCoverageRowsParameters {
    dayOrder: Day[];
    allWeekDayAvailability: Map<string, Map<number, Set<Day>>>;
    neededBadges: Record<Alliance, Record<Rarity, number>>;
    neededOrbs: Record<Alliance, Record<Rarity, number>>;
    neededForgeBadges: Record<Rarity, number>;
    neededComponents: Record<Alliance, number>;
    effectiveCartTotalsByType: Record<string, number>;
    neededXp: number;
    pl: number;
    hasBlueStarUnit: boolean;
    mythicMissingByUpgradeId: Record<string, number>;
    totalGold: number;
    neededShardsByType: Record<string, number>;
    cheapestOptionByType: Map<string, { qtyPerPack: number; costPerPack: number }>;
}

export function computeCoverageRows({
    dayOrder,
    allWeekDayAvailability,
    neededBadges,
    neededOrbs,
    neededForgeBadges,
    neededComponents,
    effectiveCartTotalsByType,
    neededXp,
    pl,
    hasBlueStarUnit,
    mythicMissingByUpgradeId,
    totalGold,
    neededShardsByType,
    cheapestOptionByType,
}: ComputeCoverageRowsParameters): CoverageRow[] {
    const XP_BOOK_TYPES = new Set(['xpRare', 'xpLegendary', 'xpMythic']);
    const rows: CoverageRow[] = [];

    for (const [typePrefix, weekDayMap] of allWeekDayAvailability) {
        // XP books are merged into a single tier-appropriate row below
        if (XP_BOOK_TYPES.has(typePrefix)) continue;

        const availability = [...weekDayMap.entries()]
            .toSorted(([a], [b]) => a - b)
            .map(([w, daysSet]) => ({
                week: w,
                days: dayOrder.filter(d => daysSet.has(d)),
            }));
        // The shop always sells the draft slot itself, regardless of which alliance gets chosen.
        const cheapest = cheapestOptionByType.get(typePrefix);

        // A draft slot's real reward is one of 3 alliance-specific resources, each with its own
        // deficit and its own alliance-tagged cart purchases — a single combined row would let a
        // surplus in one alliance mask a deficit in another, so each alliance gets its own row.
        if (isDraftRewardType(typePrefix)) {
            for (const alliance of [Alliance.Imperial, Alliance.Xenos, Alliance.Chaos]) {
                const resolvedType = resolveDraftAllianceType(typePrefix, alliance);
                if (!resolvedType) continue;
                const needed = getNeededForRewardType(
                    resolvedType,
                    neededBadges,
                    neededOrbs,
                    neededForgeBadges,
                    neededComponents
                );
                if (needed === 0) continue;
                const cartTotal = effectiveCartTotalsByType[resolvedType] ?? 0;
                const { icon, label } = rewardInfo(resolvedType);
                const remaining = Math.max(0, needed - cartTotal);
                const estimatedCost =
                    remaining > 0 && cheapest
                        ? Math.ceil(remaining / cheapest.qtyPerPack) * cheapest.costPerPack
                        : undefined;
                rows.push({
                    rewardType: resolvedType,
                    label,
                    icon,
                    needed,
                    cartTotal,
                    remaining,
                    availability,
                    estimatedCost,
                });
            }
            continue;
        }

        const needed = getNeededForRewardType(
            typePrefix,
            neededBadges,
            neededOrbs,
            neededForgeBadges,
            neededComponents
        );
        if (needed === 0) continue;
        const cartTotal = effectiveCartTotalsByType[typePrefix] ?? 0;
        const { icon, label } = rewardInfo(typePrefix);
        const remaining = Math.max(0, needed - cartTotal);
        const estimatedCost =
            remaining > 0 && cheapest ? Math.ceil(remaining / cheapest.qtyPerPack) * cheapest.costPerPack : undefined;
        rows.push({ rewardType: typePrefix, label, icon, needed, cartTotal, remaining, availability, estimatedCost });
    }

    // ── XP books (tier-appropriate denomination) ─────────────────────────────
    // Rare → low tier, Legendary → medium tier, Mythic → high tier
    const tierToXpBook: Record<
        'low' | 'medium' | 'high',
        { rarity: Rarity; type: string; iconKey: string; label: string }
    > = {
        low: { rarity: Rarity.Rare, type: 'xpRare', iconKey: 'rareBook', label: 'Rare XP Books' },
        medium: {
            rarity: Rarity.Legendary,
            type: 'xpLegendary',
            iconKey: 'legendaryBook',
            label: 'Legendary XP Books',
        },
        high: {
            rarity: Rarity.Mythic,
            type: 'xpMythic',
            iconKey: 'mythicBook',
            label: 'Grimoires (Mythic XP Books)',
        },
    };
    const currentTier = plTier(pl, hasBlueStarUnit);
    const xpBook = tierToXpBook[currentTier];
    const xpBookValue = XP_BOOK_VALUE[xpBook.rarity];
    const neededBooks = Math.ceil(neededXp / xpBookValue);
    const xpBookWeekMap = allWeekDayAvailability.get(xpBook.type);
    if (neededBooks > 0 && xpBookWeekMap) {
        // only show if purchasable in the shop
        const xpWeekDayMap = new Map<number, Set<Day>>(xpBookWeekMap);
        const xpBookXpValues: Record<string, number> = {
            xpRare: XP_BOOK_VALUE[Rarity.Rare],
            xpLegendary: XP_BOOK_VALUE[Rarity.Legendary],
            xpMythic: XP_BOOK_VALUE[Rarity.Mythic],
        };
        let cartXp = 0;
        for (const [xpType, xpValue] of Object.entries(xpBookXpValues)) {
            cartXp += (effectiveCartTotalsByType[xpType] ?? 0) * xpValue;
        }
        const cartBooks = Math.floor(cartXp / xpBookValue);
        const availability = [...xpWeekDayMap.entries()]
            .toSorted(([a], [b]) => a - b)
            .map(([w, daysSet]) => ({
                week: w,
                days: dayOrder.filter(d => daysSet.has(d)),
            }));
        const xpRemaining = Math.max(0, neededBooks - cartBooks);
        const xpCheapest = cheapestOptionByType.get(xpBook.type);
        const xpEstimatedCost =
            xpRemaining > 0 && xpCheapest
                ? Math.ceil(xpRemaining / xpCheapest.qtyPerPack) * xpCheapest.costPerPack
                : undefined;
        rows.push({
            rewardType: xpBook.type,
            label: xpBook.label,
            icon: <MiscIcon icon={xpBook.iconKey} width={ICON_SIZE} height={ICON_SIZE} />,
            needed: neededBooks,
            cartTotal: cartBooks,
            remaining: xpRemaining,
            availability,
            estimatedCost: xpEstimatedCost,
        });
    }

    // ── Mythic uncraftable upgrade materials ──────────────────────────────────
    for (const upg of MYTHIC_UNCRAFTABLE_UPGRADES) {
        const needed = mythicMissingByUpgradeId[upg.id] ?? 0;
        if (needed === 0) continue;
        const weekDayMap = allWeekDayAvailability.get(upg.id);
        if (!weekDayMap) continue; // only show if purchasable in the shop
        const cartTotal = effectiveCartTotalsByType[upg.id] ?? 0;
        const availability = [...weekDayMap.entries()]
            .toSorted(([a], [b]) => a - b)
            .map(([w, daysSet]) => ({ week: w, days: dayOrder.filter(d => daysSet.has(d)) }));
        const upgRemaining = Math.max(0, needed - cartTotal);
        const upgCheapest = cheapestOptionByType.get(upg.id);
        const upgEstimatedCost =
            upgRemaining > 0 && upgCheapest
                ? Math.ceil(upgRemaining / upgCheapest.qtyPerPack) * upgCheapest.costPerPack
                : undefined;
        rows.push({
            rewardType: upg.id,
            label: upg.material,
            icon: (
                <UpgradeImage
                    material={upg.material}
                    iconPath={upg.icon}
                    rarity={RarityMapper.rarityToRarityString(Rarity.Mythic)}
                    size={ICON_SIZE}
                />
            ),
            needed,
            cartTotal,
            remaining: upgRemaining,
            availability,
            estimatedCost: upgEstimatedCost,
        });
    }

    // ── Gold ──────────────────────────────────────────────────────────────────
    const goldWeekDayMap = allWeekDayAvailability.get('gold');
    if (totalGold > 0 && goldWeekDayMap) {
        // only show if purchasable in the shop
        const cartGold = effectiveCartTotalsByType['gold'] ?? 0;
        const goldAvailability = [...goldWeekDayMap.entries()]
            .toSorted(([a], [b]) => a - b)
            .map(([w, daysSet]) => ({ week: w, days: dayOrder.filter(d => daysSet.has(d)) }));
        const goldRemaining = Math.max(0, totalGold - cartGold);
        const goldCheapest = cheapestOptionByType.get('gold');
        const goldEstimatedCost =
            goldRemaining > 0 && goldCheapest
                ? Math.ceil(goldRemaining / goldCheapest.qtyPerPack) * goldCheapest.costPerPack
                : undefined;
        rows.push({
            rewardType: 'gold',
            label: 'Gold',
            icon: <MiscIcon icon="coin" width={ICON_SIZE} height={ICON_SIZE} />,
            needed: totalGold,
            cartTotal: cartGold,
            remaining: goldRemaining,
            availability: goldAvailability,
            note: 'The API does not tell us how many coins you have, so this is the total you need, not the total you are missing.',
            estimatedCost: goldEstimatedCost,
        });
    }

    // ── Character shards ──────────────────────────────────────────────────────
    for (const [shardType, needed] of Object.entries(neededShardsByType)) {
        if (needed === 0) continue;
        const weekDayMap = allWeekDayAvailability.get(shardType);
        if (!weekDayMap) continue; // only show if purchasable in the shop
        const cartTotal = effectiveCartTotalsByType[shardType] ?? 0;
        const availability = [...weekDayMap.entries()]
            .toSorted(([a], [b]) => a - b)
            .map(([w, daysSet]) => ({ week: w, days: dayOrder.filter(d => daysSet.has(d)) }));
        const shardRemaining = Math.max(0, needed - cartTotal);
        const shardCheapest = cheapestOptionByType.get(shardType);
        const shardEstimatedCost =
            shardRemaining > 0 && shardCheapest
                ? Math.ceil(shardRemaining / shardCheapest.qtyPerPack) * shardCheapest.costPerPack
                : undefined;
        const { icon, label } = rewardInfo(shardType);
        rows.push({
            rewardType: shardType,
            label,
            icon,
            needed,
            cartTotal,
            remaining: shardRemaining,
            availability,
            estimatedCost: shardEstimatedCost,
        });
    }

    return rows.toSorted(
        (a, b) =>
            coverageRowSortPriority(a.rewardType) - coverageRowSortPriority(b.rewardType) ||
            a.label.localeCompare(b.label)
    );
}
