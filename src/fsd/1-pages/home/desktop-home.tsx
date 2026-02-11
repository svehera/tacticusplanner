import { Card, CardContent, CardHeader } from '@mui/material';
import { sum } from 'lodash';
import { useContext } from 'react';
import { isMobile } from 'react-device-detect';
import Zoom from 'react-medium-image-zoom';
import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line import-x/no-internal-modules
import { PersonalGoalType } from 'src/models/enums';
// eslint-disable-next-line import-x/no-internal-modules
import { menuItemById } from 'src/models/menu-items';
// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from 'src/reducers/store.provider';

import { useAuth } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { ILegendaryEventStatic, LegendaryEventEnum, LegendaryEventService } from '@/fsd/4-entities/lre';

import { Thanks } from '@/fsd/3-features/thank-you';

import { useBmcWidget } from './useBmcWidget';

function formatMonthAndDay(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function LreSection({ nextEvent }: { nextEvent: ILegendaryEventStatic }) {
    const navigate = useNavigate();
    const nextLeUnit = CharactersService.charactersData.find(x => x.snowprintId === nextEvent.unitSnowprintId);

    function timeLeftToFutureDate(targetDate: Date): string {
        const currentDate = new Date();
        const timeDifference = targetDate.getTime() - currentDate.getTime();

        // Calculate days, hours, and minutes
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        // Format the result
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

    return (
        <div>
            <h3 className="text-center">{isEventStarted ? 'Ongoing ' : 'Upcoming '}Legendary Event</h3>
            <Card
                variant="outlined"
                classes="dark:bg-dark-navy"
                onClick={navigateToNextLre}
                sx={{
                    width: 350,
                    minHeight: 200,
                    cursor: 'pointer',
                }}>
                <CardHeader
                    title={
                        <div className="flex items-center gap-2.5">
                            <UnitShardIcon icon={nextLeUnit?.roundIcon ?? ''} height={50} width={50} />
                            {nextLeUnit?.shortName}
                        </div>
                    }
                    subheader={formatMonthAndDay(isEventStarted ? nextLeDateEnd : nextLeDateStart)}
                />
                <CardContent className="flex flex-col">{isEventStarted ? timeToEnd : timeToStart}</CardContent>
            </Card>
        </div>
    );
}

export const DesktopHome = () => {
    useBmcWidget();
    const navigate = useNavigate();
    const { userInfo } = useAuth();
    const { goals, dailyRaids } = useContext(StoreContext);
    const nextLeMenuItem = LegendaryEventService.getActiveEvent();

    const goalsMenuItem = menuItemById['goals'];
    const dailyRaidsMenuItem = menuItemById['dailyRaids'];

    const calendarUrls: { current?: string; next?: string } = {
        current: getImageUrl('calendar/calendar_20260202.png'),
    };

    const topPriorityGoal = goals[0];
    const unlockGoals = goals.filter(x => x.type === PersonalGoalType.Unlock).length;
    const ascendGoals = goals.filter(x => x.type === PersonalGoalType.Ascend).length;
    const upgradeRankGoals = goals.filter(x => x.type === PersonalGoalType.UpgradeRank).length;

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
        <div>
            {announcements()}
            <Thanks sliderMode={true} />
            {/*{announcements()}*/}
            <div className="flex flex-wrap items-start justify-center gap-2.5">
                <div>
                    <h3 className="text-center">Daily Raids</h3>
                    <Card
                        variant="outlined"
                        onClick={() =>
                            navigate(isMobile ? dailyRaidsMenuItem.routeMobile : dailyRaidsMenuItem.routeWeb)
                        }
                        sx={{
                            width: 350,
                            minHeight: 200,
                            cursor: 'pointer',
                        }}>
                        <CardHeader
                            title={
                                <div className="flex items-center gap-2.5">
                                    {dailyRaidsMenuItem.icon}{' '}
                                    {dailyRaids.raidedLocations?.length + ' locations raided today'}
                                </div>
                            }
                            subheader={
                                <span>
                                    {sum(dailyRaids.raidedLocations?.map(x => x.energySpent))}{' '}
                                    <MiscIcon icon={'energy'} width={15} height={15} />
                                    {' spent'}
                                </span>
                            }
                        />
                        <CardContent>
                            <ul className="m-0">
                                {dailyRaids.raidedLocations.map(x => (
                                    <li key={x.id}>
                                        {x.raidsCount}x {x.campaign} {x.nodeNumber}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {nextLeMenuItem && <LreSection nextEvent={nextLeMenuItem} />}

                {!!goals.length && (
                    <div>
                        <h3 className="text-center">Your Goals</h3>
                        <Card
                            variant="outlined"
                            onClick={() => navigate(isMobile ? goalsMenuItem.routeMobile : goalsMenuItem.routeWeb)}
                            sx={{
                                width: 350,
                                minHeight: 200,
                                cursor: 'pointer',
                            }}>
                            <CardHeader
                                title={
                                    <div className="flex items-center gap-2.5">
                                        {goalsMenuItem.icon} {goalsMenuItem.label}
                                    </div>
                                }
                            />
                            <CardContent className="flex flex-col">
                                {!!unlockGoals && (
                                    <span>
                                        <b>Unlock</b> {unlockGoals} characters
                                    </span>
                                )}
                                {!!ascendGoals && (
                                    <span>
                                        <b>Ascend</b> {ascendGoals} characters
                                    </span>
                                )}
                                {!!upgradeRankGoals && (
                                    <span>
                                        <b>Upgrade rank</b> for {upgradeRankGoals} characters
                                    </span>
                                )}
                                {!!topPriorityGoal?.notes && (
                                    <span>
                                        <b>Top priority goal notes:</b> {topPriorityGoal.notes}
                                    </span>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div>
                    <h3 className="text-center">Events calendar</h3>
                    <div className="flex flex-wrap justify-center gap-2.5">
                        {!!calendarUrls.current && (
                            <div>
                                {!!calendarUrls.next && <h4 className="text-center">Current Season</h4>}
                                <Zoom>
                                    <img
                                        src={calendarUrls.current}
                                        alt="Current Season Events Calendar"
                                        width={350}
                                        height={280}
                                    />
                                </Zoom>
                            </div>
                        )}

                        {!!calendarUrls.next && (
                            <div>
                                <h4 className="text-center">Next Season</h4>
                                <Zoom>
                                    <img
                                        src={calendarUrls.next}
                                        alt="Next Season Events Calendar"
                                        width={350}
                                        height={280}
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
