import React, { useContext, useRef, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';

import { ILegendaryEventTrack, ILreTeam, LreTrackId } from 'src/models/interfaces';

import { StoreContext } from 'src/reducers/store.provider';
import { LreTeamsCard } from 'src/v2/features/lre/lre-teams-card';
import { LreTeamsTable } from 'src/v2/features/lre/lre-teams-table';

interface Props {
    track: ILegendaryEventTrack;
    teams: ILreTeam[];
    startAddTeam: (section: LreTrackId, requirements: string[]) => void;
    completedRequirements: string[];
    editTeam: (team: ILreTeam) => void;
}

export const LegendaryEventTrack: React.FC<Props> = ({
    track,
    startAddTeam,
    completedRequirements,
    teams: selectedTeams,
    editTeam,
}) => {
    const { viewPreferences } = useContext(StoreContext);

    return viewPreferences.lreGridView ? (
        <div style={{ flex: 1 }}>
            <LreTeamsCard
                track={track}
                teams={selectedTeams}
                startAddTeam={startAddTeam}
                editTeam={editTeam}
                completedRequirements={completedRequirements}
            />
        </div>
    ) : (
        <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <LreTeamsTable
                track={track}
                teams={selectedTeams}
                startAddTeam={startAddTeam}
                editTeam={editTeam}
                completedRequirements={completedRequirements}
            />
        </div>
    );
};
