/* eslint-disable import-x/order */
/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import {
    Add as AddIcon,
    Edit as EditIcon,
    DeleteOutline as DeleteIcon,
    Diversity3 as DiversityIcon,
    MilitaryTech, // War
    Shield, // Defense
    Groups, // Guild Raid
    WorkspacePremium, // Tournament
} from '@mui/icons-material';
import { IconButton, Tooltip, Paper, Stack, Chip, ButtonBase, Typography } from '@mui/material';
import { cloneDeep } from 'lodash';
import { useContext, useEffect, useState } from 'react';

import { ICharacter2 } from '@/models/interfaces';
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { FactionId } from '@/fsd/5-shared/model';
import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';

import { CharactersService } from '@/fsd/4-entities/character/@x/unit';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';

import { AddTeamDialog } from './add-team-dialog';
import { ITeam2 } from './models';
import { TeamFlow } from './team-flow';
import { RosterSnapshotsMagnificationSlider } from '../input-roster-snapshots/roster-snapshots-magnification-slider';
import { isMobile } from 'react-device-detect';
import { IPersonalTeam } from '@/fsd/3-features/teams/teams.models';

// Somewhat arbitrary, but please consult with the planner maintainer before increasing.
const MAX_TEAMS = 20;

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

type TeamTypeKey = 'warOffense' | 'warDefense' | 'raid' | 'ta' | 'horde';

export const ManageTeams = () => {
    const {
        characters: unresolvedCharacters,
        mows: unresolvedMows,
        teams: legacyTeams,
        teams2: currentTeams,
    } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const [minRank, setMinRank] = useState<Rank>(Rank.Stone1);
    const [maxRank, setMaxRank] = useState<Rank>(Rank.Adamantine3);
    const [minRarity, setMinRarity] = useState<Rarity>(Rarity.Common);
    const [maxRarity, setMaxRarity] = useState<Rarity>(Rarity.Mythic);
    const [rarityCap, setRarityCap] = useState<Rarity>(Rarity.Mythic);
    const [factions, setFactions] = useState<FactionId[]>([]);
    const [allowLockedUnits, setAllowLockedUnits] = useState<boolean>(true);
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
    const [hordeModeSelected, setHordeModeSelected] = useState<boolean>(false);
    const [teamName, setTeamName] = useState<string>('');
    const [resolvedChars, setResolvedChars] = useState<ICharacter2[]>([]);
    const [resolvedMows, setResolvedMows] = useState<IMow2[]>([]);

    const [addTeamDialogOpen, setAddTeamDialogOpen] = useState<boolean>(false);
    const [teams, setTeams] = useState<ITeam2[]>([]);
    const [sizeMod, setSizeMod] = useState(isMobile ? 0.5 : 1);
    const [selectedTeamType, setSelectedTeamType] = useState<TeamTypeKey | undefined>(undefined);

    useEffect(() => {
        setTeams(currentTeams);
    }, [currentTeams]);

    useEffect(() => {
        setResolvedChars(CharactersService.resolveStoredCharacters(unresolvedCharacters));
        setResolvedMows(MowsService.resolveAllFromStorage(unresolvedMows));
    }, [unresolvedCharacters, unresolvedMows]);

    useEffect(() => {
        let teamSizeRestrictedModesEnabled = true;
        if (selectedChars.length > 5 && (flexIndex ?? selectedChars.length) > 5) {
            const MESSAGE =
                'TA and war teams can have a maximum of 5 core characters, click on characters to make them flex characters.';
            setWarDisallowedMessage(MESSAGE);
            setTournamentArenaDisallowedMessage(MESSAGE);
            teamSizeRestrictedModesEnabled = false;
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
            setSaveDisallowedMessage('Team name must be at most 40 characters long.');
            setSaveAllowed(false);
            return;
        }

        if (
            !guildRaidSelected &&
            !hordeModeSelected &&
            (!teamSizeRestrictedModesEnabled ||
                (!warOffenseSelected && !warDefenseSelected && !tournamentArenaSelected))
        ) {
            setSaveDisallowedMessage('Select at least one game mode.');
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
        hordeModeSelected,
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

    const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
    const [selectedLegacyTeamName, setSelectedLegacyTeamName] = useState<string>('');

    const onImport = () => {
        setSelectedLegacyTeamName(legacyTeams?.[0]?.name ?? '');
        setImportDialogOpen(true);
    };

    const onImportGo = (team: IPersonalTeam | null) => {
        setImportDialogOpen(false);
        if (!team) return;
        setSelectedChars(
            team?.lineup
                .map(id => CharactersService.resolveCharacter(id ?? '')?.snowprintId)
                .filter(c => c !== undefined)
                .map(c => c!) ?? []
        );
        setSelectedMows(team?.mowId ? [MowsService.resolveId(team.mowId)] : []);
        setTeamName(team?.name ?? '');
        setNotes(team?.notes ?? '');
        setFlexIndex(undefined);
        setAddTeamDialogOpen(true);
        setWarOffenseSelected(false);
        setWarDefenseSelected(false);
        setGuildRaidSelected(false);
        setTournamentArenaSelected(false);
        setHordeModeSelected(false);
        setSaveTeamMode(SaveTeamMode.MODE_ADD);
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
        setHordeModeSelected(!!team.horde);
        setRarityCap(Rarity.Mythic);
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
            team.horde = hordeModeSelected ? true : undefined;
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
                horde: hordeModeSelected ? true : undefined,
                notes: notes,
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
                allowLockedUnits={allowLockedUnits}
                searchText={searchText}
                minRarity={minRarity}
                maxRarity={maxRarity}
                rarityCap={rarityCap}
                minRank={minRank}
                maxRank={maxRank}
                factions={factions}
                notes={notes}
                sizeMod={sizeMod}
                setSizeMod={setSizeMod}
                onAddChar={onAddChar}
                onAddMow={onAddMow}
                onCharClicked={onCharClicked}
                onMowClicked={onMowClicked}
                onAllowLockedUnitsChange={setAllowLockedUnits}
                onSearchTextChange={setSearchText}
                onMinRarityChange={setMinRarity}
                onMaxRarityChange={setMaxRarity}
                onMinRankChange={setMinRank}
                onMaxRankChange={setMaxRank}
                onFactionsChange={setFactions}
                onRarityCapChanged={setRarityCap}
                saveAllowed={saveAllowed}
                saveDisallowedMessage={saveDisallowedMessage}
                warDisallowedMessage={warDisallowedMessage}
                tournamentArenaDisallowedMessage={tournamentArenaDisallowedMessage}
                warOffenseSelected={warOffenseSelected}
                warDefenseSelected={warDefenseSelected}
                guildRaidSelected={guildRaidSelected}
                tournamentArenaSelected={tournamentArenaSelected}
                hordeModeSelected={hordeModeSelected}
                teamName={teamName}
                onWarOffenseChanged={setWarOffenseSelected}
                onWarDefenseChanged={setWarDefenseSelected}
                onGuildRaidChanged={setGuildRaidSelected}
                onTournamentArenaChanged={setTournamentArenaSelected}
                onHordeModeChanged={setHordeModeSelected}
                onTeamNameChanged={setTeamName}
                onNotesChanged={setNotes}
                onCancel={() => setAddTeamDialogOpen(false)}
                onSave={onSave}
            />
        );
    }

    return (
        <Stack spacing={2} className="p-4">
            <div className="flex items-start justify-start">
                <RosterSnapshotsMagnificationSlider sizeMod={sizeMod} setSizeMod={setSizeMod} />
                <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Team Type
                    </label>
                    <select
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
                        value={selectedTeamType ?? ''}
                        onChange={e => {
                            const value = e.target.value as TeamTypeKey | '';
                            setSelectedTeamType(value ? value : undefined);
                        }}>
                        <option value="">All</option>
                        <option value="warOffense">War Offense</option>
                        <option value="warDefense">War Defense</option>
                        <option value="raid">Guild Raid</option>
                        <option value="ta">Tournament Arena</option>
                        <option value="horde">Horde</option>
                    </select>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 px-4 pt-4">
                <ButtonBase
                    onClick={onAdd}
                    disabled={teams.length >= MAX_TEAMS}
                    className="group flex w-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/30 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/10">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-blue-100 dark:bg-slate-800 dark:group-hover:bg-blue-900/30">
                        <AddIcon className="text-slate-500 transition-colors group-hover:text-blue-500" />
                    </div>
                    <Typography className="font-bold text-slate-600 group-hover:text-blue-600 dark:text-slate-400">
                        Add New Team
                    </Typography>
                    {teams.length >= MAX_TEAMS && (
                        <Typography className="text-xs text-red-500 dark:text-red-400">
                            You have reached the maximum number of teams ({MAX_TEAMS}).
                        </Typography>
                    )}
                </ButtonBase>

                {legacyTeams.length > 0 && teams.length < MAX_TEAMS && (
                    <>
                        <ButtonBase
                            onClick={onImport}
                            className="group flex w-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 transition-all duration-200 hover:border-green-500 hover:bg-green-50/30 dark:border-slate-700 dark:hover:border-green-400 dark:hover:bg-green-900/10">
                            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-green-100 dark:bg-slate-800 dark:group-hover:bg-green-900/30">
                                <DiversityIcon className="text-slate-500 transition-colors group-hover:text-green-500" />
                            </div>
                            <Typography className="font-bold text-slate-600 group-hover:text-green-600 dark:text-slate-400">
                                Import Legacy Team
                            </Typography>
                        </ButtonBase>

                        {importDialogOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center">
                                <div
                                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                    onClick={() => setImportDialogOpen(false)}
                                />
                                <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-[#1a1f2e]">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                            Import Legacy Team
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Select a legacy team to import.
                                        </p>
                                    </div>

                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        Legacy Team
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
                                        value={selectedLegacyTeamName}
                                        onChange={e => setSelectedLegacyTeamName(e.target.value)}>
                                        {legacyTeams.map(t => (
                                            <option key={t.name} value={t.name}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="mt-5 flex justify-end gap-2">
                                        <button
                                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            onClick={() => setImportDialogOpen(false)}>
                                            Cancel
                                        </button>
                                        <button
                                            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700"
                                            onClick={() => {
                                                const team =
                                                    legacyTeams.find(t => t.name === selectedLegacyTeamName) ?? null;
                                                onImportGo(team);
                                                setImportDialogOpen(false);
                                            }}>
                                            Import
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            {teams
                .filter(team => !selectedTeamType || Boolean(team[selectedTeamType]))
                .map(team => (
                    <Paper
                        key={team.name}
                        elevation={0}
                        className="border border-slate-200 bg-white p-4 transition-colors dark:border-slate-800 dark:bg-[#1a1f2e]">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <span className="font-mono text-xs tracking-wider text-slate-500 uppercase">
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
                        <div className="mb-4 flex flex-wrap gap-2">
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
                                <MetadataChip
                                    icon={<Groups fontSize="inherit" />}
                                    label="Guild Raid"
                                    color="secondary"
                                />
                            )}
                            {!!team.ta && (
                                <MetadataChip
                                    icon={<WorkspacePremium fontSize="inherit" />}
                                    label="Tournament"
                                    color="success"
                                />
                            )}
                            {!!team.horde && (
                                <MetadataChip icon={<DiversityIcon fontSize="inherit" />} label="Horde" color="error" />
                            )}
                        </div>
                        {team.notes && team.notes.trim().length > 0 && (
                            <div className="mb-4">
                                <span className="font-mono text-xs tracking-wider text-slate-500 uppercase">Notes</span>
                                <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                    <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                        {team.notes}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="rounded-lg bg-slate-50/50 p-3 dark:bg-slate-900/50">
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
                                sizeMod={sizeMod}
                                disabledUnits={[
                                    ...team.chars.map(
                                        char =>
                                            resolvedChars.find(x => x.snowprintId === char && x.rank === Rank.Locked)
                                                ?.snowprintId
                                    ),
                                    ...(team.mows?.map(
                                        mow => resolvedMows.find(x => x.snowprintId === mow && !x.unlocked)?.snowprintId
                                    ) ?? []),
                                ]
                                    .flatMap(id => (id ? [id] : []))
                                    .filter(id => id !== undefined)}
                            />
                        </div>
                    </Paper>
                ))}
        </Stack>
    );
};
