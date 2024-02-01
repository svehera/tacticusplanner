import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { StaticDataService } from '../../services';
import { CharacterImage } from '../../shared-components/character-image';
import { menuItemById } from '../../models/menu-items';
import { Conditional } from 'src/v2/components/conditional';

export const PlanRoutes = () => {
    const navigate = useNavigate();
    const goalsMenuItem = menuItemById['goals'];
    const dailyRaidsMenuItem = menuItemById['dailyRaids'];
    const leMasterTableMenuItem = menuItemById['leMasterTable'];
    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
            <Card
                onClick={() => navigate(goalsMenuItem.routeMobile)}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {goalsMenuItem.icon} {goalsMenuItem.label}
                        </div>
                    }
                />
            </Card>

            <Card
                onClick={() => navigate(dailyRaidsMenuItem.routeMobile)}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {dailyRaidsMenuItem.icon} {dailyRaidsMenuItem.label}
                        </div>
                    }
                />
            </Card>

            <Card
                onClick={() => navigate(leMasterTableMenuItem.routeMobile)}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {leMasterTableMenuItem.icon} {leMasterTableMenuItem.label}
                        </div>
                    }
                />
            </Card>

            {StaticDataService.legendaryEvents.map(le => {
                const isFinished = le.nextEventDate === 'Finished';
                return (
                    <Card
                        key={le.name}
                        onClick={() => navigate(le.mobileRoute)}
                        sx={{
                            width: 350,
                            minHeight: 200,
                            opacity: isFinished ? 0.5 : 1,
                        }}>
                        <CardHeader
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <CharacterImage icon={le.icon} name={le.name} /> {le.name}
                                </div>
                            }
                            subheader={'Legendary Event'}
                        />
                        <CardContent style={{ display: 'flex', flexDirection: 'column' }}>
                            <Conditional condition={isFinished}>
                                <span>Finished</span>
                            </Conditional>
                            <Conditional condition={!isFinished}>
                                <span>Stage: {le.stage}/3</span>
                                <span>Next event: {le.nextEventDate}</span>
                            </Conditional>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
