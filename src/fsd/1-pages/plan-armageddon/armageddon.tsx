/* eslint-disable import-x/no-internal-modules */
import { cloneDeep } from 'lodash';
import { ChevronDown, Info, Minus, Plus, TriangleAlert, Trash2 } from 'lucide-react';
import { JSX, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { IDailyRaidsFarmOrder, IArmageddonCartEntry, IArmageddonCart } from '@/models/interfaces';
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import {
    Alliance,
    Rarity,
    RarityMapper,
    RarityString,
    RarityStars,
    XP_BOOK_VALUE,
    useAuth,
} from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui/button';
import { BadgeImage, ForgeBadgeImage, MiscIcon, OrbIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { Modal } from '@/fsd/5-shared/ui/modal';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';
import { AccessibleTooltip, LazyTooltip } from '@/fsd/5-shared/ui/tooltip';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentService } from '@/fsd/4-entities/equipment';
import { EquipmentIcon } from '@/fsd/4-entities/equipment/ui';
import { MowsService } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService as GoalUpgradesService } from '@/fsd/3-features/goals/upgrades.service';

import armageddonData from './data/armageddon.json';

// Source of event currency:
// Yarrick's quest (week 1?): 5, 10, 10, 15
// TA (week 2?): 10, 10, 10, 10
// Lav's quest (week 3?): 5, 10, 10, 15 ---> says Lav, but it will probably be someone else
// shop itself: 6x5 per week for free
// global hse week 1: 2x35
// global hse week 2: 2x40
// global hse week 3: 2x50
// hse (per week)): 25, 50
// milestones payouts (per week): 16x50
// premium mission chain (per week): 10x50
// calendar (per week): free currency 2x10
// tactician's club offer: 100 (costs 400 credits)
//
// 1st week f2p: 40+30+75+70+800+20 = 1065
// 2nd week f2p: 40+30+75+80+800+20 = 1075
// 3rd week f2p: 40+30+75+80+800+20 = 1095
//
// 1st week with bonus: 1945
// 2nd week with bonus: 1955
// 3rd week with bonus: 1975

// ─── uncraftable mythic upgrade materials (same set as goals page) ────────────

const MYTHIC_UNCRAFTABLE_UPGRADES = [
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

// ─── types ────────────────────────────────────────────────────────────────────

interface ArmageddonProduct {
    weight: number;
    conditions: {
        minPowerLevel?: number;
        maxPowerLevel?: number;
        lockId?: string;
    };
    cronSchedule: string;
    reward: string;
    cost: { type: string; amount: number };
    maxPurchases?: string;
    freeOffer?: string;
}

interface ArmageddonWeek {
    displayLocation: string;
    products: ArmageddonProduct[][];
}

// ─── constants ────────────────────────────────────────────────────────────────

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
type Day = (typeof DAYS)[number];

const DAY_LABELS: Record<Day, string> = {
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
    SUN: 'Sunday',
};

// Event start date: June 22, 2026 (Monday of week 1)
const EVENT_START_UTC = Date.UTC(2026, 5, 22); // months are 0-indexed

function getEventDate(week: 1 | 2 | 3, day: Day): string {
    const dayIndex = DAYS.indexOf(day);
    const offsetMs = ((week - 1) * 7 + dayIndex) * 86_400_000;
    const d = new Date(EVENT_START_UTC + offsetMs);
    const month = d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
    const dayNumber = d.getUTCDate().toString().padStart(2, '0');
    return `${month} ${dayNumber}`;
}

// Computed once at module load (acceptable: changes at most once per day).
const _TODAY_OFFSET_DAYS = (() => {
    const now = new Date();
    const utcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.round((utcMs - EVENT_START_UTC) / 86_400_000);
})();
// 0–20 if currently in the event, -1 otherwise.
const TODAY_EVENT_INDEX = _TODAY_OFFSET_DAYS >= 0 && _TODAY_OFFSET_DAYS < 21 ? _TODAY_OFFSET_DAYS : -1;
// Default index for the Daily Purchases dropdown:
//   before event → first day (0), during event → today, after event → last day (20).
const TODAY_DEFAULT_INDEX = TODAY_EVENT_INDEX >= 0 ? TODAY_EVENT_INDEX : _TODAY_OFFSET_DAYS < 0 ? 0 : 20;

// All 21 event day slots, indexed 0–20.
const ALL_EVENT_DATES = Array.from({ length: 21 }, (_, index) => ({
    week: (Math.floor(index / 7) + 1) as 1 | 2 | 3,
    day: DAYS[index % 7],
}));

// PL tier thresholds
const PL_HIGH = 25;
const PL_MEDIUM = 15;
// < PL_MEDIUM → low

// "Max legendary" = first blue star or higher (includes mythic)
const MAX_LEGENDARY_THRESHOLD = RarityStars.OneBlueStar;

// ─── helpers ──────────────────────────────────────────────────────────────────

function cronMatchesDay(cronSchedule: string, day: Day): boolean {
    // Quartz cron: "0 0 0 ? * DOW *"  — field 6 (0-indexed 5) is day-of-week
    const parts = cronSchedule.split(' ');
    const dowField = parts[5] ?? '*';
    if (dowField === '*') return true;
    return dowField.split(',').includes(day);
}

function plTier(pl: number): 'high' | 'medium' | 'low' {
    if (pl >= PL_HIGH) return 'high';
    if (pl >= PL_MEDIUM) return 'medium';
    return 'low';
}

const ICON_SIZE = 45;

function rewardInfo(reward: string): { icon: JSX.Element; label: string; qty: number | undefined } {
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
    return { icon: <span className="text-xs break-all text-(--muted-fg)">{type}</span>, label: type, qty };
}

// ─── resolved product ─────────────────────────────────────────────────────────

interface ResolvedSlot {
    product: ArmageddonProduct;
    slotIndex: number;
    label: string;
    qty: number | undefined;
    icon: JSX.Element;
    isFree: boolean;
    cost: number;
}

// ─── cart ─────────────────────────────────────────────────────────────────────

type CartEntry = IArmageddonCartEntry;
type CartRecord = IArmageddonCart;

function cartKey(week: 1 | 2 | 3, slotIndex: number, day: Day): string {
    return `${week}-${slotIndex}-${day}`;
}

// ─── shop card ───────────────────────────────────────────────────────────────

interface ShopCardProps {
    slot: ResolvedSlot;
    cartQty: number;
    onSetQty: (qty: number) => void;
}

function ShopCard({ slot, cartQty, onSetQty }: ShopCardProps) {
    const { label, qty: qtyPerPack, icon, isFree, cost, product } = slot;
    const maxQty = product.maxPurchases === undefined ? undefined : Number.parseInt(product.maxPurchases, 10);
    const remaining = maxQty === undefined ? undefined : maxQty - cartQty;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [sliderValue, setSliderValue] = useState(cartQty === 0 ? 1 : cartQty);

    const handleCardClick = () => {
        if (isFree) return;
        setSliderValue(cartQty === 0 ? 1 : cartQty);
        setDialogOpen(true);
    };

    const sliderMax = maxQty ?? 10;
    const confirmDisabled = sliderValue === 0 && cartQty === 0;

    const handleConfirm = () => {
        onSetQty(sliderValue);
        setDialogOpen(false);
    };

    return (
        <>
            {/* The card itself */}
            <div
                role={isFree ? undefined : 'button'}
                tabIndex={isFree ? undefined : 0}
                onClick={handleCardClick}
                onKeyDown={event_ => {
                    if (event_.key === 'Enter' || event_.key === ' ') handleCardClick();
                }}
                className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${isFree ? 'border-(--border) bg-(--overlay)' : 'cursor-pointer border-(--border) bg-(--overlay) hover:scale-[1.04] hover:border-blue-500 hover:shadow-md active:scale-[0.98]'} ${cartQty > 0 ? 'ring-2 ring-blue-500/60' : ''}`}>
                {/* Cart badge */}
                {cartQty > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                        {cartQty}
                    </span>
                )}
                {/* Icon */}
                <div className="flex h-[45px] w-[45px] items-center justify-center">{icon}</div>
                {/* Pack qty */}
                {qtyPerPack !== undefined && (
                    <span className="text-xs font-bold text-(--muted-fg) tabular-nums">
                        ×{qtyPerPack.toLocaleString()}
                    </span>
                )}
                {/* Cost / free badge */}
                {isFree ? (
                    <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                        Free
                    </span>
                ) : (
                    <div className="flex items-center gap-0.5">
                        <span className="text-[11px] font-semibold text-amber-400">{cost}</span>
                        <MiscIcon icon="armageddonCurrency" width={12} height={12} />
                    </div>
                )}
                {/* Remaining */}
                {remaining !== undefined && !isFree && (
                    <span className="text-[10px] text-(--muted-fg)">{remaining} left</span>
                )}
                {/* Label – don't show it */}
                {/* <p className="hidden w-full truncate text-center text-xs font-semibold sm:block">{label}</p> */}
            </div>

            {/* Quantity dialog */}
            <Modal
                isOpen={dialogOpen}
                onOpenChange={open => {
                    if (!open) setDialogOpen(false);
                }}>
                <Modal.Content size="sm">
                    <Modal.Header>
                        <Modal.Title className="flex items-center gap-2">
                            <span className="inline-flex h-9 w-9 items-center justify-center">{icon}</span>
                            {label}
                        </Modal.Title>
                        {qtyPerPack !== undefined && (
                            <Modal.Description>×{qtyPerPack.toLocaleString()} per purchase</Modal.Description>
                        )}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="flex flex-col gap-4 py-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-(--muted-fg)">
                                    Quantity: <span className="text-fg font-bold">{sliderValue}</span>
                                    {maxQty !== undefined && <span className="text-(--muted-fg)"> / {maxQty}</span>}
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-amber-400">{sliderValue * cost}</span>
                                    <MiscIcon icon="armageddonCurrency" width={14} height={14} />
                                </div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={sliderMax}
                                value={sliderValue}
                                onChange={event_ => setSliderValue(Number(event_.currentTarget.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button appearance="outline" className="w-full sm:w-auto" onPress={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            intent="primary"
                            className="w-full sm:w-auto"
                            isDisabled={confirmDisabled}
                            onPress={handleConfirm}>
                            {sliderValue === 0 ? 'Remove from list' : `Add ×${sliderValue} to list`}
                        </Button>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>
        </>
    );
}

// ─── shopping list ────────────────────────────────────────────────────────────

function ShoppingList({
    cart,
    onSetQty,
    onResetWeek,
}: {
    cart: CartRecord;
    onSetQty: (key: string, qty: number) => void;
    onResetWeek: (w: 1 | 2 | 3) => void;
}) {
    const weekNumbers = [1, 2, 3] as const;
    const [sortByDay, setSortByDay] = useState(false);
    const total = useMemo(
        () => Object.values(cart).reduce((sum, cartEntry) => sum + cartEntry.quantity * cartEntry.costPerUnit, 0),
        [cart]
    );

    if (Object.keys(cart).length === 0) return;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold">Shopping List</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSortByDay(previous => !previous)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            sortByDay
                                ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                                : 'border-(--border) bg-(--overlay) text-(--muted-fg) hover:border-blue-500'
                        }`}>
                        Sort by {sortByDay ? 'day' : 'item type'}
                    </button>
                    <div className="flex items-center gap-1 text-sm">
                        <span className="text-(--muted-fg)">Grand total:</span>
                        <span className="font-semibold text-amber-400">{total.toLocaleString()}</span>
                        <MiscIcon icon="armageddonCurrency" width={14} height={14} />
                    </div>
                </div>
            </div>

            {weekNumbers.map(w => {
                const rawEntries = Object.entries(cart).filter(([, cartEntry]) => cartEntry.week === w);
                const entries = rawEntries.toSorted(([, a], [, b]) =>
                    sortByDay
                        ? DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.label.localeCompare(b.label)
                        : a.label.localeCompare(b.label)
                );
                if (rawEntries.length === 0) return;
                const weekTotal = entries.reduce(
                    (sum, [, cartEntry]) => sum + cartEntry.quantity * cartEntry.costPerUnit,
                    0
                );

                // Aggregate resource totals per reward type
                const resourceMap: Record<string, { label: string; icon: JSX.Element; total: number }> = {};
                for (const [, entry] of entries) {
                    const key = entry.rewardString.split(':')[0];
                    const totalQty = entry.quantity * entry.qtyPerPack;
                    if (resourceMap[key]) {
                        resourceMap[key].total += totalQty;
                    } else {
                        const info = rewardInfo(entry.rewardString);
                        resourceMap[key] = { label: info.label, icon: info.icon, total: totalQty };
                    }
                }

                return (
                    <div key={w} className="flex flex-col gap-3 rounded-xl border border-(--border) bg-(--overlay) p-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">Week {w}</span>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-sm">
                                    <span className="font-semibold text-amber-400">{weekTotal.toLocaleString()}</span>
                                    <MiscIcon icon="armageddonCurrency" width={12} height={12} />
                                </div>
                                <Button
                                    intent="danger"
                                    appearance="outline"
                                    size="small"
                                    onPress={() => onResetWeek(w)}>
                                    Reset Week {w}
                                </Button>
                            </div>
                        </div>

                        {/* Resource summary */}
                        <div className="flex flex-wrap gap-3 rounded-lg bg-(--muted) p-2">
                            {Object.entries(resourceMap).map(([rKey, resource]) => (
                                <div key={rKey} className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                                        {resource.icon}
                                    </div>
                                    <span className="text-xs font-semibold tabular-nums">
                                        ×{resource.total.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Line items */}
                        <div className="flex flex-col gap-2">
                            {entries.map(([key, entry]) => {
                                const { icon } = rewardInfo(entry.rewardString);
                                const lineTotal = entry.quantity * entry.costPerUnit;

                                return (
                                    <div key={key} className="flex items-center gap-2 rounded-lg bg-(--muted) p-2">
                                        <div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center">
                                            {icon}
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <span className="truncate text-sm font-medium">{entry.label}</span>
                                            <span className="text-xs text-(--muted-fg)">
                                                {DAY_LABELS[entry.day]}
                                                {entry.qtyPerPack > 1 && (
                                                    <span> &middot; ×{entry.qtyPerPack} each</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-0.5">
                                            <Button
                                                size="square-petite"
                                                appearance="outline"
                                                onPress={() => onSetQty(key, entry.quantity - 1)}>
                                                <Minus className="size-3" />
                                            </Button>
                                            <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums">
                                                {entry.quantity}
                                            </span>
                                            <Button
                                                size="square-petite"
                                                appearance="outline"
                                                isDisabled={
                                                    entry.maxQty === undefined ? false : entry.quantity >= entry.maxQty
                                                }
                                                onPress={() => onSetQty(key, entry.quantity + 1)}>
                                                <Plus className="size-3" />
                                            </Button>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <span className="text-xs font-semibold text-amber-400">{lineTotal}</span>
                                            <MiscIcon icon="armageddonCurrency" width={12} height={12} />
                                        </div>
                                        <Button
                                            size="square-petite"
                                            appearance="plain"
                                            onPress={() => onSetQty(key, 0)}>
                                            <Trash2 className="size-3.5 text-red-400" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── coverage helpers ────────────────────────────────────────────────────────

interface CoverageRow {
    rewardType: string;
    label: string;
    icon: JSX.Element;
    needed: number;
    cartTotal: number;
    remaining: number;
    availability: Array<{ week: 1 | 2 | 3; days: Day[] }>;
    note?: string;
}

function getNeededForRewardType(
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

function formatGold(amount: number): string {
    if (amount < 1_000_000) {
        return `${Math.round(amount / 1000)}K`;
    }
    return `${(Math.round(amount / 100_000) / 10).toFixed(1)}M`;
}

function coverageRowSortPriority(rewardType: string): number {
    if (rewardType === 'gold') return 0;
    if (rewardType.startsWith('xp')) return 1;
    if (rewardType.startsWith('abilityToken')) return 2;
    if (rewardType.startsWith('heroAscensionOrb')) return 3;
    if (rewardType.startsWith('itemAscensionResource_')) return 4;
    if (['upgHpM001', 'upgHpM002', 'upgHpM003', 'upgHpM004'].includes(rewardType)) return 5;
    return 6;
}

// ─── main page ────────────────────────────────────────────────────────────────

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

    const [week, setWeekState] = useState<1 | 2 | 3>(1);
    const [day, setDayState] = useState<Day>('MON');
    const pl = playerMetadata.powerLevel ?? 1;
    const [cart, setCart] = useState<CartRecord>(() => armageddonState.cart ?? {});
    const [confirmResetWeek, setConfirmResetWeek] = useState<1 | 2 | 3 | undefined>();
    const [coverageExpanded, setCoverageExpanded] = useState(false);
    const [dailyPurchasesExpanded, setDailyPurchasesExpanded] = useState(false);
    const [selectedDateIndex, setSelectedDateIndex] = useState(TODAY_DEFAULT_INDEX);

    const setWeek = setWeekState;
    const setDay = setDayState;

    // Persist cart whenever it changes (skip initial render to avoid a spurious save on mount)
    const isFirstCartPersist = useRef(true);
    useEffect(() => {
        if (isFirstCartPersist.current) {
            isFirstCartPersist.current = false;
            return;
        }
        dispatch.armageddon({ type: 'Update', setting: 'cart', value: cart });
    }, [cart, dispatch]);

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

    const setCartQty = useCallback((key: string, qty: number, newEntryMeta?: Omit<CartEntry, 'quantity'>) => {
        setCart(previous => {
            if (qty <= 0) {
                const next = { ...previous };
                delete next[key];
                return next;
            }
            const existing = previous[key];
            if (existing) return { ...previous, [key]: { ...existing, quantity: qty } };
            if (newEntryMeta) return { ...previous, [key]: { ...newEntryMeta, quantity: qty } };
            return previous;
        });
    }, []);

    const resetWeek = useCallback((w: 1 | 2 | 3) => {
        setCart(previous => {
            const next = { ...previous };
            for (const k of Object.keys(next)) {
                if (next[k].week === w) delete next[k];
            }
            return next;
        });
        setConfirmResetWeek(undefined);
    }, []);

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
        (product: ArmageddonProduct): boolean => {
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

    // ── coverage rows ─────────────────────────────────────────────────────────
    const cartTotalsByType = useMemo(() => {
        const totals: Record<string, number> = {};
        for (const entry of Object.values(cart)) {
            const type = entry.rewardString.split(':')[0];
            totals[type] = (totals[type] ?? 0) + entry.quantity * entry.qtyPerPack;
        }
        return totals;
    }, [cart]);

    const coverageRows = useMemo<CoverageRow[]>(() => {
        const XP_BOOK_TYPES = new Set(['xpRare', 'xpLegendary', 'xpMythic']);
        const rows: CoverageRow[] = [];
        for (const [typePrefix, weekDayMap] of allWeekDayAvailability) {
            // XP books are merged into a single grimoires row below
            if (XP_BOOK_TYPES.has(typePrefix)) continue;
            const needed = getNeededForRewardType(typePrefix, neededBadges, neededOrbs, neededForgeBadges);
            if (needed === 0) continue;
            const cartTotal = cartTotalsByType[typePrefix] ?? 0;
            const availability = [...weekDayMap.entries()]
                .toSorted(([a], [b]) => a - b)
                .map(([w, daysSet]) => ({
                    week: w,
                    days: DAYS.filter(d => daysSet.has(d)),
                }));
            const { icon, label } = rewardInfo(typePrefix);
            rows.push({
                rewardType: typePrefix,
                label,
                icon,
                needed,
                cartTotal,
                remaining: Math.max(0, needed - cartTotal),
                availability,
            });
        }

        // ── XP books (tier-appropriate denomination) ─────────────────────────
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
        const currentTier = plTier(pl);
        const xpBook = tierToXpBook[currentTier];
        const xpBookValue = XP_BOOK_VALUE[xpBook.rarity];
        const neededBooks = Math.ceil(neededXp / xpBookValue);
        if (neededBooks > 0) {
            // Only show availability for the relevant book type
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
            for (const entry of Object.values(cart)) {
                const xpPerBook = xpBookXpValues[entry.rewardString.split(':')[0]];
                if (xpPerBook !== undefined) cartXp += entry.quantity * entry.qtyPerPack * xpPerBook;
            }
            const cartBooks = Math.floor(cartXp / xpBookValue);
            const availability = [...xpWeekDayMap.entries()]
                .toSorted(([a], [b]) => a - b)
                .map(([w, daysSet]) => ({
                    week: w,
                    days: DAYS.filter(d => daysSet.has(d)),
                }));
            rows.push({
                rewardType: xpBook.type,
                label: xpBook.label,
                icon: <MiscIcon icon={xpBook.iconKey} width={ICON_SIZE} height={ICON_SIZE} />,
                needed: neededBooks,
                cartTotal: cartBooks,
                remaining: Math.max(0, neededBooks - cartBooks),
                availability,
            });
        }

        // ── Mythic uncraftable upgrade materials ──────────────────────────────
        for (const upg of MYTHIC_UNCRAFTABLE_UPGRADES) {
            const needed = mythicMissingByUpgradeId[upg.id] ?? 0;
            if (needed === 0) continue;
            const cartTotal = cartTotalsByType[upg.id] ?? 0;
            const weekDayMap = allWeekDayAvailability.get(upg.id);
            const availability = weekDayMap
                ? [...weekDayMap.entries()]
                      .toSorted(([a], [b]) => a - b)
                      .map(([w, daysSet]) => ({ week: w, days: DAYS.filter(d => daysSet.has(d)) }))
                : [];
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
                remaining: Math.max(0, needed - cartTotal),
                availability,
            });
        }

        // ── Gold ───────────────────────────────────────────────────────────
        if (totalGold > 0) {
            const cartGold = cartTotalsByType['gold'] ?? 0;
            const goldWeekDayMap = allWeekDayAvailability.get('gold');
            const goldAvailability = goldWeekDayMap
                ? [...goldWeekDayMap.entries()]
                      .toSorted(([a], [b]) => a - b)
                      .map(([w, daysSet]) => ({ week: w, days: DAYS.filter(d => daysSet.has(d)) }))
                : [];
            rows.push({
                rewardType: 'gold',
                label: 'Gold',
                icon: <MiscIcon icon="coin" width={ICON_SIZE} height={ICON_SIZE} />,
                needed: totalGold,
                cartTotal: cartGold,
                remaining: Math.max(0, totalGold - cartGold),
                availability: goldAvailability,
                note: 'The API does not tell us how many coins you have, so this is the total you need, not the total you are missing.',
            });
        }

        return rows.toSorted(
            (a, b) =>
                coverageRowSortPriority(a.rewardType) - coverageRowSortPriority(b.rewardType) ||
                a.label.localeCompare(b.label)
        );
    }, [
        allWeekDayAvailability,
        neededBadges,
        neededOrbs,
        neededForgeBadges,
        cartTotalsByType,
        neededXp,
        cart,
        pl,
        mythicMissingByUpgradeId,
        totalGold,
    ]);

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
                    {hasSync && <SyncButton showText={false} iconButton={true} />}
                </div>
                <span className="text-sm text-(--muted-fg)">{resolvedSlots.length} offers available</span>
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
                    <p className="mt-1 flex items-center gap-1 text-xs text-(--muted-fg)">
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
                            className="flex w-full items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-(--muted)">
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
                                className={`size-4 text-(--muted-fg) transition-transform duration-200 ${
                                    dailyPurchasesExpanded ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {dailyPurchasesExpanded && (
                            <div className="flex flex-col gap-3 border-t border-(--border) p-4">
                                {dayEntries.length === 0 ? (
                                    <p className="text-sm text-(--muted-fg)">No purchases planned for {dateLabel}.</p>
                                ) : (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            {dayEntries.map(([key, entry]) => {
                                                const { icon } = rewardInfo(entry.rewardString);
                                                const lineTotal = entry.quantity * entry.costPerUnit;
                                                return (
                                                    <div
                                                        key={key}
                                                        className="flex items-center gap-2 rounded-lg bg-(--muted) p-2">
                                                        <div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center">
                                                            {icon}
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                            <span className="truncate text-sm font-medium">
                                                                {entry.label}
                                                            </span>
                                                            {entry.qtyPerPack > 1 && (
                                                                <span className="text-xs text-(--muted-fg)">
                                                                    ×{entry.qtyPerPack} each
                                                                </span>
                                                            )}
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
                                            <span className="text-(--muted-fg)">Day total:</span>
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

            {/* Missing resources coverage */}
            {coverageRows.length > 0 && (
                <div className="rounded-xl border border-(--border) bg-(--overlay)">
                    <button
                        onClick={() => setCoverageExpanded(previous => !previous)}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-(--muted)">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Missing Resources</span>
                            <span className="rounded-full bg-(--secondary) px-2 py-0.5 text-xs text-(--muted-fg)">
                                {coverageRows.length === 1 ? '1 type' : `${coverageRows.length} types`}
                            </span>
                            {coverageRows.some(r => r.remaining > 0) && (
                                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                                    {coverageRows.filter(r => r.remaining > 0).length} unmet
                                </span>
                            )}
                        </div>
                        <ChevronDown
                            className={`size-4 text-(--muted-fg) transition-transform duration-200 ${
                                coverageExpanded ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    {coverageExpanded && (
                        <div className="flex flex-col gap-2 border-t border-(--border) p-4">
                            {coverageRows.map(row => (
                                <div
                                    key={row.rewardType}
                                    className="flex flex-col gap-2 rounded-lg border border-(--border) bg-(--muted) p-3 sm:flex-row sm:flex-wrap sm:items-start">
                                    {/* Icon + label */}
                                    <div className="flex shrink-0 items-center gap-2 sm:w-52">
                                        <div className="flex h-8 w-8 items-center justify-center">{row.icon}</div>
                                        <span className="text-sm leading-tight font-medium">{row.label}</span>
                                    </div>

                                    {/* Counts */}
                                    <div className="flex shrink-0 items-center gap-3 text-sm">
                                        <span className="flex items-center gap-1 text-(--muted-fg)">
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
                                            <span className="text-(--muted-fg)">
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
                                    </div>

                                    {/* Availability chips */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {row.availability.map(({ week: w, days }) => (
                                            <span
                                                key={w}
                                                className="flex items-center gap-1 rounded-full border border-(--border) bg-(--overlay) px-2 py-0.5 text-xs">
                                                <span className="font-semibold">W{w}</span>
                                                <span className="text-(--muted-fg)">
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
                    <span className="text-(--muted-fg)">F2P per week:</span>
                    <span className="font-semibold text-amber-400">1,050 – 1,100</span>
                </div>
                <span className="text-(--muted-fg) select-none">·</span>
                <div className="flex items-center gap-1.5">
                    <MiscIcon icon="armageddonCurrency" width={16} height={16} />
                    <span className="text-(--muted-fg)">Bonus shipment:</span>
                    <span className="font-semibold text-amber-400">+900</span>
                </div>
                <span className="text-(--muted-fg) select-none">·</span>
                <div className="flex items-center gap-1.5">
                    <MiscIcon icon="armageddonCurrency" width={16} height={16} />
                    <span className="text-(--muted-fg)">Rolls over each week</span>
                </div>
            </div>

            {/* Shop grid */}
            {resolvedSlots.length === 0 ? (
                <div className="rounded-xl border border-(--border) bg-(--overlay) p-8 text-center text-(--muted-fg)">
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
        </div>
    );
};
