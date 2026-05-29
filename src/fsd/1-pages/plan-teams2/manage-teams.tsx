/* eslint-disable import-x/order */
/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { Plus, Pencil, Trash2, Users2, Swords, Shield, Users, Trophy } from 'lucide-react';
import { cloneDeep, uniq } from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';

import { ICharacter2 } from '@/models/interfaces';
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { FactionId } from '@/fsd/5-shared/model';
import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';

import { Button, LazyTooltip, PortalDialog, Select } from '@/fsd/5-shared/ui';

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
const CHIP_CLASSES: Record<string, string> = {
    warning: 'border-amber-400/50 bg-amber-400/10 text-amber-700 dark:text-amber-400',
    info: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400',
    secondary: 'border-(--border) bg-(--soft) text-(--soft-fg)',
    success: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    error: 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400',
};

const MetadataChip = ({
    icon,
    label,
    color = 'secondary',
}: {
    icon: React.ReactElement;
    label: string;
    color: string;
}) => (
    <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase ${CHIP_CLASSES[color] ?? CHIP_CLASSES.secondary}`}>
        {icon}
        {label}
    </span>
);

enum SaveTeamMode {
    MODE_ADD,
    MODE_EDIT,
}

type TeamTypeKey = 'warOffense' | 'warDefense' | 'raid' | 'ta' | 'horde';

type TeamTypeOption = { value: TeamTypeKey | undefined; label: string };

const TEAM_TYPE_OPTIONS: TeamTypeOption[] = [
    { value: undefined, label: 'All' },
    { value: 'warOffense', label: 'War Offense' },
    { value: 'warDefense', label: 'War Defense' },
    { value: 'raid', label: 'Guild Raid' },
    { value: 'ta', label: 'Tournament Arena' },
    { value: 'horde', label: 'Horde' },
];

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
    const [flexIndex, setFlexIndex] = useState<number | undefined>();
    const [notes, setNotes] = useState<string>('');

    // State for the add/edit dialog.
    const [saveTeamMode, setSaveTeamMode] = useState<SaveTeamMode>(SaveTeamMode.MODE_ADD);
    const [editingTeam, setEditingTeam] = useState<ITeam2>();
    const [saveAllowed, setSaveAllowed] = useState(false);
    const [saveDisallowedMessage, setSaveDisallowedMessage] = useState<string | undefined>();
    const [warDisallowedMessage, setWarDisallowedMessage] = useState<string | undefined>();
    const [tournamentArenaDisallowedMessage, setTournamentArenaDisallowedMessage] = useState<string | undefined>();
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
    const [zoom, setZoom] = useState(isMobile ? 0.5 : 1);
    const [selectedTeamType, setSelectedTeamType] = useState<TeamTypeKey | undefined>();

    useEffect(() => {
        setTeams(currentTeams);
    }, [currentTeams]);

    useEffect(() => {
        setResolvedChars(CharactersService.resolveStoredCharacters(unresolvedCharacters));
        setResolvedMows(MowsService.resolveAllFromStorage(unresolvedMows));
    }, [unresolvedCharacters, unresolvedMows]);

    const otherTeamsInSelectedModes = useMemo(
        () =>
            teams.filter(
                team =>
                    ((warOffenseSelected && !!team.warOffense) ||
                        (warDefenseSelected && !!team.warDefense) ||
                        (guildRaidSelected && !!team.raid) ||
                        (tournamentArenaSelected && !!team.ta) ||
                        (hordeModeSelected && !!team.horde)) &&
                    !(saveTeamMode === SaveTeamMode.MODE_EDIT && editingTeam && team.name === editingTeam.name)
            ),
        [
            teams,
            saveTeamMode,
            editingTeam,
            warOffenseSelected,
            warDefenseSelected,
            guildRaidSelected,
            tournamentArenaSelected,
            hordeModeSelected,
        ]
    );

    const deployedCharIds = useMemo(
        () => uniq(otherTeamsInSelectedModes.flatMap(team => team.chars)),
        [otherTeamsInSelectedModes]
    );

    const deployedMowIds = useMemo(
        () => uniq(otherTeamsInSelectedModes.flatMap(team => team.mows ?? [])),
        [otherTeamsInSelectedModes]
    );

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

    const onImportGo = (team: IPersonalTeam | undefined) => {
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
        if (
            globalThis.confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)
        ) {
            dispatch.teams2({ type: 'Set', value: teams.filter(t => t.name !== team.name) });
        }
    };

    const onSave = () => {
        if (saveTeamMode === SaveTeamMode.MODE_EDIT && editingTeam) {
            const updatedTeam: ITeam2 = {
                ...editingTeam,
                name: teamName.trim(),
                chars: selectedChars,
                mows: selectedMows.length > 0 ? selectedMows : undefined,
                warOffense: warOffenseSelected ? true : undefined,
                warDefense: warDefenseSelected ? true : undefined,
                raid: guildRaidSelected ? true : undefined,
                ta: tournamentArenaSelected ? true : undefined,
                horde: hordeModeSelected ? true : undefined,
                notes,
                flexIndex,
            };

            const updatedTeams = teams.map(team => (team.name === editingTeam.name ? updatedTeam : team));
            dispatch.teams2({ type: 'Set', value: cloneDeep(updatedTeams) });
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
        setFlexIndex(flexIndex === undefined ? undefined : flexIndex + 1);
    };

    const onAddMow = (snowprintId: string) => {
        setSelectedMows([...selectedMows, snowprintId]);
    };

    const onCharClicked = (char: ICharacter2) => {
        const index = selectedChars.indexOf(char.snowprintId ?? '');
        if (index === -1) {
            console.error('Clicked character that is not in selectedChars:', char, selectedChars, index);
            return;
        }
        let flex = flexIndex ?? selectedChars.length;
        let newChars: string[] = [...selectedChars.slice(0, index), ...selectedChars.slice(index + 1)];
        if (index < flex) {
            newChars = [...newChars, char.snowprintId];
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
                zoom={zoom}
                setZoom={setZoom}
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
                deployedCharIds={deployedCharIds}
                deployedMowIds={deployedMowIds}
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
        <div className="space-y-8 py-6">
            <div>
                <h2>Teams</h2>
                <p className="text-sm text-(--soft-fg)">Build and manage your team configurations.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <RosterSnapshotsMagnificationSlider zoom={zoom} setZoom={setZoom} />
                <LazyTooltip title={teams.length >= MAX_TEAMS ? `Maximum of ${MAX_TEAMS} teams reached` : undefined}>
                    <Button intent="primary" onPress={onAdd} isDisabled={teams.length >= MAX_TEAMS}>
                        <Plus className="size-4" data-slot="icon" />
                        Add New Team
                    </Button>
                </LazyTooltip>
                {legacyTeams.length > 0 && teams.length < MAX_TEAMS && (
                    <>
                        <Button appearance="outline" intent="success" onPress={onImport}>
                            <Users2 className="size-4" data-slot="icon" />
                            Import Legacy Team
                        </Button>

                        <PortalDialog
                            open={importDialogOpen}
                            onClose={() => setImportDialogOpen(false)}
                            aria-label="Import Legacy Team"
                            size="sm">
                            <PortalDialog.Header>Import Legacy Team</PortalDialog.Header>
                            <PortalDialog.Body>
                                <p className="text-sm text-(--soft-fg)">Select a legacy team to import.</p>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold tracking-wider text-(--soft-fg) uppercase">
                                        Legacy Team
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-(--input-border) bg-(--bg) px-3 py-2 text-sm text-(--fg) shadow-sm transition outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
                                        value={selectedLegacyTeamName}
                                        onChange={event => setSelectedLegacyTeamName(event.target.value)}>
                                        {legacyTeams.map(t => (
                                            <option key={t.name} value={t.name}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </PortalDialog.Body>
                            <PortalDialog.Footer>
                                <Button appearance="outline" size="small" onPress={() => setImportDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    intent="success"
                                    size="small"
                                    onPress={() => {
                                        const team = legacyTeams.find(t => t.name === selectedLegacyTeamName);
                                        onImportGo(team);
                                        setImportDialogOpen(false);
                                    }}>
                                    Import
                                </Button>
                            </PortalDialog.Footer>
                        </PortalDialog>
                    </>
                )}
                <div className="flex flex-1 items-center justify-end gap-3">
                    <label className="text-xs font-bold tracking-[.14em] text-(--soft-fg) uppercase">Team Type</label>
                    <Select<TeamTypeOption>
                        options={TEAM_TYPE_OPTIONS}
                        value={TEAM_TYPE_OPTIONS.find(o => o.value === selectedTeamType) ?? TEAM_TYPE_OPTIONS[0]}
                        onChange={opt => setSelectedTeamType(opt.value)}
                        renderOption={opt => opt.label}
                        by={(a, b) => a.value === b.value}
                        className="w-auto min-w-[160px]"
                    />
                </div>
            </div>
            <div className="flex flex-col gap-4">
                {teams
                    .filter(team => !selectedTeamType || Boolean(team[selectedTeamType]))
                    .map(team => (
                        <div
                            key={team.name}
                            className="rounded-xl border border-(--card-border) bg-(--card) p-4 transition-colors">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <span className="font-mono text-xs tracking-wider text-(--soft-fg) uppercase">
                                        Team Configuration
                                    </span>
                                    <h3 className="text-(--card-fg)">{team.name}</h3>
                                </div>

                                <div className="flex gap-1">
                                    <LazyTooltip title="Edit Team">
                                        <Button size="square-petite" appearance="plain" onPress={() => onEdit(team)}>
                                            <Pencil className="size-4" data-slot="icon" />
                                        </Button>
                                    </LazyTooltip>
                                    <LazyTooltip title="Delete Team">
                                        <Button
                                            size="square-petite"
                                            appearance="plain"
                                            intent="danger"
                                            onPress={() => onDelete(team)}>
                                            <Trash2 className="size-4" data-slot="icon" />
                                        </Button>
                                    </LazyTooltip>
                                </div>
                            </div>
                            <div className="mb-4 flex flex-wrap gap-2">
                                {!!team.warOffense && (
                                    <MetadataChip
                                        icon={<Swords className="size-3" />}
                                        label="War Offense"
                                        color="warning"
                                    />
                                )}
                                {!!team.warDefense && (
                                    <MetadataChip
                                        icon={<Shield className="size-3" />}
                                        label="War Defense"
                                        color="info"
                                    />
                                )}
                                {!!team.raid && (
                                    <MetadataChip
                                        icon={<Users className="size-3" />}
                                        label="Guild Raid"
                                        color="secondary"
                                    />
                                )}
                                {!!team.ta && (
                                    <MetadataChip
                                        icon={<Trophy className="size-3" />}
                                        label="Tournament"
                                        color="success"
                                    />
                                )}
                                {!!team.horde && (
                                    <MetadataChip icon={<Users2 className="size-3" />} label="Horde" color="error" />
                                )}
                            </div>
                            {team.notes && team.notes.trim().length > 0 && (
                                <div className="mb-4">
                                    <span className="font-mono text-xs tracking-wider text-(--soft-fg) uppercase">
                                        Notes
                                    </span>
                                    <div className="mt-2 rounded border border-(--card-border) bg-(--soft) p-3">
                                        <p className="text-sm whitespace-pre-wrap text-(--fg)">{team.notes}</p>
                                    </div>
                                </div>
                            )}
                            <div className="rounded-lg bg-(--soft) p-3">
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
                                    zoom={zoom}
                                    disabledUnits={[
                                        ...team.chars.map(
                                            char =>
                                                resolvedChars.find(
                                                    x => x.snowprintId === char && x.rank === Rank.Locked
                                                )?.snowprintId
                                        ),
                                        ...(team.mows?.map(
                                            mow =>
                                                resolvedMows.find(x => x.snowprintId === mow && !x.unlocked)
                                                    ?.snowprintId
                                        ) ?? []),
                                    ]
                                        .flatMap(id => (id ? [id] : []))
                                        .filter(id => id !== undefined)}
                                />
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};
