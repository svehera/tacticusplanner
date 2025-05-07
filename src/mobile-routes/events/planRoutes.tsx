import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Card, CardContent, CardHeader } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PlanGuildWarRoutes } from 'src/mobile-routes/events/guildWarRoutes';
import { PlanLeRoutes } from 'src/mobile-routes/events/leRoutes';
import { menuItemById } from 'src/models/menu-items';
import { StaticDataService } from 'src/services';

import { campaignProgressionMenuItem } from 'src/v2/pages/campaign-progression/campaign-progression.menu-item';

enum SelectedRoutes {
    all,
    lre,
    gw,
}

export const PlanRoutes = () => {
    const navigate = useNavigate();
    const goalsMenuItem = menuItemById['goals'];
    const dailyRaidsMenuItem = menuItemById['dailyRaids'];
    const teamsMenuItem = menuItemById['teams'];

    const [selectedRoutes, setSelectedRoutes] = useState<SelectedRoutes>(SelectedRoutes.all);

    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
            {selectedRoutes === SelectedRoutes.all ? (
                <>
                    {[goalsMenuItem, dailyRaidsMenuItem, teamsMenuItem, campaignProgressionMenuItem].map(menuItem => (
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
                        onClick={() => setSelectedRoutes(SelectedRoutes.gw)}
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
                        onClick={() => setSelectedRoutes(SelectedRoutes.lre)}
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
                                {StaticDataService.lreCharacters
                                    .filter(x => !x.lre?.finished)
                                    .map(le => (
                                        <li key={le.name}>{le.name}</li>
                                    ))}
                            </ul>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Button onClick={() => setSelectedRoutes(SelectedRoutes.all)}>Go Back</Button>
            )}

            {selectedRoutes === SelectedRoutes.lre && <PlanLeRoutes />}
            {selectedRoutes === SelectedRoutes.gw && <PlanGuildWarRoutes />}
        </div>
    );
};
