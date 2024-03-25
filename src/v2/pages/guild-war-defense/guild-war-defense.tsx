import React, { useContext, useMemo } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { FlexBox } from 'src/v2/components/flex-box';
import { BattlefieldInfo } from 'src/v2/features/guild-war/battlefield-info';
import { BfLevelSelect } from 'src/v2/features/guild-war/bf-level-select';
import { BfSectionSelect } from 'src/v2/features/guild-war/bf-section-select';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';
import { Team } from 'src/v2/features/characters/components/team';
import { ICharacter2 } from 'src/models/interfaces';
import { Conditional } from 'src/v2/components/conditional';
import { CharacterItemDialog } from 'src/shared-components/character-item-dialog';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { SelectTeamDialog } from 'src/v2/features/characters/components/select-team-dialog';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { orderBy, sum } from 'lodash';
import InfoIcon from '@mui/icons-material/Info';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { PotentialInfo } from 'src/v2/features/characters/components/potential-info';
import { Rank, Rarity } from 'src/models/enums';
import { GuildWarTeamType, IGWTeamWithCharacters } from 'src/v2/features/guild-war/guild-war.models';

export const GuildWarDefense = () => {
    const { guildWar, characters, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openSelectTeamDialog, setOpenSelectTeamDialog] = React.useState(false);
    const [editedTeam, setEditedTeam] = React.useState<IGWTeamWithCharacters | null>(null);
    const [editedTeamRarityCap, setEditedTeamRarityCap] = React.useState<Rarity>(Rarity.Legendary);

    const [openCharacterItemDialog, setOpenCharacterItemDialog] = React.useState(false);
    const [editedCharacter, setEditedCharacter] = React.useState<ICharacter2 | null>(null);

    const updateBfLevel = (battlefieldLevel: number) => {
        dispatch.teams({ type: 'UpdateBfLevel', battlefieldLevel });
    };

    const updateBfSection = (sectionId: string) => {
        dispatch.teams({ type: 'UpdateBfSection', sectionId });
    };

    const startEditCharacter = (character: ICharacter2): void => {
        setEditedCharacter(character);
        setOpenCharacterItemDialog(true);
    };

    const endEditCharacter = (): void => {
        setEditedCharacter(null);
        setOpenCharacterItemDialog(false);
    };

    const startEditTeam = (team: IGWTeamWithCharacters, rarity: Rarity): void => {
        setEditedTeam(team);
        setEditedTeamRarityCap(rarity);
        setOpenSelectTeamDialog(true);
    };

    const endEditTeam = (team?: ICharacter2[]): void => {
        if (team && editedTeam) {
            dispatch.teams({
                type: 'UpdateTeam',
                teamId: editedTeam.id,
                lineup: team.map(x => x.name),
                rarityCap: Rarity.Legendary,
            });
        }
        setEditedTeamRarityCap(Rarity.Legendary);
        setEditedTeam(null);
        setOpenSelectTeamDialog(false);
    };

    const rarityCaps = useMemo(() => {
        return GuildWarService.getRarityCaps(guildWar.battlefieldLevel, guildWar.sectionId);
    }, [guildWar.sectionId, guildWar.battlefieldLevel]);

    const teamsWithCharacters = useMemo<IGWTeamWithCharacters[]>(() => {
        return guildWar.teams
            .filter(x => x.type === GuildWarTeamType.Defense)
            .map(team => {
                const teamWithChars = team.lineup.map(name => characters.find(char => char.name === name)!);
                return { ...team, lineup: teamWithChars.filter(x => !!x) };
            });
    }, [guildWar.teams, characters]);

    const teamsPotential = useMemo(() => {
        return teamsWithCharacters.map((team, teamIndex) => {
            const lineup = team.lineup.map(x => ({
                id: x.name,
                potential: CharactersService.calculateCharacterPotential(
                    CharactersService.capCharacterAtRarity(x, rarityCaps[teamIndex]),
                    rarityCaps[teamIndex]
                ),
            }));

            return {
                lineup,
                total: Math.round(sum(lineup.map(x => x.potential)) / 5),
            };
        });
    }, [guildWar.sectionId, guildWar.battlefieldLevel, guildWar.teams, teamsWithCharacters]);

    const renderTeams = useMemo(() => {
        return teamsWithCharacters.map((currTeam, i) => {
            return (
                <FlexBox key={i} gap={5}>
                    <Team
                        teamName={currTeam.name}
                        characters={currTeam.lineup}
                        teamIcon={<RarityImage rarity={rarityCaps[i]} />}
                        teamBenchmark={
                            <FlexBox gap={5}>
                                {teamsPotential[i].total}{' '}
                                <AccessibleTooltip
                                    title={
                                        <>
                                            <p>Team potential breakdown:</p>
                                            <FlexBox style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                                {teamsPotential[i].lineup.map(char => (
                                                    <span key={char.id}>
                                                        {char.potential} - {char.id}
                                                    </span>
                                                ))}
                                            </FlexBox>
                                        </>
                                    }>
                                    <InfoIcon color="primary" />
                                </AccessibleTooltip>
                            </FlexBox>
                        }
                    />
                    <EditIcon
                        onClick={() => startEditTeam(currTeam, rarityCaps[i])}
                        color={'primary'}
                        style={{ cursor: 'pointer' }}
                    />
                </FlexBox>
            );
        });
    }, [rarityCaps, teamsWithCharacters, teamsPotential]);

    const getCharactersWithPotential = (rarityCap: Rarity, currentTeamId: string) => {
        const blockedCharacters = teamsWithCharacters
            .filter(x => x.id !== currentTeamId)
            .flatMap(x => x.lineup)
            .map(x => x.name);
        return orderBy(
            characters
                .filter(x => x.rank > Rank.Locked && !blockedCharacters.includes(x.name))
                .map(x => CharactersService.capCharacterAtRarity(x, rarityCap))
                .map(x => ({
                    ...x,
                    potential: CharactersService.calculateCharacterPotential(x, rarityCap),
                })),
            'potential',
            'desc'
        );
    };

    return (
        <FlexBox style={{ flexDirection: 'column', gap: 30 }}>
            <FlexBox gap={10}>
                <BattlefieldInfo />
                <BfLevelSelect value={guildWar.battlefieldLevel} valueChange={updateBfLevel} />
                <BfSectionSelect
                    value={guildWar.sectionId}
                    valueChange={updateBfSection}
                    bfLevel={guildWar.battlefieldLevel}
                />
            </FlexBox>
            <FlexBox gap={5}>
                Overall Potential: {Math.round(sum(teamsPotential.map(x => x.total)) / 5)}/100
                <PotentialInfo />
            </FlexBox>
            <CharactersViewContext.Provider
                value={{
                    showAbilities: viewPreferences.showAbilitiesLevel,
                    showBadges: viewPreferences.showBadges,
                    showPower: viewPreferences.showPower,
                    showBsValue: viewPreferences.showBsValue,
                    showCharacterLevel: viewPreferences.showCharacterLevel,
                    showCharacterRarity: viewPreferences.showCharacterRarity,
                    onCharacterClick: startEditCharacter,
                }}>
                <FlexBox wrap={true} gap={30}>
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
                        rarityCap={editedTeamRarityCap}
                        onClose={endEditTeam}
                        characters={getCharactersWithPotential(editedTeamRarityCap, editedTeam.id)}
                    />
                )}
            </CharactersViewContext.Provider>
        </FlexBox>
    );
};
