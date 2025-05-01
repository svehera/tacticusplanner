import { AgGridReact } from 'ag-grid-react';
import React, { useContext, useMemo, useRef, useState } from 'react';

import { LegendaryEventEnum } from 'src/models/enums';
import {
    ICharacter2,
    ILegendaryEventSelectedRequirements,
    ILegendaryEventTrack,
    ILreTeam,
    LreTrackId,
} from 'src/models/interfaces';
import { StoreContext } from 'src/reducers/store.provider';

import { LreTeamsCard } from 'src/v2/features/lre/lre-teams-card';
import { LreTeamsTable } from 'src/v2/features/lre/lre-teams-table';

interface Props {
    track: ILegendaryEventTrack;
    teams: ILreTeam[];
    autoAddTeam: (section: LreTrackId, requirements: string[], characters: ICharacter2[]) => void;
    startAddTeam: (section: LreTrackId, requirements: string[]) => void;
    editTeam: (team: ILreTeam) => void;
    deleteTeam: (teamId: string) => void;
    progress: Record<string, number>;
}

export const LegendaryEventTrack: React.FC<Props> = ({
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
            restriction.hide = progress[restriction.name] === 14;
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
