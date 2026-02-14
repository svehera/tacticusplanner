import { Card, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { learnSubMenuMobile } from '../../models/menu-items';

export const LearnRoutes = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center gap-2.5">
            {learnSubMenuMobile.map(item => (
                <Card
                    variant="outlined"
                    key={item.label}
                    onClick={() => navigate(item.routeMobile)}
                    sx={{
                        width: 350,
                        minHeight: 140,
                    }}>
                    <CardHeader
                        title={
                            <div className="flex items-center gap-2.5">
                                {item.icon} {item.label}
                            </div>
                        }
                    />
                </Card>
            ))}
        </div>
    );
};
