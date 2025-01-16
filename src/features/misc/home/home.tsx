﻿import React, { useContext, useEffect } from 'react';
import Zoom from 'react-medium-image-zoom';
import { Thanks } from 'src/shared-components/thanks';
import { StoreContext } from 'src/reducers/store.provider';
import { Card, CardContent, CardHeader } from '@mui/material';
import { menuItemById } from 'src/models/menu-items';
import { useNavigate } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import { sum } from 'lodash';
import { MiscIcon } from 'src/shared-components/misc-icon';

import { LegendaryEventEnum, PersonalGoalType } from 'src/models/enums';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { StaticDataService } from 'src/services';
import { CharacterImage } from 'src/shared-components/character-image';

export const Home = () => {
    const navigate = useNavigate();
    const { goals, dailyRaids } = useContext(StoreContext);
    const nextLeMenuItem = StaticDataService.activeLre;
    const goalsMenuItem = menuItemById['goals'];
    const dailyRaidsMenuItem = menuItemById['dailyRaids'];
    const eventsCalendarUrl = 'https://tacticucplannerstorage.blob.core.windows.net/files/events-calendar.png';

    const topPriorityGoal = goals[0];
    const unlockGoals = goals.filter(x => x.type === PersonalGoalType.Unlock).length;
    const ascendGoals = goals.filter(x => x.type === PersonalGoalType.Ascend).length;
    const upgradeRankGoals = goals.filter(x => x.type === PersonalGoalType.UpgradeRank).length;

    // preload events calendar
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = eventsCalendarUrl;
        document.head.appendChild(link);
    }, []);

    const navigateToNextLre = () => {
        const route = `/plan/lre?character=${LegendaryEventEnum[nextLeMenuItem.lre!.id]}`;
        navigate(isMobile ? '/mobile' + route : route);
    };

    function formatMonthAndDay(date: Date): string {
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

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

    const nextLeDateStart = new Date(nextLeMenuItem.lre!.nextEventDateUtc!);
    const nextLeDateEnd = new Date(
        new Date(nextLeMenuItem.lre!.nextEventDateUtc!).setDate(nextLeDateStart.getDate() + 7)
    );
    const timeToStart = timeLeftToFutureDate(nextLeDateStart);
    const timeToEnd = timeLeftToFutureDate(nextLeDateEnd);
    const isEventStarted = timeToStart === 'Finished';

    const announcments = () => {
        return (
            // <h2 style={{ textAlign: 'center' }}>
            //     <a href="https://forms.gle/AhiqYtSAgQBmY9VW8" target="_blank" rel="noreferrer">
            //         Beginners Guide Contest (Until October 31st)
            //     </a>
            // </h2>
            <></>
        );
    };

    return (
        <div>
            {announcments()}
            <Thanks sliderMode={true} />
            {announcments()}
            <div
                style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                }}>
                <div>
                    <h3 style={{ textAlign: 'center' }}>Daily Raids</h3>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                            <ul style={{ margin: 0 }}>
                                {dailyRaids.raidedLocations.map(x => (
                                    <li key={x.id}>
                                        {x.raidsCount}x {x.campaign} {x.nodeNumber}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h3 style={{ textAlign: 'center' }}>{isEventStarted ? 'Ongoing ' : 'Upcoming '}Legendary Event</h3>
                    <Card
                        variant="outlined"
                        onClick={navigateToNextLre}
                        sx={{
                            width: 350,
                            minHeight: 200,
                            cursor: 'pointer',
                        }}>
                        <CardHeader
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <CharacterImage icon={nextLeMenuItem.icon} /> {nextLeMenuItem.name}
                                </div>
                            }
                            subheader={formatMonthAndDay(isEventStarted ? nextLeDateEnd : nextLeDateStart)}
                        />
                        <CardContent style={{ display: 'flex', flexDirection: 'column' }}>
                            {isEventStarted ? timeToEnd : timeToStart}
                        </CardContent>
                    </Card>
                </div>

                {!!goals.length && (
                    <div>
                        <h3 style={{ textAlign: 'center' }}>Your Goals</h3>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {goalsMenuItem.icon} {goalsMenuItem.label}
                                    </div>
                                }
                            />
                            <CardContent style={{ display: 'flex', flexDirection: 'column' }}>
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
                    <h3 style={{ textAlign: 'center' }}>Events calendar</h3>
                    <Zoom>
                        <img src={eventsCalendarUrl} alt="Events Calendar" width={350} />
                    </Zoom>
                </div>
            </div>
        </div>
    );
};
