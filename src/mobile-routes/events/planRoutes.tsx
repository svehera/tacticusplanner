import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { StaticDataService } from '../../services';
import { CharacterImage } from '../../shared-components/character-image';
import TargetIcon from '@mui/icons-material/TrackChanges';

export const PlanRoutes = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
            <Card
                onClick={() => navigate('/mobile/goals')}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TargetIcon /> Goals
                        </div>
                    }
                />
            </Card>

            <Card
                onClick={() => navigate('dailyRaids')}
                sx={{
                    width: 350,
                    minHeight: 200,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TargetIcon /> Daily Raids
                        </div>
                    }
                />
            </Card>
            {StaticDataService.legendaryEvents.map(le => (
                <Card
                    key={le.name}
                    onClick={() => navigate(le.mobileRoute)}
                    sx={{
                        width: 350,
                        minHeight: 200,
                    }}>
                    <CardHeader
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <CharacterImage icon={le.icon} name={le.name} /> {le.name}
                            </div>
                        }
                        subheader={'Legendary Event'}
                    />
                    <CardContent style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>Stage: {le.stage}/3</span>
                        <span>Next event: {le.nextEventDate}</span>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
