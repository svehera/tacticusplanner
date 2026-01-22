import { MenuItem, OutlinedInput, Select, SelectChangeEvent } from '@mui/material';
import React from 'react';

import { Faction, Rank, Rarity } from '@/fsd/5-shared/model';
import { RaritySelect } from '@/fsd/5-shared/ui';

import { RankSelect } from '@/fsd/4-entities/character';
import { FactionImage } from '@/fsd/4-entities/faction';

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

interface Props {
    searchText: string;
    minRarity: Rarity;
    maxRarity: Rarity;
    minRank: Rank;
    maxRank: Rank;
    factions: Faction[];
    allFactions: Faction[];
    onSearchTextChange: (text: string) => void;
    onMinRarityChange: (rarity: Rarity) => void;
    onMaxRarityChange: (rarity: Rarity) => void;
    onMinRankChange: (rank: Rank) => void;
    onMaxRankChange: (rank: Rank) => void;
    onFactionsChange: (factions: Faction[]) => void;
}

export const UnitFilter: React.FC<Props> = ({
    searchText,
    minRarity,
    maxRarity,
    minRank,
    maxRank,
    factions,
    allFactions,
    onSearchTextChange,
    onMinRarityChange,
    onMaxRarityChange,
    onMinRankChange,
    onMaxRankChange,
    onFactionsChange,
}) => {
    const handleFactionChange = (event: SelectChangeEvent<Faction[]>) => {
        if (event.target.value === undefined) {
            onFactionsChange([]);
            return;
        }
        if (event.target.value === 'All') {
            onFactionsChange([]);
            return;
        }
        onFactionsChange(event.target.value as Faction[]);
    };

    const handleResetAllFilters = () => {
        onSearchTextChange('');
        onMinRarityChange(Rarity.Common);
        onMaxRarityChange(Rarity.Mythic);
        onMinRankChange(Rank.Stone1);
        onMaxRankChange(Rank.Adamantine3);
        onFactionsChange([]);
    };

    return (
        <header className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-[#161b22] rounded-lg border border-slate-200 dark:border-slate-800">
            <FilterGroup label="Search Unit">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="e.g. Bellator..."
                        value={searchText}
                        onChange={e => onSearchTextChange(e.target.value)}
                        className="w-full md:w-64 bg-white dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </FilterGroup>
            <FilterGroup label="Rarity">
                <RaritySelect label="Min" rarityValues={RARITIES} value={minRarity} valueChanges={onMinRarityChange} />
                <RaritySelect label="Max" rarityValues={RARITIES} value={maxRarity} valueChanges={onMaxRarityChange} />
            </FilterGroup>
            <FilterGroup label="Rank">
                <RankSelect label="Min" rankValues={RANKS} value={minRank} valueChanges={onMinRankChange} />
                <div className="min-width-[180px]">
                    <RankSelect label="Max" rankValues={RANKS} value={maxRank} valueChanges={onMaxRankChange} />
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
                <button
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
                    onClick={handleResetAllFilters}>
                    Reset All Filters
                </button>
            </div>
        </header>
    );
};
