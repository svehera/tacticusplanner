/* eslint-disable import-x/no-internal-modules */
import { cloneDeep } from 'lodash';
import { Check, ChevronDown, Info, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import { JSX, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { IDailyRaidsFarmOrder } from '@/models/interfaces';
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { useAuth } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui/button';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { Modal } from '@/fsd/5-shared/ui/modal';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';
import { AccessibleTooltip, LazyTooltip } from '@/fsd/5-shared/ui/tooltip';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService as GoalUpgradesService } from '@/fsd/3-features/goals/upgrades.service';

import {
    ALL_EVENT_DATES,
    DAYS,
    DAY_LABELS,
    MAX_LEGENDARY_THRESHOLD,
    MYTHIC_UNCRAFTABLE_UPGRADES,
    PL_HIGH,
    PL_MEDIUM,
    TODAY_DEFAULT_INDEX,
    TODAY_EVENT_INDEX,
} from './armageddon.constants';
import type { Day } from './armageddon.constants';
import type { ArmageddonWeek, CartEntry, CartRecord, ResolvedSlot } from './armageddon.types';
import {
    cartKey,
    computeCoverageRows,
    cronMatchesDay,
    formatGold,
    getEventDate,
    plTier,
    rewardInfo,
} from './armageddon.utils';
import armageddonData from './data/armageddon.json';
import { PurchasedQtyModal } from './purchased-qty-modal';
import { ShopCard } from './shop-card';
import { ShoppingList } from './shopping-list';

export const Armageddon = () => {
    const {
        characters: unresolvedCharacters,
        mows,
        goals,
        gameModeTokens,
        campaignsProgress,
        dailyRaidsPreferences,
        inventory,
        dailyRaids,
        xpIncome,
        xpUse,
        armageddon: armageddonState,
        playerMetadata,
    } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const { userInfo } = useAuth();
    const hasSync = !!userInfo.tacticusApiKey;

    const [week, setWeek] = useState<1 | 2 | 3>(1);
    const [day, setDay] = useState<Day>('MON');
    const pl = playerMetadata.powerLevel ?? 1;
    const cart = useMemo<CartRecord>(() => armageddonState.structuredCart ?? {}, [armageddonState.structuredCart]);
    const purchased = useMemo<Record<string, number>>(
        () => armageddonState.purchased ?? {},
        [armageddonState.purchased]
    );
    const [purchasedDialogKey, setPurchasedDialogKey] = useState<string | undefined>();
    const [confirmResetWeek, setConfirmResetWeek] = useState<1 | 2 | 3 | undefined>();
    const [needsSync, setNeedsSync] = useState(false);
    const needsSyncFirstRender = useRef(true);
    const [coverageExpanded, setCoverageExpanded] = useState(false);
    const [purchasedExpanded, setPurchasedExpanded] = useState(false);
    const [dailyPurchasesExpanded, setDailyPurchasesExpanded] = useState(false);
    const [selectedDateIndex, setSelectedDateIndex] = useState(TODAY_DEFAULT_INDEX);

    // Mark needs-sync when purchases change (after first render)
    useEffect(() => {
        if (needsSyncFirstRender.current) {
            needsSyncFirstRender.current = false;
            return;
        }
        if (hasPurchased) setNeedsSync(true);
        else setNeedsSync(false);
    }, [armageddonState.purchased]); // eslint-disable-line react-hooks/exhaustive-deps

    // Remove purchased entries for cart items that have been removed
    useEffect(() => {
        const validKeys = new Set(Object.keys(cart));
        const toRemove = Object.keys(purchased).filter(k => !validKeys.has(k));
        if (toRemove.length === 0) return;
        const next = { ...purchased };
        for (const k of toRemove) delete next[k];
        dispatch.armageddon({ type: 'Update', setting: 'purchased', value: next });
    }, [armageddonState.structuredCart]); // eslint-disable-line react-hooks/exhaustive-deps

    // Resolve characters and mows
    const characters = useMemo(
        () => CharactersService.resolveStoredCharacters(unresolvedCharacters),
        [unresolvedCharacters]
    );
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const units = useMemo(() => [...characters, ...resolvedMows], [characters, resolvedMows]);

    // Build snowprintId → unit lookup from store
    const charBySnowprintId = useMemo(() => {
        const map: Record<string, (typeof characters)[0]> = {};
        for (const c of characters) map[c.snowprintId] = c;
        return map;
    }, [characters]);

    const mowBySnowprintId = useMemo(() => {
        const map: Record<string, (typeof resolvedMows)[0]> = {};
        for (const m of resolvedMows) {
            if ('snowprintId' in m) map[m.snowprintId] = m;
        }
        return map;
    }, [resolvedMows]);

    // ── goals estimation pipeline (for missing-resources coverage) ────────────
    const { shardsGoals, upgradeRankOrMowGoals, upgradeMaterialGoals, upgradeAbilities, ascendGoals } = useMemo(
        () => GoalsService.prepareGoals(goals, units, false),
        [goals, units]
    );

    const onslaughtTokensToday = useMemo(
        () => GoalUpgradesService.computeOnslaughtTokensToday(gameModeTokens),
        [gameModeTokens]
    );

    const estimatedUpgradesTotal = useMemo(
        () =>
            GoalUpgradesService.getUpgradesEstimatedDays(
                {
                    dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                    campaignsProgress,
                    preferences: { ...dailyRaidsPreferences },
                    upgrades: inventory.upgrades,
                    completedLocations: dailyRaids.raidedLocations,
                    onslaughtTokensToday,
                },
                characters,
                resolvedMows,
                ...[upgradeMaterialGoals, upgradeRankOrMowGoals, shardsGoals].flat().filter(x => x.include)
            ),
        [
            characters,
            resolvedMows,
            dailyRaidsPreferences,
            campaignsProgress,
            inventory.upgrades,
            dailyRaids.raidedLocations,
            onslaughtTokensToday,
            upgradeMaterialGoals,
            upgradeRankOrMowGoals,
            shardsGoals,
        ]
    );

    const isGoalPriority = dailyRaidsPreferences?.farmPreferences?.order === IDailyRaidsFarmOrder.goalPriority;

    const goalsEstimate = useMemo(
        () =>
            GoalsService.buildGoalEstimates(
                estimatedUpgradesTotal,
                shardsGoals,
                upgradeMaterialGoals,
                upgradeRankOrMowGoals,
                upgradeAbilities,
                characters,
                isGoalPriority
            ),
        [
            estimatedUpgradesTotal,
            shardsGoals,
            upgradeMaterialGoals,
            upgradeRankOrMowGoals,
            upgradeAbilities,
            characters,
            isGoalPriority,
        ]
    );

    const { neededBadges, neededOrbs, neededForgeBadges, neededXp } = useMemo(
        () =>
            GoalsService.adjustGoalEstimates(
                cloneDeep(goals),
                cloneDeep(goalsEstimate),
                inventory,
                xpUse,
                upgradeRankOrMowGoals,
                ascendGoals,
                xpIncome
            ),
        [goals, goalsEstimate, inventory, xpUse, upgradeRankOrMowGoals, ascendGoals, xpIncome]
    );

    const totalGold = useMemo(() => {
        let total = 0;
        for (const est of goalsEstimate) {
            total += est.xpEstimate?.gold ?? 0;
            total += est.xpEstimateAbilities?.gold ?? 0;
            total += est.abilitiesEstimate?.gold ?? 0;
            total += est.mowEstimate?.gold ?? 0;
        }
        return total;
    }, [goalsEstimate]);

    const mythicMissingByUpgradeId = useMemo(() => {
        const mythicIds = new Set<string>(MYTHIC_UNCRAFTABLE_UPGRADES.map(u => u.id));
        const totalNeeded: Record<string, number> = {};
        for (const mat of [...estimatedUpgradesTotal.inProgressMaterials, ...estimatedUpgradesTotal.blockedMaterials]) {
            if (mat.id && mythicIds.has(mat.id as 'upgHpM001' | 'upgHpM002' | 'upgHpM003' | 'upgHpM004')) {
                totalNeeded[mat.id] = (totalNeeded[mat.id] ?? 0) + mat.requiredCount;
            }
        }
        return Object.fromEntries(
            MYTHIC_UNCRAFTABLE_UPGRADES.map(u => [
                u.id,
                Math.max(0, (totalNeeded[u.id] ?? 0) - (inventory.upgrades[u.id] ?? 0)),
            ])
        );
    }, [estimatedUpgradesTotal, inventory.upgrades]);

    const setCartQty = useCallback(
        (key: string, qty: number, newEntryMeta?: Omit<CartEntry, 'quantity'>) => {
            const previous = cart;
            let next: CartRecord;
            if (qty <= 0) {
                next = { ...previous };
                delete next[key];
            } else {
                const existing = previous[key];
                if (existing) {
                    next = { ...previous, [key]: { ...existing, quantity: qty } };
                } else if (newEntryMeta) {
                    next = { ...previous, [key]: { ...newEntryMeta, quantity: qty } };
                } else {
                    return;
                }
            }
            dispatch.armageddon({ type: 'Update', setting: 'structuredCart', value: next });
        },
        [cart, dispatch]
    );

    const setPurchasedQty = useCallback(
        (key: string, qty: number) => {
            const previous = purchased;
            const next = qty <= 0 ? (({ [key]: _, ...rest }) => rest)(previous) : { ...previous, [key]: qty };
            dispatch.armageddon({ type: 'Update', setting: 'purchased', value: next });
        },
        [purchased, dispatch]
    );

    const resetWeek = useCallback(
        (w: 1 | 2 | 3) => {
            const next = { ...cart };
            for (const k of Object.keys(next)) {
                if (next[k].week === w) delete next[k];
            }
            dispatch.armageddon({ type: 'Update', setting: 'structuredCart', value: next });
            setConfirmResetWeek(undefined);
        },
        [cart, dispatch]
    );

    const tier = plTier(pl);

    const resolveLockId = useCallback(
        (lockId: string): boolean => {
            // returns true if this lockId applies (product should show)
            if (lockId === 'lock_mythic_shop_tier_high') return tier === 'high';
            if (lockId === 'lock_mythic_shop_tier_medium') return tier === 'medium';
            if (lockId === 'lock_mythic_shop_tier_low') return tier === 'low';

            const belowMax = lockId.match(/^lock_below_max_legendary_(.+)$/);
            if (belowMax) {
                const unitId = belowMax[1];
                const char = charBySnowprintId[unitId];
                const mow = mowBySnowprintId[unitId];
                const stars = char?.stars ?? mow?.stars;
                return stars !== undefined && stars < MAX_LEGENDARY_THRESHOLD;
            }

            const atMax = lockId.match(/^lock_max_legendary_(.+)$/);
            if (atMax) {
                const unitId = atMax[1];
                const char = charBySnowprintId[unitId];
                const mow = mowBySnowprintId[unitId];
                const stars = char?.stars ?? mow?.stars;
                return stars !== undefined && stars >= MAX_LEGENDARY_THRESHOLD;
            }

            const notUnlocked = lockId.match(/^lock_not_unlocked_(.+)$/);
            if (notUnlocked) {
                const unitId = notUnlocked[1];
                return charBySnowprintId[unitId] === undefined && mowBySnowprintId[unitId] === undefined;
            }

            // Unknown lock — assume it applies (show the product)
            return true;
        },
        [tier, charBySnowprintId, mowBySnowprintId]
    );

    const matchesConditions = useCallback(
        (product: ArmageddonWeek['products'][number][number]): boolean => {
            const { conditions } = product;
            if (conditions.minPowerLevel !== undefined && pl < conditions.minPowerLevel) return false;
            if (conditions.maxPowerLevel !== undefined && pl > conditions.maxPowerLevel) return false;
            if (conditions.lockId && !resolveLockId(conditions.lockId)) return false;
            return true;
        },
        [pl, resolveLockId]
    );

    // ── availability scan: all weeks × days (current conditions) ─────────────
    const allWeekDayAvailability = useMemo(() => {
        const map = new Map<string, Map<1 | 2 | 3, Set<Day>>>();
        for (let w = 1; w <= 3; w++) {
            const wd = (armageddonData as unknown as ArmageddonWeek[])[w - 1];
            for (const slot of wd.products) {
                for (const d of DAYS) {
                    const match = slot.find(p => cronMatchesDay(p.cronSchedule, d) && matchesConditions(p));
                    if (!match) continue;
                    const isFree = match.freeOffer !== undefined;
                    const rewardString = isFree ? match.freeOffer! : match.reward;
                    const typePrefix = rewardString.split(':')[0];
                    if (!map.has(typePrefix)) map.set(typePrefix, new Map());
                    const weekMap = map.get(typePrefix)!;
                    if (!weekMap.has(w as 1 | 2 | 3)) weekMap.set(w as 1 | 2 | 3, new Set());
                    weekMap.get(w as 1 | 2 | 3)!.add(d);
                }
            }
        }
        return map;
    }, [matchesConditions]);

    const effectiveCartTotalsByType = useMemo(() => {
        const totals: Record<string, number> = {};
        for (const [key, entry] of Object.entries(cart)) {
            const unpurchasedQty = Math.max(0, entry.quantity - (purchased[key] ?? 0));
            if (unpurchasedQty === 0) continue;
            const type = entry.rewardString.split(':')[0];
            totals[type] = (totals[type] ?? 0) + unpurchasedQty * entry.qtyPerPack;
        }
        return totals;
    }, [cart, purchased]);

    const neededShardsByType = useMemo(() => {
        const result: Record<string, number> = {};
        for (const goal of shardsGoals) {
            const u = GoalUpgradesService.getShardsForGoal(characters, resolvedMows, goal);
            const neededShards = Math.max(0, u.totalIncrementalShardsNeeded - u.incrementalShardsAcquired);
            if (neededShards > 0) result[u.shardName] = (result[u.shardName] ?? 0) + neededShards;
            const neededMythic = Math.max(0, u.totalIncrementalMythicShardsNeeded - u.incrementalMythicShardsAcquired);
            if (neededMythic > 0) result[u.mythicShardName] = (result[u.mythicShardName] ?? 0) + neededMythic;
        }
        return result;
    }, [shardsGoals, characters, resolvedMows]);

    const hasPurchased = useMemo(() => Object.values(purchased).some(q => q > 0), [purchased]);

    const purchasedItemsByType = useMemo(() => {
        const map: Record<string, { label: string; icon: JSX.Element; total: number }> = {};
        for (const [key, purchasedQty] of Object.entries(purchased)) {
            if (purchasedQty <= 0) continue;
            const entry = cart[key];
            if (!entry) continue;
            const typePrefix = entry.rewardString.split(':')[0];
            const totalItems = purchasedQty * entry.qtyPerPack;
            if (map[typePrefix]) {
                map[typePrefix].total += totalItems;
            } else {
                const { icon, label } = rewardInfo(entry.rewardString);
                map[typePrefix] = { label, icon, total: totalItems };
            }
        }
        return Object.entries(map).filter(([, v]) => v.total > 0);
    }, [cart, purchased]);

    // Cheapest paid product per reward-type prefix (minimize cost per item unit).
    const cheapestOptionByType = useMemo(() => {
        const map = new Map<string, { qtyPerPack: number; costPerPack: number }>();
        for (let w = 1; w <= 3; w++) {
            const wd = (armageddonData as unknown as ArmageddonWeek[])[w - 1];
            for (const slot of wd.products) {
                for (const d of DAYS) {
                    const match = slot.find(p => cronMatchesDay(p.cronSchedule, d) && matchesConditions(p));
                    if (!match || match.freeOffer !== undefined) continue;
                    const [typePrefix, qtyString] = match.reward.split(':');
                    const qty = qtyString === undefined ? 1 : Number.parseInt(qtyString, 10);
                    const cost = match.cost.amount;
                    const existing = map.get(typePrefix);
                    if (!existing || cost / qty < existing.costPerPack / existing.qtyPerPack) {
                        map.set(typePrefix, { qtyPerPack: qty, costPerPack: cost });
                    }
                }
            }
        }
        return map;
    }, [matchesConditions]);

    const coverageRows = useMemo(
        () =>
            computeCoverageRows({
                allWeekDayAvailability,
                neededBadges,
                neededOrbs,
                neededForgeBadges,
                effectiveCartTotalsByType,
                neededXp,
                pl,
                mythicMissingByUpgradeId,
                totalGold,
                neededShardsByType,
                cheapestOptionByType,
            }),
        [
            allWeekDayAvailability,
            neededBadges,
            neededOrbs,
            neededForgeBadges,
            effectiveCartTotalsByType,
            neededXp,
            pl,
            mythicMissingByUpgradeId,
            totalGold,
            neededShardsByType,
            cheapestOptionByType,
        ]
    );

    const weekData: ArmageddonWeek = (armageddonData as unknown as ArmageddonWeek[])[week - 1];

    const resolvedSlots = useMemo<ResolvedSlot[]>(() => {
        return weekData.products
            .map((slot, slotIndex) => {
                const match = slot.find(p => cronMatchesDay(p.cronSchedule, day) && matchesConditions(p));
                if (!match) return;
                const isFree = match.freeOffer !== undefined;
                const rewardString = isFree ? match.freeOffer! : match.reward;
                const { label, qty, icon } = rewardInfo(rewardString);
                return {
                    product: match,
                    slotIndex,
                    label,
                    qty,
                    icon,
                    isFree,
                    cost: isFree ? 0 : match.cost.amount,
                } satisfies ResolvedSlot;
            })
            .filter((s): s is ResolvedSlot => s !== undefined);
    }, [day, weekData, matchesConditions]);

    return (
        <div className="flex flex-col gap-6 p-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">Armageddon Shop</h1>
                    {hasSync && (
                        <div className="relative">
                            <SyncButton showText={false} iconButton={true} onAfterSync={() => setNeedsSync(false)} />
                            {needsSync && (
                                <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-orange-500 ring-2 ring-(--bg)" />
                            )}
                        </div>
                    )}
                </div>
                <span className="text-sm text-(--soft-fg)">{resolvedSlots.length} offers available</span>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-end gap-4 rounded-xl border border-(--border) bg-(--overlay) p-4">
                {/* Player Level */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Power Level</span>
                    {playerMetadata.powerLevel === undefined ? (
                        <AccessibleTooltip title="Power level is retrieved from the Tacticus API. Sync to load your power level.">
                            <span>
                                <SyncButton showText={true} />
                            </span>
                        </AccessibleTooltip>
                    ) : (
                        <p className="flex items-center gap-1 text-sm font-semibold tabular-nums">
                            {playerMetadata.powerLevel}
                        </p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-xs text-(--soft-fg)">
                        <span>
                            {'Tier: '}
                            <span className="font-semibold text-amber-400 capitalize">{tier}</span>
                        </span>
                        <AccessibleTooltip
                            title={
                                <span>
                                    Low: P.L. &lt;{PL_MEDIUM}
                                    <br />
                                    Medium: P.L. {PL_MEDIUM}–{PL_HIGH - 1}
                                    <br />
                                    High: P.L. ≥{PL_HIGH}
                                </span>
                            }>
                            <Info className="size-3.5 cursor-help" />
                        </AccessibleTooltip>
                    </p>
                </div>

                {/* Week */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Week</label>
                    <div className="flex gap-1">
                        {([1, 2, 3] as const).map(w => (
                            <button
                                key={w}
                                onClick={() => setWeek(w)}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                    week === w
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-(--border) bg-(--overlay) hover:border-blue-500'
                                }`}>
                                Week {w}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Day */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Day</label>
                    <div className="flex flex-wrap gap-1">
                        {DAYS.map(d => (
                            <button
                                key={d}
                                onClick={() => setDay(d)}
                                className={`flex flex-col items-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                    day === d
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-(--border) bg-(--overlay) hover:border-blue-500'
                                }`}>
                                <span>{DAY_LABELS[d].slice(0, 3)}</span>
                                <span className="text-[10px] font-normal tabular-nums opacity-70">
                                    {getEventDate(week, d)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Daily Purchases */}
            {(() => {
                const { week: selWeek, day: selDay } = ALL_EVENT_DATES[selectedDateIndex];
                const dayEntries = Object.entries(cart).filter(
                    ([, entry]) => entry.week === selWeek && entry.day === selDay
                );
                const dayTotal = dayEntries.reduce((s, [, entry]) => s + entry.quantity * entry.costPerUnit, 0);
                const dateLabel = `${DAY_LABELS[selDay]}, ${getEventDate(selWeek, selDay)}`;
                return (
                    <div className="rounded-xl border border-(--border) bg-(--overlay)">
                        <button
                            onClick={() => setDailyPurchasesExpanded(previous => !previous)}
                            className="flex w-full items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-(--soft)">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Daily Purchases</span>
                                <select
                                    value={selectedDateIndex}
                                    onClick={event => event.stopPropagation()}
                                    onChange={event => setSelectedDateIndex(Number(event.currentTarget.value))}
                                    className="rounded-lg border border-(--border) bg-(--overlay) px-2 py-0.5 text-xs text-(--fg)">
                                    {ALL_EVENT_DATES.map(({ week: w, day: d }, index) => (
                                        <option key={index} value={index}>
                                            {`Week ${w} · ${DAY_LABELS[d].slice(0, 3)} ${getEventDate(w, d)}${index === TODAY_EVENT_INDEX ? ' (Today)' : ''}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <ChevronDown
                                className={`size-4 text-(--soft-fg) transition-transform duration-200 ${
                                    dailyPurchasesExpanded ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {dailyPurchasesExpanded && (
                            <div className="flex flex-col gap-3 border-t border-(--border) p-4">
                                {dayEntries.length === 0 ? (
                                    <p className="text-sm text-(--soft-fg)">No purchases planned for {dateLabel}.</p>
                                ) : (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            {dayEntries.map(([key, entry]) => {
                                                const { icon } = rewardInfo(entry.rewardString);
                                                const lineTotal = entry.quantity * entry.costPerUnit;
                                                const purchasedQty = purchased[key] ?? 0;
                                                const isFullyPurchased = purchasedQty >= entry.quantity;
                                                return (
                                                    <div
                                                        key={key}
                                                        className={`flex items-center gap-2 rounded-lg bg-(--soft) p-2 ${
                                                            isFullyPurchased ? 'opacity-60' : ''
                                                        }`}>
                                                        <div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center">
                                                            {icon}
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                            <span
                                                                className={`truncate text-sm font-medium ${
                                                                    isFullyPurchased ? 'line-through' : ''
                                                                }`}>
                                                                {entry.label}
                                                            </span>
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                {entry.qtyPerPack > 1 && (
                                                                    <span className="text-xs text-(--soft-fg)">
                                                                        ×{entry.qtyPerPack} each
                                                                    </span>
                                                                )}
                                                                {purchasedQty > 0 && (
                                                                    <span
                                                                        className={`text-xs font-medium ${
                                                                            isFullyPurchased
                                                                                ? 'text-green-400'
                                                                                : 'text-amber-400'
                                                                        }`}>
                                                                        purchased {purchasedQty}/{entry.quantity}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-1">
                                                            <AccessibleTooltip
                                                                title={
                                                                    isFullyPurchased
                                                                        ? 'Clear purchase'
                                                                        : 'Mark full quantity as purchased'
                                                                }>
                                                                <button
                                                                    onClick={() =>
                                                                        setPurchasedQty(
                                                                            key,
                                                                            isFullyPurchased ? 0 : entry.quantity
                                                                        )
                                                                    }
                                                                    className={`flex size-7 items-center justify-center rounded-md border transition-colors ${
                                                                        isFullyPurchased
                                                                            ? 'border-green-500 bg-green-500/20 text-green-400'
                                                                            : 'border-(--border) hover:border-green-500 hover:text-green-400'
                                                                    }`}>
                                                                    <Check className="size-3.5" />
                                                                </button>
                                                            </AccessibleTooltip>
                                                            <AccessibleTooltip title="Mark partial quantity as purchased">
                                                                <button
                                                                    onClick={() => setPurchasedDialogKey(key)}
                                                                    className="flex size-7 items-center justify-center rounded-md border border-(--border) transition-colors hover:border-blue-500 hover:text-blue-400">
                                                                    <SlidersHorizontal className="size-3.5" />
                                                                </button>
                                                            </AccessibleTooltip>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-1">
                                                            <span className="text-xs font-semibold text-amber-400 tabular-nums">
                                                                {lineTotal.toLocaleString()}
                                                            </span>
                                                            <MiscIcon
                                                                icon="armageddonCurrency"
                                                                width={12}
                                                                height={12}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex items-center justify-end gap-1 border-t border-(--border) pt-2 text-sm">
                                            <span className="text-(--soft-fg)">Day total:</span>
                                            <span className="font-semibold text-amber-400 tabular-nums">
                                                {dayTotal.toLocaleString()}
                                            </span>
                                            <MiscIcon icon="armageddonCurrency" width={14} height={14} />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Purchased items summary */}
            {purchasedItemsByType.length > 0 && (
                <div className="rounded-xl border border-(--border) bg-(--overlay)">
                    <button
                        onClick={() => setPurchasedExpanded(previous => !previous)}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-(--soft)">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Purchased Items</span>
                            <span className="rounded-full bg-(--neutral) px-2 py-0.5 text-xs text-(--soft-fg)">
                                {purchasedItemsByType.length === 1 ? '1 type' : `${purchasedItemsByType.length} types`}
                            </span>
                        </div>
                        <ChevronDown
                            className={`size-4 text-(--soft-fg) transition-transform duration-200 ${
                                purchasedExpanded ? 'rotate-180' : ''
                            }`}
                        />
                    </button>
                    {purchasedExpanded && (
                        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-(--border) p-4">
                            {purchasedItemsByType.map(([type, info]) => (
                                <div key={type} className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center">{info.icon}</div>
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-xs font-medium">{info.label}</span>
                                        <span className="text-xs font-semibold text-green-400 tabular-nums">
                                            ×{info.total.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Missing resources coverage */}
            {coverageRows.length > 0 && (
                <div className="rounded-xl border border-(--border) bg-(--overlay)">
                    <button
                        onClick={() => setCoverageExpanded(previous => !previous)}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-(--soft)">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Missing Resources</span>
                            <span className="rounded-full bg-(--neutral) px-2 py-0.5 text-xs text-(--soft-fg)">
                                {coverageRows.length === 1 ? '1 type' : `${coverageRows.length} types`}
                            </span>
                            {coverageRows.some(r => r.remaining > 0) && (
                                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                                    {coverageRows.filter(r => r.remaining > 0).length} unmet
                                </span>
                            )}
                        </div>
                        <ChevronDown
                            className={`size-4 text-(--soft-fg) transition-transform duration-200 ${
                                coverageExpanded ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {coverageExpanded && (
                        <div className="flex flex-col gap-2 border-t border-(--border) p-4">
                            {coverageRows.map(row => (
                                <div
                                    key={row.rewardType}
                                    className="flex flex-col gap-2 rounded-lg border border-(--border) bg-(--soft) p-3 sm:flex-row sm:flex-wrap sm:items-start">
                                    {/* Icon + label */}
                                    <div className="flex shrink-0 items-center gap-2 sm:w-52">
                                        <div className="flex h-8 w-8 items-center justify-center">{row.icon}</div>
                                        <span className="text-sm leading-tight font-medium">{row.label}</span>
                                    </div>

                                    {/* Counts */}
                                    <div className="flex shrink-0 items-center gap-3 text-sm">
                                        <span className="flex items-center gap-1 text-(--soft-fg)">
                                            Need{' '}
                                            <span className="font-semibold text-amber-400">
                                                {row.rewardType === 'gold'
                                                    ? formatGold(row.needed)
                                                    : row.needed.toLocaleString()}
                                            </span>
                                            {row.note && (
                                                <LazyTooltip title={row.note}>
                                                    <TriangleAlert className="size-3.5 cursor-help text-amber-400" />
                                                </LazyTooltip>
                                            )}
                                        </span>
                                        {row.cartTotal > 0 && (
                                            <span className="text-(--soft-fg)">
                                                Cart{' '}
                                                <span className="font-semibold text-green-400">
                                                    +
                                                    {row.rewardType === 'gold'
                                                        ? formatGold(row.cartTotal)
                                                        : row.cartTotal.toLocaleString()}
                                                </span>
                                            </span>
                                        )}
                                        <span
                                            className={`font-semibold ${
                                                row.remaining === 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {row.remaining === 0
                                                ? '✓ Covered'
                                                : `${row.rewardType === 'gold' ? formatGold(row.remaining) : row.remaining.toLocaleString()} remaining`}
                                        </span>
                                        {row.remaining > 0 && row.estimatedCost !== undefined && (
                                            <span className="flex items-center gap-0.5 text-xs text-(--soft-fg)">
                                                ≈
                                                <span className="font-semibold text-amber-400 tabular-nums">
                                                    {row.estimatedCost.toLocaleString()}
                                                </span>
                                                <MiscIcon icon="armageddonCurrency" width={11} height={11} />
                                            </span>
                                        )}
                                    </div>

                                    {/* Availability chips */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {row.availability.map(({ week: w, days }) => (
                                            <span
                                                key={w}
                                                className="flex items-center gap-1 rounded-full border border-(--border) bg-(--overlay) px-2 py-0.5 text-xs">
                                                <span className="font-semibold">W{w}</span>
                                                <span className="text-(--soft-fg)">
                                                    {days.map(d => DAY_LABELS[d].slice(0, 3)).join(', ')}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Currency earnings infographic */}
            <div className="flex flex-wrap gap-3 rounded-xl border border-(--border) bg-(--overlay) px-4 py-3 text-sm">
                <div className="flex items-center gap-1.5">
                    <MiscIcon icon="armageddonCurrency" width={16} height={16} />
                    <span className="text-(--soft-fg)">F2P per week:</span>
                    <span className="font-semibold text-amber-400">1,050 – 1,100</span>
                </div>
                <span className="text-(--soft-fg) select-none">·</span>
                <div className="flex items-center gap-1.5">
                    <MiscIcon icon="armageddonCurrency" width={16} height={16} />
                    <span className="text-(--soft-fg)">Bonus shipment:</span>
                    <span className="font-semibold text-amber-400">+900</span>
                </div>
                <span className="text-(--soft-fg) select-none">·</span>
                <div className="flex items-center gap-1.5">
                    <MiscIcon icon="armageddonCurrency" width={16} height={16} />
                    <span className="text-(--soft-fg)">Rolls over each week</span>
                </div>
            </div>

            {/* Shop grid */}
            {resolvedSlots.length === 0 ? (
                <div className="rounded-xl border border-(--border) bg-(--overlay) p-8 text-center text-(--soft-fg)">
                    No offers available for the selected week / day / player level.
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {resolvedSlots.map((slot, index) => {
                        const key = cartKey(week, slot.slotIndex, day);
                        const cartQty = cart[key]?.quantity ?? 0;
                        const maxQty =
                            slot.product.maxPurchases === undefined
                                ? undefined
                                : Number.parseInt(slot.product.maxPurchases, 10);
                        return (
                            <ShopCard
                                key={index}
                                slot={slot}
                                cartQty={cartQty}
                                onSetQty={qty =>
                                    setCartQty(key, qty, {
                                        week,
                                        slotIndex: slot.slotIndex,
                                        day,
                                        label: slot.label,
                                        rewardString: slot.product.reward,
                                        costPerUnit: slot.cost,
                                        maxQty,
                                        qtyPerPack: slot.qty ?? 1,
                                    })
                                }
                            />
                        );
                    })}
                </div>
            )}

            <ShoppingList cart={cart} onSetQty={(key, qty) => setCartQty(key, qty)} onResetWeek={setConfirmResetWeek} />

            <Modal
                isOpen={confirmResetWeek !== undefined}
                onOpenChange={open => {
                    if (!open) setConfirmResetWeek(undefined);
                }}>
                <Modal.Content size="sm">
                    <Modal.Header>
                        <Modal.Title>Reset Week {confirmResetWeek}?</Modal.Title>
                        <Modal.Description>
                            This will remove all Week {confirmResetWeek} purchases from your shopping list.
                        </Modal.Description>
                    </Modal.Header>
                    <Modal.Footer>
                        <Button appearance="outline" onPress={() => setConfirmResetWeek(undefined)}>
                            Cancel
                        </Button>
                        <Button intent="danger" onPress={() => resetWeek(confirmResetWeek!)}>
                            Reset
                        </Button>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>

            {purchasedDialogKey !== null && cart[purchasedDialogKey ?? ''] && (
                <PurchasedQtyModal
                    key={purchasedDialogKey}
                    isOpen={true}
                    entry={cart[purchasedDialogKey ?? '']!}
                    icon={rewardInfo(cart[purchasedDialogKey ?? '']!.rewardString).icon}
                    initialPurchased={purchased[purchasedDialogKey ?? ''] ?? 0}
                    onConfirm={qty => {
                        setPurchasedQty(purchasedDialogKey ?? '', qty);
                        setPurchasedDialogKey(undefined);
                    }}
                    onClose={() => setPurchasedDialogKey(undefined)}
                />
            )}
        </div>
    );
};
