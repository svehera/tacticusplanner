import { FormControlLabel, Paper, Switch } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';
import { NumberInput } from '@/fsd/5-shared/ui/input';

import { ILegendaryEvent } from '@/fsd/3-features/lre';

import {
    computeLeRoundForecasts,
    createInitialLeForecastRoundConfig,
    getLegendaryEventRoundStatuses,
} from './le-round-outcome-forecast.service';
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

const getRarityLabel = (rarity: Rarity) => (rarity === Rarity.Mythic ? 'Mythic' : 'Legendary');

export const LeRoundOutcomeForecast = ({ legendaryEvent, model, progress, tokenIncrements }: Props) => {
    const nowMillis = Date.now();
    const [roundConfigs, setRoundConfigs] = useState(() =>
        createInitialLeForecastRoundConfig(model, legendaryEvent, nowMillis)
    );

    useEffect(() => {
        setRoundConfigs(createInitialLeForecastRoundConfig(model, legendaryEvent, Date.now()));
    }, [legendaryEvent, model.occurrenceProgress, model.syncedProgress?.hasPremiumPayout]);

    const statuses = useMemo(
        () => getLegendaryEventRoundStatuses(legendaryEvent, nowMillis),
        [legendaryEvent, nowMillis]
    );

    const forecasts = useMemo(
        () =>
            computeLeRoundForecasts({
                legendaryEvent,
                model,
                currentProgress: progress,
                tokenIncrements,
                roundConfigs,
                nowMillis,
            }),
        [legendaryEvent, model, progress, roundConfigs, tokenIncrements, nowMillis]
    );

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
                                        <div>
                                            Progression: {getRarityLabel(forecast.endingRarity)} /{' '}
                                            {RarityStars[forecast.endingStars]}
                                        </div>
                                        <div>
                                            Shards: {forecast.endingShards} toward {forecast.nextMilestone}
                                            {forecast.shardsNeededForNextMilestone > 0
                                                ? ` (${forecast.shardsNeededForNextMilestone} needed)`
                                                : ''}
                                        </div>
                                        {forecast.boughtOhSoCloseShards > 0 && (
                                            <div>Oh, So Close! shards bought: {forecast.boughtOhSoCloseShards}</div>
                                        )}
                                        {!forecast.ohSoCloseEligible && forecast.shardsNeededForNextMilestone > 0 && (
                                            <div className="text-gray-600 dark:text-gray-400">
                                                Not close enough for Oh, So Close! shards this round.
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
