import { DeleteForever, Edit } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { sum } from 'lodash';
import React from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ICharacter2 } from 'src/models/interfaces';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { getCompletionRateColor } from 'src/shared-logic/functions';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';

import { CharactersService as NewCharService } from '@/fsd/4-entities/character';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IMow2 } from '@/fsd/3-features/characters/characters.models';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersService } from '@/fsd/3-features/characters/characters.service';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TeamView } from '@/fsd/3-features/teams/components/team-view';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { allModes } from '@/fsd/3-features/teams/teams.constants';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GameMode } from '@/fsd/3-features/teams/teams.enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IPersonalTeam } from '@/fsd/3-features/teams/teams.models';

interface Props {
    teams: IPersonalTeam[];
    characters: ICharacter2[];
    mows: IMow2[];
    deleteTeam: (teamId: string) => void;
    editTeam: (team: IPersonalTeam) => void;
}

export const TeamsGrid: React.FC<Props> = ({ teams, characters, mows, deleteTeam, editTeam }) => {
    const guildRaidTeams = teams.filter(x => x.primaryGameMode === GameMode.guildRaids);
    const taTeams = teams.filter(x => x.primaryGameMode === GameMode.tournamentArena);
    const gwTeams = teams.filter(x => x.primaryGameMode === GameMode.guildWar);
    const survivalTeams = teams.filter(x => x.primaryGameMode === GameMode.survival);

    const renderTeam = (team: IPersonalTeam) => {
        const teamCharacters = team.lineup.map(id => {
            return characters.find(character => NewCharService.matchesAnyCharacterId(id, character));
        });
        const teamMowId = typeof team.mowId === 'string' ? team.mowId : undefined;
        const teamMow = teamMowId ? mows.find(x => [x.snowprintId, x.id].includes(teamMowId)) : undefined;
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
                    title={<span className="text-[1.2rem]">{team.name}</span>}
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
        const teamCharacters = team.lineup
            .map(id => characters.find(character => NewCharService.matchesAnyCharacterId(id, character))!)
            .filter(x => x !== undefined);
        const cappedCharacters = teamCharacters.map(x => CharactersService.capCharacterAtRarity(x, team.rarityCap));
        const teamMow = mows.find(x => x.id === team.mowId);
        const withMow = !!teamMow;
        const subModes = team.subModes.map(value => allModes.find(x => x.value === value)?.label ?? '').join(', ');

        const teamPotential = cappedCharacters.map(x =>
            CharactersService.calculateCharacterPotential(x, team.rarityCap)
        );
        const totalPotential = teamCharacters.length > 0 ? Math.round(sum(teamPotential) / teamCharacters.length) : 0;

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
                            <div className="flex-box gap5 text-base">
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
                        <span className="text-[1.2rem]">
                            <div className="flex-box gap5 text-lg">
                                <RarityIcon rarity={team.rarityCap} />
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
                    <div className="flex gap-3 flex-wrap items-center">{guildRaidTeams.map(renderTeam)}</div>
                </div>
            )}
            {!!taTeams.length && (
                <div>
                    <h2>Tournament Arena</h2>
                    <div className="flex gap-3 flex-wrap items-center">{taTeams.map(renderCappedTeam)}</div>
                </div>
            )}

            {!!gwTeams.length && (
                <div>
                    <h2>Guild War</h2>
                    <div className="flex gap-3 flex-wrap items-center">{gwTeams.map(renderCappedTeam)}</div>
                </div>
            )}

            {!!survivalTeams.length && (
                <div>
                    <h2>Survival</h2>
                    <div className="flex gap-3 flex-wrap items-center">{survivalTeams.map(renderCappedTeam)}</div>
                </div>
            )}
        </div>
    );
};
