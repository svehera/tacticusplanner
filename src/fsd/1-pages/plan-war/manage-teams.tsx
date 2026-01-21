/* eslint-disable import-x/no-internal-modules */
import SaveIcon from '@mui/icons-material/Save';
import { Button } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import { ICharacter2 } from '@/models/interfaces';

import { FactionsService } from '@/fsd/5-shared/lib';
import { Faction, Rank, Rarity } from '@/fsd/5-shared/model';

import { IMow2 } from '@/fsd/4-entities/mow';

import { CharacterGrid } from './character-grid';
import { MowGrid } from './mow-grid';
import { SaveTeamDialog } from './save-team-dialog';
import { TeamFlow } from './team-flow';
import { UnitFilter } from './unit-filter';
import { WarService } from './war.service';

const NAME_TOO_SHORT_MESSAGE = 'Team name must be at least 3 characters long.';

interface Props {
    chars: ICharacter2[];
    mows: IMow2[];
}

export const ManageTeams: React.FC<Props> = ({ chars, mows }) => {
    const [selectedChars, setSelectedChars] = useState<string[]>([]);
    const [selectedMows, setSelectedMows] = useState<string[]>([]);
    const [searchText, setSearchText] = useState('');
    const [minRarity, setMinRarity] = useState<Rarity>(Rarity.Common);
    const [maxRarity, setMaxRarity] = useState<Rarity>(Rarity.Mythic);
    const [minRank, setMinRank] = useState<Rank>(Rank.Stone1);
    const [maxRank, setMaxRank] = useState<Rank>(Rank.Adamantine3);
    const [factions, setFactions] = useState<Faction[]>([]);
    const [mowWidth, setMowWidth] = useState<number>(200);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // State for the save dialog.
    const [saveAllowed, setSaveAllowed] = useState(false);
    const [saveTeamDialogOpen, setSaveTeamDialogOpen] = useState<boolean>(false);
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

    const startResizing = useCallback(() => {
        setIsDragging(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsDragging(false);
    }, []);

    const resizeGrids = useCallback(
        (e: MouseEvent) => {
            if (isDragging) {
                // We calculate distance from the right side of the window
                const newWidth = window.innerWidth - e.clientX;
                // Set boundaries (e.g., min 200px, max 50% of screen)
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
        setSelectedChars(prev => [...prev, snowprintId]);
    };

    const addMow = (snowprintId: string) => {
        setSelectedMows(prev => [...prev, snowprintId]);
    };

    const filteredChars = chars
        .filter(c => !selectedChars.includes(c.snowprintId!))
        .filter(c => WarService.passesCharacterFilter(c, minRank, maxRank, minRarity, maxRarity, factions, searchText))
        .sort((a, b) => {
            if (b.rank !== a.rank) {
                return b.rank - a.rank;
            }
            const powerA = Math.pow(a.activeAbilityLevel ?? 0, 2) + Math.pow(a.passiveAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.activeAbilityLevel ?? 0, 2) + Math.pow(b.passiveAbilityLevel ?? 0, 2);
            if (powerB !== powerA) {
                return powerB - powerA;
            }
            return b.rarity - a.rarity;
        });

    const filteredMows = mows
        .filter(mow => !selectedMows.includes(mow.snowprintId!))
        .filter(mow => WarService.passesMowFilter(mow, minRarity, maxRarity, factions, searchText))
        .sort((a, b) => {
            const powerA = Math.pow(a.primaryAbilityLevel ?? 0, 2) + Math.pow(a.secondaryAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.primaryAbilityLevel ?? 0, 2) + Math.pow(b.secondaryAbilityLevel ?? 0, 2);
            if (powerB !== powerA) {
                return powerB - powerA;
            }
            return b.rarity - a.rarity;
        });

    const showSaveDialog = () => {
        setSaveTeamDialogOpen(true);
    };

    const handleSaveTeam = () => {
        setSaveTeamDialogOpen(false);
    };

    const handleWarOffenseChange = (offense: boolean) => {
        setWarOffenseSelected(offense);
    };
    const handleWarDefenseChange = (defense: boolean) => {
        setWarDefenseSelected(defense);
    };
    const handleGuildRaidChange = (guildRaid: boolean) => {
        setGuildRaidSelected(guildRaid);
    };
    const handleTournamentArenaChange = (tournamentArena: boolean) => {
        setTournamentArenaSelected(tournamentArena);
    };
    const handleBattleFieldLevelsChange = (levels: boolean[]) => {
        setBattleFieldLevels(levels);
    };

    const handleTeamNameChange = (teamName: string) => {
        setTeamName(teamName);
    };

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
            setSaveDisallowedMessage(NAME_TOO_SHORT_MESSAGE);
            setSaveAllowed(teamName.trim().length >= 3);
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

    return (
        <div>
            <SaveTeamDialog
                warOffense={warOffenseSelected}
                warDefense={warDefenseSelected}
                warEnabled={warDisallowedMessage === undefined}
                warDisabledMessage={warDisallowedMessage}
                tournamentArena={tournamentArenaSelected}
                tournamentArenaEnabled={tournamentArenaDisallowedMessage === undefined}
                tournamentArenaDisabledMessage={tournamentArenaDisallowedMessage}
                guildRaid={guildRaidSelected}
                battleFieldLevels={battleFieldLevels}
                teamName={teamName}
                isOpen={saveTeamDialogOpen}
                saveAllowed={saveAllowed}
                saveDisallowedMessage={saveDisallowedMessage}
                onWarOffenseChanged={handleWarOffenseChange}
                onWarDefenseChanged={handleWarDefenseChange}
                onGuildRaidChanged={handleGuildRaidChange}
                onTournamentArenaChanged={handleTournamentArenaChange}
                onBattleFieldLevelsChanged={handleBattleFieldLevelsChange}
                onTeamNameChange={handleTeamNameChange}
                onCancel={() => setSaveTeamDialogOpen(false)}
                onSave={handleSaveTeam}
            />
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 p-4 gap-6">
                <UnitFilter
                    searchText={searchText}
                    minRarity={minRarity}
                    maxRarity={maxRarity}
                    minRank={minRank}
                    maxRank={maxRank}
                    factions={factions}
                    allFactions={allFactions}
                    onSearchTextChange={setSearchText}
                    onMinRarityChange={setMinRarity}
                    onMaxRarityChange={setMaxRarity}
                    onMinRankChange={setMinRank}
                    onMaxRankChange={setMaxRank}
                    onFactionsChange={(newFactions: Faction[]) => {
                        setFactions(newFactions);
                    }}
                />
                <section className="bg-white dark:bg-[#161b22] p-6 rounded-lg border-2 border-blue-500/30 dark:border-blue-400/20 shadow-inner">
                    <div className="flex flex-wrap">
                        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-blue-600 dark:text-blue-400">
                            Selected Team
                        </h2>
                        <div className="w-[20px]" />
                        <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            sx={{ py: 0.2 }}
                            onClick={showSaveDialog}
                            disabled={selectedChars.length === 0 && selectedMows.length === 0}>
                            <SaveIcon className="mr-1" />
                            Save
                        </Button>
                    </div>
                    <div className="h-[10px]" />
                    <TeamFlow
                        chars={selectedChars.map(x => chars.find(char => char.snowprintId! === x)) as ICharacter2[]}
                        mows={selectedMows.map(id => mows.find(mow => mow.snowprintId! === id)) as IMow2[]}
                        onCharClicked={char => setSelectedChars(prev => prev.filter(id => id !== char.snowprintId!))}
                        onMowClicked={mow => setSelectedMows(prev => prev.filter(id => id !== mow.snowprintId!))}
                    />
                </section>
                <div
                    className={`flex flex-col xl:flex-row-reverse xl:flex-nowrap gap-4 h-full ${
                        isDragging ? 'cursor-col-resize select-none' : ''
                    }`}
                    style={{ '--mow-width': `${mowWidth}px` } as React.CSSProperties}>
                    <div
                        /* w-full by default. On desktop (xl), it takes the custom width */
                        className="w-full xl:w-[var(--mow-width)] flex-shrink-0 bg-white dark:bg-[#161b22] p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                        <MowGrid mows={filteredMows} onMowSelect={addMow} showHeader={true} />
                    </div>

                    <div
                        onMouseDown={startResizing}
                        className={`hidden xl:flex w-6 flex-shrink-0 cursor-col-resize relative z-20
                                ${isDragging ? 'bg-blue-500/10' : 'hover:bg-blue-500/5'}
                                group`}>
                        <div
                            className={`w-[1px] h-full mx-auto ${isDragging ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-400'}`}
                        />
                        <div className="absolute inset-0 pointer-events-none flex justify-center">
                            <div
                                className={`sticky top-[20%] z-30 pointer-events-auto flex flex-col gap-1 items-center justify-center
                                        w-6 h-16 rounded-l-md border-y border-l shadow-[-4px_0_10px_rgba(0,0,0,0.1)] 
                                        transition-all duration-200
                                        ${
                                            isDragging
                                                ? 'bg-blue-500 border-blue-600'
                                                : 'bg-white dark:bg-[#1c2128] border-slate-300 dark:border-slate-600 group-hover:border-blue-500'
                                        }`}>
                                <div
                                    className={`w-3 h-[2px] rounded-full ${isDragging ? 'bg-blue-200' : 'bg-slate-300 dark:bg-slate-500'}`}
                                />
                                <div
                                    className={`w-3 h-[2px] rounded-full ${isDragging ? 'bg-blue-200' : 'bg-slate-300 dark:bg-slate-500'}`}
                                />
                                <div
                                    className={`w-3 h-[2px] rounded-full ${isDragging ? 'bg-blue-200' : 'bg-slate-300 dark:bg-slate-500'}`}
                                />
                                <div className="absolute right-[-2px] w-[2px] h-full bg-inherit" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 bg-white dark:bg-[#161b22] p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                        <CharacterGrid characters={filteredChars} onCharacterSelect={addChar} showHeader={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};
