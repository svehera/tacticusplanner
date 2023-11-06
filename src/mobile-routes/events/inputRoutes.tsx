import React from 'react';
import { Card, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TargetIcon from '@mui/icons-material/TrackChanges';

export const InputRoutes = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
            <Card
                onClick={() => navigate('/mobile/wyo')}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TargetIcon /> Who You Own
                        </div>
                    }
                />
            </Card>

            <Card
                onClick={() => navigate('campaignsProgress')}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TargetIcon /> Campaigns Progress
                        </div>
                    }
                />
            </Card>

            <Card
                onClick={() => navigate('inventory')}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TargetIcon /> Inventory
                        </div>
                    }
                />
            </Card>
        </div>
    );
};
