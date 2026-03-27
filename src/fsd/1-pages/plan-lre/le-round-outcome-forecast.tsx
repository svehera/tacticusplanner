/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { FormControlLabel, Paper, Switch } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { Rank, RarityStars } from '@/fsd/5-shared/model';
import { NumberInput } from '@/fsd/5-shared/ui/input';

import { CharactersService } from '@/fsd/4-entities/character';

import { ILegendaryEvent } from '@/fsd/3-features/lre';
import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ISnapshotCharacter } from '../input-roster-snapshots/models';
import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';
import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';

import { LeRoundOutcomeForecastService } from './le-round-outcome-forecast.service';
import { LeTokenService } from './le-token-service';
import { ILreProgressModel } from './lre.models';
import { EventProgress } from './token-estimation-service';

interface Props {
    legendaryEvent: ILegendaryEvent;
    model: ILreProgressModel;
    progress: EventProgress;
    tokenIncrements: number[];
}

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

export const LeRoundOutcomeForecast = ({ legendaryEvent, model, progress, tokenIncrements }: Props) => {
    const { characters: unresolvedCharacters } = useContext(StoreContext);
    const chars = useMemo(
        () => CharactersService.resolveStoredCharacters(unresolvedCharacters),
        [unresolvedCharacters]
    );
    const nowMillis = Date.now();
    const [roundConfigs, setRoundConfigs] = useState(() =>
        LeRoundOutcomeForecastService.createInitialLeForecastRoundConfig(model, legendaryEvent, nowMillis)
    );

    useEffect(() => {
        setRoundConfigs(
            LeRoundOutcomeForecastService.createInitialLeForecastRoundConfig(model, legendaryEvent, Date.now())
        );
    }, [legendaryEvent, model.occurrenceProgress, model.syncedProgress?.hasPremiumPayout]);

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
                roundConfigs,
                nowMillis,
            }),
        [legendaryEvent, model, progress, roundConfigs, tokenIncrements, nowMillis]
    );

    const characterData = CharactersService.resolveCharacter(legendaryEvent.unitSnowprintId);
    const resolvedCharacter = chars.find(c => c.snowprintId === legendaryEvent.unitSnowprintId);

    const activeRound = statuses.find(item => item.status === 'active')?.round;
    const eventStart = LeTokenService.getEventStartTimeMillis(legendaryEvent);
    const isEventActive =
        !legendaryEvent.finished &&
        nowMillis >= eventStart &&
        nowMillis <= LeTokenService.getEventEndTimeMillis(legendaryEvent);
    const hasKnownCurrentTokens = !!model.syncedProgress;

    const updateRoundConfig = (round: 1 | 2 | 3, update: Partial<(typeof roundConfigs)[number]>) => {
        setRoundConfigs(previous =>
            previous.map(config => (config.round === round ? { ...config, ...update } : config))
        );
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
            {isEventActive && (
                <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                    Event in Progress, Mission Status Synced
                </div>
            )}
            <div className="grid gap-4 lg:grid-cols-3">
                {forecasts.map(forecast => {
                    const config = roundConfigs.find(item => item.round === forecast.round)!;
                    const status = statuses.find(item => item.round === forecast.round)?.status ?? 'future';
                    const currentOccurrence = model.occurrenceProgress.find(
                        item => item.eventOccurrence === forecast.round
                    );
                    const bonusDeliveryLocked =
                        status === 'active' &&
                        forecast.round === activeRound &&
                        !!model.syncedProgress?.hasPremiumPayout;
                    const bundleLocked = status === 'active' && !!currentOccurrence?.bundlePurchased;
                    const freeMissionMin = status === 'active' ? (currentOccurrence?.freeMissionsProgress ?? 0) : 0;
                    const paidMissionMin = status === 'active' ? (currentOccurrence?.premiumMissionsProgress ?? 0) : 0;

                    return (
                        <Paper key={forecast.round} className="flex flex-col gap-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="font-semibold">{getRoundLabel(forecast.round)}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {getStatusLabel(status)}
                                    </div>
                                </div>
                            </div>

                            {status === 'finished' ? (
                                <div className="text-sm text-gray-600 dark:text-gray-400">{forecast.message}</div>
                            ) : (
                                <>
                                    <div className="grid gap-4">
                                        <NumberInput
                                            fullWidth
                                            label={`Free missions ${config.freeMissions}/10`}
                                            value={config.freeMissions}
                                            valueChange={freeMissions =>
                                                updateRoundConfig(forecast.round, { freeMissions })
                                            }
                                            disabled={isEventActive}
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
                                                            paidMissions: buyBonusDelivery ? config.paidMissions : 0,
                                                        })
                                                    }
                                                />
                                            }
                                        />
                                        {config.buyBonusDelivery && (
                                            <NumberInput
                                                fullWidth
                                                label={`Paid missions ${config.paidMissions}/10`}
                                                value={config.paidMissions}
                                                valueChange={paidMissions =>
                                                    updateRoundConfig(forecast.round, { paidMissions })
                                                }
                                                disabled={isEventActive}
                                                min={paidMissionMin}
                                                max={10}
                                            />
                                        )}
                                        <FormControlLabel
                                            label="Buy 300 currency bundle"
                                            control={
                                                <Switch
                                                    checked={config.buyCurrencyBundle}
                                                    disabled={bundleLocked}
                                                    onChange={(_, buyCurrencyBundle) =>
                                                        updateRoundConfig(forecast.round, { buyCurrencyBundle })
                                                    }
                                                />
                                            }
                                        />
                                        {forecast.ohSoCloseEligible && (
                                            <FormControlLabel
                                                label={`Buy Oh, So Close! shards (${forecast.ohSoCloseShardCost})`}
                                                control={
                                                    <Switch
                                                        checked={config.buyOhSoCloseShards}
                                                        onChange={(_, buyOhSoCloseShards) =>
                                                            updateRoundConfig(forecast.round, { buyOhSoCloseShards })
                                                        }
                                                    />
                                                }
                                            />
                                        )}
                                    </div>

                                    <div className="mt-2 rounded border border-gray-200 p-3 text-sm dark:border-gray-700">
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
                                                                    : (resolvedCharacter?.rank ?? Rank.Stone1),
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
                                            <div className="relative h-5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                                <div
                                                    className="h-full bg-blue-600"
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
                                                <span className="absolute inset-0 flex h-full w-full items-center justify-center text-xs font-medium text-gray-800 dark:text-gray-100">
                                                    {forecast.endingShards} /{' '}
                                                    {forecast.shardsNeededForNextMilestone > 0
                                                        ? forecast.endingShards + forecast.shardsNeededForNextMilestone
                                                        : '∞'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                toward {forecast.nextMilestone}
                                            </div>
                                        </div>
                                        {forecast.boughtOhSoCloseShards > 0 && (
                                            <div>Oh, So Close! shards bought: {forecast.boughtOhSoCloseShards}</div>
                                        )}
                                        {!forecast.ohSoCloseEligible && forecast.shardsNeededForNextMilestone > 0 && (
                                            <div className="text-gray-600 dark:text-gray-400">
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
