import InfoIcon from '@mui/icons-material/Info';
import { Card, CardContent, CardHeader } from '@mui/material';
import React, { useContext, useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { LreTrackId } from '@/fsd/4-entities/lre';

// eslint-disable-next-line import-x/no-internal-modules
import { ICharacterUpgradeMow, ICharacterUpgradeRankGoal } from '@/fsd/3-features/goals/goals.models';
import { ILegendaryEvent, ILegendaryEventTrack, ILreTeam } from '@/fsd/3-features/lre';

import { LreTile } from './lre-tile';
import { SelectedTeamCard } from './selected-teams-card';
import { TrackRequirementCheck } from './track-requirement-check';

interface Props {
    legendaryEvent: ILegendaryEvent;
    track: ILegendaryEventTrack;
    teams: ILreTeam[];
    upgradeRankOrMowGoals: (ICharacterUpgradeRankGoal | ICharacterUpgradeMow)[];
    startAddTeam: (section: LreTrackId, requirements: string[]) => void;
    progress: Record<string, number>;
    editTeam: (team: ILreTeam) => void;
    deleteTeam: (teamId: string) => void;
    restrictions: string[];
    updateRestrictionSelection: (
        eventId: ILegendaryEventTrack['eventId'],
        section: LreTrackId,
        restrictionName: string,
        selected: boolean
    ) => void;
}

export const LreTeamsCard: React.FC<Props> = ({
    legendaryEvent,
    track,
    progress,
    upgradeRankOrMowGoals,
    startAddTeam,
    teams: selectedTeams,
    editTeam,
    deleteTeam,
    restrictions,
    updateRestrictionSelection,
}) => {
    const { viewPreferences, autoTeamsPreferences } = useContext(StoreContext);

    const gridTeam = useMemo(
        () => track.suggestTeam(autoTeamsPreferences, viewPreferences.onlyUnlocked, restrictions),
        [autoTeamsPreferences, restrictions, viewPreferences.onlyUnlocked]
    );

    const handleChange = (selected: boolean, restrictionName: string) => {
        updateRestrictionSelection(track.eventId, track.section, restrictionName, selected);
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
                                progress={`${progress[restriction.name] ?? 0}/${legendaryEvent.battlesCount}`}
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
                            upgradeRankOrMowGoals={upgradeRankOrMowGoals}
                            character={character}
                            settings={viewPreferences}
                            onClick={addTeam}
                        />
                    ))}
                </div>
                {selectedTeams.length > 0 ? (
                    <>
                        <h3>Selected Teams ({selectedTeams.length})</h3>
                        <div className="flex-box wrap">
                            {selectedTeams.map(team => (
                                <SelectedTeamCard
                                    key={team.id}
                                    team={team}
                                    upgradeRankOrMowGoals={upgradeRankOrMowGoals}
                                    menuItemSelect={handleAction(team)}
                                />
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
