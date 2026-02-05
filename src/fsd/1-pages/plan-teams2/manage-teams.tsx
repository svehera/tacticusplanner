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
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Faction } from '@/fsd/5-shared/model/enums/faction.enum';
import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';

import { CharactersService } from '@/fsd/4-entities/character/@x/unit';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';

import { AddTeamDialog } from './add-team-dialog';
import { ITeam2 } from './models';
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

enum SaveTeamMode {
    MODE_ADD,
    MODE_EDIT,
}

export const ManageTeams = () => {
    const { characters: unresolvedCharacters, mows: unresolvedMows, teams2: currentTeams } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const [minRank, setMinRank] = useState<Rank>(Rank.Stone1);
    const [maxRank, setMaxRank] = useState<Rank>(Rank.Adamantine3);
    const [minRarity, setMinRarity] = useState<Rarity>(Rarity.Common);
    const [maxRarity, setMaxRarity] = useState<Rarity>(Rarity.Mythic);
    const [factions, setFactions] = useState<Faction[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [selectedChars, setSelectedChars] = useState<string[]>([]);
    const [selectedMows, setSelectedMows] = useState<string[]>([]);
    const [flexIndex, setFlexIndex] = useState<number | undefined>(undefined);
    const [notes, setNotes] = useState<string>('');

    // State for the add/edit dialog.
    const [saveTeamMode, setSaveTeamMode] = useState<SaveTeamMode>(SaveTeamMode.MODE_ADD);
    const [editingTeam, setEditingTeam] = useState<ITeam2 | null>(null);
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
    const [teams, setTeams] = useState<ITeam2[]>([]);

    useEffect(() => {
        setTeams(currentTeams);
    }, [currentTeams]);

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

        if (notes.trim().length > 300) {
            setSaveDisallowedMessage('Notes cannot exceed 300 characters.');
            setSaveAllowed(false);
            return;
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
        notes,
        selectedChars,
        selectedMows,
    ]);

    const onAdd = () => {
        setAddTeamDialogOpen(true);
        setSaveTeamMode(SaveTeamMode.MODE_ADD);
        // Reset dialog state
        setTeamName('');
        setNotes('');
        setFlexIndex(undefined);
        setSelectedChars([]);
        setSelectedMows([]);
    };

    const onEdit = (team: ITeam2) => {
        setEditingTeam(team);
        setAddTeamDialogOpen(true);
        setSaveTeamMode(SaveTeamMode.MODE_EDIT);
        setFlexIndex(team.flexIndex);
        setNotes(team.notes || '');
        setTeamName(team.name);
        setSelectedChars(team.chars);
        setSelectedMows(team.mows || []);
        setWarOffenseSelected(!!team.warOffense);
        setWarDefenseSelected(!!team.warDefense);
        setGuildRaidSelected(!!team.raid);
        setTournamentArenaSelected(!!team.ta);
        setBattleFieldLevels(team.bfs || [true, true, true, true, true, true]);
    };

    const onDelete = (team: ITeam2) => {
        if (window.confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) {
            dispatch.teams2({ type: 'Set', value: teams.filter(t => t.name !== team.name) });
        }
    };

    const onSave = () => {
        if (saveTeamMode === SaveTeamMode.MODE_EDIT && editingTeam) {
            const team: ITeam2 = teams.find(t => t.name === editingTeam?.name)!;
            team.chars = selectedChars;
            if (selectedMows.length > 0) team.mows = selectedMows;
            team.warOffense = warOffenseSelected ? true : undefined;
            team.warDefense = warDefenseSelected ? true : undefined;
            team.raid = guildRaidSelected ? true : undefined;
            team.ta = tournamentArenaSelected ? true : undefined;
            team.bfs = team.warOffense || team.warDefense ? battleFieldLevels : undefined;
            team.notes = notes;
            team.flexIndex = flexIndex;
            const curTeams = [...teams];
            curTeams.forEach(t => {
                if (t.name !== editingTeam.name) return;
                t = team;
            });
            dispatch.teams2({ type: 'Set', value: cloneDeep(curTeams) });
        } else {
            const newTeam: ITeam2 = {
                name: teamName.trim(),
                chars: selectedChars,
                flexIndex: flexIndex,
                mows: selectedMows,
                warOffense: warOffenseSelected ? true : undefined,
                warDefense: warDefenseSelected ? true : undefined,
                raid: guildRaidSelected ? true : undefined,
                ta: tournamentArenaSelected ? true : undefined,
                notes: notes,
                bfs: warOffenseSelected || warDefenseSelected ? battleFieldLevels : undefined,
            };
            dispatch.teams2({ type: 'Set', value: [...teams, newTeam] });
        }
        setTeamName('');
        setSelectedChars([]);
        setSelectedMows([]);
        setAddTeamDialogOpen(false);
    };

    const onAddChar = (snowprintId: string) => {
        const flex = flexIndex ?? selectedChars.length;
        setSelectedChars([...selectedChars.slice(0, flex), snowprintId, ...selectedChars.slice(flex)]);
        setFlexIndex(flexIndex !== undefined ? flexIndex + 1 : undefined);
    };

    const onAddMow = (snowprintId: string) => {
        setSelectedMows([...selectedMows, snowprintId]);
    };

    const onCharClicked = (char: ICharacter2) => {
        const index = selectedChars.findIndex(id => id === (char.snowprintId ?? ''));
        if (index === -1) {
            console.error('Clicked character that is not in selectedChars: ', char, selectedChars, index);
            return;
        }
        let flex = flexIndex ?? selectedChars.length;
        let newChars: string[] = [...selectedChars.slice(0, index), ...selectedChars.slice(index + 1)];
        if (index < flex) {
            newChars = [...newChars, char.snowprintId!];
            --flex;
        }
        setSelectedChars(newChars);
        setFlexIndex(flex >= newChars.length ? undefined : flex);
    };

    const onMowClicked = (mow: IMow2) => {
        setSelectedMows(selectedMows.filter(id => id !== (mow.snowprintId ?? '')));
    };

    if (addTeamDialogOpen) {
        return (
            <AddTeamDialog
                chars={resolvedChars}
                mows={resolvedMows}
                selectedChars={selectedChars}
                selectedMows={selectedMows}
                flexIndex={flexIndex}
                searchText={searchText}
                minRarity={minRarity}
                maxRarity={maxRarity}
                minRank={minRank}
                maxRank={maxRank}
                factions={factions}
                notes={notes}
                onAddChar={onAddChar}
                onAddMow={onAddMow}
                onCharClicked={onCharClicked}
                onMowClicked={onMowClicked}
                onSearchTextChange={setSearchText}
                onMinRarityChange={setMinRarity}
                onMaxRarityChange={setMaxRarity}
                onMinRankChange={setMinRank}
                onMaxRankChange={setMaxRank}
                onFactionsChange={setFactions}
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
                onNotesChanged={setNotes}
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
                        {!!team.warOffense && (
                            <MetadataChip
                                icon={<MilitaryTech fontSize="inherit" />}
                                label="War Offense"
                                color="warning"
                            />
                        )}
                        {!!team.warDefense && (
                            <MetadataChip icon={<Shield fontSize="inherit" />} label="War Defense" color="info" />
                        )}
                        {!!team.raid && (
                            <MetadataChip icon={<Groups fontSize="inherit" />} label="Guild Raid" color="secondary" />
                        )}
                        {!!team.ta && (
                            <MetadataChip
                                icon={<WorkspacePremium fontSize="inherit" />}
                                label="Tournament"
                                color="success"
                            />
                        )}

                        {team.bfs !== undefined && (!!team.warOffense || !!team.warDefense) && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <Layers className="text-slate-500" sx={{ fontSize: 14 }} />
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                    {team.bfs
                                        .map((active: boolean, i: number) => (active ? i + 1 : null))
                                        .filter(Boolean)
                                        .map(num => `BF${num!.toString()}`)
                                        .join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                    {team.notes && team.notes.trim().length > 0 && (
                        <div className="mb-4">
                            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Notes</span>
                            <div className="mt-2 p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {team.notes}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-lg p-3">
                        <TeamFlow
                            chars={
                                team.chars
                                    .filter(id => resolvedChars.some(x => x.snowprintId === id))
                                    .map(id => resolvedChars.find(x => x.snowprintId === id)!)
                                    .filter(x => x !== undefined) ?? []
                            }
                            mows={
                                team.mows
                                    ?.filter(id => resolvedMows.some(x => x.snowprintId === id))
                                    .map(id => resolvedMows.find(x => x.snowprintId === id)!)
                                    .filter(x => x !== undefined) ?? []
                            }
                            flexIndex={team.flexIndex}
                            onCharClicked={() => {}}
                            onMowClicked={() => {}}
                        />
                    </div>
                </Paper>
            ))}
        </Stack>
    );
};
