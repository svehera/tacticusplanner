/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { uniq } from 'lodash';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { ICharacter2 } from '@/models/interfaces';

import { FactionId, Rank, Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip, Button, Select } from '@/fsd/5-shared/ui';
import { RaritySelect } from '@/fsd/5-shared/ui/selects';

import { IMow2 } from '@/fsd/4-entities/mow';

import { CharacterSelectGrid, MowSelectGrid } from '@/fsd/2-widgets/unit-select-grid';

import { RosterSnapshotsMagnificationSlider } from '../input-roster-snapshots/roster-snapshots-magnification-slider';

import {
    campaignStorylineLabel,
    campaignStorylineOptions,
    campaignStorylineUsableFactionIds,
    campaignStorylineUsableFactions,
} from './campaign.constants';
import { TeamFlow } from './team-flow';
import { Teams2Service } from './teams2.service';
import { UnitFilter } from './unit-filter';

interface Props {
    chars: ICharacter2[];
    mows: IMow2[];
    selectedChars: string[];
    selectedMows: string[];
    flexIndex?: number;
    allowLockedUnits: boolean;
    searchText: string;
    minRarity: Rarity;
    maxRarity: Rarity;
    rarityCap: Rarity;
    minRank: Rank;
    maxRank: Rank;
    factions: FactionId[];
    notes: string;
    zoom: number;
    setZoom: (value: number) => void;
    onAddChar: (snowprintId: string) => void;
    onAddMow: (snowprintId: string) => void;
    onCharClicked: (char: ICharacter2) => void;
    onMowClicked: (mow: IMow2) => void;
    onAllowLockedUnitsChange: (allow: boolean) => void;
    onSearchTextChange: (text: string) => void;
    onMinRarityChange: (rarity: Rarity) => void;
    onMaxRarityChange: (rarity: Rarity) => void;
    onMinRankChange: (rank: Rank) => void;
    onMaxRankChange: (rank: Rank) => void;
    onFactionsChange: (factions: FactionId[]) => void;
    onRarityCapChanged: (rarity: Rarity) => void;
    deployedCharIds: string[];
    deployedMowIds: string[];

    saveAllowed: boolean;
    saveDisallowedMessage: string | undefined;
    warDisallowedMessage: string | undefined;
    tournamentArenaDisallowedMessage: string | undefined;
    warOffenseSelected: boolean;
    warDefenseSelected: boolean;
    guildRaidSelected: boolean;
    tournamentArenaSelected: boolean;
    hordeModeSelected: boolean;
    campaignSelected: boolean;
    campaignStoryline: string | undefined;
    teamName: string;
    onWarOffenseChanged: (offense: boolean) => void;
    onWarDefenseChanged: (defense: boolean) => void;
    onGuildRaidChanged: (guildRaid: boolean) => void;
    onTournamentArenaChanged: (tournamentArena: boolean) => void;
    onHordeModeChanged: (hordeMode: boolean) => void;
    onCampaignChanged: (campaign: boolean) => void;
    onCampaignStorylineChanged: (storyline: string | undefined) => void;
    onTeamNameChanged: (teamName: string) => void;
    onNotesChanged: (notes: string) => void;
    onCancel: () => void;
    onSave: () => void;
}
export const AddTeamDialog: React.FC<Props> = ({
    chars,
    mows,
    selectedChars,
    selectedMows,
    flexIndex,
    allowLockedUnits,
    searchText,
    minRarity,
    maxRarity,
    minRank,
    maxRank,
    factions,
    notes,
    zoom,
    rarityCap,
    setZoom,
    onAddChar,
    onAddMow,
    onCharClicked,
    onMowClicked,
    onAllowLockedUnitsChange,
    onSearchTextChange,
    onMinRarityChange,
    onMaxRarityChange,
    onMinRankChange,
    onMaxRankChange,
    onFactionsChange,
    onRarityCapChanged,
    deployedCharIds,
    deployedMowIds,
    onCancel,
    onSave,

    saveAllowed,
    saveDisallowedMessage,
    warDisallowedMessage,
    tournamentArenaDisallowedMessage,
    warOffenseSelected: warOffense,
    warDefenseSelected: warDefense,
    guildRaidSelected: guildRaid,
    tournamentArenaSelected: tournamentArena,
    hordeModeSelected,
    campaignSelected,
    campaignStoryline,
    teamName,
    onWarOffenseChanged,
    onWarDefenseChanged,
    onGuildRaidChanged,
    onTournamentArenaChanged,
    onHordeModeChanged,
    onCampaignChanged,
    onCampaignStorylineChanged,
    onTeamNameChanged,
    onNotesChanged,
}: Props) => {
    const [mowWidth, setMowWidth] = useState<number>(250);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const startResizing = useCallback(() => {
        setIsDragging(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsDragging(false);
    }, []);

    const resizeGrids = useCallback(
        (event: MouseEvent) => {
            if (isDragging) {
                const newWidth = window.innerWidth - event.clientX;
                if (newWidth > 200 && newWidth < window.innerWidth * 0.5) {
                    setMowWidth(newWidth);
                }
            }
        },
        [isDragging]
    );

    useEffect(() => {
        if (isDragging) {
            globalThis.addEventListener('mousemove', resizeGrids);
            globalThis.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
        } else {
            document.body.style.cursor = 'default';
        }
        return () => {
            globalThis.removeEventListener('mousemove', resizeGrids);
            globalThis.removeEventListener('mouseup', stopResizing);
        };
    }, [isDragging, resizeGrids, stopResizing]);

    const allFactions: FactionId[] = uniq([...chars.map(c => c.faction), ...mows.map(m => m.faction)]).toSorted(
        (a, b) => a.localeCompare(b)
    );

    // When a campaign is selected, only its usable factions can be fielded.
    const campaignFactions =
        campaignSelected && campaignStoryline ? campaignStorylineUsableFactionIds(campaignStoryline) : undefined;

    const filteredChars = chars
        .filter(c => !selectedChars.includes(c.snowprintId))
        .filter(c => !campaignFactions?.length || campaignFactions.includes(c.faction))
        .filter(c =>
            Teams2Service.passesCharacterFilter(
                c,
                allowLockedUnits,
                minRank,
                maxRank,
                minRarity,
                maxRarity,
                factions,
                searchText
            )
        )
        .toSorted((a, b) => {
            if (b.rank !== a.rank) return b.rank - a.rank;
            const powerA = Math.pow(a.activeAbilityLevel ?? 0, 2) + Math.pow(a.passiveAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.activeAbilityLevel ?? 0, 2) + Math.pow(b.passiveAbilityLevel ?? 0, 2);
            if (powerB !== powerA) return powerB - powerA;
            return b.rarity - a.rarity;
        })
        .map(a => Teams2Service.capCharacterAtRarity(a, rarityCap));

    const filteredMows = mows
        .filter(mow => !selectedMows.includes(mow.snowprintId))
        .filter(mow => Teams2Service.passesMowFilter(mow, allowLockedUnits, minRarity, maxRarity, factions, searchText))
        .toSorted((a, b) => {
            const powerA = Math.pow(a.primaryAbilityLevel ?? 0, 2) + Math.pow(a.secondaryAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.primaryAbilityLevel ?? 0, 2) + Math.pow(b.secondaryAbilityLevel ?? 0, 2);
            if (powerB !== powerA) return powerB - powerA;
            return b.rarity - a.rarity;
        })
        .map(a => Teams2Service.capMowAtRarity(a, rarityCap));

    // Campaign is exclusive with the other modes: while one side is selected, the other
    // side's checkboxes are disabled (an already-checked box can still be unchecked).
    const otherModeSelected = warOffense || warDefense || guildRaid || tournamentArena || hordeModeSelected;
    const campaignDisabled = otherModeSelected && !campaignSelected;
    const exclusivityMessage = "Campaign teams can't be combined with other modes.";

    return (
        <div className="relative isolate flex w-full flex-col rounded-xl border border-(--border) bg-(--overlay) shadow-2xl">
            {/* STATIC HEADER */}
            <div className="z-30 flex flex-shrink-0 items-center justify-between border-b border-(--border) bg-(--neutral) p-4">
                <div className="justify-left flex flex-wrap items-center gap-6">
                    <h3>Assemble Team</h3>
                    <RosterSnapshotsMagnificationSlider zoom={zoom} setZoom={setZoom} />
                    {/* RARITY CAP */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-(--soft-fg)">Rarity Cap</span>
                        <div className="min-w-[180px]">
                            <RaritySelect
                                rarityValues={[
                                    Rarity.Common,
                                    Rarity.Uncommon,
                                    Rarity.Rare,
                                    Rarity.Epic,
                                    Rarity.Legendary,
                                    Rarity.Mythic,
                                ]}
                                value={rarityCap}
                                valueChanges={onRarityCapChanged}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-2"></div>
                <Button appearance="plain" size="square-petite" onPress={onCancel}>
                    <X data-slot="icon" />
                </Button>
            </div>

            <div className="flex flex-col gap-6 p-6">
                {/* UNIT FILTER SECTION */}
                <section className="rounded-lg border border-(--border) bg-(--card) shadow-inner">
                    <details className="group p-2 transition-all group-open:p-6">
                        <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-(--primary)">
                            <div className="flex items-center justify-between">
                                <span>Unit Filter</span>
                                <span className="transition group-open:rotate-180">▼</span>
                            </div>
                        </summary>
                        <div className="mt-4 space-y-6">
                            <UnitFilter
                                allowLockedUnits={allowLockedUnits}
                                searchText={searchText}
                                minRarity={minRarity}
                                maxRarity={maxRarity}
                                minRank={minRank}
                                maxRank={maxRank}
                                factions={factions}
                                allFactions={allFactions}
                                onAllowLockedUnitsChange={onAllowLockedUnitsChange}
                                onSearchTextChange={onSearchTextChange}
                                onMinRarityChange={onMinRarityChange}
                                onMaxRarityChange={onMaxRarityChange}
                                onMinRankChange={onMinRankChange}
                                onMaxRankChange={onMaxRankChange}
                                onFactionsChange={onFactionsChange}
                            />
                        </div>
                    </details>
                </section>

                {/* TEAM DETAILS SECTION */}
                <section className="rounded-lg border border-(--border) bg-(--card) shadow-inner">
                    <details open className="group space-y-6 p-6">
                        <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-(--primary)">
                            <div className="flex items-center justify-between">
                                <span>Team Details</span>
                                <span className="transition group-open:rotate-180">▼</span>
                            </div>
                        </summary>
                        <div>
                            <div className="mb-2 flex items-end justify-between">
                                <label className="text-sm font-medium text-(--soft-fg)">Team Name</label>
                                {!saveAllowed && (
                                    <span className="text-xs text-(--danger) italic">{saveDisallowedMessage}</span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={teamName}
                                onChange={event => onTeamNameChanged(event.target.value)}
                                placeholder="Enter team name..."
                                className="w-full rounded-lg border border-(--input-border) bg-(--bg) px-4 py-2 text-(--fg) transition-all outline-none focus:ring-2 focus:ring-(--ring)"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex flex-wrap items-center gap-6">
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip
                                        title={
                                            warDisallowedMessage ??
                                            (campaignSelected && !warOffense ? exclusivityMessage : '')
                                        }>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!warDisallowedMessage && warOffense}
                                                disabled={!!warDisallowedMessage || (campaignSelected && !warOffense)}
                                                onChange={() => onWarOffenseChanged(!warOffense)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>War Offense</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip
                                        title={
                                            warDisallowedMessage ??
                                            (campaignSelected && !warDefense ? exclusivityMessage : '')
                                        }>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!warDisallowedMessage && warDefense}
                                                disabled={!!warDisallowedMessage || (campaignSelected && !warDefense)}
                                                onChange={() => onWarDefenseChanged(!warDefense)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>War Defense</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip title={campaignSelected && !guildRaid ? exclusivityMessage : ''}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={guildRaid}
                                                disabled={campaignSelected && !guildRaid}
                                                onChange={() => onGuildRaidChanged(!guildRaid)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>Guild Raid</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip
                                        title={
                                            tournamentArenaDisallowedMessage ??
                                            (campaignSelected && !tournamentArena ? exclusivityMessage : '')
                                        }>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!tournamentArenaDisallowedMessage && tournamentArena}
                                                disabled={
                                                    !!tournamentArenaDisallowedMessage ||
                                                    (campaignSelected && !tournamentArena)
                                                }
                                                onChange={() => onTournamentArenaChanged(!tournamentArena)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>Tournament Arena</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip
                                        title={campaignSelected && !hordeModeSelected ? exclusivityMessage : ''}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={hordeModeSelected}
                                                disabled={campaignSelected && !hordeModeSelected}
                                                onChange={() => onHordeModeChanged(!hordeModeSelected)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>Horde Mode</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip title={campaignDisabled ? exclusivityMessage : ''}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={campaignSelected}
                                                disabled={campaignDisabled}
                                                onChange={() => onCampaignChanged(!campaignSelected)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>Campaign</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                            </div>
                            {campaignSelected && (
                                <div className="min-w-[220px]">
                                    <Select<string | undefined>
                                        options={[undefined, ...campaignStorylineOptions.map(option => option.value)]}
                                        value={campaignStoryline}
                                        onChange={onCampaignStorylineChanged}
                                        renderOption={value => (value ? campaignStorylineLabel(value) : 'None')}
                                        placeholder="Select a campaign..."
                                    />
                                    {campaignStoryline && (
                                        <p className="mt-1 text-xs text-(--soft-fg)">
                                            Usable: {campaignStorylineUsableFactions(campaignStoryline) ?? 'unknown'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-(--soft-fg)">Notes</label>
                            <textarea
                                placeholder="Add notes..."
                                value={notes}
                                onChange={event => onNotesChanged(event.target.value)}
                                className="min-h-[80px] w-full rounded-lg border border-(--input-border) bg-(--bg) px-4 py-2 text-(--fg) transition-all outline-none focus:ring-2 focus:ring-(--ring)"
                            />
                        </div>
                    </details>

                    <div className="flex items-center justify-between border-t border-(--border) bg-(--neutral) p-4">
                        <h3 className="text-sm font-bold tracking-widest text-(--primary) uppercase">Selected Team</h3>
                        <div className="flex items-center gap-3">
                            <Button intent="success" isDisabled={!saveAllowed} onPress={onSave}>
                                Save Team
                            </Button>
                        </div>
                    </div>

                    <div className="p-4">
                        <TeamFlow
                            chars={(
                                selectedChars
                                    .map(x => chars.find(char => (char.snowprintId ?? '') === x))
                                    .filter(x => x !== undefined) ?? []
                            ).map(char => Teams2Service.capCharacterAtRarity(char!, rarityCap))}
                            mows={
                                campaignSelected
                                    ? []
                                    : (
                                          selectedMows
                                              .map(id => mows.find(mow => (mow.snowprintId ?? '') === id))
                                              .filter(x => x !== undefined) ?? []
                                      ).map(mow => Teams2Service.capMowAtRarity(mow!, rarityCap))
                            }
                            flexIndex={flexIndex}
                            onCharClicked={onCharClicked}
                            onMowClicked={onMowClicked}
                            zoom={zoom}
                        />
                    </div>
                </section>

                {/* GRIDS SECTION */}
                <div
                    className={`flex min-h-0 flex-col gap-4 xl:flex-row-reverse xl:flex-nowrap ${
                        isDragging ? 'select-none' : ''
                    }`}
                    style={{ '--mow-width': `${mowWidth}px` } as React.CSSProperties}>
                    <div className="min-w-0 flex-1 rounded-lg border border-(--card-border) bg-(--card) p-4">
                        <CharacterSelectGrid
                            characters={filteredChars}
                            onCharacterSelect={onAddChar}
                            showHeader={true}
                            zoom={zoom}
                            deployedUnitIds={deployedCharIds}
                        />
                    </div>

                    {!campaignSelected && (
                        <>
                            <div
                                onMouseDown={startResizing}
                                className={`relative z-10 hidden w-4 flex-shrink-0 cursor-col-resize xl:flex ${isDragging ? 'bg-(--primary)/10' : 'hover:bg-(--primary)/5'} group transition-colors`}>
                                <div
                                    className={`mx-auto h-full w-[1px] ${isDragging ? 'bg-blue-500' : 'bg-(--border) group-hover:bg-blue-400'}`}
                                />
                                <div className="pointer-events-none absolute top-24 left-1/2 flex -translate-x-1/2 justify-center">
                                    <div
                                        className={`pointer-events-auto flex h-16 w-6 flex-col items-center justify-center gap-1 rounded-l-md border-y border-l shadow-md transition-all duration-200 ${
                                            isDragging
                                                ? 'border-blue-600 bg-blue-500'
                                                : 'border-(--card-border) bg-(--card) group-hover:border-blue-500'
                                        }`}>
                                        <div
                                            className={`h-[1px] w-3 ${isDragging ? 'bg-blue-100' : 'bg-(--border)'}`}
                                        />
                                        <div
                                            className={`h-[1px] w-3 ${isDragging ? 'bg-blue-100' : 'bg-(--border)'}`}
                                        />
                                        <div
                                            className={`h-[1px] w-3 ${isDragging ? 'bg-blue-100' : 'bg-(--border)'}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="w-full flex-shrink-0 rounded-lg border border-(--card-border) bg-(--card) p-4 xl:w-[var(--mow-width)]">
                                <MowSelectGrid
                                    mows={filteredMows}
                                    onMowSelect={onAddMow}
                                    showHeader={true}
                                    zoom={zoom}
                                    deployedUnitIds={deployedMowIds}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
