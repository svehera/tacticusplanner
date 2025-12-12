import InfoIcon from '@mui/icons-material/Info';
import { Card, CardContent, CardHeader } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import React, { useContext, useEffect, useMemo, useRef } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { LreTrackId } from '@/fsd/4-entities/lre';

import {
    ILegendaryEvent,
    ILegendaryEventTrack,
    ILreTeam,
    IRequirementProgress,
    RequirementStatus,
} from '@/fsd/3-features/lre';

import { LreTile } from './lre-tile';
import { SelectedTeamCard } from './selected-teams-card';
import { TrackRequirementCheck } from './track-requirement-check';

interface Props {
    legendaryEvent: ILegendaryEvent;
    track: ILegendaryEventTrack;
    teams: ILreTeam[];
    startAddTeam: (section: LreTrackId, requirements: string[]) => void;
    progress: Record<string, number>;
    editTeam: (team: ILreTeam) => void;
    deleteTeam: (teamId: string) => void;
    restrictions: string[];
}

export const LreTeamsCard: React.FC<Props> = ({
    legendaryEvent,
    track,
    progress,
    startAddTeam,
    teams: selectedTeams,
    editTeam,
    deleteTeam,
    restrictions,
}) => {
    const gridRef = useRef<AgGridReact>(null);

    const { viewPreferences, autoTeamsPreferences, leSelectedRequirements } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const selectedRequirementsForEvent = leSelectedRequirements[track.eventId]?.[track.section] ?? {};

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

    const handleStatusChange = (restrictionName: string, progress: IRequirementProgress) => {
        dispatch.leSelectedRequirements({
            type: 'UpdateStatus',
            eventId: track.eventId,
            section: track.section,
            restrictionName,
            progress,
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

    const getRequirementProgress = (restrictionName: string): IRequirementProgress => {
        const saved = selectedRequirementsForEvent[restrictionName];

        // If it's already in new format
        if (saved !== undefined && typeof saved === 'object' && 'status' in saved) {
            return saved as IRequirementProgress;
        }

        // Legacy boolean format
        if (typeof saved === 'boolean') {
            return {
                status: saved ? RequirementStatus.Cleared : RequirementStatus.NotCleared,
            };
        }

        // Default
        return {
            status: RequirementStatus.NotCleared,
        };
    };

    return (
        <Card variant="outlined">
            <CardHeader
                title={track.name}
                subheader={
                    <div className="flex-box gap5">
                        <span className="italic text-base"> vs {track.enemies.label}</span>
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
                        .map(restriction => {
                            const requirementProgress = getRequirementProgress(restriction.name);
                            const isKillScore = restriction.name.toLowerCase().includes('kill score');

                            return (
                                <TrackRequirementCheck
                                    key={restriction.name}
                                    checked={restrictions.includes(restriction.name)}
                                    restriction={restriction}
                                    onCheckboxChange={value => handleChange(value, restriction.name)}
                                    onStatusChange={progress => handleStatusChange(restriction.name, progress)}
                                    requirementProgress={requirementProgress}
                                    progress={`${progress[restriction.name] ?? 0}/${legendaryEvent.battlesCount}`}
                                    isKillScore={isKillScore}
                                />
                            );
                        })}
                </div>
                <br />
                <div className="flex-box column gap-[1px] start min-h-[300px] max-h-[300px] overflow-auto">
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
