import { Thanks } from '../../../shared-components/thanks';
import React, { useContext } from 'react';
import { StoreContext } from '../../../reducers/store.provider';
import { Card, CardContent, CardHeader } from '@mui/material';
import { menuItemById } from '../../../models/menu-items';
import { useNavigate } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import { sum } from 'lodash';
import { MiscIcon } from '../../../shared-components/misc-icon';

import lre from 'src/assets/legendary-events/Vitruvius.json';
import { PersonalGoalType } from 'src/models/enums';

export const Home = () => {
    const navigate = useNavigate();
    const { goals, dailyRaids } = useContext(StoreContext);
    const nextLeMenuItem = menuItemById['vitruvius'];
    const goalsMenuItem = menuItemById['goals'];
    const dailyRaidsMenuItem = menuItemById['dailyRaids'];

    const topPriorityGoal = goals[0];
    const unlockGoals = goals.filter(x => x.type === PersonalGoalType.Unlock).length;
    const ascendGoals = goals.filter(x => x.type === PersonalGoalType.Ascend).length;
    const upgradeRankGoals = goals.filter(x => x.type === PersonalGoalType.UpgradeRank).length;

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

    const nextLeDateStart = new Date(lre.nextEventDateUtc);
    const nextLeDateEnd = new Date(new Date(lre.nextEventDateUtc).setDate(nextLeDateStart.getDate() + 7));
    const timeToStart = timeLeftToFutureDate(nextLeDateStart);
    const timeToEnd = timeLeftToFutureDate(nextLeDateEnd);
    const isEventStarted = timeToStart === 'Finished';

    return (
        <div>
            <Thanks sliderMode={true} />
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
                                    {dailyRaids.completedLocations?.flatMap(x => x.locations).length +
                                        ' locations raided today'}
                                </div>
                            }
                            subheader={
                                <span>
                                    {sum(
                                        dailyRaids.completedLocations?.flatMap(x => x.locations).map(x => x.energySpent)
                                    )}{' '}
                                    <MiscIcon icon={'energy'} width={15} height={15} />
                                    {' spent'}
                                </span>
                            }
                        />
                        <CardContent>
                            <ul style={{ margin: 0 }}>
                                {dailyRaids.completedLocations
                                    ?.flatMap(x => x.locations)
                                    .map(x => (
                                        <li key={x.id}>
                                            {x.raidsCount}x {x.campaign} {x.battleNumber}
                                        </li>
                                    ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h3 style={{ textAlign: 'center' }}>{isEventStarted ? 'Ongoing ' : 'Upcoming '}Legendary Event</h3>
                    <Card
                        onClick={() => navigate(isMobile ? nextLeMenuItem.routeMobile : nextLeMenuItem.routeWeb)}
                        sx={{
                            width: 350,
                            minHeight: 200,
                            cursor: 'pointer',
                        }}>
                        <CardHeader
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {nextLeMenuItem.icon} {nextLeMenuItem.label}
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
            </div>
        </div>
    );
};
