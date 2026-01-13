import { Card, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { menuItemById } from '@/models/menu-items';

export const PlanGuildWarRoutes = () => {
    const navigate = useNavigate();
    const defenseItem = menuItemById['defense'];
    const offenseItem = menuItemById['offense'];
    const layoutItem = menuItemById['zones'];
    return (
        <div className="flex gap-2.5 flex-col items-center">
            <Card
                variant="outlined"
                onClick={() => navigate(defenseItem.routeMobile)}
                sx={{
                    width: 350,
                    minHeight: 140,
                }}>
                <CardHeader
                    title={
                        <div className="flex items-center gap-2.5">
                            {defenseItem.icon} {defenseItem.label}
                        </div>
                    }
                />
            </Card>

            <Card
                variant="outlined"
                onClick={() => navigate(offenseItem.routeMobile)}
                sx={{
                    width: 350,
                    minHeight: 140,
                }}>
                <CardHeader
                    title={
                        <div className="flex items-center gap-2.5">
                            {offenseItem.icon} {offenseItem.label}
                        </div>
                    }
                />
            </Card>
            <Card
                variant="outlined"
                onClick={() => navigate(layoutItem.routeMobile)}
                sx={{
                    width: 350,
                    minHeight: 140,
                }}>
                <CardHeader
                    title={
                        <div className="flex items-center gap-2.5">
                            {layoutItem.icon} {layoutItem.label}
                        </div>
                    }
                />
            </Card>
        </div>
    );
};
