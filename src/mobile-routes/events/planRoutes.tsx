import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { StaticDataService } from '../../services';
import { menuItemById } from '../../models/menu-items';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

export const PlanRoutes = () => {
    const navigate = useNavigate();
    const goalsMenuItem = menuItemById['goals'];
    const dailyRaidsMenuItem = menuItemById['dailyRaids'];
    const guildWarMenuItem = menuItemById['guildWar'];
    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
            <Card
                onClick={() => navigate(goalsMenuItem.routeMobile)}
                sx={{
                    width: 350,
                    minHeight: 140,
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
                    minHeight: 140,
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
                onClick={() => navigate(guildWarMenuItem.routeMobile)}
                sx={{
                    width: 350,
                    minHeight: 140,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {guildWarMenuItem.icon} {guildWarMenuItem.label}
                        </div>
                    }
                />
            </Card>

            <Card
                onClick={() => navigate('lre')}
                sx={{
                    width: 350,
                    minHeight: 140,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FormatListBulletedIcon /> LRE
                        </div>
                    }
                />
                <CardContent style={{ display: 'flex', flexDirection: 'column' }}>
                    <ul>
                        <li>Master Table</li>
                        {StaticDataService.legendaryEvents.map(le => (
                            <li key={le.name}>{le.name}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};
