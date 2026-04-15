import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Card, CardContent, CardHeader } from '@mui/material';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PlanGuildWarRoutes } from 'src/mobile-routes/events/guild-war-routes';
import { PlanLeRoutes } from 'src/mobile-routes/events/le-routes';
import { menuItemById } from 'src/models/menu-items';

import { CharactersService } from '@/fsd/4-entities/character';

import { bulkGoalCreatorMenuItem } from '@/fsd/1-pages/plan-bulk-goals/bulk-goal-creator.menu-item';
import { campaignProgressionMenuItem } from '@/fsd/1-pages/plan-campaign-progression';

import { PlanToBeDeletedRoutes } from './to-be-deleted-routes';

enum SelectedRoutes {
    all,
    lre,
    gw,
    tbk,
}

export const PlanRoutes = () => {
    const navigate = useNavigate();
    const goalsMenuItem = menuItemById['goals'];
    const dailyRaidsMenuItem = menuItemById['dailyRaids'];
    const teams2MenuItem = menuItemById['teams2'];
    const questsMenuItem = menuItemById['quests'];
    const cesMenuItem = menuItemById['ces'];
    const hsesMenuItem = menuItemById['hses'];

    const [selectedRoutes, setSelectedRoutes] = useState<SelectedRoutes>(SelectedRoutes.all);

    return (
        <div className="flex flex-col items-center gap-2.5">
            {selectedRoutes === SelectedRoutes.all ? (
                <>
                    {[
                        goalsMenuItem,
                        dailyRaidsMenuItem,
                        teams2MenuItem,
                        campaignProgressionMenuItem,
                        questsMenuItem,
                        cesMenuItem,
                        hsesMenuItem,
                        bulkGoalCreatorMenuItem,
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

                    <Card
                        variant="outlined"
                        onClick={() => setSelectedRoutes(SelectedRoutes.tbk)}
                        sx={{
                            width: 350,
                            minHeight: 140,
                        }}>
                        <CardHeader
                            title={
                                <div className="flex items-center gap-2.5">
                                    <FormatListBulletedIcon /> To Be Deleted
                                </div>
                            }
                        />
                        <CardContent className="flex flex-col">
                            <ul>
                                <li>Old Teams</li>
                                <li>Old Guild War Offense</li>
                                <li>Old Guild War Defense</li>
                            </ul>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Button onClick={() => setSelectedRoutes(SelectedRoutes.all)}>Go Back</Button>
            )}

            {selectedRoutes === SelectedRoutes.lre && <PlanLeRoutes />}
            {selectedRoutes === SelectedRoutes.gw && <PlanGuildWarRoutes />}
            {selectedRoutes === SelectedRoutes.tbk && <PlanToBeDeletedRoutes />}
        </div>
    );
};
