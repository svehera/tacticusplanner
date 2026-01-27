/* eslint-disable import-x/no-internal-modules */
import React, { useCallback, useEffect, useState } from 'react';

import { ICharacter2 } from '@/models/interfaces';

import { FactionsService } from '@/fsd/5-shared/lib';
import { Faction, Rank, Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { IMow2 } from '@/fsd/4-entities/mow';

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
    searchText: string;
    minRarity: Rarity;
    maxRarity: Rarity;
    minRank: Rank;
    maxRank: Rank;
    factions: Faction[];
    onSelectedCharsChange: (ids: string[]) => void;
    onSelectedMowsChange: (ids: string[]) => void;
    onSearchTextChange: (text: string) => void;
    onMinRarityChange: (rarity: Rarity) => void;
    onMaxRarityChange: (rarity: Rarity) => void;
    onMinRankChange: (rank: Rank) => void;
    onMaxRankChange: (rank: Rank) => void;
    onFactionsChange: (factions: Faction[]) => void;

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
    onCancel: () => void;
    onSave: () => void;
}
export const AddTeamDialog: React.FC<Props> = ({
    chars,
    mows,
    selectedChars,
    selectedMows,
    searchText,
    minRarity,
    maxRarity,
    minRank,
    maxRank,
    factions,
    onSelectedCharsChange,
    onSelectedMowsChange,
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
    onTeamNameChanged: onTeamNameChange,
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

    const allFactions: Faction[] = Array.from(
        new Set<Faction>([
            ...(chars.map(c => FactionsService.snowprintFactionToFaction(c.faction)) as Faction[]),
            ...(mows.map(m => FactionsService.snowprintFactionToFaction(m.faction)) as Faction[]),
        ])
    ).sort((a, b) => a.localeCompare(b));

    const addChar = (snowprintId: string) => {
        onSelectedCharsChange([...selectedChars, snowprintId]);
    };

    const addMow = (snowprintId: string) => {
        onSelectedMowsChange([...selectedMows, snowprintId]);
    };

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
        <div className="relative w-full bg-white dark:bg-[#1a2234] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 h-[95vh] flex flex-col overflow-hidden isolate">
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-700 z-30">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Assemble Team</h2>
                <button
                    onClick={onCancel}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <span className="text-2xl">&times;</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-[#0d1117] transform-gpu">
                <div className="flex flex-col gap-6">
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

                    <section className="bg-white dark:bg-[#161b22] p-6 rounded-lg border-2 border-blue-500/30 dark:border-blue-400/20 shadow-inner">
                        <div className="flex flex-wrap items-center">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                Selected Team
                            </h2>
                        </div>
                        <div className="mt-4">
                            <TeamFlow
                                chars={selectedChars.map(x => chars.find(char => (char.snowprintId ?? '') === x)!)}
                                mows={selectedMows.map(id => mows.find(mow => (mow.snowprintId ?? '') === id)!)}
                                onCharClicked={char =>
                                    onSelectedCharsChange(selectedChars.filter(id => id !== (char.snowprintId ?? '')))
                                }
                                onMowClicked={mow =>
                                    onSelectedMowsChange(selectedMows.filter(id => id !== (mow.snowprintId ?? '')))
                                }
                            />
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Team Name
                                    </label>
                                    {!saveAllowed && (
                                        <span className="text-red-500 text-xs italic">{saveDisallowedMessage}</span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={e => onTeamNameChange(e.target.value)}
                                    placeholder="Enter team name..."
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                    <AccessibleTooltip title={warDisallowedMessage ?? ''}>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!warDisallowedMessage && warOffense}
                                                disabled={!!warDisallowedMessage}
                                                onChange={() => onWarOffenseChanged(!warOffense)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />{' '}
                                            War Offense
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                    <AccessibleTooltip title={warDisallowedMessage ?? ''}>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!warDisallowedMessage && warDefense}
                                                disabled={!!warDisallowedMessage}
                                                onChange={() => onWarDefenseChanged(!warDefense)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />{' '}
                                            War Defense
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={guildRaid}
                                        onChange={() => onGuildRaidChanged(!guildRaid)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />{' '}
                                    Guild Raid
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                    <AccessibleTooltip title={tournamentArenaDisallowedMessage ?? ''}>
                                        <div>
                                            <input
                                                type="checkbox"
                                                checked={!tournamentArenaDisallowedMessage && tournamentArena}
                                                disabled={!!tournamentArenaDisallowedMessage}
                                                onChange={() => onTournamentArenaChanged(!tournamentArena)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />{' '}
                                            Tournament Arena
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                    Battlefield Levels
                                </h4>
                                {!warDisallowedMessage && (
                                    <div className="grid grid-cols-3 gap-3">
                                        {[1, 2, 3, 4, 5, 6].map(lvl => (
                                            <label
                                                key={lvl}
                                                className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors ${
                                                    battleFieldLevels[lvl - 1]
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600'
                                                        : 'border-gray-200 dark:border-slate-700 text-gray-500'
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
                        </div>

                        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-[#1e293b] border-t border-gray-200 dark:border-slate-700">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={onSave}
                                disabled={!saveAllowed}
                                className={`px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 ${
                                    saveAllowed
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-gray-400 cursor-not-allowed text-gray-200'
                                }`}>
                                Save Team
                            </button>
                        </div>
                    </section>

                    <div
                        className={`flex flex-col xl:flex-row-reverse xl:flex-nowrap gap-4 min-h-0 ${
                            isDragging ? 'select-none' : ''
                        }`}
                        style={{ '--mow-width': `${mowWidth}px` } as React.CSSProperties}>
                        <div className="w-full xl:w-[var(--mow-width)] flex-shrink-0 bg-white dark:bg-[#161b22] p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                            <MowGrid mows={filteredMows} onMowSelect={addMow} showHeader={true} />
                        </div>

                        <div
                            onMouseDown={startResizing}
                            className={`hidden xl:flex w-4 flex-shrink-0 cursor-col-resize relative z-10
                                    ${isDragging ? 'bg-blue-500/10' : 'hover:bg-blue-500/5'}
                                    group transition-colors`}>
                            <div
                                className={`w-[1px] h-full mx-auto ${isDragging ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-400'}`}
                            />

                            <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none flex justify-center">
                                <div
                                    className={`pointer-events-auto flex flex-col gap-1 items-center justify-center
                                            w-6 h-16 rounded-l-md border-y border-l shadow-md
                                            transition-all duration-200
                                            ${
                                                isDragging
                                                    ? 'bg-blue-500 border-blue-600'
                                                    : 'bg-white dark:bg-[#1c2128] border-slate-300 dark:border-slate-600 group-hover:border-blue-500'
                                            }`}>
                                    <div className={`w-3 h-[1px] ${isDragging ? 'bg-blue-100' : 'bg-slate-400'}`} />
                                    <div className={`w-3 h-[1px] ${isDragging ? 'bg-blue-100' : 'bg-slate-400'}`} />
                                    <div className={`w-3 h-[1px] ${isDragging ? 'bg-blue-100' : 'bg-slate-400'}`} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 bg-white dark:bg-[#161b22] p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                            <CharacterGrid characters={filteredChars} onCharacterSelect={addChar} showHeader={true} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
