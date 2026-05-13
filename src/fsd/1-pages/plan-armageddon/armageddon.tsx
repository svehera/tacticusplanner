/* eslint-disable import-x/no-internal-modules */
import { JSX, useCallback, useContext, useMemo, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { Alliance, Rarity, RarityMapper, RarityString, RarityStars } from '@/fsd/5-shared/model';
import { BadgeImage, ForgeBadgeImage, MiscIcon, OrbIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { NumberInput } from '@/fsd/5-shared/ui/input/number-input';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentService } from '@/fsd/4-entities/equipment';
import { EquipmentIcon } from '@/fsd/4-entities/equipment/ui';
import { MowsService } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import armageddonData from './data/armageddon.json';

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
            label: isMythic ? 'Mythic Shards' : 'Shards',
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
    label: string;
    qty: number | undefined;
    icon: JSX.Element;
    isFree: boolean;
    cost: number;
}

// ─── shop card ───────────────────────────────────────────────────────────────

function ShopCard({ slot }: { slot: ResolvedSlot }) {
    const { label, qty, icon, isFree, cost, product } = slot;
    const maxPurchases = product.maxPurchases ? Number.parseInt(product.maxPurchases, 10) : undefined;

    return (
        <div className="flex flex-col gap-2 rounded-xl border border-(--border) bg-(--overlay) p-3">
            {/* Icon + name row */}
            <div className="flex items-center gap-2">
                <div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center">{icon}</div>
                <p className="min-w-0 truncate text-sm font-semibold">{label}</p>
            </div>

            {/* Quantity */}
            {qty !== undefined && <span className="text-base font-bold tabular-nums">×{qty.toLocaleString()}</span>}

            {/* Cost row */}
            <div className="flex items-center justify-between gap-2 border-t border-(--border) pt-2">
                {isFree ? (
                    <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs font-medium text-green-400">
                        Free
                    </span>
                ) : (
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-amber-400">{cost}</span>
                        <MiscIcon icon="armageddonCurrency" width={16} height={16} />
                    </div>
                )}
                {maxPurchases !== undefined && (
                    <span className="rounded bg-(--muted) px-1.5 py-0.5 text-xs text-(--muted-fg)">
                        max {maxPurchases}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── main page ────────────────────────────────────────────────────────────────

export const Armageddon = () => {
    const { characters, mows } = useContext(StoreContext);

    const [week, setWeek] = useState<1 | 2 | 3>(1);
    const [day, setDay] = useState<Day>('MON');
    const [pl, setPl] = useState(1);

    // Build snowprintId → unit lookup from store
    const charBySnowprintId = useMemo(() => {
        const map: Record<string, (typeof characters)[0]> = {};
        for (const c of characters) map[c.snowprintId] = c;
        return map;
    }, [characters]);

    const mowBySnowprintId = useMemo(() => {
        const map: Record<string, (typeof mows)[0]> = {};
        for (const m of mows) if (m.snowprintId) map[m.snowprintId] = m;
        return map;
    }, [mows]);

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

    const weekData: ArmageddonWeek = (armageddonData as unknown as ArmageddonWeek[])[week - 1];

    const resolvedSlots = useMemo<ResolvedSlot[]>(() => {
        return weekData.products
            .map(slot => {
                const match = slot.find(p => cronMatchesDay(p.cronSchedule, day) && matchesConditions(p));
                if (!match) return;
                const isFree = match.freeOffer !== undefined;
                const rewardString = isFree ? match.freeOffer! : match.reward;
                const { label, qty, icon } = rewardInfo(rewardString);
                return {
                    product: match,
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
                <h1 className="text-2xl font-bold">Armageddon Shop</h1>
                <span className="text-sm text-(--muted-fg)">{resolvedSlots.length} offers available</span>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-end gap-4 rounded-xl border border-(--border) bg-(--overlay) p-4">
                {/* Player Level */}
                <div className="min-w-[140px]">
                    <NumberInput label="Player Level" min={1} max={99} value={pl} valueChange={setPl} />
                    <p className="mt-1 text-xs text-(--muted-fg)">
                        Tier: <span className="font-semibold text-amber-400 capitalize">{tier}</span>
                        <span className="ml-1 text-(--muted-fg)">
                            (low &lt;{PL_MEDIUM}, medium {PL_MEDIUM}–{PL_HIGH - 1}, high ≥{PL_HIGH})
                        </span>
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
                                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                    day === d
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-(--border) bg-(--overlay) hover:border-blue-500'
                                }`}>
                                {DAY_LABELS[d].slice(0, 3)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Shop grid */}
            {resolvedSlots.length === 0 ? (
                <div className="rounded-xl border border-(--border) bg-(--overlay) p-8 text-center text-(--muted-fg)">
                    No offers available for the selected week / day / player level.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {resolvedSlots.map((slot, index) => (
                        <ShopCard key={index} slot={slot} />
                    ))}
                </div>
            )}
        </div>
    );
};
