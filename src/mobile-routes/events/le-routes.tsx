import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { menuItemById } from 'src/models/menu-items';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { ICharacterData } from '@/fsd/4-entities/character/model';
import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

import { MobileNavCard } from '../components/mobile-nav-card';

function isValidLreDate(date: unknown): date is string {
    return (
        date !== null &&
        typeof date === 'string' &&
        date !== 'TBA' &&
        date !== '' &&
        !Number.isNaN(new Date(date).getTime())
    );
}

function sortCharsByLreDate(a: ICharacterData, b: ICharacterData) {
    const aDate = a.lre?.nextEventDateUtc;
    const bDate = b.lre?.nextEventDateUtc;

    const aHasValidDate = isValidLreDate(aDate);
    const bHasValidDate = isValidLreDate(bDate);

    if (aHasValidDate && bHasValidDate) {
        return new Date(aDate).getTime() - new Date(bDate).getTime();
    }

    if (aHasValidDate && !bHasValidDate) return -1;
    if (!aHasValidDate && bHasValidDate) return 1;

    const aStage = a.lre?.eventStage || 0;
    const bStage = b.lre?.eventStage || 0;
    return bStage - aStage;
}

export const PlanLeRoutes = () => {
    const navigate = useNavigate();
    const leMasterTableMenuItem = menuItemById['leMasterTable'];
    const sortedActiveLres: ICharacterData[] = useMemo(
        () => CharactersService.activeLres.toSorted(sortCharsByLreDate),
        []
    );

    return (
        <div className="flex w-full flex-col items-center gap-4">
            <MobileNavCard
                icon={leMasterTableMenuItem.icon}
                label={leMasterTableMenuItem.label}
                onClick={() => navigate(leMasterTableMenuItem.routeMobile)}
            />

            {sortedActiveLres.map(le => {
                const isFinished = !!le.lre?.finished;
                return (
                    <div
                        key={le.name}
                        className={`flex min-h-[140px] w-full max-w-[350px] cursor-pointer flex-col overflow-hidden rounded-xl border border-(--card-border) bg-(--card-bg) shadow-sm transition-colors${isFinished ? 'opacity-50' : ''}`}
                        onClick={() => navigate(`/mobile/plan/lre?character=${LegendaryEventEnum[le.lre!.id]}`)}>
                        <div className="border-b border-(--card-border) px-4 py-3">
                            <div className="flex items-center gap-2.5 font-medium">
                                <UnitShardIcon icon={le.roundIcon} name={le.name} /> {le.name}
                            </div>
                            <span className="text-sm text-(--muted-fg)">Legendary Event</span>
                        </div>
                        <div className="px-4 py-3 text-sm">
                            {isFinished ? (
                                <span>Finished</span>
                            ) : (
                                <>
                                    <div>Stage: {le.lre?.eventStage}/3</div>
                                    <div>Next event: {le.lre?.nextEventDate}</div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
