import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { StaticDataService } from '../../services';
import { CharacterImage } from '../../shared-components/character-image';
import { menuItemById } from '../../models/menu-items';
import { Conditional } from '@/fsd/5-shared/ui';

export const PlanGuildWarRoutes = () => {
    const navigate = useNavigate();
    const defenseItem = menuItemById['defense'];
    const offenseItem = menuItemById['offense'];
    const layoutItem = menuItemById['zones'];
    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
            <Card
                variant="outlined"
                onClick={() => navigate(defenseItem.routeMobile)}
                sx={{
                    width: 350,
                    minHeight: 140,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {layoutItem.icon} {layoutItem.label}
                        </div>
                    }
                />
            </Card>
        </div>
    );
};
