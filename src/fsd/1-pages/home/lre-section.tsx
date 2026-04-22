/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import React, { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate } from 'react-router-dom';

import { LegendaryEventData } from 'src/models/interfaces';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model/enums';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { ILegendaryEventStatic, LegendaryEventEnum } from '@/fsd/4-entities/lre';

import { getLre } from '@/fsd/3-features/lre';
import { ILreProgressDto } from '@/fsd/3-features/lre-progress';

import { LreService } from '@/fsd/1-pages/plan-lre/lre.service';
import { TokenEstimationService } from '@/fsd/1-pages/plan-lre/token-estimation-service';

function formatMonthAndDay(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

interface LreSectionProps {
    nextEvent: ILegendaryEventStatic;
    leProgress: LegendaryEventData<ILreProgressDto>;
    characters: ICharacter2[];
}

export function LreSection({ nextEvent, leProgress, characters }: LreSectionProps) {
    const navigate = useNavigate();
    const nextLeUnit = CharactersService.charactersData.find(x => x.snowprintId === nextEvent.unitSnowprintId);

    function timeUntil(targetDate: Date): string {
        const timeDifference = targetDate.getTime() - Date.now();
        if (timeDifference < 0) return 'Finished';
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return days === 0 ? `${hours}h` : `${days}d ${hours}h`;
    }

    const navigateToNextLre = () => {
        const route = `/plan/lre?character=${LegendaryEventEnum[nextEvent.id]}`;
        navigate(isMobile ? '/mobile' + route : route);
    };

    const nextLeDateStart = new Date(nextEvent.nextEventDateUtc!);
    const nextLeDateEnd = new Date(new Date(nextEvent.nextEventDateUtc!).setDate(nextLeDateStart.getDate() + 7));
    const isEventStarted = Date.now() >= nextLeDateStart.getTime();
    const isEventEnded = Date.now() > nextLeDateEnd.getTime();

    const eventProgress = leProgress[nextEvent.id as LegendaryEventEnum];

    const lre = useMemo(() => getLre(nextEvent.id as LegendaryEventEnum, characters), [nextEvent.id, characters]);
    const progressModel = useMemo(() => LreService.mapProgressDtoToModel(eventProgress, lre), [eventProgress, lre]);

    const totalBattles = nextEvent.alpha.battlesPoints.length;

    const getTrackProgress = (trackId: 'alpha' | 'beta' | 'gamma'): number => {
        const track = progressModel.tracksProgress.find(t => t.trackId === trackId);
        if (!track) return 0;
        let highest = 0;
        for (const battle of track.battles) {
            if (battle.requirementsProgress.some(r => r.completed)) {
                highest = Math.max(highest, battle.battleIndex + 1);
            }
        }
        return highest;
    };

    const hasTrackProgress = progressModel.tracksProgress.some(t =>
        t.battles.some(b => b.requirementsProgress.some(r => r.completed))
    );
    const alphaCompleted = getTrackProgress('alpha');
    const betaCompleted = getTrackProgress('beta');
    const gammaCompleted = getTrackProgress('gamma');

    // Mirror the pattern from le-tokenomics.tsx: match by snowprintId, guard with Rank.Locked.
    const userChar = characters.find(c => c.snowprintId === nextEvent.unitSnowprintId);
    const charRank = userChar?.rank ?? Rank.Locked;
    const charRarity = !!userChar?.rarity && charRank !== Rank.Locked ? userChar.rarity : Rarity.Legendary;
    const charStars = !!userChar?.stars && charRank !== Rank.Locked ? userChar.stars : RarityStars.None;

    const lreShardProgress = useMemo(
        () =>
            progressModel.syncedProgress === undefined
                ? undefined
                : TokenEstimationService.computeCurrentProgress(progressModel, charRarity, charStars),
        [progressModel, charRarity, charStars]
    );

    const getTrackTooltip = (trackId: 'alpha' | 'beta' | 'gamma'): React.ReactNode => {
        const track = progressModel.tracksProgress.find(t => t.trackId === trackId);
        const restrictions = lre[trackId].unitsRestrictions;
        if (!track || restrictions.length === 0) return undefined;
        return (
            <div>
                {restrictions.map(requirement => {
                    if (!requirement.name) return;
                    // requirementsProgress uses req.name (not req.id) as its id field
                    const completedBattles = track.battles.filter(b =>
                        b.requirementsProgress.some(r => r.id === requirement.name && r.completed)
                    ).length;
                    return (
                        <div key={requirement.id}>
                            {requirement.name}: {completedBattles}/{totalBattles}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="w-full max-w-[350px]">
            <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                {isEventEnded ? 'Past ' : isEventStarted ? 'Ongoing ' : 'Upcoming '}Legendary Event
            </p>
            <div
                className="flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-(--card-border) bg-(--card-bg) shadow-sm transition-colors"
                onClick={navigateToNextLre}>
                <div className="border-b border-(--card-border) px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 font-medium">
                            <UnitShardIcon icon={nextLeUnit?.roundIcon ?? ''} height={40} width={40} />
                            {nextLeUnit?.shortName}
                            <span className="text-sm font-normal text-(--muted-fg)">({nextEvent.eventStage}/3)</span>
                        </div>
                        <div className="flex shrink-0 flex-col items-end text-sm text-(--muted-fg)">
                            <span>
                                {isEventEnded ? 'Ended' : isEventStarted ? 'Ends' : 'Starts'}{' '}
                                {formatMonthAndDay(isEventStarted ? nextLeDateEnd : nextLeDateStart)}
                            </span>
                            {!isEventEnded && (
                                <span className="text-xs">
                                    {isEventStarted
                                        ? `${timeUntil(nextLeDateEnd)} left`
                                        : `in ${timeUntil(nextLeDateStart)}`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1 px-4 py-3 text-sm">
                    {hasTrackProgress && (
                        <div className="flex flex-col gap-1.5">
                            {(['alpha', 'beta', 'gamma'] as const).map((trackId, index) => {
                                const label = ['α', 'β', 'γ'][index];
                                const count = [alphaCompleted, betaCompleted, gammaCompleted][index];
                                const tip = getTrackTooltip(trackId);
                                const pct = totalBattles > 0 ? (count / totalBattles) * 100 : 0;
                                const barColor = ['bg-blue-400/70', 'bg-amber-400/70', 'bg-orange-400/70'][index];
                                const row = (
                                    <div
                                        className={`flex items-center gap-2 text-xs text-(--muted-fg) ${tip ? 'cursor-help' : ''}`}>
                                        <span className="w-3 shrink-0 text-center">{label}</span>
                                        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-(--card-fg)/15">
                                            <div
                                                className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="w-8 shrink-0 text-right">
                                            {count}/{totalBattles}
                                        </span>
                                    </div>
                                );
                                return tip ? (
                                    <AccessibleTooltip key={trackId} title={tip}>
                                        <div>{row}</div>
                                    </AccessibleTooltip>
                                ) : (
                                    <div key={trackId}>{row}</div>
                                );
                            })}
                        </div>
                    )}
                    {lreShardProgress !== undefined &&
                        (lreShardProgress.addlShardsForNextMilestone === Infinity ? (
                            <div className="flex items-center gap-1.5 text-xs text-(--muted-fg)">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                                    ✓
                                </span>
                                Shards complete
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-xs text-(--muted-fg)">
                                    <span>To {lreShardProgress.nextMilestone}</span>
                                    <span>
                                        {lreShardProgress.currentShards} /{' '}
                                        {lreShardProgress.currentShards + lreShardProgress.addlShardsForNextMilestone}{' '}
                                        shards
                                    </span>
                                </div>
                                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-(--card-fg)/15">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-(--card-fg)/60"
                                        style={{
                                            width: `${Math.min(
                                                (lreShardProgress.currentShards /
                                                    (lreShardProgress.currentShards +
                                                        lreShardProgress.addlShardsForNextMilestone)) *
                                                    100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    {!hasTrackProgress && lreShardProgress === undefined && (
                        <p className="text-xs text-(--muted-fg)">
                            {isEventEnded
                                ? 'Event complete.'
                                : isEventStarted
                                  ? 'No battles recorded yet.'
                                  : 'Event has not started.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
