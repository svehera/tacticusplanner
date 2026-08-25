/* eslint-disable import-x/no-internal-modules */
import { cloneDeep } from 'lodash';
import { ArrowLeft, Check, ChevronDown, Info, Search, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import { Fragment, JSX, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { IDailyRaidsFarmOrder } from '@/models/interfaces';
import { defaultShopEventPurchaseState } from '@/reducers/shop-events.reducer';
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rank, useAuth } from '@/fsd/5-shared/model';
import { PortalDialog, Switch } from '@/fsd/5-shared/ui';
import { Button } from '@/fsd/5-shared/ui/button';
import { MiscIcon, RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';
import { Modal } from '@/fsd/5-shared/ui/modal';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';
import { TabBar } from '@/fsd/5-shared/ui/tab-bar';
import { AccessibleTooltip, LazyTooltip } from '@/fsd/5-shared/ui/tooltip';

import { CharactersService } from '@/fsd/4-entities/character';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import {
    computeShopLockContext,
    cronMatchesDay,
    eventProductMatches,
    getShopCurrencyIconKey,
    hasBlueStarUnit,
    MYTHIC_UNCRAFTABLE_UPGRADES,
    PL_MEDIUM,
    plTier,
    ShopProduct,
    shopEvents,
} from '@/fsd/4-entities/shops';
import { IUnit, UnitsAutocomplete } from '@/fsd/4-entities/unit';

import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService as GoalUpgradesService } from '@/fsd/3-features/goals/upgrades.service';
import { rewardInfo } from '@/fsd/3-features/shop-rewards';

import { resolveDraftAllianceType } from './draft-alliance';
import { PurchasedQtyModal } from './purchased-qty-modal';
import { ShopCard } from './shop-card';
import { DAYS, DAY_LABELS } from './shop-events.constants';
import type { Day } from './shop-events.constants';
import { buildEventDateIndex, getEventDate, getEventDayOrder } from './shop-events.dates';
import type { CartEntry, CartRecord, ResolvedSlot } from './shop-events.types';
import { cartKey, computeCoverageRows, formatGold } from './shop-events.utils';
import { ShoppingList } from './shopping-list';
import { MilestonesTab } from './tabs/milestones-tab';
import { MissionsTab } from './tabs/missions-tab';

const TAB_IDS = ['shop', 'milestones', 'missions'] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
    shop: 'Shop',
    milestones: 'Milestones & Rewards',
    missions: 'Missions',
};

/** The reward type a cart entry actually resolves to — a draft entry with a chosen alliance resolves
 *  to its real alliance-specific type, matching how `computeCoverageRows` buckets draft rows. */
function resolveCartEntryType(entry: CartEntry): string {
    const type = entry.rewardString.split(':')[0];
    if (!entry.draftAlliance) return type;
    return resolveDraftAllianceType(type, entry.draftAlliance) ?? type;
}

export const ShopEventDetail = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const event = useMemo(() => shopEvents.find(shopEvent => shopEvent.id === eventId), [eventId]);

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
        shopEvents: shopEventsState,
        playerMetadata,
    } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const { userInfo } = useAuth();
    const hasSync = !!userInfo.tacticusApiKey;

    const dayOrder = useMemo(() => (event ? getEventDayOrder(event) : [...DAYS]), [event]);

    const [week, setWeek] = useState(1);
    const [day, setDay] = useState<Day>(dayOrder[0]);
    const [activeTab, setActiveTab] = useState<TabId>('shop');
    const pl = playerMetadata.powerLevel ?? 1;

    const eventState = event
        ? (shopEventsState[event.id] ?? defaultShopEventPurchaseState)
        : defaultShopEventPurchaseState;
    const cart = useMemo<CartRecord>(() => eventState.structuredCart ?? {}, [eventState.structuredCart]);
    const purchased = useMemo<Record<string, number>>(() => eventState.purchased ?? {}, [eventState.purchased]);

    const [purchasedDialogKey, setPurchasedDialogKey] = useState<string | undefined>();
    const [confirmResetWeek, setConfirmResetWeek] = useState<number | undefined>();
    const [needsSync, setNeedsSync] = useState(false);
    const needsSyncFirstRender = useRef(true);
    const [coverageExpanded, setCoverageExpanded] = useState(false);
    const [purchasedExpanded, setPurchasedExpanded] = useState(false);
    const [dailyPurchasesExpanded, setDailyPurchasesExpanded] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    // eslint-disable-next-line unicorn/no-null -- autocomplete requires null for empty state
    const [searchUnit, setSearchUnit] = useState<IUnit | null>(null);
    const [detailsEnabled, setDetailsEnabled] = useState(false);

    const dateIndex = useMemo(() => (event ? buildEventDateIndex(event) : undefined), [event]);
    const [selectedDateIndex, setSelectedDateIndex] = useState(dateIndex?.defaultIndex ?? 0);

    useEffect(() => {
        if (dateIndex) setSelectedDateIndex(dateIndex.defaultIndex);
        setDay(dayOrder[0]);
    }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const hasPurchased = useMemo(() => Object.values(purchased).some(q => q > 0), [purchased]);

    // Mark needs-sync when purchases change (after first render)
    useEffect(() => {
        if (needsSyncFirstRender.current) {
            needsSyncFirstRender.current = false;
            return;
        }
        if (hasPurchased) setNeedsSync(true);
        else setNeedsSync(false);
    }, [eventState.purchased]); // eslint-disable-line react-hooks/exhaustive-deps

    // Remove purchased entries for cart items that have been removed
    useEffect(() => {
        if (!event) return;
        const validKeys = new Set(Object.keys(cart));
        const toRemove = Object.keys(purchased).filter(k => !validKeys.has(k));
        if (toRemove.length === 0) return;
        const next = { ...purchased };
        for (const k of toRemove) delete next[k];
        dispatch.shopEvents({ type: 'UpdatePurchased', eventId: event.id, value: next });
    }, [eventState.structuredCart]); // eslint-disable-line react-hooks/exhaustive-deps

    // Resolve characters and mows
    const characters = useMemo(
        () => CharactersService.resolveStoredCharacters(unresolvedCharacters),
        [unresolvedCharacters]
    );
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const units = useMemo(() => [...characters, ...resolvedMows], [characters, resolvedMows]);

    // Every character/MoW in the game (locked ones included), for the shard-search feature below —
    // unlike `characters`/`units` above, this isn't limited to what the user already owns.
    const allCharacters = useMemo(
        () => CharactersService.resolveAllCharacters(unresolvedCharacters),
        [unresolvedCharacters]
    );
    const allUnits = useMemo<IUnit[]>(() => [...allCharacters, ...resolvedMows], [allCharacters, resolvedMows]);

    const mowRosterUnits = useMemo(
        () =>
            resolvedMows
                .filter((m): m is (typeof resolvedMows)[number] & { snowprintId: string } => 'snowprintId' in m)
                .map(m => ({ snowprintId: m.snowprintId, stars: m.stars })),
        [resolvedMows]
    );

    // ── goals estimation pipeline (for missing-resources coverage) ────────────
    const { shardsGoals, upgradeRankOrMowGoals, upgradeMaterialGoals, upgradeAbilities, ascendGoals, preFarmGoals } =
        useMemo(() => GoalsService.prepareGoals(goals, units, false), [goals, units]);

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
                isGoalPriority,
                preFarmGoals
            ),
        [
            estimatedUpgradesTotal,
            shardsGoals,
            upgradeMaterialGoals,
            upgradeRankOrMowGoals,
            upgradeAbilities,
            characters,
            isGoalPriority,
            preFarmGoals,
        ]
    );

    const { neededBadges, neededOrbs, neededForgeBadges, neededComponents, neededXp } = useMemo(
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
            if (!event) return;
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
            dispatch.shopEvents({ type: 'UpdateCart', eventId: event.id, value: next });
        },
        [cart, dispatch, event]
    );

    const setPurchasedQty = useCallback(
        (key: string, qty: number) => {
            if (!event) return;
            const previous = purchased;
            const next = qty <= 0 ? (({ [key]: _, ...rest }) => rest)(previous) : { ...previous, [key]: qty };
            dispatch.shopEvents({ type: 'UpdatePurchased', eventId: event.id, value: next });
        },
        [purchased, dispatch, event]
    );

    const resetWeek = useCallback(
        (w: number) => {
            if (!event) return;
            const next = { ...cart };
            for (const k of Object.keys(next)) {
                if (next[k].week === w) delete next[k];
            }
            dispatch.shopEvents({ type: 'UpdateCart', eventId: event.id, value: next });
            setConfirmResetWeek(undefined);
        },
        [cart, dispatch, event]
    );

    const lockContext = useMemo(
        () => computeShopLockContext(pl, characters, mowRosterUnits),
        [pl, characters, mowRosterUnits]
    );
    const rosterHasBlueStarUnit = hasBlueStarUnit([...characters, ...mowRosterUnits]);
    const tier = plTier(pl, rosterHasBlueStarUnit);

    const matchesConditions = useCallback(
        (product: ShopProduct): boolean => eventProductMatches(product, pl, lockContext),
        [pl, lockContext]
    );

    const weekCount = event?.weeks.length ?? 0;
    const currencyIconKey = event ? (getShopCurrencyIconKey(event.currencyType) ?? 'coin') : 'coin';

    // ── availability scan: all weeks × days (current conditions) ─────────────
    const allWeekDayAvailability = useMemo(() => {
        const map = new Map<string, Map<number, Set<Day>>>();
        if (!event) return map;
        for (let w = 1; w <= weekCount; w++) {
            const wd = event.weeks[w - 1];
            for (const slot of wd.products) {
                for (const d of dayOrder) {
                    const match = slot.find(p => cronMatchesDay(p.cronSchedule, d) && matchesConditions(p));
                    if (!match) continue;
                    const isFree = match.freeOffer !== undefined;
                    const rewardString = isFree ? match.freeOffer! : match.reward;
                    const typePrefix = rewardString.split(':')[0];
                    if (!map.has(typePrefix)) map.set(typePrefix, new Map());
                    const weekMap = map.get(typePrefix)!;
                    if (!weekMap.has(w)) weekMap.set(w, new Set());
                    weekMap.get(w)!.add(d);
                }
            }
        }
        return map;
    }, [event, weekCount, matchesConditions, dayOrder]);

    const effectiveCartTotalsByType = useMemo(() => {
        const totals: Record<string, number> = {};
        for (const [key, entry] of Object.entries(cart)) {
            const unpurchasedQty = Math.max(0, entry.quantity - (purchased[key] ?? 0));
            if (unpurchasedQty === 0) continue;
            const type = resolveCartEntryType(entry);
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

    const purchasedItemsByType = useMemo(() => {
        const map: Record<string, { label: string; icon: JSX.Element; total: number }> = {};
        for (const [key, purchasedQty] of Object.entries(purchased)) {
            if (purchasedQty <= 0) continue;
            const entry = cart[key];
            if (!entry) continue;
            const typePrefix = resolveCartEntryType(entry);
            const totalItems = purchasedQty * entry.qtyPerPack;
            if (map[typePrefix]) {
                map[typePrefix].total += totalItems;
            } else {
                const { icon, label } = rewardInfo(typePrefix);
                map[typePrefix] = { label, icon, total: totalItems };
            }
        }
        return Object.entries(map).filter(([, v]) => v.total > 0);
    }, [cart, purchased]);

    // Cheapest paid product per reward-type prefix (minimize cost per item unit).
    const cheapestOptionByType = useMemo(() => {
        const map = new Map<string, { qtyPerPack: number; costPerPack: number }>();
        if (!event) return map;
        for (let w = 1; w <= weekCount; w++) {
            const wd = event.weeks[w - 1];
            for (const slot of wd.products) {
                for (const d of dayOrder) {
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
    }, [event, weekCount, matchesConditions, dayOrder]);

    const coverageRows = useMemo(
        () =>
            computeCoverageRows({
                dayOrder,
                allWeekDayAvailability,
                neededBadges,
                neededOrbs,
                neededForgeBadges,
                neededComponents,
                effectiveCartTotalsByType,
                neededXp,
                pl,
                hasBlueStarUnit: rosterHasBlueStarUnit,
                mythicMissingByUpgradeId,
                totalGold,
                neededShardsByType,
                cheapestOptionByType,
            }),
        [
            dayOrder,
            allWeekDayAvailability,
            neededBadges,
            neededOrbs,
            neededForgeBadges,
            neededComponents,
            effectiveCartTotalsByType,
            neededXp,
            pl,
            rosterHasBlueStarUnit,
            mythicMissingByUpgradeId,
            totalGold,
            neededShardsByType,
            cheapestOptionByType,
        ]
    );

    const weekData = event?.weeks[week - 1];

    const resolvedSlots = useMemo<ResolvedSlot[]>(() => {
        if (!weekData) return [];
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
                    rewardString,
                } satisfies ResolvedSlot;
            })
            .filter((s): s is ResolvedSlot => s !== undefined);
    }, [day, weekData, matchesConditions]);

    // ── "Details" toggle: current rarity/stars/shards for a slot's character/MoW, if any ────────
    const resolveUnitShardDetails = useCallback(
        (rewardString: string): JSX.Element | undefined => {
            const [type] = rewardString.split(':');
            const isMythic = type.startsWith('mythicShards_');
            if (!isMythic && !type.startsWith('shards_')) return undefined;

            const unitId = type.slice(isMythic ? 'mythicShards_'.length : 'shards_'.length);
            const unit = allUnits.find(u => u.snowprintId === unitId);
            if (!unit) return undefined;

            const isCharacter = 'rank' in unit;
            const locked = isCharacter ? unit.rank === Rank.Locked : !(unit as IMow2).unlocked;

            return (
                <div className="mt-1 flex w-full flex-col gap-1 rounded-md bg-(--soft) px-2 py-1 text-[11px] text-(--soft-fg)">
                    <div className="flex items-center justify-center gap-1.5">
                        <RarityIcon rarity={unit.rarity} />
                        {locked ? (
                            <span className="font-semibold text-red-400">Locked</span>
                        ) : (
                            <StarsIcon stars={unit.stars} />
                        )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1">
                            <MiscIcon icon="shard" width={14} height={14} />
                            <span className="font-semibold text-(--fg)">{unit.shards}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="font-semibold text-(--fg)">{unit.mythicShards}</span>
                            <MiscIcon icon="mythicShard" width={14} height={14} />
                        </span>
                    </div>
                </div>
            );
        },
        [allUnits]
    );

    // ── shard-availability search (magnifying glass) ─────────────────────────────────────────────
    const renderShardAvailability = (rewardType: string, label: string) => {
        const weekMap = allWeekDayAvailability.get(rewardType);
        return (
            <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-(--fg)">{label}</span>
                {!weekMap || weekMap.size === 0 ? (
                    <span className="text-sm text-(--soft-fg)">Not available in this event.</span>
                ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {[...weekMap.entries()]
                            .toSorted(([a], [b]) => a - b)
                            .map(([w, days]) => (
                                <span
                                    key={w}
                                    className="flex items-center gap-1 rounded-full border border-(--border) bg-(--overlay) px-2 py-0.5 text-xs">
                                    <span className="font-semibold">W{w}</span>
                                    <span className="text-(--soft-fg)">
                                        {[...days].map(d => DAY_LABELS[d].slice(0, 3)).join(', ')}
                                    </span>
                                </span>
                            ))}
                    </div>
                )}
            </div>
        );
    };

    if (!event) {
        return (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
                <p className="text-(--soft-fg)">This shop event doesn&apos;t exist.</p>
                <Link
                    to="/plan/shop-events"
                    className="flex items-center gap-1.5 text-sm font-semibold text-(--primary)">
                    <ArrowLeft className="size-4" />
                    Back to Shop Events
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Link
                        to="/plan/shop-events"
                        className="flex items-center gap-1 rounded-lg border border-(--border) bg-(--overlay) px-2 py-1 text-xs font-semibold text-(--soft-fg) transition-colors hover:border-(--primary) hover:text-(--primary)">
                        <ArrowLeft className="size-3.5" />
                        Back
                    </Link>
                    <h1 className="text-2xl font-bold">{event.displayName}</h1>
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
                    <span className="text-sm font-medium text-(--fg)">Power Level</span>
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
                                    Medium: P.L. ≥{PL_MEDIUM}, no blue-star unit
                                    <br />
                                    High: P.L. ≥{PL_MEDIUM} with a blue-star unit
                                </span>
                            }>
                            <Info className="size-3.5 cursor-help" />
                        </AccessibleTooltip>
                    </p>
                </div>

                {/* Week */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-(--fg)">Week</label>
                    <div className="flex gap-1">
                        {Array.from({ length: weekCount }, (_, index) => index + 1).map(w => (
                            <button
                                key={w}
                                onClick={() => setWeek(w)}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                    week === w
                                        ? 'bg-(--primary) text-(--primary-fg)'
                                        : 'border border-(--border) bg-(--overlay) hover:border-(--primary)'
                                }`}>
                                Week {w}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Day */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-(--fg)">Day</label>
                    <div className="flex flex-wrap gap-1">
                        {dayOrder.map(d => (
                            <button
                                key={d}
                                onClick={() => setDay(d)}
                                className={`flex flex-col items-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                    day === d
                                        ? 'bg-(--primary) text-(--primary-fg)'
                                        : 'border border-(--border) bg-(--overlay) hover:border-(--primary)'
                                }`}>
                                <span>{DAY_LABELS[d].slice(0, 3)}</span>
                                <span className="text-[10px] font-normal tabular-nums opacity-70">
                                    {getEventDate(event, week, d)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <TabBar tabs={TAB_IDS} labels={TAB_LABELS} active={activeTab} onChange={setActiveTab} />

            <div className={activeTab === 'milestones' ? undefined : 'hidden'}>
                {weekData && <MilestonesTab week={weekData} currencyType={event.currencyType} />}
            </div>
            <div className={activeTab === 'missions' ? undefined : 'hidden'}>
                <MissionsTab missions={weekData?.missions} />
            </div>

            <div className={`flex flex-col gap-6 ${activeTab === 'shop' ? '' : 'hidden'}`}>
                {/* Daily Purchases */}
                {dateIndex &&
                    (() => {
                        const { week: selWeek, day: selDay } = dateIndex.allDates[selectedDateIndex];
                        const dayEntries = Object.entries(cart).filter(
                            ([, entry]) => entry.week === selWeek && entry.day === selDay
                        );
                        const dayTotal = dayEntries.reduce((s, [, entry]) => s + entry.quantity * entry.costPerUnit, 0);
                        const dateLabel = `${DAY_LABELS[selDay]}, ${getEventDate(event, selWeek, selDay)}`;
                        return (
                            <div className="rounded-xl border border-(--border) bg-(--overlay)">
                                <button
                                    onClick={() => setDailyPurchasesExpanded(previous => !previous)}
                                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-(--soft)">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Daily Purchases</span>
                                        <select
                                            value={selectedDateIndex}
                                            onClick={event_ => event_.stopPropagation()}
                                            onChange={event_ =>
                                                setSelectedDateIndex(Number(event_.currentTarget.value))
                                            }
                                            className="rounded-lg border border-(--border) bg-(--overlay) px-2 py-0.5 text-xs text-(--fg)">
                                            {dateIndex.allDates.map(({ week: w, day: d }, index) => (
                                                <option key={index} value={index}>
                                                    {`Week ${w} · ${DAY_LABELS[d].slice(0, 3)} ${getEventDate(event, w, d)}${index === dateIndex.todayIndex ? ' (Today)' : ''}`}
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
                                            <p className="text-sm text-(--soft-fg)">
                                                No purchases planned for {dateLabel}.
                                            </p>
                                        ) : (
                                            <>
                                                <div className="flex flex-col gap-2">
                                                    {dayEntries.map(([key, entry]) => {
                                                        const { icon } = rewardInfo(resolveCartEntryType(entry));
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
                                                                                purchased {purchasedQty}/
                                                                                {entry.quantity}
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
                                                                                    isFullyPurchased
                                                                                        ? 0
                                                                                        : entry.quantity
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
                                                                        icon={currencyIconKey}
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
                                                    <MiscIcon icon={currencyIconKey} width={14} height={14} />
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
                                    {purchasedItemsByType.length === 1
                                        ? '1 type'
                                        : `${purchasedItemsByType.length} types`}
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
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                            {info.icon}
                                        </div>
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
                                                    <MiscIcon icon={currencyIconKey} width={11} height={11} />
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
                {event.earningsInfographic && event.earningsInfographic.length > 0 && (
                    <div className="flex flex-wrap gap-3 rounded-xl border border-(--border) bg-(--overlay) px-4 py-3 text-sm">
                        {event.earningsInfographic.map((line, index) => (
                            <Fragment key={line.label}>
                                {index > 0 && <span className="text-(--soft-fg) select-none">·</span>}
                                <div className="flex items-center gap-1.5">
                                    <MiscIcon icon={currencyIconKey} width={16} height={16} />
                                    <span className="text-(--soft-fg)">{line.label}:</span>
                                    <span className="font-semibold text-amber-400">{line.amount}</span>
                                </div>
                            </Fragment>
                        ))}
                    </div>
                )}

                {/* Shard search + details toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <AccessibleTooltip title="Find which weeks/days a character or MoW's shards are available">
                        <button
                            onClick={() => setSearchOpen(true)}
                            aria-label="Find shard availability"
                            className="flex size-9 items-center justify-center rounded-lg border border-(--border) bg-(--overlay) text-(--soft-fg) transition-colors hover:border-(--primary) hover:text-(--primary)">
                            <Search className="size-4" />
                        </button>
                    </AccessibleTooltip>
                    <Switch isSelected={detailsEnabled} onChange={setDetailsEnabled}>
                        Details
                    </Switch>
                </div>

                <PortalDialog
                    open={searchOpen}
                    onClose={() => setSearchOpen(false)}
                    aria-label="Find shard availability"
                    size="sm">
                    <PortalDialog.Header>Find shard availability</PortalDialog.Header>
                    <PortalDialog.Body>
                        <UnitsAutocomplete<IUnit>
                            options={allUnits}
                            unit={searchUnit}
                            onUnitChange={setSearchUnit}
                            label="Character or MoW"
                        />
                        {searchUnit && (
                            <div className="flex flex-col gap-3">
                                {renderShardAvailability(`shards_${searchUnit.snowprintId}`, 'Shards')}
                                {renderShardAvailability(`mythicShards_${searchUnit.snowprintId}`, 'Mythic Shards')}
                            </div>
                        )}
                    </PortalDialog.Body>
                </PortalDialog>

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
                            const draftAlliance = cart[key]?.draftAlliance;
                            const maxQty =
                                slot.product.maxPurchases === undefined
                                    ? undefined
                                    : Number.parseInt(slot.product.maxPurchases, 10);
                            return (
                                <ShopCard
                                    key={index}
                                    slot={slot}
                                    cartQty={cartQty}
                                    draftAlliance={draftAlliance}
                                    currencyIconKey={currencyIconKey}
                                    details={detailsEnabled ? resolveUnitShardDetails(slot.rewardString) : undefined}
                                    onConfirm={(qty, alliance) =>
                                        setCartQty(key, qty, {
                                            week,
                                            slotIndex: slot.slotIndex,
                                            day,
                                            label: slot.label,
                                            rewardString: slot.rewardString,
                                            costPerUnit: slot.cost,
                                            maxQty,
                                            qtyPerPack: slot.qty ?? 1,
                                            draftAlliance: alliance,
                                        })
                                    }
                                />
                            );
                        })}
                    </div>
                )}

                <ShoppingList
                    cart={cart}
                    weekCount={weekCount}
                    currencyIconKey={currencyIconKey}
                    dayOrder={dayOrder}
                    onSetQty={(key, qty) => setCartQty(key, qty)}
                    onResetWeek={setConfirmResetWeek}
                />

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

                {purchasedDialogKey !== undefined && cart[purchasedDialogKey ?? ''] && (
                    <PurchasedQtyModal
                        key={purchasedDialogKey}
                        isOpen={true}
                        entry={cart[purchasedDialogKey ?? '']!}
                        icon={rewardInfo(resolveCartEntryType(cart[purchasedDialogKey ?? '']!)).icon}
                        initialPurchased={purchased[purchasedDialogKey ?? ''] ?? 0}
                        onConfirm={qty => {
                            setPurchasedQty(purchasedDialogKey ?? '', qty);
                            setPurchasedDialogKey(undefined);
                        }}
                        onClose={() => setPurchasedDialogKey(undefined)}
                    />
                )}
            </div>
        </div>
    );
};
