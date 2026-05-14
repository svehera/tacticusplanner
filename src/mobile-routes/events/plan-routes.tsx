import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PlanGuildWarRoutes } from 'src/mobile-routes/events/guild-war-routes';
import { PlanLeRoutes } from 'src/mobile-routes/events/le-routes';
import { menuItemById } from 'src/models/menu-items';

import { CharactersService } from '@/fsd/4-entities/character';

import { bulkGoalCreatorMenuItem } from '@/fsd/1-pages/plan-bulk-goals/bulk-goal-creator.menu-item';
import { campaignProgressionMenuItem } from '@/fsd/1-pages/plan-campaign-progression';

import { MobileCategoryCard } from '../components/mobile-category-card';
import { MobileNavCard } from '../components/mobile-nav-card';

enum SelectedRoutes {
    all,
    lre,
    gw,
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
        <div className="flex flex-col items-center gap-4 px-4 py-4">
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
                        <MobileNavCard
                            key={menuItem.label}
                            icon={menuItem.icon}
                            label={menuItem.label}
                            onClick={() => navigate(menuItem.routeMobile)}
                        />
                    ))}

                    <MobileCategoryCard
                        icon={<FormatListBulletedIcon />}
                        label="Guild War"
                        items={['Defense', 'Offense', 'War zones']}
                        onClick={() => setSelectedRoutes(SelectedRoutes.gw)}
                    />
                    <MobileCategoryCard
                        icon={<FormatListBulletedIcon />}
                        label="LRE"
                        items={['Master Table', ...CharactersService.activeLres.map(le => le.name)]}
                        onClick={() => setSelectedRoutes(SelectedRoutes.lre)}
                    />
                </>
            ) : (
                <Button onClick={() => setSelectedRoutes(SelectedRoutes.all)}>Go Back</Button>
            )}

            {selectedRoutes === SelectedRoutes.lre && <PlanLeRoutes />}
            {selectedRoutes === SelectedRoutes.gw && <PlanGuildWarRoutes />}
        </div>
    );
};
