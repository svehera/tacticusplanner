import InfoIcon from '@mui/icons-material/Info';
import { Card, CardActions, CardContent, CardHeader, Input } from '@mui/material';
import Button from '@mui/material/Button';
import { groupBy, mapValues, orderBy, sum } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ICharacter2 } from 'src/models/interfaces';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { getCompletionRateColor } from 'src/shared-logic/functions';

import { Rarity, Rank } from '@/fsd/5-shared/model';
import { AccessibleTooltip, Conditional, FlexBox } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';

import { CharactersService as CharacterEntityService } from '@/fsd/4-entities/character';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharacterItemDialog } from '@/fsd/3-features/character-details/character-item-dialog';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersService } from '@/fsd/3-features/characters/characters.service';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersGrid } from '@/fsd/3-features/characters/components/characters-grid';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { PotentialInfo } from '@/fsd/3-features/characters/components/potential-info';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { SelectTeamDialog } from '@/fsd/3-features/characters/components/select-team-dialog';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { Team } from '@/fsd/3-features/characters/components/team';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { useGetGuildRosters } from '@/fsd/3-features/guild/guild.endpoint';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IGuildWarOffensePlayer } from '@/fsd/3-features/guild/guild.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ViewGuildOffense } from '@/fsd/3-features/guild/view-guild-offense';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { BattlefieldInfo } from '@/fsd/3-features/guild-war/battlefield-info';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { DeploymentStatus } from '@/fsd/3-features/guild-war/deployment-status';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GuildWarTeamType, IGWTeamWithCharacters } from '@/fsd/3-features/guild-war/guild-war.models';

export const GuildWarOffense = () => {
    const { guild, guildWar, characters, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openSelectTeamDialog, setOpenSelectTeamDialog] = useState(false);
    const [editedTeam, setEditedTeam] = useState<IGWTeamWithCharacters | null>(null);

    const [openCharacterItemDialog, setOpenCharacterItemDialog] = useState(false);
    const [editedCharacter, setEditedCharacter] = useState<ICharacter2 | null>(null);

    const { data, loading } = useGetGuildRosters({ members: guild.members });

    const startEditCharacter = (character: ICharacter2): void => {
        const originalChar = characters.find(x => x.name === character.name);
        if (originalChar) {
            setEditedCharacter(originalChar);
            setOpenCharacterItemDialog(true);
        }
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

    const endEditTeam = (team?: ICharacter2[], rarityCap?: Rarity, teamName?: string): void => {
        if (team && rarityCap && editedTeam && teamName) {
            dispatch.guildWar({
                type: 'UpdateTeam',
                teamId: editedTeam.id,
                lineup: team.map(x => x.name),
                rarityCap: rarityCap,
                teamName,
            });
        }
        setEditedTeam(null);
        setOpenSelectTeamDialog(false);
    };

    const guildWarPlayers: IGuildWarOffensePlayer[] = useMemo(() => {
        if (!data) {
            return [];
        }

        return data.guildUsers.map(user => {
            const userCharacters = data.userData[user].characters;
            const userDeployedCharacters = data.userData[user].offense.deployedCharacters;
            const unlockedCharacters = userCharacters.filter(x => x.rank > Rank.Locked);
            const availableCharacters = unlockedCharacters.filter(x => !userDeployedCharacters.includes(x.name));
            return {
                username: user,
                tokensLeft: data.userData[user].offense.tokensLeft,
                charactersLeft: availableCharacters.length,
                charactersUnlocked: unlockedCharacters.length,
                rarityPool: CharactersService.groupByRarityPools(availableCharacters),
            };
        });
    }, [data]);

    const teamsWithCharacters = useMemo<IGWTeamWithCharacters[]>(() => {
        const teams = guildWar.teams
            .filter(x => x.type === GuildWarTeamType.Offense)
            .map(team => {
                const teamWithChars = team.lineup.map(name =>
                    characters.find(char => CharacterEntityService.matchesAnyCharacterId(name, char))
                );
                return { ...team, lineup: teamWithChars.filter(x => !!x) };
            });
        return orderBy(
            teams,
            [
                team => {
                    return team.lineup.every(character => !guildWar.deployedCharacters.includes(character.name));
                },
            ],
            ['desc']
        );
    }, [guildWar.teams, characters, guildWar.deployedCharacters]);

    const teamsPotential = useMemo(() => {
        return teamsWithCharacters.map(team => {
            const lineup = team.lineup.map(x => ({
                id: x.name,
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
                    actions={
                        <>
                            <Button size="small" onClick={() => startEditTeam(currTeam)}>
                                Edit
                            </Button>
                            <Conditional condition={!!currTeam.lineup.length}>
                                <Button size="small" color="error" onClick={() => clearTeam(currTeam.id)}>
                                    Clear
                                </Button>
                            </Conditional>
                            <Conditional
                                condition={
                                    !!currTeam.lineup.length &&
                                    currTeam.lineup.some(
                                        character => !guildWar.deployedCharacters.includes(character.name)
                                    )
                                }>
                                <Button size="small" onClick={() => deployTeam(currTeam.lineup.map(x => x.name))}>
                                    Deploy
                                </Button>
                            </Conditional>
                            <Conditional
                                condition={
                                    !!currTeam.lineup.length &&
                                    currTeam.lineup.every(character =>
                                        guildWar.deployedCharacters.includes(character.name)
                                    )
                                }>
                                <Button size="small" onClick={() => withdrawTeam(currTeam.lineup.map(x => x.name))}>
                                    Withdraw
                                </Button>
                            </Conditional>
                        </>
                    }
                    onEdit={() => startEditTeam(currTeam)}
                    teamPotential={teamsPotential[i].total}
                    onCharacterClick={startEditCharacter}
                    teamPotentialBreakdown={
                        <div className="flex-box column start">
                            {teamsPotential[i].lineup.map(char => (
                                <span key={char.id}>
                                    {char.potential} - {char.id}
                                </span>
                            ))}
                        </div>
                    }
                />
            )),
        [teamsWithCharacters, teamsPotential, guildWar.deployedCharacters]
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

    const getTeamsSlots = useMemo(() => {
        const slots = mapValues(
            groupBy(
                guildWar.teams
                    .filter(
                        team =>
                            team.type === GuildWarTeamType.Offense &&
                            team.lineup.length > 0 &&
                            !team.lineup.every(character => guildWar.deployedCharacters.includes(character))
                    )
                    .map(team => team.rarityCap)
            ),
            x => x.length
        );

        if (!Object.values(slots).length) {
            return 'Empty. Add some characters to the teams below';
        }

        return [Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
            const slotsCount = slots[rarity];
            if (slotsCount) {
                return (
                    <div key={rarity} className="flex-box gap-[3px]">
                        <RarityIcon rarity={rarity} /> x{slotsCount}
                    </div>
                );
            }
        });
    }, [guildWar.teams, guildWar.deployedCharacters]);

    const availableCharacters = useMemo(() => {
        return characters.filter(
            character => character.rank > Rank.Locked && !guildWar.deployedCharacters.includes(character.name)
        );
    }, [characters, guildWar.deployedCharacters]);

    const groupByRarityPools = () => {
        const slots = CharactersService.groupByRarityPools(availableCharacters);

        return [Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
            const slotsCount = slots[rarity];
            if (slotsCount) {
                return (
                    <div key={rarity} className="flex-box gap-[3px]">
                        <RarityIcon rarity={rarity} /> x{slotsCount}
                    </div>
                );
            }
        });
    };

    const deployCharacter = (character: string) => {
        dispatch.guildWar({ type: 'DeployCharacter', character });
    };

    const deployTeam = (charactersIds: string[]) => {
        dispatch.guildWar({ type: 'DeployTeam', charactersIds });
    };

    const withdrawCharacter = (character: string) => {
        dispatch.guildWar({ type: 'WithdrawCharacter', character });
    };

    const withdrawTeam = (charactersIds: string[]) => {
        dispatch.guildWar({ type: 'WithdrawTeam', charactersIds });
    };

    const clearDeployedCharacters = () => {
        dispatch.guildWar({ type: 'ClearDeployedCharacters' });
    };

    const handleWarTokensChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch.guildWar({ type: 'EditWarTokens', value: event.target.value === '' ? 0 : Number(event.target.value) });
    };

    return (
        <div className="flex-box column gap10">
            <CharactersViewContext.Provider
                value={{
                    showAbilitiesLevel: viewPreferences.showAbilitiesLevel,
                    showBadges: viewPreferences.showBadges,
                    showPower: viewPreferences.showPower,
                    showBsValue: viewPreferences.showBsValue,
                    showCharacterLevel: viewPreferences.showCharacterLevel,
                    showCharacterRarity: viewPreferences.showCharacterRarity,
                    getOpacity: character => (guildWar.deployedCharacters.includes(character.name) ? 0.5 : 1),
                }}>
                <div className="flex-box gap10">
                    <BattlefieldInfo />
                    <Button
                        variant={'contained'}
                        component={Link}
                        to={isMobile ? '/mobile/plan/guildWar/defense' : '/plan/guildWar/defense'}>
                        Go to: Defense
                    </Button>
                    <DeploymentStatus charactersLeft={availableCharacters.length} onClearAll={clearDeployedCharacters}>
                        <div className="flex-box gap-[3px]">
                            <MiscIcon icon={'warToken'} />
                            <Input
                                value={guildWar.attackTokens}
                                size="small"
                                onChange={handleWarTokensChange}
                                onFocus={event => event.target.select()}
                                inputProps={{
                                    step: 1,
                                    min: 0,
                                    max: 10,
                                    type: 'number',
                                    'aria-labelledby': 'input-slider',
                                }}
                            />
                        </div>
                        <div className="flex-box gap5">Rarity pools: {groupByRarityPools()}</div>
                        <CharactersGrid
                            onlyBlocked
                            characters={orderBy(
                                characters,
                                [
                                    character =>
                                        CharactersService.calculateCharacterPotential(character, Rarity.Legendary),
                                ],
                                ['desc']
                            )}
                            blockedCharacters={guildWar.deployedCharacters}
                            onAvailableCharacterClick={character => deployCharacter(character.name)}
                            onLockedCharacterClick={character => withdrawCharacter(character.name)}
                        />
                    </DeploymentStatus>

                    <AccessibleTooltip title={'War tokens. Deploy/withdraw team to decrement/increment by 1'}>
                        <div className="flex-box gap-[3px]">
                            <MiscIcon icon={'warToken'} /> {guildWar.attackTokens}/10
                        </div>
                    </AccessibleTooltip>
                </div>
                {!!guild.members.length && <ViewGuildOffense guildWarPlayers={guildWarPlayers} loading={loading} />}
                <div className="flex-box gap5">Your teams: {getTeamsSlots}</div>
                <div className="flex-box gap5">
                    Overall Potential: {Math.round(sum(teamsPotential.map(x => x.total)) / teamsPotential.length)}/100
                    <PotentialInfo />
                </div>

                <FlexBox wrap={true} justifyContent={'center'} gap={30}>
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
                        allowPropsEdit
                        isOpen={openSelectTeamDialog}
                        team={editedTeam.lineup}
                        teamName={editedTeam.name}
                        rarityCap={editedTeam.rarityCap}
                        onClose={endEditTeam}
                        characters={getCharactersWithPotential(editedTeam.rarityCap)}
                        blockedCharacters={getBlockedCharacters(editedTeam.id)}
                    />
                )}
            </CharactersViewContext.Provider>
        </div>
    );
};

const TeamCard: React.FC<{
    team: IGWTeamWithCharacters;
    actions: React.ReactElement;
    onEdit: () => void;
    onCharacterClick: (character: ICharacter2) => void;
    teamPotential: number;
    teamPotentialBreakdown: React.ReactElement;
}> = ({ actions, team, teamPotential, teamPotentialBreakdown, onEdit, onCharacterClick }) => {
    return (
        <Card variant="outlined" sx={{ maxWidth: 400, boxShadow: '1px 2px 3px rgba(0, 0, 0, 0.6)' }}>
            <CardHeader
                title={
                    <FlexBox justifyContent={'space-between'}>
                        <div className="flex-box gap5 text-lg">
                            <RarityIcon rarity={team.rarityCap} />
                            <span>{team.name}</span>
                        </div>
                        <div className="flex-box gap5 text-base">
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
                        </div>
                    </FlexBox>
                }
                subheader={Rarity[team.rarityCap]}
            />
            <CardContent className="py-0">
                <Team
                    characters={team.lineup.map(x => CharactersService.capCharacterAtRarity(x, team.rarityCap))}
                    onSetSlotClick={onCharacterClick}
                    onEmptySlotClick={onEdit}
                />
            </CardContent>
            <CardActions>{actions}</CardActions>
        </Card>
    );
};
