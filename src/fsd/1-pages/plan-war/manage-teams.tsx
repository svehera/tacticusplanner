/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import {
    Add as AddIcon,
    Edit as EditIcon,
    DeleteOutline as DeleteIcon,
    MilitaryTech, // War
    Shield, // Defense
    Groups, // Guild Raid
    WorkspacePremium, // Tournament
    Layers, // Battlefield
} from '@mui/icons-material';
import { IconButton, Tooltip, Paper, Stack, Chip, ButtonBase, Typography } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useContext, useEffect, useState } from 'react';

import { ICharacter2 } from '@/models/interfaces';
import { StoreContext } from '@/reducers/store.provider';

import { Faction } from '@/fsd/5-shared/model/enums/faction.enum';
import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';

import { CharactersService } from '@/fsd/4-entities/character/@x/unit';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';

import { AddTeamDialog } from './add-team-dialog';
import { TeamFlow } from './team-flow';

const MAX_TEAMS = 5;

// Internal helper for metadata styling
const MetadataChip = ({ icon, label, color }: { icon: React.ReactElement; label: string; color: any }) => (
    <Chip
        icon={icon}
        label={label}
        size="small"
        variant="outlined"
        color={color}
        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}
    />
);

interface Team {
    name: string;
    characterIds: string[];
    mowIds?: string[];
    warOffense?: boolean;
    warDefense?: boolean;
    guildRaid?: boolean;
    tournamentArena?: boolean;
    battleFieldLevels?: boolean[];
}

enum SaveTeamMode {
    MODE_ADD,
    MODE_EDIT,
}

export const ManageTeams = () => {
    const { characters: unresolvedCharacters, mows: unresolvedMows } = useContext(StoreContext);
    const [minRank, setMinRank] = useState<Rank>(Rank.Stone1);
    const [maxRank, setMaxRank] = useState<Rank>(Rank.Adamantine3);
    const [minRarity, setMinRarity] = useState<Rarity>(Rarity.Common);
    const [maxRarity, setMaxRarity] = useState<Rarity>(Rarity.Mythic);
    const [factions, onFactionsChange] = useState<Faction[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [selectedChars, onSelectedCharsChange] = useState<string[]>([]);
    const [selectedMows, onSelectedMowsChange] = useState<string[]>([]);

    // State for the add/edit dialog.
    const [saveTeamMode, setSaveTeamMode] = useState<SaveTeamMode>(SaveTeamMode.MODE_ADD);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [saveAllowed, setSaveAllowed] = useState(false);
    const [saveDisallowedMessage, setSaveDisallowedMessage] = useState<string | undefined>(undefined);
    const [warDisallowedMessage, setWarDisallowedMessage] = useState<string | undefined>(undefined);
    const [tournamentArenaDisallowedMessage, setTournamentArenaDisallowedMessage] = useState<string | undefined>(
        undefined
    );
    const [warOffenseSelected, setWarOffenseSelected] = useState<boolean>(false);
    const [warDefenseSelected, setWarDefenseSelected] = useState<boolean>(false);
    const [guildRaidSelected, setGuildRaidSelected] = useState<boolean>(false);
    const [tournamentArenaSelected, setTournamentArenaSelected] = useState<boolean>(false);
    const [teamName, setTeamName] = useState<string>('');
    const [battleFieldLevels, setBattleFieldLevels] = useState<boolean[]>([true, true, true, true, true, true]);
    const [resolvedChars, setResolvedChars] = useState<ICharacter2[]>([]);
    const [resolvedMows, setResolvedMows] = useState<IMow2[]>([]);

    const [addTeamDialogOpen, setAddTeamDialogOpen] = useState<boolean>(false);

    // TODO(cpunerd): This is just here as a demo, move this stuff into GlobalState once done prototyping.
    const [teams, setTeams] = useState<Team[]>([
        {
            name: 'Custards',
            characterIds: [
                'custoBladeChampion',
                'worldKharn',
                'custoTrajann',
                'custoVexilusPraetor',
                'spaceRagnar',
                'bloodDante',
                'bloodMephiston',
                'blackAbaddon',
                'templHelbrecht',
                'admecDominus',
                'emperExultant',
                'orksWarboss',
            ],
            mowIds: ['blackForgefiend', 'tyranBiovore', 'ultraDreadnought'],
            guildRaid: true,
        },
        {
            name: 'Toasters',
            characterIds: [
                'admecDominus',
                'admecManipulus',
                'admecMarshall',
                'admecRuststalker',
                'tauMarksman',
                'orksWarboss',
                'templHelbrecht',
            ],
            mowIds: ['ultraDreadnought'],
            guildRaid: true,
        },
        {
            name: 'GSC TA',
            characterIds: ['genesBiophagus', 'genesKelermorph', 'genesMagus', 'genesPatriarch', 'genesPrimus'],
            tournamentArena: true,
        },
        {
            name: 'GSC War',
            characterIds: ['genesBiophagus', 'genesKelermorph', 'tyranNeurothrope', 'genesPatriarch', 'genesPrimus'],
            mowIds: ['blackForgefiend'],
            warOffense: true,
            warDefense: true,
            battleFieldLevels: [true, true, true, false, false, false],
        },
    ]);

    useEffect(() => {
        setResolvedChars(CharactersService.resolveStoredCharacters(unresolvedCharacters));
        setResolvedMows(MowsService.resolveAllFromStorage(unresolvedMows));
    }, [unresolvedCharacters, unresolvedMows]);

    useEffect(() => {
        let nonRaidModesEnabled = true;
        if (selectedChars.length > 5) {
            const MESSAGE =
                'A team can have a maximum of 5 characters (only Guild Raid Teams can have more than five characters).';
            setWarDisallowedMessage(MESSAGE);
            setTournamentArenaDisallowedMessage(MESSAGE);
            nonRaidModesEnabled = false;
        } else if (selectedMows.length > 1) {
            const MESSAGE =
                'A team can have a maximum of 1 Machine of War (only Guild Raid Teams can have more than one MoW).';
            setWarDisallowedMessage(MESSAGE);
            setTournamentArenaDisallowedMessage(MESSAGE);
            nonRaidModesEnabled = false;
        } else {
            setWarDisallowedMessage(undefined);
            setTournamentArenaDisallowedMessage(undefined);
        }

        if (teamName.trim().length < 3) {
            setSaveDisallowedMessage('Team name must be at least 3 characters long.');
            setSaveAllowed(teamName.trim().length >= 3);
            return;
        } else if (
            teams.some(team => team.name.toLowerCase() === teamName.trim().toLowerCase()) &&
            !(
                saveTeamMode === SaveTeamMode.MODE_EDIT &&
                editingTeam?.name.toLowerCase() === teamName.trim().toLowerCase()
            )
        ) {
            setSaveDisallowedMessage('A team with this name already exists. Please choose a unique name.');
            setSaveAllowed(false);
            return;
        } else if (teamName.trim().length > 40) {
            setSaveDisallowedMessage('Team name must be at most 40 characters.');
            setSaveAllowed(false);
            return;
        }

        if (
            !guildRaidSelected &&
            (!nonRaidModesEnabled || (!warOffenseSelected && !warDefenseSelected && !tournamentArenaSelected))
        ) {
            setSaveDisallowedMessage('Select at least one game mode.');
            setSaveAllowed(false);
            return;
        }
        if (
            nonRaidModesEnabled &&
            (warOffenseSelected || warDefenseSelected) &&
            !battleFieldLevels.some(level => level)
        ) {
            setSaveDisallowedMessage('Select at least one Battlefield Level.');
            setSaveAllowed(false);
            return;
        }
        setSaveAllowed(true);
        setSaveDisallowedMessage(undefined);
    }, [
        teamName,
        warOffenseSelected,
        warDefenseSelected,
        guildRaidSelected,
        tournamentArenaSelected,
        battleFieldLevels,
        selectedChars,
        selectedMows,
    ]);

    const onAdd = () => {
        setAddTeamDialogOpen(true);
        setSaveTeamMode(SaveTeamMode.MODE_ADD);
        // Reset dialog state
        setTeamName('');
        onSelectedCharsChange([]);
        onSelectedMowsChange([]);
    };

    const onEdit = (team: Team) => {
        setEditingTeam(team);
        setAddTeamDialogOpen(true);
        setSaveTeamMode(SaveTeamMode.MODE_EDIT);
        // Load dialog state
        setTeamName(team.name);
        onSelectedCharsChange(team.characterIds);
        onSelectedMowsChange(team.mowIds || []);
        setWarOffenseSelected(!!team.warOffense);
        setWarDefenseSelected(!!team.warDefense);
        setGuildRaidSelected(!!team.guildRaid);
        setTournamentArenaSelected(!!team.tournamentArena);
        setBattleFieldLevels(team.battleFieldLevels || [true, true, true, true, true, true]);
    };

    const onDelete = (team: Team) => {
        if (window.confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) {
            setTeams(currentTeams => currentTeams.filter(t => t.name !== team.name));
        }
    };

    const onSave = () => {
        if (saveTeamMode === SaveTeamMode.MODE_EDIT && editingTeam) {
            const team = teams.find(t => t.name === editingTeam?.name)!;
            team.characterIds = selectedChars;
            team.mowIds = selectedMows;
            team.warOffense = warOffenseSelected;
            team.warDefense = warDefenseSelected;
            team.guildRaid = guildRaidSelected;
            team.tournamentArena = tournamentArenaSelected;
            team.battleFieldLevels = battleFieldLevels;
            const curTeams = [...teams];
            curTeams.forEach(t => {
                if (t.name !== editingTeam.name) return;
                t = team;
            });
            setTeams(cloneDeep(curTeams));
        } else {
            const newTeam: Team = {
                name: teamName.trim(),
                characterIds: selectedChars,
                mowIds: selectedMows,
                warOffense: warOffenseSelected,
                warDefense: warDefenseSelected,
                guildRaid: guildRaidSelected,
                tournamentArena: tournamentArenaSelected,
                battleFieldLevels: battleFieldLevels,
            };
            setTeams(currentTeams => [...currentTeams, newTeam]);
        }
        // TODO: dispatch changes to global state.
        setTeamName('');
        onSelectedCharsChange([]);
        onSelectedMowsChange([]);
        setAddTeamDialogOpen(false);
    };

    if (addTeamDialogOpen) {
        return (
            <AddTeamDialog
                chars={resolvedChars}
                mows={resolvedMows}
                selectedChars={selectedChars}
                selectedMows={selectedMows}
                searchText={searchText}
                minRarity={minRarity}
                maxRarity={maxRarity}
                minRank={minRank}
                maxRank={maxRank}
                factions={factions}
                onSelectedCharsChange={onSelectedCharsChange}
                onSelectedMowsChange={onSelectedMowsChange}
                onSearchTextChange={setSearchText}
                onMinRarityChange={setMinRarity}
                onMaxRarityChange={setMaxRarity}
                onMinRankChange={setMinRank}
                onMaxRankChange={setMaxRank}
                onFactionsChange={onFactionsChange}
                saveAllowed={saveAllowed}
                saveDisallowedMessage={saveDisallowedMessage}
                warDisallowedMessage={warDisallowedMessage}
                tournamentArenaDisallowedMessage={tournamentArenaDisallowedMessage}
                warOffenseSelected={warOffenseSelected}
                warDefenseSelected={warDefenseSelected}
                guildRaidSelected={guildRaidSelected}
                tournamentArenaSelected={tournamentArenaSelected}
                teamName={teamName}
                battleFieldLevels={battleFieldLevels}
                onWarOffenseChanged={setWarOffenseSelected}
                onWarDefenseChanged={setWarDefenseSelected}
                onGuildRaidChanged={setGuildRaidSelected}
                onTournamentArenaChanged={setTournamentArenaSelected}
                onTeamNameChanged={setTeamName}
                onBattleFieldLevelsChanged={setBattleFieldLevels}
                onCancel={() => setAddTeamDialogOpen(false)}
                onSave={onSave}
            />
        );
    }

    return (
        <Stack spacing={2} className="p-4">
            <div className="px-4 pt-4">
                <ButtonBase
                    onClick={onAdd}
                    disabled={teams.length >= MAX_TEAMS}
                    className="w-full group flex flex-col items-center justify-center p-6 
                           border-2 border-dashed border-slate-300 dark:border-slate-700 
                           hover:border-blue-500 dark:hover:border-blue-400 
                           hover:bg-blue-50/30 dark:hover:bg-blue-900/10 
                           rounded-xl transition-all duration-200">
                    <div
                        className="flex items-center justify-center w-10 h-10 mb-2 
                                rounded-full bg-slate-100 dark:bg-slate-800 
                                group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 
                                transition-colors">
                        <AddIcon className="text-slate-500 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <Typography className="font-bold text-slate-600 dark:text-slate-400 group-hover:text-blue-600">
                        Add New Team
                    </Typography>
                    {teams.length < MAX_TEAMS ? (
                        <Typography className="text-xs text-slate-400 dark:text-slate-500">
                            Create a custom configuration for Raids or War
                        </Typography>
                    ) : (
                        <Typography className="text-xs text-red-500 dark:text-red-400">
                            You have reached the maximum number of teams ({MAX_TEAMS}).
                        </Typography>
                    )}
                </ButtonBase>
            </div>
            {teams.map(team => (
                <Paper
                    key={team.name}
                    elevation={0}
                    className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1f2e] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                                Team Configuration
                            </span>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{team.name}</h3>
                        </div>

                        <div className="flex gap-1">
                            <Tooltip title="Edit Team">
                                <IconButton onClick={() => onEdit(team)} size="small">
                                    <EditIcon fontSize="small" className="text-slate-500" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Team">
                                <IconButton onClick={() => onDelete(team)} size="small" color="error">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {team.warOffense && (
                            <MetadataChip
                                icon={<MilitaryTech fontSize="inherit" />}
                                label="War Offense"
                                color="warning"
                            />
                        )}
                        {team.warDefense && (
                            <MetadataChip icon={<Shield fontSize="inherit" />} label="War Defense" color="info" />
                        )}
                        {team.guildRaid && (
                            <MetadataChip icon={<Groups fontSize="inherit" />} label="Guild Raid" color="secondary" />
                        )}
                        {team.tournamentArena && (
                            <MetadataChip
                                icon={<WorkspacePremium fontSize="inherit" />}
                                label="Tournament"
                                color="success"
                            />
                        )}

                        {team.battleFieldLevels !== undefined && (!!team.warOffense || !!team.warDefense) && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <Layers className="text-slate-500" sx={{ fontSize: 14 }} />
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                    {team.battleFieldLevels
                                        .map((active: boolean, i: number) => (active ? i + 1 : null))
                                        .filter(Boolean)
                                        .map(num => `BF${num!.toString()}`)
                                        .join(', ')}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-lg p-3">
                        <TeamFlow
                            chars={resolvedChars.filter(x => team.characterIds.includes(x.snowprintId!))}
                            mows={resolvedMows.filter(x => (team.mowIds ?? []).includes(x.snowprintId!))}
                            onCharClicked={() => {}}
                            onMowClicked={() => {}}
                        />
                    </div>
                </Paper>
            ))}
        </Stack>
    );
};
