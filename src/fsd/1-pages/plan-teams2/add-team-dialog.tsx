/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import React, { useCallback, useEffect, useState } from 'react';

import { ICharacter2 } from '@/models/interfaces';

import { FactionId, Rank, Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { IMow2 } from '@/fsd/4-entities/mow';

import { RosterSnapshotsMagnificationSlider } from '../input-roster-snapshots/roster-snapshots-magnification-slider';

import { CharacterGrid } from './character-grid';
import { MowGrid } from './mow-grid';
import { TeamFlow } from './team-flow';
import { Teams2Service } from './teams2.service';
import { UnitFilter } from './unit-filter';

interface Props {
    chars: ICharacter2[];
    mows: IMow2[];
    selectedChars: string[];
    selectedMows: string[];
    flexIndex?: number;
    searchText: string;
    minRarity: Rarity;
    maxRarity: Rarity;
    minRank: Rank;
    maxRank: Rank;
    factions: FactionId[];
    notes: string;
    sizeMod: number;
    setSizeMod: (value: number) => void;
    onAddChar: (snowprintId: string) => void;
    onAddMow: (snowprintId: string) => void;
    onCharClicked: (char: ICharacter2) => void;
    onMowClicked: (mow: IMow2) => void;
    onSearchTextChange: (text: string) => void;
    onMinRarityChange: (rarity: Rarity) => void;
    onMaxRarityChange: (rarity: Rarity) => void;
    onMinRankChange: (rank: Rank) => void;
    onMaxRankChange: (rank: Rank) => void;
    onFactionsChange: (factions: FactionId[]) => void;

    saveAllowed: boolean;
    saveDisallowedMessage: string | undefined;
    warDisallowedMessage: string | undefined;
    tournamentArenaDisallowedMessage: string | undefined;
    warOffenseSelected: boolean;
    warDefenseSelected: boolean;
    guildRaidSelected: boolean;
    tournamentArenaSelected: boolean;
    teamName: string;
    battleFieldLevels: boolean[];
    onWarOffenseChanged: (offense: boolean) => void;
    onWarDefenseChanged: (defense: boolean) => void;
    onGuildRaidChanged: (guildRaid: boolean) => void;
    onTournamentArenaChanged: (tournamentArena: boolean) => void;
    onBattleFieldLevelsChanged: (levels: boolean[]) => void;
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
    searchText,
    minRarity,
    maxRarity,
    minRank,
    maxRank,
    factions,
    notes,
    sizeMod,
    setSizeMod,
    onAddChar,
    onAddMow,
    onCharClicked,
    onMowClicked,
    onSearchTextChange,
    onMinRarityChange,
    onMaxRarityChange,
    onMinRankChange,
    onMaxRankChange,
    onFactionsChange,
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
    teamName,
    battleFieldLevels,
    onWarOffenseChanged,
    onWarDefenseChanged,
    onGuildRaidChanged,
    onTournamentArenaChanged,
    onBattleFieldLevelsChanged,
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
        (e: MouseEvent) => {
            if (isDragging) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth > 200 && newWidth < window.innerWidth * 0.5) {
                    setMowWidth(newWidth);
                }
            }
        },
        [isDragging]
    );

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', resizeGrids);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
        } else {
            document.body.style.cursor = 'default';
        }
        return () => {
            window.removeEventListener('mousemove', resizeGrids);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isDragging, resizeGrids, stopResizing]);

    const allFactions: FactionId[] = Array.from(
        new Set<FactionId>([...chars.map(c => c.faction), ...mows.map(m => m.faction)])
    ).sort((a, b) => a.localeCompare(b));

    const filteredChars = chars
        .filter(c => !selectedChars.includes(c.snowprintId!))
        .filter(c =>
            Teams2Service.passesCharacterFilter(c, minRank, maxRank, minRarity, maxRarity, factions, searchText)
        )
        .sort((a, b) => {
            if (b.rank !== a.rank) return b.rank - a.rank;
            const powerA = Math.pow(a.activeAbilityLevel ?? 0, 2) + Math.pow(a.passiveAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.activeAbilityLevel ?? 0, 2) + Math.pow(b.passiveAbilityLevel ?? 0, 2);
            if (powerB !== powerA) return powerB - powerA;
            return b.rarity - a.rarity;
        });

    const filteredMows = mows
        .filter(mow => !selectedMows.includes(mow.snowprintId!))
        .filter(mow => Teams2Service.passesMowFilter(mow, minRarity, maxRarity, factions, searchText))
        .sort((a, b) => {
            const powerA = Math.pow(a.primaryAbilityLevel ?? 0, 2) + Math.pow(a.secondaryAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.primaryAbilityLevel ?? 0, 2) + Math.pow(b.secondaryAbilityLevel ?? 0, 2);
            if (powerB !== powerA) return powerB - powerA;
            return b.rarity - a.rarity;
        });

    const handleBattleFieldLevelsChange = (level: number) => {
        const newLevels = [...battleFieldLevels];
        newLevels[level - 1] = !newLevels[level - 1];
        onBattleFieldLevelsChanged(newLevels);
    };

    return (
        <div className="relative isolate flex h-[95vh] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#1a2234]">
            {/* STATIC HEADER */}
            <div className="z-30 flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-[#1e293b]">
                <div className="justify-left flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Assemble Team</h2>
                    <RosterSnapshotsMagnificationSlider sizeMod={sizeMod} setSizeMod={setSizeMod} />
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                    <span className="text-2xl">&times;</span>
                </button>
            </div>

            {/* SINGLE SCROLLABLE CONTAINER */}
            <div className="flex-1 transform-gpu overflow-y-auto bg-slate-50 p-4 md:p-6 dark:bg-[#0d1117]">
                <div className="flex flex-col gap-6">
                    {/* UNIT FILTER SECTION */}
                    <section className="rounded-lg border-2 border-blue-500/30 bg-white shadow-inner dark:border-blue-400/20 dark:bg-[#161b22]">
                        <details className="group p-2 transition-all group-open:p-6">
                            <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-blue-600">
                                <div className="flex items-center justify-between">
                                    <span>Unit Filter</span>
                                    <span className="transition group-open:rotate-180">▼</span>
                                </div>
                            </summary>
                            <div className="mt-4 space-y-6">
                                <UnitFilter
                                    searchText={searchText}
                                    minRarity={minRarity}
                                    maxRarity={maxRarity}
                                    minRank={minRank}
                                    maxRank={maxRank}
                                    factions={factions}
                                    allFactions={allFactions}
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
                    <section className="rounded-lg border-2 border-blue-500/30 bg-white shadow-inner dark:border-blue-400/20 dark:bg-[#161b22]">
                        <details open className="group space-y-6 p-6">
                            <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-blue-600">
                                <div className="flex items-center justify-between">
                                    <span>Team Details</span>
                                    <span className="transition group-open:rotate-180">▼</span>
                                </div>
                            </summary>
                            <div>
                                <div className="mb-2 flex items-end justify-between">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Team Name
                                    </label>
                                    {!saveAllowed && (
                                        <span className="text-xs text-red-500 italic">{saveDisallowedMessage}</span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={e => onTeamNameChanged(e.target.value)}
                                    placeholder="Enter team name..."
                                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 transition-all outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-[#0f172a] dark:text-white"
                                />
                            </div>

                            <div className="flex flex-wrap gap-6">
                                <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <AccessibleTooltip title={warDisallowedMessage ?? ''}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!warDisallowedMessage && warOffense}
                                                disabled={!!warDisallowedMessage}
                                                onChange={() => onWarOffenseChanged(!warOffense)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>War Offense</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <AccessibleTooltip title={warDisallowedMessage ?? ''}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!warDisallowedMessage && warDefense}
                                                disabled={!!warDisallowedMessage}
                                                onChange={() => onWarDefenseChanged(!warDefense)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>War Defense</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={guildRaid}
                                        onChange={() => onGuildRaidChanged(!guildRaid)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Guild Raid</span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <AccessibleTooltip title={tournamentArenaDisallowedMessage ?? ''}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!tournamentArenaDisallowedMessage && tournamentArena}
                                                disabled={!!tournamentArenaDisallowedMessage}
                                                onChange={() => onTournamentArenaChanged(!tournamentArena)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Tournament Arena</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                            </div>

                            <div>
                                <h4 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                                    Battlefield Levels
                                </h4>
                                {!warDisallowedMessage && (
                                    <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                                        {[1, 2, 3, 4, 5, 6].map(lvl => (
                                            <label
                                                key={lvl}
                                                className={`flex cursor-pointer items-center justify-center rounded-lg border p-2 transition-colors ${
                                                    battleFieldLevels[lvl - 1]
                                                        ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                                        : 'border-gray-200 text-gray-500 dark:border-slate-700'
                                                }`}>
                                                <input
                                                    type="checkbox"
                                                    hidden
                                                    checked={battleFieldLevels[lvl - 1]}
                                                    onChange={() => handleBattleFieldLevelsChange(lvl)}
                                                />
                                                <span className="text-sm font-medium">Lvl {lvl}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Notes
                                </label>
                                <textarea
                                    placeholder="Add notes..."
                                    value={notes}
                                    onChange={e => onNotesChanged(e.target.value)}
                                    className="min-h-[80px] w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 transition-all outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-[#0f172a] dark:text-white"
                                />
                            </div>
                        </details>

                        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-[#1e293b]">
                            <h3 className="text-sm font-bold tracking-widest text-blue-600 uppercase dark:text-blue-400">
                                Selected Team
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onSave}
                                    disabled={!saveAllowed}
                                    className={`rounded-lg px-4 py-2 text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 ${
                                        saveAllowed
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            : 'cursor-not-allowed bg-gray-400 text-gray-200'
                                    }`}>
                                    Save Team
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            <TeamFlow
                                chars={
                                    selectedChars
                                        .map(x => chars.find(char => (char.snowprintId ?? '') === x))
                                        .filter(x => x !== undefined) ?? []
                                }
                                mows={
                                    selectedMows
                                        .map(id => mows.find(mow => (mow.snowprintId ?? '') === id))
                                        .filter(x => x !== undefined) ?? []
                                }
                                flexIndex={flexIndex}
                                onCharClicked={onCharClicked}
                                onMowClicked={onMowClicked}
                                sizeMod={sizeMod}
                            />
                        </div>
                    </section>

                    {/* GRIDS SECTION */}
                    <div
                        className={`flex min-h-0 flex-col gap-4 xl:flex-row-reverse xl:flex-nowrap ${
                            isDragging ? 'select-none' : ''
                        }`}
                        style={{ '--mow-width': `${mowWidth}px` } as React.CSSProperties}>
                        <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#161b22]">
                            <CharacterGrid
                                characters={filteredChars}
                                onCharacterSelect={onAddChar}
                                showHeader={true}
                                sizeMod={sizeMod}
                            />
                        </div>

                        <div
                            onMouseDown={startResizing}
                            className={`relative z-10 hidden w-4 flex-shrink-0 cursor-col-resize xl:flex ${isDragging ? 'bg-blue-500/10' : 'hover:bg-blue-500/5'} group transition-colors`}>
                            <div
                                className={`mx-auto h-full w-[1px] ${isDragging ? 'bg-blue-500' : 'bg-slate-200 group-hover:bg-blue-400 dark:bg-slate-800'}`}
                            />
                            <div className="pointer-events-none absolute top-24 left-1/2 flex -translate-x-1/2 justify-center">
                                <div
                                    className={`pointer-events-auto flex h-16 w-6 flex-col items-center justify-center gap-1 rounded-l-md border-y border-l shadow-md transition-all duration-200 ${
                                        isDragging
                                            ? 'border-blue-600 bg-blue-500'
                                            : 'border-slate-300 bg-white group-hover:border-blue-500 dark:border-slate-600 dark:bg-[#1c2128]'
                                    }`}>
                                    <div className={`h-[1px] w-3 ${isDragging ? 'bg-blue-100' : 'bg-slate-400'}`} />
                                    <div className={`h-[1px] w-3 ${isDragging ? 'bg-blue-100' : 'bg-slate-400'}`} />
                                    <div className={`h-[1px] w-3 ${isDragging ? 'bg-blue-100' : 'bg-slate-400'}`} />
                                </div>
                            </div>
                        </div>

                        <div className="w-full flex-shrink-0 rounded-lg border border-slate-200 bg-white p-4 xl:w-[var(--mow-width)] dark:border-slate-800 dark:bg-[#161b22]">
                            <MowGrid mows={filteredMows} onMowSelect={onAddMow} showHeader={true} sizeMod={sizeMod} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
