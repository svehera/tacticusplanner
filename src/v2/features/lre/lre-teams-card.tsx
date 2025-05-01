import InfoIcon from '@mui/icons-material/Info';
import { Card, CardContent, CardHeader, Checkbox, FormControlLabel } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { LegendaryEventEnum } from 'src/models/enums';
import { ILegendaryEventSelectedRequirements, ILegendaryEventTrack, ILreTeam, LreTrackId } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { TrackRequirementCheck } from 'src/v2/features/lre/track-requirement-check';

import { LreTile } from './lre-tile';
import { SelectedTeamCard } from './selected-teams-card';

interface Props {
    track: ILegendaryEventTrack;
    teams: ILreTeam[];
    startAddTeam: (section: LreTrackId, requirements: string[]) => void;
    progress: Record<string, number>;
    editTeam: (team: ILreTeam) => void;
    deleteTeam: (teamId: string) => void;
    restrictions: string[];
}

export const LreTeamsCard: React.FC<Props> = ({
    track,
    progress,
    startAddTeam,
    teams: selectedTeams,
    editTeam,
    deleteTeam,
    restrictions,
}) => {
    const gridRef = useRef<AgGridReact>(null);

    const { viewPreferences, autoTeamsPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const gridTeam = useMemo(
        () => track.suggestTeam(autoTeamsPreferences, viewPreferences.onlyUnlocked, restrictions),
        [autoTeamsPreferences, restrictions, viewPreferences.onlyUnlocked]
    );

    useEffect(() => {
        gridRef.current?.api?.sizeColumnsToFit();
    }, [
        viewPreferences.showAlpha,
        viewPreferences.showBeta,
        viewPreferences.showGamma,
        track.eventId,
        viewPreferences.hideCompleted,
    ]);

    const handleChange = (selected: boolean, restrictionName: string) => {
        dispatch.leSelectedRequirements({
            type: 'Update',
            eventId: track.eventId,
            section: track.section,
            restrictionName,
            selected,
        });
    };

    const addTeam = () => {
        startAddTeam(track.section, restrictions);
    };

    const handleAction = (team: ILreTeam) => (action: 'edit' | 'delete') => {
        if (action === 'edit') {
            editTeam(team);
        }
        if (action === 'delete') {
            deleteTeam(team.id);
        }
    };

    return (
        <Card variant="outlined">
            <CardHeader
                title={track.name}
                subheader={
                    <div className="flex-box gap5">
                        <span style={{ fontStyle: 'italic', fontSize: '1rem' }}> vs {track.enemies.label}</span>
                        <a href={track.enemies.link} target={'_blank'} rel="noreferrer">
                            <InfoIcon color={'primary'} />
                        </a>
                    </div>
                }
            />
            <CardContent>
                <div className="flex-box around wrap">
                    {track.unitsRestrictions
                        .filter(x => !x.hide)
                        .map(restriction => (
                            <TrackRequirementCheck
                                key={restriction.name}
                                checked={restrictions.includes(restriction.name)}
                                restriction={restriction}
                                onCheckboxChange={value => handleChange(value, restriction.name)}
                                progress={`${progress[restriction.name]}/14`}
                            />
                        ))}
                </div>
                <br />
                <div
                    className="flex-box column gap1 start"
                    style={{ minHeight: 300, maxHeight: 300, overflow: 'auto' }}>
                    {gridTeam.map(character => (
                        <LreTile
                            key={character.id}
                            character={character}
                            settings={viewPreferences}
                            onClick={addTeam}
                        />
                    ))}
                </div>
                {selectedTeams.length ? (
                    <>
                        <h3>Selected Teams ({selectedTeams.length})</h3>
                        <div className="flex-box wrap">
                            {selectedTeams.map(team => (
                                <SelectedTeamCard key={team.id} team={team} menuItemSelect={handleAction(team)} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div>Click on any character tile above to start adding teams</div>
                )}
            </CardContent>
        </Card>
    );
};
