/* eslint-disable import-x/no-internal-modules */
import { JSX } from 'react';

import { Alliance, Rarity, RarityMapper, RarityString, XP_BOOK_VALUE } from '@/fsd/5-shared/model';
import { BadgeImage, ForgeBadgeImage, MiscIcon, OrbIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentService } from '@/fsd/4-entities/equipment';
import { EquipmentIcon } from '@/fsd/4-entities/equipment/ui';
import { MowsService } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { DAYS, EVENT_START_UTC, ICON_SIZE, MYTHIC_UNCRAFTABLE_UPGRADES, PL_MEDIUM } from './armageddon.constants';
import type { Day } from './armageddon.constants';
import type { CoverageRow } from './armageddon.types';

export function getEventDate(week: 1 | 2 | 3, day: Day): string {
    const dayIndex = DAYS.indexOf(day);
    const offsetMs = ((week - 1) * 7 + dayIndex) * 86_400_000;
    const d = new Date(EVENT_START_UTC + offsetMs);
    const month = d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
    const dayNumber = d.getUTCDate().toString().padStart(2, '0');
    return `${month} ${dayNumber}`;
}

export function cronMatchesDay(cronSchedule: string, day: Day): boolean {
    // Quartz cron: "0 0 0 ? * DOW *"  — field 6 (0-indexed 5) is day-of-week
    const parts = cronSchedule.split(' ');
    const dowField = parts[5] ?? '*';
    if (dowField === '*') return true;
    return dowField.split(',').includes(day);
}

export function plTier(pl: number, hasBlueStarUnit: boolean): 'high' | 'medium' | 'low' {
    if (pl >= PL_MEDIUM && hasBlueStarUnit) return 'high';
    if (pl >= PL_MEDIUM) return 'medium';
    return 'low';
}

export function cartKey(week: 1 | 2 | 3, slotIndex: number, day: Day): string {
    return `${week}-${slotIndex}-${day}`;
}

export function rewardInfo(reward: string): { icon: JSX.Element; label: string; qty: number | undefined } {
    const [type, qtyString] = reward.split(':');
    const qty = qtyString === undefined ? undefined : Number.parseInt(qtyString, 10);

    // ── character shards ──────────────────────────────────────────────────────
    if (type.startsWith('shards_') || type.startsWith('mythicShards_')) {
        const isMythic = type.startsWith('mythicShards_');
        const charId = type.replace(isMythic ? 'mythicShards_' : 'shards_', '');
        const char = CharactersService.charactersBySnowprintId[charId];
        const mow = char ? undefined : MowsService.resolveToStatic(charId);
        const unit = char ?? mow;
        return {
            icon: unit ? (
                <UnitShardIcon
                    icon={unit.roundIcon}
                    name={unit.name}
                    mythic={isMythic}
                    height={ICON_SIZE}
                    width={ICON_SIZE}
                />
            ) : (
                <MiscIcon icon={isMythic ? 'mythicShard' : 'shard'} width={ICON_SIZE} height={ICON_SIZE} />
            ),
            label: unit
                ? `${unit.name} ${isMythic ? 'Mythic Shards' : 'Shards'}`
                : isMythic
                  ? 'Mythic Shards'
                  : 'Shards',
            qty,
        };
    }

    // ── named resources ───────────────────────────────────────────────────────
    if (type === 'seasonalEventCurrencyJune2026')
        return {
            icon: <MiscIcon icon="armageddonCurrency" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Armageddon Currency',
            qty,
        };
    if (type === 'gold')
        return { icon: <MiscIcon icon="coin" width={ICON_SIZE} height={ICON_SIZE} />, label: 'Gold', qty };
    if (type === 'dust')
        return { icon: <MiscIcon icon="salvage" width={ICON_SIZE} height={ICON_SIZE} />, label: 'Salvage', qty };
    if (type === 'mythicDust')
        return {
            icon: <MiscIcon icon="mythicSalvage" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Mythic Salvage',
            qty,
        };
    if (type === 'summoningToken')
        return { icon: <MiscIcon icon="reqOrder" width={ICON_SIZE} height={ICON_SIZE} />, label: 'Req Scroll', qty };
    if (type === 'specialSummoningToken')
        return {
            icon: <MiscIcon icon="blessedReqOrder" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Blessed Req Scroll',
            qty,
        };

    // ── XP books ──────────────────────────────────────────────────────────────
    const xpBookIcon: Record<string, string> = {
        xpRare: 'rareBook',
        xpLegendary: 'legendaryBook',
        xpMythic: 'mythicBook',
    };
    if (xpBookIcon[type])
        return {
            icon: <MiscIcon icon={xpBookIcon[type]} width={ICON_SIZE} height={ICON_SIZE} />,
            label: `XP Book (${type.replace('xp', '')})`,
            qty,
        };

    // ── event summoning tokens ────────────────────────────────────────────────
    if (type.startsWith('eventSummoningToken_')) {
        const faction = type.replace('eventSummoningToken_', '');
        const factionIconMap: Record<string, string> = {
            BloodAngels: 'bloodAngelsReq',
            Orks: 'orksReq',
        };
        const iconKey = factionIconMap[faction] ?? 'legendaryEventToken';
        return {
            icon: <MiscIcon icon={iconKey} width={ICON_SIZE} height={ICON_SIZE} />,
            label: `${faction} Req Scroll`,
            qty,
        };
    }

    // ── ability badges: abilityToken{Rarity}_{Alliance} ──────────────────────
    const badgeMatch = type.match(/^abilityToken(Common|Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Xenos|Chaos)$/);
    if (badgeMatch) {
        const rarity = badgeMatch[1] as RarityString;
        const alliance = badgeMatch[2] as Alliance;
        return {
            icon: <BadgeImage alliance={alliance} rarity={rarity} size="medium" />,
            label: `${rarity} ${alliance} Badge`,
            qty,
        };
    }

    // ── ascension orbs: heroAscensionOrb{Rarity}_{Alliance} ──────────────────
    const orbMatch = type.match(/^heroAscensionOrb(Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Xenos|Chaos)$/);
    if (orbMatch) {
        const rarity = RarityMapper.stringToNumber[orbMatch[1] as RarityString];
        const alliance = orbMatch[2] as Alliance;
        return {
            icon: <OrbIcon alliance={alliance} rarity={rarity} size={ICON_SIZE} />,
            label: `${orbMatch[1]} ${alliance} Orb`,
            qty,
        };
    }

    // ── forge badges: itemAscensionResource_{Rarity} ─────────────────────────
    const forgeMatch = type.match(/^itemAscensionResource_(Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (forgeMatch) {
        const rarity = RarityMapper.stringToNumber[forgeMatch[1] as RarityString];
        return {
            icon: <ForgeBadgeImage rarity={rarity} />,
            label: `${forgeMatch[1]} Forge Badge`,
            qty,
        };
    }

    // ── upgrade materials: upg* ───────────────────────────────────────────────
    if (type.startsWith('upg')) {
        const upgradeData = UpgradesService.recipeExpandedUpgradeData[type];
        if (upgradeData) {
            return {
                icon: (
                    <UpgradeImage
                        material={upgradeData.label}
                        iconPath={upgradeData.iconPath}
                        rarity={RarityMapper.rarityToRarityString(upgradeData.rarity as Rarity)}
                        size={ICON_SIZE}
                    />
                ),
                label: upgradeData.label,
                qty,
            };
        }
    }

    // ── equipment / relics: I_* or R_* ───────────────────────────────────────
    if (type.startsWith('I_') || type.startsWith('R_')) {
        const equip = EquipmentService.equipmentData.find(item => item.id === type);
        if (equip) {
            return {
                icon: <EquipmentIcon equipment={equip} height={ICON_SIZE} width={ICON_SIZE} />,
                label: equip.name,
                qty,
            };
        }
    }

    // ── fallback ──────────────────────────────────────────────────────────────
    return { icon: <span className="text-xs break-all text-(--soft-fg)">{type}</span>, label: type, qty };
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
    allWeekDayAvailability: Map<string, Map<1 | 2 | 3, Set<Day>>>;
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
                days: DAYS.filter(d => daysSet.has(d)),
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
    if (neededBooks > 0) {
        const xpWeekDayMap = new Map<1 | 2 | 3, Set<Day>>();
        const weekMap = allWeekDayAvailability.get(xpBook.type);
        if (weekMap) {
            for (const [w, days] of weekMap) {
                xpWeekDayMap.set(w, new Set(days));
            }
        }
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
                days: DAYS.filter(d => daysSet.has(d)),
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
        const cartTotal = effectiveCartTotalsByType[upg.id] ?? 0;
        const weekDayMap = allWeekDayAvailability.get(upg.id);
        const availability = weekDayMap
            ? [...weekDayMap.entries()]
                  .toSorted(([a], [b]) => a - b)
                  .map(([w, daysSet]) => ({ week: w, days: DAYS.filter(d => daysSet.has(d)) }))
            : [];
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
    if (totalGold > 0) {
        const cartGold = effectiveCartTotalsByType['gold'] ?? 0;
        const goldWeekDayMap = allWeekDayAvailability.get('gold');
        const goldAvailability = goldWeekDayMap
            ? [...goldWeekDayMap.entries()]
                  .toSorted(([a], [b]) => a - b)
                  .map(([w, daysSet]) => ({ week: w, days: DAYS.filter(d => daysSet.has(d)) }))
            : [];
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
            .map(([w, daysSet]) => ({ week: w, days: DAYS.filter(d => daysSet.has(d)) }));
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
