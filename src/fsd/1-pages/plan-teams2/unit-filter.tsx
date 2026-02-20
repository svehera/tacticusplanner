import { MenuItem, OutlinedInput, Select, SelectChangeEvent } from '@mui/material';
import React from 'react';

import { FactionId, Rank, Rarity } from '@/fsd/5-shared/model';
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
    <div className="flex flex-wrap items-center gap-1">
        <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            {label}
        </label>
        <div className="flex flex-wrap items-center justify-center gap-2">{children}</div>
    </div>
);

interface Props {
    searchText: string;
    minRarity: Rarity;
    maxRarity: Rarity;
    minRank: Rank;
    maxRank: Rank;
    factions: FactionId[];
    allFactions: FactionId[];
    onSearchTextChange: (text: string) => void;
    onMinRarityChange: (rarity: Rarity) => void;
    onMaxRarityChange: (rarity: Rarity) => void;
    onMinRankChange: (rank: Rank) => void;
    onMaxRankChange: (rank: Rank) => void;
    onFactionsChange: (factions: FactionId[]) => void;
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
    const handleFactionChange = (event: SelectChangeEvent<FactionId[]>) => {
        if (event.target.value === undefined) {
            onFactionsChange([]);
            return;
        }
        if (event.target.value === 'All') {
            onFactionsChange([]);
            return;
        }
        onFactionsChange(event.target.value as FactionId[]);
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
        <header className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#161b22]">
            <FilterGroup label="Search Unit">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="e.g. Bellator..."
                        value={searchText}
                        onChange={e => onSearchTextChange(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 md:w-64 dark:border-slate-700 dark:bg-[#0d1117] dark:text-slate-100"
                    />
                </div>
            </FilterGroup>
            <FilterGroup label="Rarity">
                <div className="min-w-[180px]">
                    <RaritySelect
                        label="Min"
                        rarityValues={RARITIES}
                        value={minRarity}
                        valueChanges={onMinRarityChange}
                    />
                </div>
                <div className="min-w-[180px]">
                    <RaritySelect
                        label="Max"
                        rarityValues={RARITIES}
                        value={maxRarity}
                        valueChanges={onMaxRarityChange}
                    />
                </div>
            </FilterGroup>
            <FilterGroup label="Rank">
                <div className="min-w-[210px]">
                    <RankSelect label="Min" rankValues={RANKS} value={minRank} valueChanges={onMinRankChange} />
                </div>
                <div className="min-w-[210px]">
                    <RankSelect label="Max" rankValues={RANKS} value={maxRank} valueChanges={onMaxRankChange} />
                </div>
            </FilterGroup>
            <FilterGroup label="Factions">
                <Select<FactionId[]>
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

            <div className="flex flex-col items-center">
                <div className="ml-auto self-end">
                    <button
                        className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        onClick={handleResetAllFilters}>
                        Reset All Filters
                    </button>
                </div>
            </div>
        </header>
    );
};
