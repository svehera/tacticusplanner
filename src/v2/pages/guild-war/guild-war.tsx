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
import { sum } from 'lodash';
import InfoIcon from '@mui/icons-material/Info';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { PotentialInfo } from 'src/v2/features/characters/components/potential-info';

export const GuildWar = () => {
    const { teams, characters, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openSelectTeamDialog, setOpenSelectTeamDialog] = React.useState(false);
    const [editedTeamId, setEditedTeamId] = React.useState<string | null>(null);
    const [editedLineup, setEditedLineup] = React.useState<ICharacter2[] | null>(null);

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

    const startEditTeam = (teamId: string, lineup: ICharacter2[]): void => {
        setEditedTeamId(teamId);
        setEditedLineup(lineup);
        setOpenSelectTeamDialog(true);
    };

    const endEditTeam = (team?: ICharacter2[]): void => {
        if (team && editedTeamId) {
            dispatch.teams({
                type: 'AddOrUpdateGWTeam',
                team: { id: editedTeamId, lineup: team.map(x => x.name) },
            });
        }
        setEditedTeamId(null);
        setEditedLineup(null);
        setOpenSelectTeamDialog(false);
    };

    const rarityCaps = useMemo(() => {
        return GuildWarService.getRarityCaps(teams.guildWar.battlefieldLevel, teams.guildWar.sectionId);
    }, [teams.guildWar.sectionId, teams.guildWar.battlefieldLevel]);

    const teamsWithCharacters = useMemo(() => {
        return teams.guildWar.teams.map(team => {
            const teamWithChars = team.lineup.map(name => characters.find(char => char.name === name)!);
            return { id: team.id, lineup: teamWithChars.filter(x => !!x) };
        });
    }, [teams.guildWar.teams, characters]);

    // const teamsWithCharacters = teams.guildWar.teams.map(team => {
    //     const teamWithChars = team.lineup.map(name => characters.find(char => char.name === name)!);
    //     return { id: team.id, lineup: teamWithChars.filter(x => !!x) };
    // });

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
    }, [teams.guildWar.sectionId, teams.guildWar.battlefieldLevel, teams.guildWar.teams, teamsWithCharacters]);

    const renderTeams = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => {
            const currTeam = teamsWithCharacters[i];
            const lineup = currTeam?.lineup ?? [];
            return (
                <FlexBox key={i} gap={5}>
                    <Team
                        teamName={`Team ${i + 1}`}
                        characters={lineup}
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
                    <EditIcon onClick={() => startEditTeam(currTeam?.id, lineup)} />
                </FlexBox>
            );
        });
    }, [rarityCaps, teams.guildWar.teams, teamsPotential]);

    return (
        <FlexBox style={{ flexDirection: 'column', gap: 30 }}>
            <FlexBox gap={10}>
                <BattlefieldInfo />
                <BfLevelSelect value={teams.guildWar.battlefieldLevel} valueChange={updateBfLevel} />
                <BfSectionSelect
                    value={teams.guildWar.sectionId}
                    valueChange={updateBfSection}
                    bfLevel={teams.guildWar.battlefieldLevel}
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

                <Conditional condition={!!editedLineup}>
                    <SelectTeamDialog
                        isOpen={openSelectTeamDialog}
                        team={editedLineup!}
                        onClose={endEditTeam}
                        characters={characters}
                    />
                </Conditional>
            </CharactersViewContext.Provider>
        </FlexBox>
    );
};
