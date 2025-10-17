﻿import React, { useContext, useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { LreTrackId, LegendaryEventEnum } from '@/fsd/4-entities/lre';

import {
    ILegendaryEvent,
    ILegendaryEventSelectedRequirements,
    ILegendaryEventTrack,
    ILreTeam,
} from '@/fsd/3-features/lre';

import { LreTeamsCard } from './lre-teams-card';
import { LreTeamsTable } from './lre-teams-table';

interface Props {
    legendaryEvent: ILegendaryEvent;
    track: ILegendaryEventTrack;
    teams: ILreTeam[];
    autoAddTeam: (section: LreTrackId, requirements: string[], characters: ICharacter2[]) => void;
    startAddTeam: (section: LreTrackId, requirements: string[]) => void;
    editTeam: (team: ILreTeam) => void;
    deleteTeam: (teamId: string) => void;
    progress: Record<string, number>;
}

export const LegendaryEventTrack: React.FC<Props> = ({
    legendaryEvent,
    track,
    startAddTeam,
    progress,
    teams: selectedTeams,
    autoAddTeam,
    editTeam,
    deleteTeam,
}) => {
    const { viewPreferences, leSelectedRequirements } = useContext(StoreContext);

    if (viewPreferences.hideCompleted) {
        track.unitsRestrictions.forEach(restriction => {
            restriction.hide = progress[restriction.name] === legendaryEvent.battlesCount;
        });
    }

    const restrictions = useMemo(() => {
        const event: ILegendaryEventSelectedRequirements = leSelectedRequirements[track.eventId] ?? {
            id: track.eventId,
            name: LegendaryEventEnum[track.eventId],
            alpha: {},
            beta: {},
            gamma: {},
        };
        const section = event[track.section];
        const result: string[] = [];

        track.unitsRestrictions
            .filter(x => !x.hide)
            .forEach(x => {
                const selected = section[x.name] !== undefined ? section[x.name] : x.selected;
                if (selected) {
                    result.push(x.name);
                }
            });

        return result;
    }, [leSelectedRequirements]);

    return viewPreferences.lreGridView ? (
        <div style={{ flex: 1 }}>
            <LreTeamsCard
                legendaryEvent={legendaryEvent}
                track={track}
                teams={selectedTeams}
                startAddTeam={startAddTeam}
                editTeam={editTeam}
                deleteTeam={deleteTeam}
                progress={progress}
                restrictions={restrictions}
            />
        </div>
    ) : (
        <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <LreTeamsTable
                legendaryEvent={legendaryEvent}
                track={track}
                teams={selectedTeams}
                autoAddTeam={autoAddTeam}
                startAddTeam={startAddTeam}
                editTeam={editTeam}
                progress={progress}
                restrictions={restrictions}
            />
        </div>
    );
};
