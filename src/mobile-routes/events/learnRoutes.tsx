import { Card, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { learnSubMenuMobile } from '../../models/menu-items';

export const LearnRoutes = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {item.icon} {item.label}
                            </div>
                        }
                    />
                </Card>
            ))}
        </div>
    );
};
