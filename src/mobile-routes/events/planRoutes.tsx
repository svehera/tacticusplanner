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
    const teamsMenuItem = menuItemById['teams'];
    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
            {[goalsMenuItem, dailyRaidsMenuItem].map(menuItem => (
                <Card
                    variant="outlined"
                    key={menuItem.label}
                    onClick={() => navigate(menuItem.routeMobile)}
                    sx={{
                        width: 350,
                        minHeight: 140,
                    }}>
                    <CardHeader
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {menuItem.icon} {menuItem.label}
                            </div>
                        }
                    />
                </Card>
            ))}

            <Card
                variant="outlined"
                onClick={() => navigate('guildWar')}
                sx={{
                    width: 350,
                    minHeight: 140,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FormatListBulletedIcon /> Guild War
                        </div>
                    }
                />
                <CardContent style={{ display: 'flex', flexDirection: 'column' }}>
                    <ul>
                        <li>Defense</li>
                        <li>Offense</li>
                        <li>War zones</li>
                    </ul>
                </CardContent>
            </Card>

            <Card
                variant="outlined"
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
