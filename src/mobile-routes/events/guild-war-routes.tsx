import { useNavigate } from 'react-router-dom';

import { trackEvent } from '@/fsd/5-shared/monitoring';

import { menuItemById } from '../../models/menu-items';
import { MobileNavCard } from '../components/mobile-nav-card';

export const PlanGuildWarRoutes = () => {
    const navigate = useNavigate();
    const defenseItem = menuItemById['warDefense2'];
    const offenseItem = menuItemById['warOffense2'];
    const layoutItem = menuItemById['zones'];

    return (
        <div className="flex w-full flex-col items-center gap-4">
            {[defenseItem, offenseItem, layoutItem].map(item => (
                <MobileNavCard
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => {
                        trackEvent('nav_menu_select', {
                            feature: 'navigation',
                            action: 'select',
                            destination_path: item.routeMobile,
                            source: 'mobile_category_card',
                        });
                        navigate(item.routeMobile);
                    }}
                />
            ))}
        </div>
    );
};
