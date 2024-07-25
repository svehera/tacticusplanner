import React from 'react';
import { IPersonalTeam } from 'src/v2/features/teams/teams.models';
import { GameMode } from 'src/v2/features/teams/teams.enums';
import { ICharacter2 } from 'src/models/interfaces';
import { IMow } from 'src/v2/features/characters/characters.models';
import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { DeleteForever, Edit } from '@mui/icons-material';
import { TeamView } from 'src/v2/features/teams/components/team-view';

interface Props {
    teams: IPersonalTeam[];
    characters: ICharacter2[];
    mows: IMow[];
    deleteTeam: (teamId: string) => void;
    editTeam: (team: IPersonalTeam) => void;
}

export const TeamsGrid: React.FC<Props> = ({ teams, characters, mows, deleteTeam, editTeam }) => {
    const guildRaidTeams = teams.filter(x => x.primaryGameMode === GameMode.guildRaids);
    const taTeams = teams.filter(x => x.primaryGameMode === GameMode.tournamentArena);

    const renderTeam = (team: IPersonalTeam) => {
        const teamCharacters = team.lineup.map(id => characters.find(character => id === character.id)!);
        const teamMow = mows.find(x => x.id === team.mowId);
        const withMow = !!teamMow;

        return (
            <Card
                key={team.id}
                variant="outlined"
                sx={{
                    width: withMow ? 500 : 450,
                    minHeight: 200,
                }}>
                <CardHeader
                    action={
                        <>
                            <IconButton onClick={() => editTeam(team)}>
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton onClick={() => deleteTeam(team.id)}>
                                <DeleteForever fontSize="small" />
                            </IconButton>
                        </>
                    }
                    title={<span style={{ fontSize: '1.2rem' }}>{team.name}</span>}
                    subheader={team.subModes.join(',')}
                />
                <CardContent>
                    <TeamView characters={teamCharacters} mow={teamMow} withMow={withMow} />
                    <span>{team.notes}</span>
                </CardContent>
            </Card>
        );
    };

    return (
        <div>
            {!!guildRaidTeams.length && (
                <div>
                    <h2>Guild Raids</h2>
                    {guildRaidTeams.map(renderTeam)}
                </div>
            )}
            {!!taTeams.length && (
                <div>
                    <h2>Tournament Arena</h2>
                    {taTeams.map(renderTeam)}
                </div>
            )}
        </div>
    );
};
