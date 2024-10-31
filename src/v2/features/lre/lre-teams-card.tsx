import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { AgGridReact } from 'ag-grid-react';

import { ILegendaryEventSelectedRequirements, ILegendaryEventTrack, ILreTeam, LreTrackId } from 'src/models/interfaces';
import { LegendaryEventEnum } from 'src/models/enums';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import InfoIcon from '@mui/icons-material/Info';
import { Card, CardContent, CardHeader, Checkbox, FormControlLabel } from '@mui/material';
import { LreTile } from './lre-tile';
import { SelectedTeamCard } from './selected-teams-card';

interface Props {
    track: ILegendaryEventTrack;
    teams: ILreTeam[];
    startAddTeam: (section: LreTrackId, requirements: string[]) => void;
    completedRequirements: string[];
    editTeam: (team: ILreTeam) => void;
}

export const LreTeamsCard: React.FC<Props> = ({ track, completedRequirements, startAddTeam, teams: selectedTeams }) => {
    const gridRef = useRef<AgGridReact>(null);

    const { viewPreferences, autoTeamsPreferences, leSelectedRequirements, selectedTeamOrder } =
        useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

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

        track.unitsRestrictions.forEach(x => {
            const selected = section[x.name] !== undefined ? section[x.name] : x.selected;
            if (selected && !completedRequirements.includes(x.name)) {
                result.push(x.name);
            }
        });

        return result;
    }, [leSelectedRequirements, completedRequirements]);

    const gridTeam = useMemo(
        () => track.suggestTeam(autoTeamsPreferences, viewPreferences.onlyUnlocked, restrictions),
        [autoTeamsPreferences, restrictions, viewPreferences.onlyUnlocked, selectedTeamOrder]
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

    return (
        <Card variant="outlined">
            <CardHeader
                title={track.name + ' - ' + track.killPoints}
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
                <div className="flex-box wrap">
                    {track.unitsRestrictions.map(resriction => (
                        <FormControlLabel
                            key={resriction.name}
                            control={
                                <Checkbox
                                    checked={restrictions.includes(resriction.name)}
                                    onChange={event => handleChange(event.target.checked, resriction.name)}
                                    inputProps={{ 'aria-label': 'controlled' }}
                                />
                            }
                            label={`(${resriction.points}) ${resriction.name}`}
                        />
                    ))}
                </div>
                <div className="flex-box column start" style={{ minHeight: 300, maxHeight: 300, overflow: 'auto' }}>
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
                        <h3>Selected Teams</h3>
                        <div className="flex-box wrap">
                            {selectedTeams.map(team => (
                                <SelectedTeamCard key={team.id} team={team} />
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
