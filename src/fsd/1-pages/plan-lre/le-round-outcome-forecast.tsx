/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { FormControlLabel, Paper, Switch } from '@mui/material';
import { useContext, useMemo } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { Rank, RarityStars } from '@/fsd/5-shared/model';
import { MiscIcon, RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';
import { NumberInput } from '@/fsd/5-shared/ui/input';
import { ISnapshotCharacter, UnitPortrait as RosterSnapshotCharacter } from '@/fsd/5-shared/ui/unit-portrait';

import { CharactersService } from '@/fsd/4-entities/character';

import { ILegendaryEvent } from '@/fsd/3-features/lre';
import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';

import { LeRoundOutcomeForecastService } from './le-round-outcome-forecast.service';
import { LeTokenService } from './le-token-service';
import { DailyMultiplier, ILreForecastRoundConfig, ILreProgressModel } from './lre.models';
import { EventProgress } from './token-estimation-service';

interface Props {
    legendaryEvent: ILegendaryEvent;
    model: ILreProgressModel;
    progress: EventProgress;
    tokenIncrements: number[];
    /** Objectives cleared by each token, parallel to `tokenIncrements`. */
    tokenObjectives: number[];
    /** Objectives already cleared before the first forecast token is spent. */
    initialObjectivesCleared: number;
    /** Persists the user's inputs for one round. */
    onConfigChange: (config: ILreForecastRoundConfig) => void;
}

const DAILY_MULTIPLIERS: readonly DailyMultiplier[] = [1, 2, 4];
const MAX_OBJECTIVES = 324;

const getRoundLabel = (round: 1 | 2 | 3) => {
    switch (round) {
        case 1: {
            return 'Round 1';
        }
        case 2: {
            return 'Round 2';
        }
        case 3: {
            return 'Round 3';
        }
    }
};

const getStatusLabel = (status: 'finished' | 'active' | 'upcoming' | 'future') => {
    switch (status) {
        case 'finished': {
            return 'Already finished';
        }
        case 'active': {
            return 'Active now';
        }
        case 'upcoming': {
            return 'Coming up next';
        }
        case 'future': {
            return 'Future round';
        }
    }
};

const getRank = (stars: RarityStars, rank: Rank | undefined): Rank => {
    if (stars !== RarityStars.None) {
        if (rank === undefined || rank === Rank.Locked) return Rank.Stone1;
        return rank;
    }
    return Rank.Locked;
};

export const LeRoundOutcomeForecast = ({
    legendaryEvent,
    model,
    progress,
    tokenIncrements,
    tokenObjectives,
    initialObjectivesCleared,
    onConfigChange,
}: Props) => {
    const { characters: unresolvedCharacters } = useContext(StoreContext);
    const chars = useMemo(
        () => CharactersService.resolveStoredCharacters(unresolvedCharacters),
        [unresolvedCharacters]
    );
    const nowMillis = Date.now();
    const roundConfigs = useMemo(
        () => LeRoundOutcomeForecastService.createInitialLeForecastRoundConfig(model, legendaryEvent, nowMillis),
        [model, legendaryEvent, nowMillis]
    );

    const statuses = useMemo(
        () => LeRoundOutcomeForecastService.getLegendaryEventRoundStatuses(legendaryEvent, nowMillis),
        [legendaryEvent, nowMillis]
    );

    const forecasts = useMemo(
        () =>
            LeRoundOutcomeForecastService.computeLeRoundForecasts({
                legendaryEvent,
                model,
                currentProgress: progress,
                tokenIncrements,
                tokenObjectives,
                initialObjectivesCleared,
                roundConfigs,
                nowMillis,
            }),
        [
            legendaryEvent,
            model,
            progress,
            roundConfigs,
            tokenIncrements,
            tokenObjectives,
            initialObjectivesCleared,
            nowMillis,
        ]
    );

    const ascensionMilestones = useMemo(() => LeRoundOutcomeForecastService.getAscensionMilestones(model), [model]);
    const cumulativeChestCosts = useMemo(() => LeRoundOutcomeForecastService.getCumulativeChestCosts(model), [model]);

    const characterData = CharactersService.resolveCharacter(legendaryEvent.unitSnowprintId);
    const resolvedCharacter = chars.find(c => c.snowprintId === legendaryEvent.unitSnowprintId);

    const activeRound = statuses.find(item => item.status === 'active')?.round;
    const eventStart = LeTokenService.getEventStartTimeMillis(legendaryEvent);
    const isEventActive =
        !legendaryEvent.finished &&
        nowMillis >= eventStart &&
        nowMillis <= LeTokenService.getEventEndTimeMillis(legendaryEvent);
    const hasKnownCurrentTokens = !!model.syncedProgress;

    const updateRoundConfig = (round: 1 | 2 | 3, update: Partial<ILreForecastRoundConfig>) => {
        const config = roundConfigs.find(item => item.round === round);
        if (config) onConfigChange({ ...config, ...update });
    };

    return (
        <div className="flex flex-col gap-4">
            {isEventActive && !hasKnownCurrentTokens && (
                <div className="rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300">
                    Syncing Tacticus improves current-round token accuracy for this forecast.
                </div>
            )}
            {tokenIncrements.length === 0 && (
                <div className="rounded border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                    No useful token path is available with the currently selected LRE teams, so token-based point gains
                    in this forecast stay at zero.
                </div>
            )}
            <div className="grid gap-4 lg:grid-cols-3">
                {forecasts.map(forecast => {
                    const config = roundConfigs.find(item => item.round === forecast.round)!;
                    const status = statuses.find(item => item.round === forecast.round)?.status ?? 'future';
                    const isRoundActive = status === 'active';
                    const currentOccurrence = model.occurrenceProgress.find(
                        item => item.eventOccurrence === forecast.round
                    );
                    const bonusDeliveryLocked =
                        status === 'active' &&
                        forecast.round === activeRound &&
                        !!model.syncedProgress?.hasPremiumPayout;
                    const bundleMin = status === 'active' ? (currentOccurrence?.bundleCurrency ?? 0) : 0;
                    const freeMissionMin = status === 'active' ? (currentOccurrence?.freeMissionsProgress ?? 0) : 0;
                    const paidMissionMin = status === 'active' ? (currentOccurrence?.premiumMissionsProgress ?? 0) : 0;

                    return (
                        <Paper key={forecast.round} className="flex flex-col gap-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="font-semibold">{getRoundLabel(forecast.round)}</div>
                                    <div className="text-sm text-(--soft-fg)">{getStatusLabel(status)}</div>
                                </div>
                            </div>

                            {status === 'finished' ? (
                                <div className="text-sm text-(--soft-fg)">{forecast.message}</div>
                            ) : (
                                <>
                                    <div className="grid gap-4">
                                        {isRoundActive && (
                                            <div className="rounded border border-(--border) bg-(--soft) px-3 py-2 text-xs text-(--soft-fg)">
                                                Event in Progress, Mission Status Synced
                                            </div>
                                        )}
                                        {!isRoundActive && (
                                            <>
                                                <NumberInput
                                                    fullWidth
                                                    label={`Free missions ${config.freeMissions}/10`}
                                                    value={config.freeMissions}
                                                    valueChange={freeMissions =>
                                                        updateRoundConfig(forecast.round, { freeMissions })
                                                    }
                                                    disabled={isRoundActive}
                                                    min={freeMissionMin}
                                                    max={10}
                                                />
                                                <FormControlLabel
                                                    label="Buy bonus delivery"
                                                    control={
                                                        <Switch
                                                            checked={config.buyBonusDelivery}
                                                            disabled={bonusDeliveryLocked}
                                                            onChange={(_, buyBonusDelivery) =>
                                                                updateRoundConfig(forecast.round, {
                                                                    buyBonusDelivery,
                                                                    paidMissions: buyBonusDelivery
                                                                        ? config.paidMissions
                                                                        : 0,
                                                                })
                                                            }
                                                        />
                                                    }
                                                />
                                            </>
                                        )}
                                        {config.buyBonusDelivery && isRoundActive && (
                                            <div className="rounded border border-(--border) bg-(--soft) px-3 py-2 text-xs text-(--soft-fg)">
                                                Event in Progress, Mission Status Synced
                                            </div>
                                        )}
                                        {config.buyBonusDelivery && !isRoundActive && (
                                            <NumberInput
                                                fullWidth
                                                label={`Paid missions ${config.paidMissions}/10`}
                                                value={config.paidMissions}
                                                valueChange={paidMissions =>
                                                    updateRoundConfig(forecast.round, { paidMissions })
                                                }
                                                disabled={isRoundActive}
                                                min={paidMissionMin}
                                                max={10}
                                            />
                                        )}
                                        <NumberInput
                                            fullWidth
                                            label="Currency from bundles (150 / 300 / 600 offers)"
                                            value={config.bundleCurrency}
                                            valueChange={bundleCurrency =>
                                                updateRoundConfig(forecast.round, { bundleCurrency })
                                            }
                                            min={bundleMin}
                                            max={100_000}
                                            step={150}
                                        />
                                        <div className="flex flex-col gap-1">
                                            <label className="block text-sm font-medium text-(--soft-fg)">
                                                Daily delivery multiplier
                                            </label>
                                            <select
                                                value={config.dailyMultiplier}
                                                onChange={event =>
                                                    updateRoundConfig(forecast.round, {
                                                        dailyMultiplier: Number(event.target.value) as DailyMultiplier,
                                                    })
                                                }
                                                className="h-10 w-full rounded-lg border border-(--input) bg-(--neutral) px-3 text-sm text-(--fg) shadow-sm focus:ring-2 focus:ring-(--ring) focus:outline-none">
                                                {DAILY_MULTIPLIERS.map(multiplier => (
                                                    <option key={multiplier} value={multiplier}>
                                                        {multiplier} per objective
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <NumberInput
                                                fullWidth
                                                label={`Avg objectives cleared at daily payouts (${forecast.dailyPayouts} left)`}
                                                value={config.avgObjectivesPerDay ?? forecast.estimatedAvgObjectives}
                                                valueChange={avgObjectivesPerDay =>
                                                    updateRoundConfig(forecast.round, { avgObjectivesPerDay })
                                                }
                                                min={0}
                                                max={MAX_OBJECTIVES}
                                            />
                                            <div className="flex items-center gap-2 text-xs text-(--soft-fg)">
                                                <span>
                                                    Estimated {forecast.estimatedAvgObjectives} (
                                                    {forecast.startObjectives} → {forecast.endObjectives} cleared over
                                                    the round)
                                                </span>
                                                {config.avgObjectivesPerDay !== undefined && (
                                                    <button
                                                        type="button"
                                                        className="underline"
                                                        onClick={() =>
                                                            updateRoundConfig(forecast.round, {
                                                                avgObjectivesPerDay: undefined,
                                                            })
                                                        }>
                                                        Use estimate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {forecast.ohSoCloseEligible && (
                                            <div className="flex flex-col gap-1">
                                                <FormControlLabel
                                                    label={`Buy Oh, So Close! shards (${forecast.ohSoCloseShardCost})`}
                                                    control={
                                                        <Switch
                                                            checked={config.buyOhSoCloseShards}
                                                            onChange={(_, buyOhSoCloseShards) =>
                                                                updateRoundConfig(forecast.round, {
                                                                    buyOhSoCloseShards,
                                                                })
                                                            }
                                                        />
                                                    }
                                                />
                                                <div className="flex items-center gap-1 text-xs text-(--soft-fg)">
                                                    <span>
                                                        &quot;Oh, So Close!&quot; offer will cost you{' '}
                                                        {forecast.ohSoCloseBlackstoneCost}
                                                    </span>
                                                    <MiscIcon icon={'blackstone'} width={14} height={14} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-2 rounded border border-(--border) p-3 text-sm">
                                        <div className="mb-2 font-medium">End of round outcome</div>
                                        <div>
                                            Tokens: {forecast.tokensUsed} / {forecast.tokensAvailable} used
                                        </div>
                                        <div>
                                            Points: +{forecast.pointsEarned} → {forecast.endingPoints}
                                        </div>
                                        <div>
                                            Currency: +{forecast.currencyEarned} → {forecast.endingCurrency}
                                        </div>
                                        <div className="text-xs text-(--soft-fg)">
                                            Daily delivery: +{forecast.dailyDeliveryCurrency} ({forecast.dailyPayouts}{' '}
                                            payouts)
                                        </div>
                                        <div>Chests opened: {forecast.chestsOpened}</div>
                                        <div className="mt-2 flex flex-col items-center gap-1">
                                            <RosterSnapshotsAssetsProvider>
                                                <RosterSnapshotCharacter
                                                    showShards={RosterSnapshotShowVariableSettings.Never}
                                                    showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                                    showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                                    showAbilities={RosterSnapshotShowVariableSettings.Never}
                                                    showEquipment={RosterSnapshotShowVariableSettings.Never}
                                                    showTooltip={false}
                                                    char={
                                                        {
                                                            id: legendaryEvent.unitSnowprintId,
                                                            rank:
                                                                forecast.endingStars === RarityStars.None
                                                                    ? Rank.Locked
                                                                    : getRank(
                                                                          forecast.endingStars,
                                                                          resolvedCharacter?.rank
                                                                      ),
                                                            rarity: forecast.endingRarity,
                                                            stars: forecast.endingStars,
                                                            shards: 0,
                                                            mythicShards: 0,
                                                            activeAbilityLevel: 1,
                                                            passiveAbilityLevel: 1,
                                                            xpLevel: 1,
                                                        } as ISnapshotCharacter
                                                    }
                                                    charData={characterData}
                                                    isDisabled={false}
                                                />
                                            </RosterSnapshotsAssetsProvider>
                                            <div className="relative h-5 w-full overflow-hidden rounded-full bg-(--fg)/12">
                                                <div
                                                    className="h-full bg-(--primary)"
                                                    style={{
                                                        width: `${
                                                            forecast.shardsNeededForNextMilestone > 0
                                                                ? Math.min(
                                                                      100,
                                                                      (forecast.endingShards /
                                                                          (forecast.endingShards +
                                                                              forecast.shardsNeededForNextMilestone)) *
                                                                          100
                                                                  )
                                                                : 100
                                                        }%`,
                                                        borderTopRightRadius: '9999px',
                                                        borderBottomRightRadius: '9999px',
                                                    }}
                                                />
                                                <span className="absolute inset-0 flex h-full w-full items-center justify-center text-xs font-medium text-(--fg)">
                                                    {forecast.endingShards} /{' '}
                                                    {forecast.shardsNeededForNextMilestone > 0
                                                        ? forecast.endingShards + forecast.shardsNeededForNextMilestone
                                                        : '∞'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-(--soft-fg)">
                                                {(() => {
                                                    const nextChestCost = cumulativeChestCosts.find(
                                                        cost => cost > forecast.endingCurrency
                                                    );

                                                    if (nextChestCost === undefined) {
                                                        return <span>Chest: Full Clear</span>;
                                                    }

                                                    return (
                                                        <span>
                                                            Currency for Next Chest: {forecast.endingCurrency} /{' '}
                                                            {nextChestCost} ({nextChestCost - forecast.endingCurrency}{' '}
                                                            needed)
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="text-xs text-(--soft-fg)">
                                                {(() => {
                                                    if (forecast.shardsNeededForNextMilestone <= 0) {
                                                        return <span>Currency for Next Shard Milestone: 0 needed</span>;
                                                    }

                                                    if (model.shardsPerChest <= 0) {
                                                        return <span>Currency for Next Shard Milestone: N/A</span>;
                                                    }

                                                    const additionalChestsNeeded = Math.ceil(
                                                        forecast.shardsNeededForNextMilestone / model.shardsPerChest
                                                    );

                                                    const currentClaimedChestIndex = cumulativeChestCosts.findLastIndex(
                                                        cost => cost <= forecast.endingCurrency
                                                    );

                                                    const targetChestCost =
                                                        cumulativeChestCosts[
                                                            currentClaimedChestIndex + additionalChestsNeeded
                                                        ];

                                                    if (targetChestCost === undefined) {
                                                        return (
                                                            <span>Currency for Next Shard Milestone: Full Clear</span>
                                                        );
                                                    }

                                                    return (
                                                        <span>
                                                            Currency for Next Shard Milestone: {forecast.endingCurrency}{' '}
                                                            / {targetChestCost} (
                                                            {targetChestCost - forecast.endingCurrency} needed)
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="text-xs text-(--soft-fg)">
                                                {(() => {
                                                    const nextMilestone = ascensionMilestones.find(
                                                        milestone => milestone.label === forecast.nextMilestone
                                                    );
                                                    if (!nextMilestone) {
                                                        return <span>Full Clear</span>;
                                                    }

                                                    return (
                                                        <span className="inline-flex items-center gap-1">
                                                            <span>toward</span>
                                                            <RarityIcon rarity={nextMilestone.rarity} />
                                                            <StarsIcon stars={nextMilestone.stars} />
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        {forecast.boughtOhSoCloseShards > 0 && (
                                            <div>Oh, So Close! shards bought: {forecast.boughtOhSoCloseShards}</div>
                                        )}
                                        {!forecast.ohSoCloseEligible && forecast.shardsNeededForNextMilestone > 0 && (
                                            <div className="flex justify-center text-(--soft-fg)">
                                                Not close enough for &quot;Oh, So Close!&quot; shards this round.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </Paper>
                    );
                })}
            </div>
        </div>
    );
};
