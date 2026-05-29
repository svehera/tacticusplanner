import React from 'react';

import { FactionId, Rank, Rarity } from '@/fsd/5-shared/model';
import { Button, FactionSelect, RankSelect, RaritySelect } from '@/fsd/5-shared/ui';

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
        <header className="rounded-xl border border-(--card-border) bg-(--card) p-4 md:p-6">
            <div className="grid grid-cols-1 gap-6">
                {/* ALLOW LOCKED UNITS */}
                <div className="flex items-center gap-2">
                    <input
                        id="allow-locked-units"
                        type="checkbox"
                        checked={allowLockedUnits}
                        onChange={event => onAllowLockedUnitsChange(event.target.checked)}
                        className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring)"
                    />
                    <label
                        htmlFor="allow-locked-units"
                        className="text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Allow Locked Units
                    </label>
                </div>
                {/* SEARCH */}
                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Search Unit
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Bellator..."
                        value={searchText}
                        onChange={event => onSearchTextChange(event.target.value)}
                        className="w-full rounded-lg border border-(--input-border) bg-(--bg) px-4 py-2 text-sm text-(--fg) outline-none focus:ring-2 focus:ring-(--ring)"
                    />
                </div>

                {/* RARITY + RANK */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* RARITY */}
                    <div>
                        <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                            Rarity
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <RaritySelect
                                label="Min"
                                rarityValues={RARITIES}
                                value={minRarity}
                                valueChanges={onMinRarityChange}
                            />
                            <RaritySelect
                                label="Max"
                                rarityValues={RARITIES}
                                value={maxRarity}
                                valueChanges={onMaxRarityChange}
                            />
                        </div>
                    </div>

                    {/* RANK */}
                    <div>
                        <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                            Rank
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <RankSelect label="Min" rankValues={RANKS} value={minRank} valueChanges={onMinRankChange} />
                            <RankSelect label="Max" rankValues={RANKS} value={maxRank} valueChanges={onMaxRankChange} />
                        </div>
                    </div>
                </div>

                {/* FACTIONS */}
                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Factions
                    </label>

                    <FactionSelect
                        label=""
                        value={factions}
                        factionValues={allFactions}
                        valueChanges={handleFactionChange}
                    />
                </div>

                {/* RESET BUTTON */}
                <div className="flex justify-end pt-2">
                    <Button intent="primary" size="small" onPress={handleResetAllFilters}>
                        Reset All Filters
                    </Button>
                </div>
            </div>
        </header>
    );
};
