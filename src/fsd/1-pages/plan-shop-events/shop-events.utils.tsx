import { Alliance, Rarity, RarityMapper, RarityString, XP_BOOK_VALUE } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { MYTHIC_UNCRAFTABLE_UPGRADES, plTier, ShopEventData } from '@/fsd/4-entities/shops';
import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { rewardInfo } from '@/fsd/3-features/shop-rewards';

import { DAYS, ICON_SIZE } from './shop-events.constants';
import type { Day } from './shop-events.constants';
import type { CoverageRow } from './shop-events.types';

/**
 * The 7-day weekday sequence for an event, starting at the actual UTC weekday of `event.startUtc`
 * (e.g. a Wednesday-start event yields `['WED','THU',...,'MON','TUE']`). Position `i` in this array
 * is "day `i` of any week of this event" - shop events don't necessarily start on a Monday, so this
 * replaces the fixed `DAYS` order wherever day-of-week needs to line up with real calendar dates.
 */
export function getEventDayOrder(event: ShopEventData): Day[] {
    const mondayBasedStart = (new Date(event.startUtc).getUTCDay() + 6) % 7; // Mon=0..Sun=6
    return Array.from({ length: 7 }, (_, index) => DAYS[(mondayBasedStart + index) % 7]);
}

export function getEventDate(event: ShopEventData, week: number, day: Day): string {
    const dayIndex = getEventDayOrder(event).indexOf(day);
    const offsetMs = ((week - 1) * 7 + dayIndex) * 86_400_000;
    const d = new Date(event.startUtc + offsetMs);
    const month = d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
    const dayNumber = d.getUTCDate().toString().padStart(2, '0');
    return `${month} ${dayNumber}`;
}

export interface EventDateIndexEntry {
    week: number;
    day: Day;
}

export interface EventDateIndex {
    allDates: EventDateIndexEntry[];
    /** Index into `allDates` corresponding to today, or -1 if today falls outside the event window. */
    todayIndex: number;
    /** Default selected index: today if in-event, else the first day (before) or last day (after). */
    defaultIndex: number;
}

/** Builds the full day-by-day index for an event, derived from its start date and week count. */
export function buildEventDateIndex(event: ShopEventData): EventDateIndex {
    const dayOrder = getEventDayOrder(event);
    const totalDays = event.weeks.length * 7;
    const allDates: EventDateIndexEntry[] = Array.from({ length: totalDays }, (_, index) => ({
        week: Math.floor(index / 7) + 1,
        day: dayOrder[index % 7],
    }));

    const now = new Date();
    const utcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const offsetDays = Math.round((utcMs - event.startUtc) / 86_400_000);

    const todayIndex = offsetDays >= 0 && offsetDays < totalDays ? offsetDays : -1;
    const defaultIndex = todayIndex >= 0 ? todayIndex : offsetDays < 0 ? 0 : totalDays - 1;

    return { allDates, todayIndex, defaultIndex };
}

export function cartKey(week: number, slotIndex: number, day: Day): string {
    return `${week}-${slotIndex}-${day}`;
}

/** A draft item can be claimed as any single alliance's variant, so the total needed is the sum of every alliance's deficit. */
function sumAcrossAlliances(needed: Record<Alliance, Record<Rarity, number>>, rarity: Rarity): number {
    return Object.values(Alliance).reduce((total, alliance) => total + (needed[alliance]?.[rarity] ?? 0), 0);
}

export function getNeededForRewardType(
    type: string,
    neededBadges: Record<Alliance, Record<Rarity, number>>,
    neededOrbs: Record<Alliance, Record<Rarity, number>>,
    neededForgeBadges: Record<Rarity, number>
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
    const draftBadgeMatch = type.match(/^draft_abilityTokens(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (draftBadgeMatch) {
        const rarity = RarityMapper.stringToNumber[draftBadgeMatch[1] as RarityString];
        return sumAcrossAlliances(neededBadges, rarity);
    }
    const draftOrbMatch = type.match(/^draft_ascensionOrbs(Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (draftOrbMatch) {
        const rarity = RarityMapper.stringToNumber[draftOrbMatch[1] as RarityString];
        return sumAcrossAlliances(neededOrbs, rarity);
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
        const needed = getNeededForRewardType(typePrefix, neededBadges, neededOrbs, neededForgeBadges);
        if (needed === 0) continue;
        const cartTotal = effectiveCartTotalsByType[typePrefix] ?? 0;
        const availability = [...weekDayMap.entries()]
            .toSorted(([a], [b]) => a - b)
            .map(([w, daysSet]) => ({
                week: w,
                days: dayOrder.filter(d => daysSet.has(d)),
            }));
        const { icon, label } = rewardInfo(typePrefix);
        const remaining = Math.max(0, needed - cartTotal);
        const cheapest = cheapestOptionByType.get(typePrefix);
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
