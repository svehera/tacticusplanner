import { useNavigate } from 'react-router-dom';

import { trackEvent } from '@/fsd/5-shared/monitoring';

import { learnSubMenuMobile } from '../../models/menu-items';
import { MobileNavCard } from '../components/mobile-nav-card';

export const LearnRoutes = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center gap-4 px-4 py-4">
            {learnSubMenuMobile.map(item => (
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
