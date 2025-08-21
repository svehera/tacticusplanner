import { Card, CardContent, CardHeader } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { menuItemById } from 'src/models/menu-items';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { ICharacterData } from '@/fsd/4-entities/character/model';
import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

function sortCharsByLreDate(a: ICharacterData, b: ICharacterData) {
    function isValidLreDate(date: unknown): date is string {
        return (
            date !== null &&
            typeof date === 'string' &&
            date !== 'TBA' &&
            date !== '' &&
            !isNaN(new Date(date).getTime())
        );
    }
    const aDate = a.lre?.nextEventDateUtc;
    const bDate = b.lre?.nextEventDateUtc;

    const aHasValidDate = isValidLreDate(aDate);
    const bHasValidDate = isValidLreDate(bDate);

    // If both have valid dates, sort by date (earliest first)
    if (aHasValidDate && bHasValidDate) {
        return new Date(aDate).getTime() - new Date(bDate).getTime();
    }

    // Valid dates come before invalid/missing ones including "TBA"
    if (aHasValidDate && !bHasValidDate) return -1;
    if (!aHasValidDate && bHasValidDate) return 1;

    // When both have invalid dates - sort by eventStage (descending)
    const aStage = a.lre?.eventStage || 0;
    const bStage = b.lre?.eventStage || 0;
    return bStage - aStage;
}

export const PlanLeRoutes = () => {
    const navigate = useNavigate();
    const leMasterTableMenuItem = menuItemById['leMasterTable'];
    return (
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', alignItems: 'center' }}>
            <Card
                variant="outlined"
                onClick={() => navigate(leMasterTableMenuItem.routeMobile)}
                sx={{
                    width: 350,
                    minHeight: 140,
                }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {leMasterTableMenuItem.icon} {leMasterTableMenuItem.label}
                        </div>
                    }
                />
            </Card>

            {CharactersService.activeLres.sort(sortCharsByLreDate).map(le => {
                const isFinished = !!le.lre?.finished;
                return (
                    <Card
                        variant="outlined"
                        key={le.name}
                        onClick={() => navigate(`/mobile/plan/lre?character=${LegendaryEventEnum[le.lre!.id]}`)}
                        sx={{
                            width: 350,
                            minHeight: 140,
                            opacity: isFinished ? 0.5 : 1,
                        }}>
                        <CardHeader
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <UnitShardIcon icon={le.roundIcon} name={le.name} /> {le.name}
                                </div>
                            }
                            subheader={'Legendary Event'}
                        />
                        <CardContent style={{ display: 'flex', flexDirection: 'column' }}>
                            {isFinished ? (
                                <span>Finished</span>
                            ) : (
                                <>
                                    <span>Stage: {le.lre?.eventStage}/3</span>
                                    <span>Next event: {le.lre?.nextEventDate}</span>
                                </>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
