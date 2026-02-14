import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Card, CardContent, CardHeader } from '@mui/material';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PlanGuildWarRoutes } from 'src/mobile-routes/events/guildWarRoutes';
import { PlanLeRoutes } from 'src/mobile-routes/events/leRoutes';
import { menuItemById } from 'src/models/menu-items';

import { CharactersService } from '@/fsd/4-entities/character';

import { campaignProgressionMenuItem } from '@/fsd/1-pages/plan-campaign-progression';

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
    const teams2MenuItem = menuItemById['teams2'];
    const warOffense2MenuItem = menuItemById['warOffense2'];

    const [selectedRoutes, setSelectedRoutes] = useState<SelectedRoutes>(SelectedRoutes.all);

    return (
        <div className="flex flex-col items-center gap-2.5">
            {selectedRoutes === SelectedRoutes.all ? (
                <>
                    {[
                        goalsMenuItem,
                        dailyRaidsMenuItem,
                        teamsMenuItem,
                        teams2MenuItem,
                        warOffense2MenuItem,
                        campaignProgressionMenuItem,
                    ].map(menuItem => (
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
                                    <div className="flex items-center gap-2.5">
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
                                <div className="flex items-center gap-2.5">
                                    <FormatListBulletedIcon /> Guild War
                                </div>
                            }
                        />
                        <CardContent className="flex flex-col">
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
                                <div className="flex items-center gap-2.5">
                                    <FormatListBulletedIcon /> LRE
                                </div>
                            }
                        />
                        <CardContent className="flex flex-col">
                            <ul>
                                <li>Master Table</li>
                                {CharactersService.activeLres.map(le => (
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
