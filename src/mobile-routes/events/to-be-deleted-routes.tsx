import { useNavigate } from 'react-router-dom';

import { menuItemById } from '../../models/menu-items';
import { MobileNavCard } from '../components/mobile-nav-card';

export const PlanToBeDeletedRoutes = () => {
    const navigate = useNavigate();
    const teams = menuItemById['teams'];
    const defenseItem = menuItemById['defense'];
    const offenseItem = menuItemById['offense'];

    return (
        <div className="flex w-full flex-col items-center gap-4">
            {[defenseItem, offenseItem, teams].map(item => (
                <MobileNavCard
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => navigate(item.routeMobile)}
                />
            ))}
        </div>
    );
};
