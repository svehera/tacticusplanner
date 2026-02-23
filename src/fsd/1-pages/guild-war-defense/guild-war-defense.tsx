/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import InfoIcon from '@mui/icons-material/Info';
import { Card, CardActions, CardContent, CardHeader } from '@mui/material';
import Button from '@mui/material/Button';
import { orderBy, sum } from 'lodash';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { ICharacter2 } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { getCompletionRateColor } from 'src/shared-logic/functions';

import { Rarity, Rank } from '@/fsd/5-shared/model';
import { AccessibleTooltip, FlexBox, Conditional } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';

import { CharactersService as CharacterEntityService } from '@/fsd/4-entities/character';

import { CharacterItemDialog } from '@/fsd/3-features/character-details/character-item-dialog';
import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';
import { CharactersService } from '@/fsd/3-features/characters/characters.service';
import { PotentialInfo } from '@/fsd/3-features/characters/components/potential-info';
import { SelectTeamDialog } from '@/fsd/3-features/characters/components/select-team-dialog';
import { Team } from '@/fsd/3-features/characters/components/team';
import { BattlefieldInfo } from '@/fsd/3-features/guild-war/battlefield-info';
import { BfZoneDifficultySelect } from '@/fsd/3-features/guild-war/bf-zone-difficulty-select';
import { GuildWarTeamType, IGWTeamWithCharacters } from '@/fsd/3-features/guild-war/guild-war.models';
import { GuildWarService } from '@/fsd/3-features/guild-war/guild-war.service';

import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';

export const GuildWarDefense = () => {
    const { guildWar, characters, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openSelectTeamDialog, setOpenSelectTeamDialog] = useState(false);
    const [editedTeam, setEditedTeam] = useState<IGWTeamWithCharacters | null>(null);

    const [openCharacterItemDialog, setOpenCharacterItemDialog] = useState(false);
    const [editedCharacter, setEditedCharacter] = useState<ICharacter2 | null>(null);

    useEffect(() => {
        const rarityCaps = GuildWarService.getDifficultyRarityCaps(guildWar.zoneDifficulty);
        dispatch.guildWar({ type: 'UpdateDefenseRarityCaps', rarityCaps });
    }, [guildWar.zoneDifficulty]);

    const updateZoneDifficulty = (zoneDifficulty: number) => {
        dispatch.guildWar({ type: 'UpdateZoneDifficulty', zoneDifficulty });
    };

    const endEditCharacter = (): void => {
        setEditedCharacter(null);
        setOpenCharacterItemDialog(false);
    };

    const startEditTeam = (team: IGWTeamWithCharacters): void => {
        setEditedTeam(team);
        setOpenSelectTeamDialog(true);
    };

    const clearTeam = (teamId: string): void => {
        dispatch.guildWar({
            type: 'ClearTeamLineup',
            teamId,
        });
    };

    const endEditTeam = (team?: ICharacter2[]): void => {
        if (team && editedTeam) {
            dispatch.guildWar({
                type: 'UpdateTeam',
                teamId: editedTeam.id,
                lineup: team.map(x => x.name),
                rarityCap: editedTeam.rarityCap,
            });
        }
        setEditedTeam(null);
        setOpenSelectTeamDialog(false);
    };

    const teamsWithCharacters = useMemo<IGWTeamWithCharacters[]>(() => {
        return guildWar.teams
            .filter(x => x.type === GuildWarTeamType.Defense)
            .map(team => {
                const teamWithChars = team.lineup.map(name =>
                    characters.find(char => CharacterEntityService.matchesAnyCharacterId(name, char))
                );
                return { ...team, lineup: teamWithChars.filter(x => !!x) };
            });
    }, [guildWar.teams, characters]);

    const teamsPotential = useMemo(() => {
        return teamsWithCharacters.map(team => {
            const lineup = team.lineup.map(x => ({
                id: x.shortName,
                potential: CharactersService.calculateCharacterPotential(
                    CharactersService.capCharacterAtRarity(x, team.rarityCap),
                    team.rarityCap
                ),
            }));

            return {
                lineup,
                total: Math.round(sum(lineup.map(x => x.potential)) / 5),
            };
        });
    }, [teamsWithCharacters]);

    const renderTeams = useMemo(
        () =>
            teamsWithCharacters.map((currTeam, i) => (
                <TeamCard
                    key={currTeam.id}
                    team={currTeam}
                    onEdit={() => startEditTeam(currTeam)}
                    onClear={() => clearTeam(currTeam.id)}
                    teamPotential={teamsPotential[i].total}
                    onCharacterClick={() => {}}
                    teamPotentialBreakdown={
                        <FlexBox className="flex-col items-start">
                            {teamsPotential[i].lineup.map(char => (
                                <span key={char.id}>
                                    {char.potential} - {char.id}
                                </span>
                            ))}
                        </FlexBox>
                    }
                />
            )),
        [teamsWithCharacters, teamsPotential]
    );

    const getCharactersWithPotential = (rarityCap: Rarity) => {
        return orderBy(
            characters
                .filter(x => x.rank > Rank.Locked)
                .map(x => CharactersService.capCharacterAtRarity(x, rarityCap))
                .map(x => ({
                    ...x,
                    potential: CharactersService.calculateCharacterPotential(x, rarityCap),
                })),
            'potential',
            'desc'
        );
    };

    const getBlockedCharacters = (currentTeamId: string) => {
        return teamsWithCharacters
            .filter(x => x.id !== currentTeamId)
            .flatMap(x => x.lineup)
            .map(x => x.name);
    };

    return (
        <FlexBox className="flex-col gap-2.5">
            <FlexBox className="gap-2.5">
                <BattlefieldInfo />
                <Button
                    variant={'contained'}
                    component={Link}
                    to={isMobile ? '/mobile/plan/guildWar/offense' : '/plan/guildWar/offense'}>
                    Go to: Offense
                </Button>
                <BfZoneDifficultySelect value={guildWar.zoneDifficulty} valueChange={updateZoneDifficulty} />
            </FlexBox>
            <FlexBox gap={5}>
                Overall Potential: {Math.round(sum(teamsPotential.map(x => x.total)) / 5)}/100
                <PotentialInfo />
            </FlexBox>
            <CharactersViewContext.Provider
                value={{
                    showAbilitiesLevel: viewPreferences.showAbilitiesLevel,
                    showBadges: viewPreferences.showBadges,
                    showPower: viewPreferences.showPower,
                    showBsValue: viewPreferences.showBsValue,
                    showEquipment: viewPreferences.showEquipment,
                    showCharacterLevel: viewPreferences.showCharacterLevel,
                    showCharacterRarity: viewPreferences.showCharacterRarity,
                }}>
                <RosterSnapshotsAssetsProvider>
                    <FlexBox wrap={true} gap={30} justifyContent={'center'}>
                        {renderTeams}
                    </FlexBox>

                    <Conditional condition={!!editedCharacter}>
                        <CharacterItemDialog
                            character={editedCharacter!}
                            isOpen={openCharacterItemDialog}
                            onClose={endEditCharacter}
                        />
                    </Conditional>

                    {editedTeam && (
                        <SelectTeamDialog
                            isOpen={openSelectTeamDialog}
                            team={editedTeam.lineup}
                            teamName={editedTeam.name}
                            rarityCap={editedTeam.rarityCap}
                            onClose={endEditTeam}
                            characters={getCharactersWithPotential(editedTeam.rarityCap)}
                            blockedCharacters={getBlockedCharacters(editedTeam.id)}
                        />
                    )}
                </RosterSnapshotsAssetsProvider>
            </CharactersViewContext.Provider>
        </FlexBox>
    );
};

const TeamCard: React.FC<{
    team: IGWTeamWithCharacters;
    onEdit: () => void;
    onClear: () => void;
    teamPotential: number;
    teamPotentialBreakdown: React.ReactElement;
    onCharacterClick: (character: ICharacter2) => void;
}> = ({ team, teamPotential, teamPotentialBreakdown, onEdit, onClear, onCharacterClick }) => {
    return (
        <Card
            variant="outlined"
            sx={{
                minWidth: 524,
                width: 'fit-content',
                flexShrink: 0,
                boxShadow: '1px 2px 3px rgba(0, 0, 0, 0.6)',
            }}>
            <CardHeader
                title={
                    <FlexBox justifyContent={'space-between'}>
                        <FlexBox gap={5} className="text-lg">
                            <RarityIcon rarity={team.rarityCap} />
                            <span>{team.name}</span>
                        </FlexBox>
                        <FlexBox gap={5} className="text-base">
                            {teamPotential}
                            <AccessibleTooltip
                                title={
                                    <>
                                        <p>Team potential breakdown:</p>
                                        {teamPotentialBreakdown}
                                    </>
                                }>
                                <InfoIcon
                                    style={{ color: getCompletionRateColor(teamPotential, 100) }}
                                    fontSize="small"
                                />
                            </AccessibleTooltip>
                        </FlexBox>
                    </FlexBox>
                }
                subheader={Rarity[team.rarityCap]}
            />
            <CardContent
                sx={{
                    padding: '10px',
                    '&:last-child': { paddingBottom: '10px' },
                    '& > div': {
                        display: 'inline-flex',
                        flexWrap: 'nowrap',
                        gap: '6px',
                        justifyContent: 'center',
                    },
                }}>
                <Team
                    characters={team.lineup.map(x => CharactersService.capCharacterAtRarity(x, team.rarityCap))}
                    onSetSlotClick={onCharacterClick}
                    onEmptySlotClick={onEdit}
                />
            </CardContent>
            <CardActions>
                <Button size="small" onClick={onEdit}>
                    Edit
                </Button>
                <Conditional condition={!!team.lineup.length}>
                    <Button size="small" color="error" onClick={onClear}>
                        Clear
                    </Button>
                </Conditional>
            </CardActions>
        </Card>
    );
};
