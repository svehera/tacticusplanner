/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { MenuItem, OutlinedInput, Select, SelectChangeEvent } from '@mui/material';
import React, { useState } from 'react';

import { ICharacter2 } from '@/models/interfaces';

import { FactionsService } from '@/fsd/5-shared/lib';
import { Faction, Rank, Rarity } from '@/fsd/5-shared/model';
import { RaritySelect } from '@/fsd/5-shared/ui';

import { RankSelect } from '@/fsd/4-entities/character';
import { FactionImage } from '@/fsd/4-entities/faction/faction.icon';
import { IMow2 } from '@/fsd/4-entities/mow';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { CharacterSelectionGrid } from './character-selection-grid';
import { MowSelectionGrid } from './mow-selection-grid';
import { WarService } from './war.service';

interface FilterGroupProps {
    label: string;
    children: React.ReactNode;
}

const FilterGroup: React.FC<FilterGroupProps> = ({ label, children }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
        </label>
        <div className="flex flex-row items-center gap-2">{children}</div>
    </div>
);

interface SelectTeamProps {
    chars: ICharacter2[];
    mows: IMow2[];
}

const RARITIES = [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary, Rarity.Mythic];
const RANKS = [
    Rank.Stone1,
    Rank.Stone2,
    Rank.Stone3,
    Rank.Bronze1,
    Rank.Bronze2,
    Rank.Bronze3,
    Rank.Silver1,
    Rank.Silver2,
    Rank.Silver3,
    Rank.Gold1,
    Rank.Gold2,
    Rank.Gold3,
    Rank.Diamond1,
    Rank.Diamond2,
    Rank.Diamond3,
    Rank.Adamantine1,
    Rank.Adamantine2,
    Rank.Adamantine3,
];

export const SelectTeam: React.FC<SelectTeamProps> = ({ chars, mows }) => {
    const [teamName, setTeamName] = useState('');
    const [searchText, setSearchText] = useState('');
    const [minRarity, setMinRarity] = useState<Rarity>(Rarity.Common);
    const [maxRarity, setMaxRarity] = useState<Rarity>(Rarity.Mythic);
    const [minRank, setMinRank] = useState<Rank>(Rank.Stone1);
    const [maxRank, setMaxRank] = useState<Rank>(Rank.Adamantine3);
    const [factions, setFactions] = useState<Faction[]>([]);
    const [selectedChars, setSelectedChars] = useState<string[]>([]);
    const [selectedMow, setSelectedMow] = useState<string>('');

    const allFactions: Faction[] = Array.from(
        new Set<Faction>([
            ...(chars.map(c => FactionsService.snowprintFactionToFaction(c.faction)) as Faction[]),
            ...(mows.map(m => FactionsService.snowprintFactionToFaction(m.faction)) as Faction[]),
        ])
    ).sort((a, b) => a.localeCompare(b));

    const handleFactionChange = (event: SelectChangeEvent<Faction[]>) => {
        if (event.target.value === undefined) {
            setFactions([]);
            return;
        }
        if (event.target.value === 'All') {
            setFactions([]);
            return;
        }
        setFactions(event.target.value as Faction[]);
    };

    const addChar = (snowprintId: string) => {
        if (selectedChars.length >= 5) return;
        setSelectedChars(prev => [...prev, snowprintId]);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 p-4 gap-6">
            <header className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-[#161b22] rounded-lg border border-slate-200 dark:border-slate-800">
                <FilterGroup label="Search Unit">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="e.g. Bellator..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="w-full md:w-64 bg-white dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </FilterGroup>
                <FilterGroup label="Rarity">
                    <RaritySelect label="Min" rarityValues={RARITIES} value={minRarity} valueChanges={setMinRarity} />
                    <RaritySelect label="Max" rarityValues={RARITIES} value={maxRarity} valueChanges={setMaxRarity} />
                </FilterGroup>
                <FilterGroup label="Rank">
                    <RankSelect label="Min" rankValues={RANKS} value={minRank} valueChanges={setMinRank} />
                    <div className="min-width-[180px]">
                        <RankSelect label="Max" rankValues={RANKS} value={maxRank} valueChanges={setMaxRank} />
                    </div>
                </FilterGroup>
                <FilterGroup label="Factions">
                    <Select<Faction[]>
                        labelId="faction-select-label"
                        multiple
                        value={factions}
                        onChange={handleFactionChange}
                        input={<OutlinedInput label="Factions" />}
                        className="min-w-[200px]"
                        renderValue={selected => {
                            if (selected.length === 0) {
                                return <em style={{ color: '#94a3b8' }}>All Factions</em>;
                            }
                            return (
                                <div className="flex flex-wrap gap-1">
                                    {selected.map(value => (
                                        <FactionImage key={'shown-faction-' + value} faction={value} />
                                    ))}
                                </div>
                            );
                        }}>
                        {allFactions.map(faction => (
                            <MenuItem key={faction} value={faction}>
                                <div className="flex items-center gap-[15px]">
                                    <span>{faction}</span>
                                    <FactionImage faction={faction} />
                                </div>
                            </MenuItem>
                        ))}
                    </Select>
                </FilterGroup>

                <div className="ml-auto self-end">
                    <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition">
                        Reset All Filters
                    </button>
                </div>
            </header>

            <section className="bg-white dark:bg-[#161b22] p-6 rounded-lg border-2 border-blue-500/30 dark:border-blue-400/20 shadow-inner">
                <div className="flex flex-wrap">
                    <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-blue-600 dark:text-blue-400">
                        Selected Team
                    </h2>
                    <div className="w-[20px]" />
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="team name"
                            value={teamName}
                            onChange={e => setTeamName(e.target.value)}
                            className="w-full md:w-64 bg-white dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="w-[20px]" />
                </div>
                <div className="flex flex-wrap gap-4 min-h-[100px] items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-black/10">
                    {selectedChars.length > 0 &&
                        selectedChars
                            .map(x => chars.find(char => char.snowprintId! === x))
                            .map(char => (
                                <div
                                    key={char!.snowprintId!}
                                    onClick={() =>
                                        setSelectedChars(prev => prev.filter(id => id !== char!.snowprintId!))
                                    }
                                    className="cursor-pointer transition-transform duration-100 active:scale-95 hover:brightness-110"
                                    title={`Selected ${char!.snowprintId! || 'Character'}`}>
                                    <RosterSnapshotCharacter
                                        key={char!.snowprintId!}
                                        showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                        showShards={RosterSnapshotShowVariableSettings.Never}
                                        showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                        char={WarService.convertCharacter(char!)}
                                        charData={char}
                                    />
                                </div>
                            ))}
                    {selectedMow.length > 0 &&
                        [selectedMow]
                            .map(x => mows.find(mow => mow.snowprintId! === x))
                            .map(mow => (
                                <div
                                    key="selected-mow"
                                    onClick={() => setSelectedMow('')}
                                    className="cursor-pointer transition-transform duration-100 active:scale-95 hover:brightness-110"
                                    title="Selected Machine of War">
                                    <RosterSnapshotCharacter
                                        key={mow!.snowprintId!}
                                        showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                        showShards={RosterSnapshotShowVariableSettings.Never}
                                        showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                        mow={WarService.convertMow(mow!)}
                                        mowData={mow}
                                    />
                                </div>
                            ))}
                </div>
            </section>

            <div className="flex flex-col lg:flex-row gap-6 h-full">
                <CharacterSelectionGrid
                    searchText={searchText}
                    minRank={minRank}
                    maxRank={maxRank}
                    minRarity={minRarity}
                    maxRarity={maxRarity}
                    factions={factions}
                    characters={chars}
                    selectedCharacterIds={selectedChars}
                    onCharacterSelect={addChar}
                />
                <MowSelectionGrid
                    searchText={searchText}
                    minRarity={minRarity}
                    maxRarity={maxRarity}
                    factions={factions}
                    mows={mows}
                    selectedMow={selectedMow}
                    onMowSelect={setSelectedMow}
                />
            </div>
        </div>
    );
};
