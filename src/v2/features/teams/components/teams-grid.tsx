import React from 'react';
import { IPersonalTeam } from 'src/v2/features/teams/teams.models';
import { GameMode } from 'src/v2/features/teams/teams.enums';
import { ICharacter2 } from 'src/models/interfaces';
import { IMow } from 'src/v2/features/characters/characters.models';
import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { DeleteForever, Edit } from '@mui/icons-material';
import { TeamView } from 'src/v2/features/teams/components/team-view';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import InfoIcon from '@mui/icons-material/Info';
import { getCompletionRateColor } from 'src/shared-logic/functions';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { sum } from 'lodash';
import { allModes } from 'src/v2/features/teams/teams.constants';
import { isMobile } from 'react-device-detect';

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
        const subModes = team.subModes.map(value => allModes.find(x => x.value === value)?.label ?? '').join(', ');

        return (
            <Card
                key={team.id}
                variant="outlined"
                sx={{
                    zoom: isMobile ? '80%' : '100%',
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
                    subheader={subModes}
                />
                <CardContent>
                    <TeamView characters={teamCharacters} mow={teamMow} withMow={withMow} />
                    <span>{team.notes}</span>
                </CardContent>
            </Card>
        );
    };

    const renderCappedTeam = (team: IPersonalTeam) => {
        const teamCharacters = team.lineup.map(id => characters.find(character => id === character.id)!);
        const cappedCharacters = teamCharacters.map(x => CharactersService.capCharacterAtRarity(x, team.rarityCap));
        const teamMow = mows.find(x => x.id === team.mowId);
        const withMow = !!teamMow;
        const subModes = team.subModes.map(value => allModes.find(x => x.value === value)?.label ?? '').join(', ');

        const teamPotential = cappedCharacters.map(x =>
            CharactersService.calculateCharacterPotential(x, team.rarityCap)
        );
        const totalPotential = Math.round(sum(teamPotential) / 5);

        return (
            <Card
                key={team.id}
                variant="outlined"
                sx={{
                    zoom: isMobile ? '80%' : '100%',
                    width: withMow ? 500 : 450,
                    minHeight: 200,
                }}>
                <CardHeader
                    action={
                        <div className="flex-box">
                            <IconButton onClick={() => editTeam(team)}>
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton onClick={() => deleteTeam(team.id)}>
                                <DeleteForever fontSize="small" />
                            </IconButton>
                            <div className="flex-box gap5" style={{ fontSize: 16 }}>
                                {totalPotential}
                                <AccessibleTooltip
                                    title={
                                        <>
                                            <p>Team potential breakdown:</p>
                                            <div className="flex-box column start">
                                                {teamCharacters.map((char, index) => (
                                                    <span key={char.id}>
                                                        {teamPotential[index]} - {char.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    }>
                                    <InfoIcon
                                        style={{ color: getCompletionRateColor(totalPotential, 100) }}
                                        fontSize="small"
                                    />
                                </AccessibleTooltip>
                            </div>
                        </div>
                    }
                    title={
                        <span style={{ fontSize: '1.2rem' }}>
                            <div className="flex-box gap5" style={{ fontSize: 18 }}>
                                <RarityImage rarity={team.rarityCap} />
                                <span>{team.name}</span>
                            </div>
                        </span>
                    }
                    subheader={subModes}
                />
                <CardContent>
                    <TeamView characters={cappedCharacters} mow={teamMow} withMow={withMow} />
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
                    <div className="flex-box gap10 wrap">{guildRaidTeams.map(renderTeam)}</div>
                </div>
            )}
            {!!taTeams.length && (
                <div>
                    <h2>Tournament Arena</h2>
                    <div className="flex-box gap10 wrap">{taTeams.map(renderCappedTeam)}</div>
                </div>
            )}
        </div>
    );
};
