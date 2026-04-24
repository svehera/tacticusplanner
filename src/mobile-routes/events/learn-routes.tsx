import { useNavigate } from 'react-router-dom';

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
                    onClick={() => navigate(item.routeMobile)}
                />
            ))}
        </div>
    );
};
