import React from 'react';
import { Card, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TargetIcon from '@mui/icons-material/TrackChanges';

export const LearnRoutes = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
            <Card
                onClick={() => navigate('characters')}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TargetIcon /> Characters
                        </div>
                    }
                />
            </Card>

            <Card
                onClick={() => navigate('upgrades')}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TargetIcon /> Upgrades
                        </div>
                    }
                />
            </Card>

            <Card
                onClick={() => navigate('rankLookup')}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TargetIcon /> Rank Lookup
                        </div>
                    }
                />
            </Card>

            <Card
                onClick={() => navigate('campaigns')}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TargetIcon /> Campaigns
                        </div>
                    }
                />
            </Card>

            <Card
                onClick={() => navigate('dirtyDozen')}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TargetIcon /> Dirty Dozen
                        </div>
                    }
                />
            </Card>
        </div>
    );
};
