/* eslint-disable import-x/no-internal-modules */
import { sum } from 'lodash';
import { ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { IDailyRaidsFarmOrder, IEstimatedRanksSettings } from '@/models/interfaces';
import { StoreContext } from '@/reducers/store.provider';

import { Alliance, RarityString } from '@/fsd/5-shared/model';
import { BadgeImage, MiscIcon, resolveSimpleRewardIcon } from '@/fsd/5-shared/ui/icons';
import { NumberInput } from '@/fsd/5-shared/ui/input';
import { Switch } from '@/fsd/5-shared/ui/switch';

import { CharactersService } from '@/fsd/4-entities/character';
import {
    getHseDisplayName,
    getHseDurationDays,
    getHseModesConfig,
    getHseRemainingDays,
    getHseSchedule,
    getHseScheduleStatus,
    getOfferEventPoints,
    homescreenEvents,
    HomescreenEventOffer,
    hseRaidPointsOverrides,
    resolveHseMilestones,
    resolveHseTier,
    tallyHseRewards,
} from '@/fsd/4-entities/homescreen_events';
import { MowsService } from '@/fsd/4-entities/mow';
import {
    getShopCurrencyIconKey,
    getShopCurrencyLabel,
    hasBlueStarUnit,
    parseReward,
    plTier,
} from '@/fsd/4-entities/shops';

import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

type WaveModeKey = 'onslaught' | 'salvageRun' | 'survival' | 'legendaryEvent' | 'incursion';
type FlatModeKey = 'arena' | 'tournamentArena';
type ModeKey = WaveModeKey | FlatModeKey;

const WAVE_MODE_KEYS: WaveModeKey[] = ['onslaught', 'salvageRun', 'survival', 'legendaryEvent', 'incursion'];
const FLAT_MODE_KEYS: FlatModeKey[] = ['arena', 'tournamentArena'];

const MODE_LABELS: Record<ModeKey, string> = {
    onslaught: 'Onslaught',
    salvageRun: 'Salvage Run',
    survival: 'Survival',
    legendaryEvent: 'Legendary Event',
    incursion: 'Incursion',
    arena: 'Arena',
    tournamentArena: 'Tournament Arena',
};

const REWARD_ICON_SIZE = 28;

/** Resolves a reward `type` (from parseReward) to an icon + label. Small, feature-local resolver — matches this codebase's convention of duplicating per-feature reward resolvers rather than sharing one (see survival-event.utils.tsx) rather than reaching into the learn-hses page slice. */
function hseCalculatorRewardIcon(type: string): { icon: ReactNode; label: string } {
    const simple = resolveSimpleRewardIcon(type);
    if (simple) {
        return {
            icon: <MiscIcon icon={simple.iconKey} width={REWARD_ICON_SIZE} height={REWARD_ICON_SIZE} />,
            label: simple.label,
        };
    }

    const currencyIconKey = getShopCurrencyIconKey(type);
    if (currencyIconKey) {
        return {
            icon: <MiscIcon icon={currencyIconKey} width={REWARD_ICON_SIZE} height={REWARD_ICON_SIZE} />,
            label: getShopCurrencyLabel(type),
        };
    }

    const badgeMatch = /^abilityToken(Common|Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Xenos|Chaos)$/.exec(type);
    if (badgeMatch) {
        const rarity = badgeMatch[1] as RarityString;
        const alliance = badgeMatch[2] as Alliance;
        return {
            icon: <BadgeImage alliance={alliance} rarity={rarity} size="medium" />,
            label: `${rarity} ${alliance} Badge`,
        };
    }

    return { icon: <span className="text-[10px] text-(--soft-fg)">{type}</span>, label: type };
}

interface ModeState {
    enabled: boolean;
    tokensSpent: number;
    avgPerToken: number;
}

const EMPTY_MODE_STATE: ModeState = { enabled: false, tokensSpent: 0, avgPerToken: 0 };

const DEFAULT_MODE_STATES: Record<ModeKey, ModeState> = {
    onslaught: EMPTY_MODE_STATE,
    salvageRun: EMPTY_MODE_STATE,
    survival: EMPTY_MODE_STATE,
    legendaryEvent: EMPTY_MODE_STATE,
    incursion: EMPTY_MODE_STATE,
    arena: EMPTY_MODE_STATE,
    tournamentArena: EMPTY_MODE_STATE,
};

type RaidStrategy = 'totalMaterialsHseOptimized' | 'currentSettings' | 'maximizeHse';

const RAID_STRATEGY_OPTIONS: { value: RaidStrategy; label: string; description: string }[] = [
    {
        value: 'totalMaterialsHseOptimized',
        label: 'Sorted by total materials, optimized for this HSE',
        description: 'Combines all your active goals and prioritizes raids that also score well for this event.',
    },
    {
        value: 'currentSettings',
        label: 'Current raid settings',
        description:
            'Plans raids exactly as your Daily Raids settings are configured today, then tallies whatever HSE points fall out of that plan.',
    },
    {
        value: 'maximizeHse',
        label: 'Maximize HSE points',
        description:
            'Ignores goals entirely and spends all energy on whichever battles score the most points for this event.',
    },
];

function offerTitle(offerId: string): string {
    const kind = offerId.split('_').at(-1) ?? offerId;
    if (kind === 'bundle') return 'Bundle';
    if (kind === 'playmore') return 'Play More';
    if (kind === 'booster') return 'Booster';
    return kind;
}

function nonPointsRewardLabel(reward: string): string {
    const { type, qty } = parseReward(reward);
    if (type.startsWith('tieredRewardPoints_') || type.startsWith('draft_HSE_')) return '';
    return `×${qty} ${type}`;
}

export const HsePointsCalculator = () => {
    const {
        characters: unresolvedCharacters,
        mows,
        campaignsProgress,
        inventory,
        dailyRaids,
        dailyRaidsPreferences,
        goals,
        onslaughtPreferences,
        gameModeTokens,
        playerMetadata,
    } = useContext(StoreContext);

    const eventOptions = useMemo(
        () =>
            homescreenEvents
                .map(event => {
                    const schedule = getHseSchedule(event.eventName);
                    return {
                        event,
                        displayName: getHseDisplayName(event),
                        schedule,
                        status: getHseScheduleStatus(schedule),
                    };
                })
                .toSorted((a, b) => {
                    const rank = { active: 0, upcoming: 1, past: 2, unknown: 2 } as const;
                    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
                    if (a.status === 'upcoming' && b.status === 'upcoming' && a.schedule && b.schedule) {
                        return Date.parse(a.schedule.startUtc) - Date.parse(b.schedule.startUtc);
                    }
                    return a.displayName.localeCompare(b.displayName);
                }),
        []
    );

    const [selectedEventName, setSelectedEventName] = useState<string>(
        () => eventOptions.find(x => x.status === 'active' || x.status === 'upcoming')?.event.eventName ?? ''
    );

    const selectedOption = eventOptions.find(x => x.event.eventName === selectedEventName);

    const characters = useMemo(
        () => CharactersService.resolveStoredCharacters(unresolvedCharacters),
        [unresolvedCharacters]
    );
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const units = useMemo(() => [...characters, ...resolvedMows], [characters, resolvedMows]);

    const pl = playerMetadata.powerLevel ?? 1;
    const rosterHasBlueStarUnit = useMemo(() => hasBlueStarUnit(units), [units]);
    const tierKey = useMemo(() => {
        const tier = plTier(pl, rosterHasBlueStarUnit);
        return tier === 'medium' ? 'mid' : tier;
    }, [pl, rosterHasBlueStarUnit]);

    const resolvedTier = selectedOption ? resolveHseTier(selectedOption.event, tierKey) : undefined;

    const [modeStates, setModeStates] = useState<Record<ModeKey, ModeState>>(DEFAULT_MODE_STATES);
    const [offerQuantities, setOfferQuantities] = useState<Record<string, number>>({});
    const [raidStrategy, setRaidStrategy] = useState<RaidStrategy>('totalMaterialsHseOptimized');

    useEffect(() => {
        setOfferQuantities({});
        const option = eventOptions.find(x => x.event.eventName === selectedEventName);
        const tier = option ? resolveHseTier(option.event, tierKey) : undefined;
        if (!tier) {
            setModeStates(DEFAULT_MODE_STATES);
            return;
        }
        const config = getHseModesConfig(tier.tier, selectedEventName);
        setModeStates({
            onslaught: { ...EMPTY_MODE_STATE, enabled: config.onslaught.enabled },
            salvageRun: { ...EMPTY_MODE_STATE, enabled: config.salvageRun.enabled },
            survival: { ...EMPTY_MODE_STATE, enabled: config.survival.enabled },
            legendaryEvent: { ...EMPTY_MODE_STATE, enabled: config.legendaryEvent.enabled },
            incursion: { ...EMPTY_MODE_STATE, enabled: config.incursion.enabled },
            arena: { ...EMPTY_MODE_STATE, enabled: config.arena.enabled },
            tournamentArena: { ...EMPTY_MODE_STATE, enabled: config.tournamentArena.enabled },
        });
    }, [selectedEventName, tierKey, eventOptions]);

    const modesConfig = resolvedTier ? getHseModesConfig(resolvedTier.tier, selectedEventName) : undefined;

    const modePointsByKey = useMemo(() => {
        const result: Record<ModeKey, number> = {
            onslaught: 0,
            salvageRun: 0,
            survival: 0,
            legendaryEvent: 0,
            incursion: 0,
            arena: 0,
            tournamentArena: 0,
        };
        if (!modesConfig) return result;
        for (const key of WAVE_MODE_KEYS) {
            const state = modeStates[key];
            if (!state.enabled) continue;
            const units = Math.floor(state.tokensSpent * state.avgPerToken);
            result[key] = units * (modesConfig[key].pointsPerUnit ?? 0);
        }
        for (const key of FLAT_MODE_KEYS) {
            const state = modeStates[key];
            if (!state.enabled) continue;
            result[key] = state.tokensSpent * state.avgPerToken;
        }
        return result;
    }, [modeStates, modesConfig]);

    const modePointsTotal = sum(Object.values(modePointsByKey));

    const offers = Object.entries(resolvedTier?.tier.offers ?? {});
    const shopPointsTotal = sum(
        offers.map(([offerId, offer]) => (offerQuantities[offerId] ?? 0) * getOfferEventPoints(offer))
    );

    const schedule = selectedOption?.schedule;
    const status = selectedOption?.status ?? 'unknown';
    const daysToSimulate =
        schedule && status === 'active'
            ? getHseRemainingDays(schedule)
            : schedule && status === 'upcoming'
              ? getHseDurationDays(schedule)
              : 0;

    const energyAlreadySpentToday = useMemo(
        () => sum(dailyRaids.raidedLocations.map(loc => loc.raidsAlreadyPerformed * loc.energyCost)),
        [dailyRaids]
    );

    const raidsAvailable = useMemo(() => {
        if (!resolvedTier) return false;
        const hasKillUnitsTracker = resolvedTier.tier.liveEventConfig?.trackers?.some(t => t.type === 'killUnits');
        return Boolean(hasKillUnitsTracker) || Boolean(hseRaidPointsOverrides[selectedEventName]);
    }, [resolvedTier, selectedEventName]);

    const { shardsGoals, upgradeRankOrMowGoals, upgradeMaterialGoals, preFarmGoals } = useMemo(
        () => GoalsService.prepareGoals(goals, units, false, onslaughtPreferences),
        [goals, units, onslaughtPreferences]
    );
    const includedGoals = useMemo(
        () => [preFarmGoals, upgradeMaterialGoals, upgradeRankOrMowGoals, shardsGoals].flat().filter(x => x.include),
        [preFarmGoals, upgradeMaterialGoals, upgradeRankOrMowGoals, shardsGoals]
    );
    const onslaughtTokensToday = useMemo(
        () => UpgradesService.computeOnslaughtTokensToday(gameModeTokens),
        [gameModeTokens]
    );

    const raidPoints = useMemo(() => {
        if (!resolvedTier || !raidsAvailable || daysToSimulate <= 0) return 0;
        const tier = resolvedTier.key;

        if (raidStrategy === 'maximizeHse') {
            const { totalPoints } = UpgradesService.estimateMaxHsePointsRaids(
                selectedEventName,
                tier,
                daysToSimulate,
                dailyRaidsPreferences.dailyEnergy,
                campaignsProgress,
                status === 'active' ? energyAlreadySpentToday : 0
            );
            return totalPoints;
        }

        const settings: IEstimatedRanksSettings = {
            dailyEnergy: dailyRaidsPreferences.dailyEnergy,
            campaignsProgress,
            upgrades: inventory.upgrades,
            completedLocations: dailyRaids.raidedLocations,
            onslaughtTokensToday,
            onslaughtPreferences,
            hseMaxDays: daysToSimulate,
            preferences:
                raidStrategy === 'totalMaterialsHseOptimized'
                    ? {
                          ...dailyRaidsPreferences,
                          farmPreferences: {
                              ...dailyRaidsPreferences.farmPreferences,
                              order: IDailyRaidsFarmOrder.totalMaterials,
                              customHseEventName: selectedEventName,
                              customHseTier: tier,
                          },
                      }
                    : { ...dailyRaidsPreferences },
        };

        const result = UpgradesService.getUpgradesEstimatedDays(settings, characters, resolvedMows, ...includedGoals);

        if (raidStrategy === 'totalMaterialsHseOptimized') {
            return sum(result.upgradesRaids.map(day => day.hsePointsTotal ?? 0));
        }
        return UpgradesService.scoreRaidsForHse(result.upgradesRaids, selectedEventName, tier);
    }, [
        resolvedTier,
        raidsAvailable,
        daysToSimulate,
        raidStrategy,
        selectedEventName,
        dailyRaidsPreferences,
        campaignsProgress,
        inventory,
        dailyRaids,
        onslaughtTokensToday,
        onslaughtPreferences,
        characters,
        resolvedMows,
        includedGoals,
        status,
        energyAlreadySpentToday,
    ]);

    const totalPoints = Math.floor(modePointsTotal + shopPointsTotal + raidPoints);
    const rewards = resolvedTier?.tier.tieredProgressRewards ?? [];
    const milestones = rewards.length > 0 ? resolveHseMilestones(rewards, totalPoints) : undefined;
    const rewardTally = milestones ? tallyHseRewards(rewards, milestones) : {};
    const rewardTallyEntries = Object.entries(rewardTally);

    const updateMode = (key: ModeKey, patch: Partial<ModeState>) => {
        setModeStates(previous => ({ ...previous, [key]: { ...previous[key], ...patch } }));
    };

    return (
        <div className="mb-3 flex flex-col gap-4 rounded-xl border border-(--border) bg-(--overlay) p-4">
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1">
                    <label htmlFor="hse-calc-event-select" className="text-sm font-medium text-(--fg)">
                        Event
                    </label>
                    <select
                        id="hse-calc-event-select"
                        value={selectedEventName}
                        onChange={event_ => setSelectedEventName(event_.currentTarget.value)}
                        className="rounded-lg border border-(--border) bg-(--overlay) px-2 py-1.5 text-sm text-(--fg)">
                        <option value="" disabled>
                            Choose an event…
                        </option>
                        {eventOptions.map(({ event, displayName, status: optionStatus }) => (
                            <option
                                key={event.eventName}
                                value={event.eventName}
                                disabled={optionStatus === 'past' || optionStatus === 'unknown'}>
                                {displayName}
                                {optionStatus === 'active' ? ' (active)' : ''}
                                {optionStatus === 'upcoming' ? ' (upcoming)' : ''}
                                {optionStatus === 'past' ? ' (ended)' : ''}
                                {optionStatus === 'unknown' ? ' (no schedule)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {schedule && (
                    <div className="text-sm text-(--soft-fg)">
                        {status === 'active' && <>{daysToSimulate} day(s) remaining</>}
                        {status === 'upcoming' && <>Runs for {daysToSimulate} day(s), starting soon</>}
                    </div>
                )}
                {!schedule && selectedEventName && (
                    <div className="text-sm text-(--soft-fg)">
                        No schedule entered for this event yet — add one to hse-schedule.ts to enable raid planning.
                    </div>
                )}
            </div>

            {resolvedTier && (
                <>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {[...WAVE_MODE_KEYS, ...FLAT_MODE_KEYS].map(key => {
                            const state = modeStates[key];
                            const waveConfig =
                                modesConfig && WAVE_MODE_KEYS.includes(key as WaveModeKey)
                                    ? modesConfig[key as WaveModeKey]
                                    : undefined;
                            return (
                                <div key={key} className="flex flex-col gap-2 rounded-lg bg-(--soft) p-3">
                                    <Switch
                                        isSelected={state.enabled}
                                        onChange={value => updateMode(key, { enabled: value })}>
                                        {MODE_LABELS[key]}
                                    </Switch>
                                    {state.enabled && (
                                        <div className="flex flex-col gap-2">
                                            <NumberInput
                                                label="Tokens spent"
                                                value={state.tokensSpent}
                                                valueChange={value => updateMode(key, { tokensSpent: value })}
                                                min={0}
                                                max={999_999}
                                                fullWidth
                                            />
                                            <NumberInput
                                                label={
                                                    waveConfig?.unit === 'waves'
                                                        ? 'Avg waves cleared / token'
                                                        : waveConfig?.unit === 'kills'
                                                          ? 'Avg enemies killed / token'
                                                          : 'Avg points / token'
                                                }
                                                value={state.avgPerToken}
                                                valueChange={value => updateMode(key, { avgPerToken: value })}
                                                min={0}
                                                max={999_999}
                                                step={0.1}
                                                fullWidth
                                            />
                                            {waveConfig && (
                                                <span className="text-xs text-(--soft-fg)">
                                                    {waveConfig.pointsPerUnit} pts per{' '}
                                                    {waveConfig.unit === 'waves' ? 'wave' : 'kill'} ·{' '}
                                                    {modePointsByKey[key].toLocaleString()} pts
                                                </span>
                                            )}
                                            {!waveConfig && (
                                                <span className="text-xs text-(--soft-fg)">
                                                    {modePointsByKey[key].toLocaleString()} pts
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {offers.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold tracking-wide text-(--soft-fg) uppercase">Shop</h3>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {offers.map(([offerId, offer]) => (
                                    <OfferCard
                                        key={offerId}
                                        offerId={offerId}
                                        offer={offer}
                                        quantity={offerQuantities[offerId] ?? 0}
                                        onChange={qty =>
                                            setOfferQuantities(previous => ({ ...previous, [offerId]: qty }))
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold tracking-wide text-(--soft-fg) uppercase">Raids</h3>
                        {!raidsAvailable && (
                            <p className="text-sm text-(--soft-fg)">This event doesn&apos;t earn points via raiding.</p>
                        )}
                        {raidsAvailable && (
                            <div className="flex flex-col gap-2">
                                {RAID_STRATEGY_OPTIONS.map(option => (
                                    <label key={option.value} className="flex items-start gap-2 text-sm text-(--fg)">
                                        <input
                                            type="radio"
                                            name="hse-calc-raid-strategy"
                                            className="mt-1"
                                            checked={raidStrategy === option.value}
                                            onChange={() => setRaidStrategy(option.value)}
                                        />
                                        <span>
                                            <span className="font-medium">{option.label}</span>
                                            <br />
                                            <span className="text-(--soft-fg)">{option.description}</span>
                                        </span>
                                    </label>
                                ))}
                                {daysToSimulate <= 0 && (
                                    <p className="text-sm text-(--soft-fg)">
                                        No schedule entered for this event, so raid points can&apos;t be simulated yet.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1 rounded-lg bg-(--soft) p-3">
                        <h3 className="text-sm font-semibold tracking-wide text-(--soft-fg) uppercase">Results</h3>
                        <p className="text-lg font-semibold text-(--fg)">{totalPoints.toLocaleString()} points</p>
                        <p className="text-sm text-(--soft-fg)">
                            Modes: {Math.floor(modePointsTotal).toLocaleString()} · Shop:{' '}
                            {Math.floor(shopPointsTotal).toLocaleString()} · Raids:{' '}
                            {Math.floor(raidPoints).toLocaleString()}
                        </p>
                        {milestones && (
                            <p className="text-sm text-(--fg)">
                                Reaches milestone {milestones.reachedIndex + 1} of{' '}
                                {rewards.filter(r => !r.endless).length}
                                {milestones.endlessRepeats > 0 && <> (+{milestones.endlessRepeats}× repeat)</>}
                            </p>
                        )}
                        {milestones && milestones.reachedIndex < 0 && (
                            <p className="text-sm text-(--soft-fg)">No milestone reached yet.</p>
                        )}
                        {rewardTallyEntries.length > 0 && (
                            <div className="mt-1 flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-(--soft-fg)">Rewards earned so far:</span>
                                <div className="flex flex-wrap gap-3">
                                    {rewardTallyEntries.map(([type, qty]) => {
                                        const { icon, label } = hseCalculatorRewardIcon(type);
                                        return (
                                            <div key={type} className="flex items-center gap-1.5">
                                                <div
                                                    className="flex shrink-0 items-center justify-center"
                                                    style={{ width: REWARD_ICON_SIZE, height: REWARD_ICON_SIZE }}>
                                                    {icon}
                                                </div>
                                                <span className="text-sm text-(--fg)">
                                                    <span className="mr-1 font-semibold tabular-nums">×{qty}</span>
                                                    {label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {milestones?.pointsToNext !== undefined && (
                            <p className="mt-1 text-sm text-(--soft-fg)">
                                {milestones.pointsToNext.toLocaleString()} points to next milestone.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const OfferCard = ({
    offerId,
    offer,
    quantity,
    onChange,
}: {
    offerId: string;
    offer: HomescreenEventOffer;
    quantity: number;
    onChange: (qty: number) => void;
}) => {
    const maxPurchases = offer.offer.maxPurchases;
    const points = getOfferEventPoints(offer);
    const otherRewards = offer.realMoneyProduct.rewards.map(reward => nonPointsRewardLabel(reward)).filter(Boolean);

    return (
        <div className="flex flex-col gap-1.5 rounded-lg bg-(--soft) p-3">
            <div className="flex items-center justify-between">
                <span className="font-medium text-(--fg)">{offerTitle(offerId)}</span>
                {maxPurchases !== undefined && <span className="text-xs text-(--soft-fg)">max ×{maxPurchases}</span>}
            </div>
            <span className="text-xs text-(--soft-fg)">
                {points} pts each{otherRewards.length > 0 ? ` · ${otherRewards.join(', ')}` : ''}
            </span>
            <NumberInput
                label="Quantity"
                value={quantity}
                valueChange={onChange}
                min={0}
                max={maxPurchases ?? 999}
                fullWidth
            />
        </div>
    );
};
