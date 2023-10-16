import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { StaticDataService } from '../../services';
import { CharacterImage } from '../../shared-components/character-image';

export const Events = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
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
