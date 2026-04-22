/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { sum } from 'lodash';
import { useContext } from 'react';
import { isMobile } from 'react-device-detect';
import Zoom from 'react-medium-image-zoom';
import { useNavigate } from 'react-router-dom';

import { PersonalGoalType } from 'src/models/enums';
import { IPersonalGoal, LegendaryEventData } from 'src/models/interfaces';
import { menuItemById } from 'src/models/menu-items';
import { StoreContext } from 'src/reducers/store.provider';

import { useAuth } from '@/fsd/5-shared/model';
import { Rank, rankToString } from '@/fsd/5-shared/model/enums';
import { getImageUrl } from '@/fsd/5-shared/ui';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { ILegendaryEventStatic, LegendaryEventEnum, LegendaryEventService } from '@/fsd/4-entities/lre';

import { ILreProgressDto } from '@/fsd/3-features/lre-progress';

import TokenAvailability from '@/fsd/1-pages/game-mode-tokens';

import { useBmcWidget } from './use-bmc-widget';

function formatMonthAndDay(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function describeGoal(goal: IPersonalGoal): string {
    switch (goal.type) {
        case PersonalGoalType.UpgradeRank: {
            return `${rankToString(goal.startingRank ?? Rank.Locked)} → ${rankToString(goal.targetRank ?? Rank.Locked)}`;
        }
        case PersonalGoalType.Ascend: {
            return `→ ★${goal.targetStars} ${goal.targetRarity}`;
        }
        case PersonalGoalType.Unlock: {
            return 'Unlock';
        }
        case PersonalGoalType.MowAbilities:
        case PersonalGoalType.CharacterAbilities: {
            return 'Ability upgrade';
        }
        default: {
            return '';
        }
    }
}

function LreSection({
    nextEvent,
    leProgress,
}: {
    nextEvent: ILegendaryEventStatic;
    leProgress: LegendaryEventData<ILreProgressDto>;
}) {
    const navigate = useNavigate();
    const nextLeUnit = CharactersService.charactersData.find(x => x.snowprintId === nextEvent.unitSnowprintId);

    function timeLeftToFutureDate(targetDate: Date): string {
        const currentDate = new Date();
        const timeDifference = targetDate.getTime() - currentDate.getTime();

        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const result = days === 0 ? `${hours} h left` : `${days} Days ${hours} h left`;

        return timeDifference >= 0 ? result : 'Finished';
    }

    const navigateToNextLre = () => {
        const route = `/plan/lre?character=${LegendaryEventEnum[nextEvent.id]}`;
        navigate(isMobile ? '/mobile' + route : route);
    };

    const nextLeDateStart = new Date(nextEvent.nextEventDateUtc!);
    const nextLeDateEnd = new Date(new Date(nextEvent.nextEventDateUtc!).setDate(nextLeDateStart.getDate() + 7));
    const timeToStart = timeLeftToFutureDate(nextLeDateStart);
    const timeToEnd = timeLeftToFutureDate(nextLeDateEnd);
    const isEventStarted = timeToStart === 'Finished';

    const eventProgress = leProgress[nextEvent.id as LegendaryEventEnum];

    const getTrackProgress = (trackId: 'alpha' | 'beta' | 'gamma'): number => {
        const trackData = eventProgress?.compactProgress?.[trackId];
        if (!trackData) return 0;
        const requirementStates = Object.values(trackData).map(requirement => requirement.states);
        if (requirementStates.length === 0) return 0;
        const totalBattles = Math.max(...requirementStates.map(stateList => stateList.length));
        let highest = 0;
        for (let index = 0; index < totalBattles; index++) {
            if (requirementStates.some(stateList => stateList[index] === 1)) highest = index + 1;
        }
        return highest;
    };

    const hasTrackProgress = !!eventProgress?.compactProgress;
    const totalBattles = nextEvent.alpha.battlesPoints.length;
    const alphaCompleted = getTrackProgress('alpha');
    const betaCompleted = getTrackProgress('beta');
    const gammaCompleted = getTrackProgress('gamma');

    return (
        <div className="w-full max-w-[350px]">
            <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                {isEventStarted ? 'Ongoing ' : 'Upcoming '}Legendary Event
            </p>
            <div
                className="flex min-h-[200px] w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-(--card-border) bg-(--card-bg) shadow-sm transition-colors"
                onClick={navigateToNextLre}>
                <div className="border-b border-(--card-border) px-4 py-3">
                    <div className="flex items-center gap-2.5 font-medium">
                        <UnitShardIcon icon={nextLeUnit?.roundIcon ?? ''} height={50} width={50} />
                        {nextLeUnit?.shortName}
                    </div>
                    <span className="text-sm text-(--muted-fg)">
                        {formatMonthAndDay(isEventStarted ? nextLeDateEnd : nextLeDateStart)}
                    </span>
                </div>
                <div className="flex flex-col gap-1 px-4 py-3 text-sm">
                    <div>{isEventStarted ? timeToEnd : timeToStart}</div>
                    <div className="text-(--muted-fg)">Stage {nextEvent.eventStage}/3</div>
                    {hasTrackProgress && (
                        <div className="text-(--muted-fg)">
                            α {alphaCompleted}/{totalBattles} · β {betaCompleted}/{totalBattles} · γ {gammaCompleted}/
                            {totalBattles}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export const DesktopHome = () => {
    useBmcWidget();
    const navigate = useNavigate();
    const { userInfo } = useAuth();
    const { goals, dailyRaids, leProgress } = useContext(StoreContext);
    const nextLeMenuItem = LegendaryEventService.getActiveEvent();

    const goalsMenuItem = menuItemById['goals'];
    const dailyRaidsMenuItem = menuItemById['dailyRaids'];

    const calendarUrls: { current?: string; next?: string } = {
        current: getImageUrl('calendar/calendar_138.webp'),
    };

    const topPriorityGoal = goals[0];
    const unlockGoals = goals.filter(x => x.type === PersonalGoalType.Unlock).length;
    const ascendGoals = goals.filter(x => x.type === PersonalGoalType.Ascend).length;
    const upgradeRankGoals = goals.filter(x => x.type === PersonalGoalType.UpgradeRank).length;

    const goalCountSummary = [
        unlockGoals && `${unlockGoals} unlock`,
        ascendGoals && `${ascendGoals} ascend`,
        upgradeRankGoals && `${upgradeRankGoals} upgrade rank`,
    ]
        .filter(Boolean)
        .join(' · ');

    const announcements = () => {
        if (userInfo.tacticusApiKey) {
            return <></>;
        }

        return (
            <div className="px-0 pt-[25px] pb-[50px] text-center">
                <h2>Exciting News from WH40k Tacticus!</h2>
                <p>
                    We&apos;re thrilled to announce that player API keys are now available! Use your key to effortlessly
                    upload your Tacticus roster to the Planner.
                </p>
                <p>
                    For more details, check out our{' '}
                    <a href="/faq" target="_blank" rel="noreferrer">
                        FAQ
                    </a>{' '}
                    or find additional information in the user menu.
                </p>
            </div>
        );
    };

    return (
        <div className="px-4 py-4">
            {announcements()}
            <TokenAvailability />
            <div className="mt-6 flex flex-wrap items-start justify-center gap-4">
                <div className="w-full max-w-[350px]">
                    <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                        Daily Raids
                    </p>
                    <div
                        className="flex min-h-[200px] w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-(--card-border) bg-(--card-bg) shadow-sm transition-colors"
                        onClick={() =>
                            navigate(isMobile ? dailyRaidsMenuItem.routeMobile : dailyRaidsMenuItem.routeWeb)
                        }>
                        <div className="border-b border-(--card-border) px-4 py-3">
                            <div className="flex items-center gap-2.5 font-medium">
                                {dailyRaidsMenuItem.icon}{' '}
                                {dailyRaids.raidedLocations?.length + ' locations raided today'}
                            </div>
                            <span className="text-sm text-(--muted-fg)">
                                {sum(dailyRaids.raidedLocations?.map(x => x.energySpent))}{' '}
                                <MiscIcon icon={'energy'} width={15} height={15} />
                                {' spent'}
                            </span>
                        </div>
                        <div className="px-4 py-3 text-sm">
                            <ul className="m-0 list-none p-0">
                                {dailyRaids.raidedLocations.map(x => (
                                    <li key={x.id}>
                                        {x.raidsAlreadyPerformed}x {x.campaign} {x.nodeNumber}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {nextLeMenuItem && <LreSection nextEvent={nextLeMenuItem} leProgress={leProgress} />}

                {goals.length > 0 && (
                    <div className="w-full max-w-[350px]">
                        <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                            Your Goals
                        </p>
                        <div
                            className="flex min-h-[200px] w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-(--card-border) bg-(--card-bg) shadow-sm transition-colors"
                            onClick={() => navigate(isMobile ? goalsMenuItem.routeMobile : goalsMenuItem.routeWeb)}>
                            <div className="border-b border-(--card-border) px-4 py-3">
                                <div className="flex items-center gap-2.5 font-medium">
                                    {goalsMenuItem.icon} {goalsMenuItem.label}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 px-4 py-3 text-sm">
                                {topPriorityGoal &&
                                    (() => {
                                        const unit = CharactersService.getUnit(topPriorityGoal.character);
                                        return (
                                            <div className="flex items-center gap-2.5">
                                                {unit && (
                                                    <UnitShardIcon
                                                        icon={unit.roundIcon}
                                                        name={unit.shortName}
                                                        width={40}
                                                        height={40}
                                                    />
                                                )}
                                                <div>
                                                    <div className="font-semibold">
                                                        {unit?.shortName ?? topPriorityGoal.character}
                                                    </div>
                                                    <div className="text-(--muted-fg)">
                                                        {describeGoal(topPriorityGoal)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                {goalCountSummary && <div className="text-(--muted-fg)">{goalCountSummary}</div>}
                                {!!topPriorityGoal?.notes && (
                                    <div>
                                        <span className="font-semibold">Note:</span> {topPriorityGoal.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                        Events calendar
                    </p>
                    <div className="flex flex-wrap justify-center gap-2.5">
                        {!!calendarUrls.current && (
                            <div className="w-full max-w-[350px]">
                                {!!calendarUrls.next && (
                                    <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                                        Current Season
                                    </p>
                                )}
                                <Zoom>
                                    <img
                                        src={calendarUrls.current}
                                        alt="Current Season Events Calendar"
                                        width={350}
                                        height={280}
                                        className="h-auto max-w-full"
                                    />
                                </Zoom>
                            </div>
                        )}

                        {!!calendarUrls.next && (
                            <div className="w-full max-w-[350px]">
                                <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                                    Next Season
                                </p>
                                <Zoom>
                                    <img
                                        src={calendarUrls.next}
                                        alt="Next Season Events Calendar"
                                        width={350}
                                        height={280}
                                        className="h-auto max-w-full"
                                    />
                                </Zoom>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
