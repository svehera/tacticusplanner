import React, { useContext, useMemo } from 'react';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { FlexBox } from 'src/v2/components/flex-box';
import { BattlefieldInfo } from 'src/v2/features/guild-war/battlefield-info';
import { BfLevelSelect } from 'src/v2/features/guild-war/bf-level-select';
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
import { PersonalGoalType, Rank, Rarity } from 'src/models/enums';
import { GuildWarTeamType, IGWTeamWithCharacters } from 'src/v2/features/guild-war/guild-war.models';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';
import Button from '@mui/material/Button';
import { Card, CardActions, CardContent, CardHeader } from '@mui/material';
import { getCompletionRateColor } from 'src/shared-logic/functions';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';

export const GuildWarOffense = () => {
    const { guildWar, characters, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openSelectTeamDialog, setOpenSelectTeamDialog] = React.useState(false);
    const [editedTeam, setEditedTeam] = React.useState<IGWTeamWithCharacters | null>(null);

    const [openCharacterItemDialog, setOpenCharacterItemDialog] = React.useState(false);
    const [editedCharacter, setEditedCharacter] = React.useState<ICharacter2 | null>(null);

    const updateBfLevel = (battlefieldLevel: number) => {
        dispatch.guildWar({ type: 'UpdateBfLevel', battlefieldLevel });
    };

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

    const teamsWithCharacters = useMemo<IGWTeamWithCharacters[]>(() => {
        return guildWar.teams
            .filter(x => x.type === GuildWarTeamType.Offense)
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
                    CharactersService.capCharacterAtRarity(x, team.rarityCap),
                    team.rarityCap
                ),
            }));

            return {
                lineup,
                total: Math.round(sum(lineup.map(x => x.potential)) / 5),
            };
        });
    }, [guildWar.sectionId, guildWar.battlefieldLevel, guildWar.teams, teamsWithCharacters]);

    const renderTeams = useMemo(
        () =>
            teamsWithCharacters.map((currTeam, i) => (
                <TeamCard
                    key={currTeam.id}
                    team={currTeam}
                    onEdit={() => startEditTeam(currTeam)}
                    onClear={() => clearTeam(currTeam.id)}
                    teamPotential={teamsPotential[i].total}
                    onCharacterClick={startEditCharacter}
                    teamPotentialBreakdown={
                        <FlexBox style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
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

    const getTotalSlots = useMemo(() => {
        const slots = GuildWarService.getTotalRarityCaps(guildWar.battlefieldLevel);
        return [Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
            const slotsCount = slots[rarity];
            if (slotsCount) {
                return (
                    <FlexBox key={rarity} gap={3}>
                        <RarityImage rarity={rarity} /> x{slotsCount}
                    </FlexBox>
                );
            }
        });
    }, [guildWar.battlefieldLevel]);

    return (
        <FlexBox style={{ flexDirection: 'column', gap: 10 }}>
            <FlexBox gap={10}>
                <BattlefieldInfo />
                <BfLevelSelect value={guildWar.battlefieldLevel} valueChange={updateBfLevel} />
            </FlexBox>
            <FlexBox>
                <Button
                    variant={'contained'}
                    component={Link}
                    to={isMobile ? '/mobile/plan/guildWar/defense' : '/plan/guildWar/defense'}>
                    Go to: Defense
                </Button>
            </FlexBox>
            <FlexBox gap={5}>Enemy teams: {getTotalSlots}</FlexBox>
            <FlexBox gap={5}>
                Overall Potential: {Math.round(sum(teamsPotential.map(x => x.total)) / teamsPotential.length)}/100
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
                }}>
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
        </FlexBox>
    );
};

const TeamCard: React.FC<{
    team: IGWTeamWithCharacters;
    onEdit: () => void;
    onClear: () => void;
    onCharacterClick: (character: ICharacter2) => void;
    teamPotential: number;
    teamPotentialBreakdown: React.ReactElement;
}> = ({ team, teamPotential, teamPotentialBreakdown, onEdit, onClear, onCharacterClick }) => {
    return (
        <Card sx={{ maxWidth: 400, boxShadow: '1px 2px 3px rgba(0, 0, 0, 0.6)' }}>
            <CardHeader
                title={
                    <FlexBox justifyContent={'space-between'}>
                        <FlexBox gap={5} style={{ fontSize: 18 }}>
                            <RarityImage rarity={team.rarityCap} />
                            <span>{team.name}</span>
                        </FlexBox>
                        <FlexBox gap={5} style={{ fontSize: 16 }}>
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
            <CardContent style={{ paddingTop: 0, paddingBottom: 0 }}>
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
