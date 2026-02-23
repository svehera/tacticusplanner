import React from 'react';

import { FactionId, Rank, Rarity } from '@/fsd/5-shared/model';
import { FactionSelect2 } from '@/fsd/5-shared/ui/faction-select2';
import { RankSelect2 } from '@/fsd/5-shared/ui/rank-select2';
import { RaritySelect2 } from '@/fsd/5-shared/ui/rarity-select2';

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

interface Props {
    searchText: string;
    minRarity: Rarity;
    maxRarity: Rarity;
    minRank: Rank;
    maxRank: Rank;
    factions: FactionId[];
    allFactions: FactionId[];
    allowLockedUnits: boolean;
    onSearchTextChange: (text: string) => void;
    onMinRarityChange: (rarity: Rarity) => void;
    onMaxRarityChange: (rarity: Rarity) => void;
    onMinRankChange: (rank: Rank) => void;
    onMaxRankChange: (rank: Rank) => void;
    onFactionsChange: (factions: FactionId[]) => void;
    onAllowLockedUnitsChange: (allow: boolean) => void;
}

export const UnitFilter: React.FC<Props> = ({
    searchText,
    minRarity,
    maxRarity,
    minRank,
    maxRank,
    factions,
    allFactions,
    allowLockedUnits,
    onSearchTextChange,
    onMinRarityChange,
    onMaxRarityChange,
    onMinRankChange,
    onMaxRankChange,
    onFactionsChange,
    onAllowLockedUnitsChange,
}) => {
    const handleFactionChange = (value: FactionId[]) => {
        onFactionsChange(value);
    };

    const handleResetAllFilters = () => {
        onSearchTextChange('');
        onMinRarityChange(Rarity.Common);
        onMaxRarityChange(Rarity.Mythic);
        onMinRankChange(Rank.Stone1);
        onMaxRankChange(Rank.Adamantine3);
        onFactionsChange([]);
        onAllowLockedUnitsChange(true);
    };

    return (
        <header className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 dark:border-slate-800 dark:bg-[#161b22]">
            <div className="grid grid-cols-1 gap-6">
                {/* ALLOW LOCKED UNITS */}
                <div className="flex items-center gap-2">
                    <input
                        id="allow-locked-units"
                        type="checkbox"
                        checked={allowLockedUnits}
                        onChange={e => onAllowLockedUnitsChange(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700"
                    />
                    <label
                        htmlFor="allow-locked-units"
                        className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                        Allow Locked Units
                    </label>
                </div>
                {/* SEARCH */}
                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                        Search Unit
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Bellator..."
                        value={searchText}
                        onChange={e => onSearchTextChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-[#0d1117] dark:text-slate-100"
                    />
                </div>

                {/* RARITY + RANK */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* RARITY */}
                    <div>
                        <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                            Rarity
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <RaritySelect2
                                label="Min"
                                rarityValues={RARITIES}
                                value={minRarity}
                                valueChanges={onMinRarityChange}
                            />
                            <RaritySelect2
                                label="Max"
                                rarityValues={RARITIES}
                                value={maxRarity}
                                valueChanges={onMaxRarityChange}
                            />
                        </div>
                    </div>

                    {/* RANK */}
                    <div>
                        <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                            Rank
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <RankSelect2
                                label="Min"
                                rankValues={RANKS}
                                value={minRank}
                                valueChanges={onMinRankChange}
                            />
                            <RankSelect2
                                label="Max"
                                rankValues={RANKS}
                                value={maxRank}
                                valueChanges={onMaxRankChange}
                            />
                        </div>
                    </div>
                </div>

                {/* FACTIONS */}
                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                        Factions
                    </label>

                    <FactionSelect2
                        label=""
                        value={factions}
                        factionValues={allFactions}
                        valueChanges={handleFactionChange}
                    />
                </div>

                {/* RESET BUTTON */}
                <div className="flex justify-end pt-2">
                    <button
                        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        onClick={handleResetAllFilters}>
                        Reset All Filters
                    </button>
                </div>
            </div>
        </header>
    );
};
