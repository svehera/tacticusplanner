import React from 'react';

import { Alliance, DamageType, FactionId, Rank, Rarity, Trait } from '@/fsd/5-shared/model';
import { Button, FactionSelect, RankSelect, RaritySelect, Select, SelectMulti, TraitSelect } from '@/fsd/5-shared/ui';
import { AllianceImage, MiscIcon } from '@/fsd/5-shared/ui/icons';

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

const renderAnyOption = (opt: number | '') => (opt === '' ? 'Any' : opt);
const attackTypeLabel = (opt: string) => (opt === '' ? 'Any' : opt === 'melee' ? 'Melee Only' : 'Range Only');

// Every Min/Max pair renders as two of these stacked rows, so the position→meaning mapping
// (which one is Min, which is Max) doesn't rely on the user remembering a left/right convention.
const MinMaxRow = ({ tag, children }: { tag: 'Min' | 'Max'; children: React.ReactNode }) => (
    <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 text-[10px] font-semibold tracking-wide text-(--soft-fg) uppercase">{tag}</span>
        <div className="min-w-0 flex-1">{children}</div>
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
    traits: Trait[];
    allTraits: Trait[];
    alliance: Alliance[];
    attackType: string;
    minHits: number | '';
    maxHits: number | '';
    hitsOptions: number[];
    movement: number | '';
    movementOptions: number[];
    minRange: number | '';
    maxRange: number | '';
    rangeOptions: number[];
    damageTypes: DamageType[];
    damageTypesOptions: DamageType[];
    allowLockedUnits: boolean;
    onSearchTextChange: (text: string) => void;
    onMinRarityChange: (rarity: Rarity) => void;
    onMaxRarityChange: (rarity: Rarity) => void;
    onMinRankChange: (rank: Rank) => void;
    onMaxRankChange: (rank: Rank) => void;
    onFactionsChange: (factions: FactionId[]) => void;
    onTraitsChange: (traits: Trait[]) => void;
    onAllianceChange: (alliance: Alliance[]) => void;
    onAttackTypeChange: (attackType: string) => void;
    onMinHitsChange: (hits: number | '') => void;
    onMaxHitsChange: (hits: number | '') => void;
    onMovementChange: (movement: number | '') => void;
    onMinRangeChange: (range: number | '') => void;
    onMaxRangeChange: (range: number | '') => void;
    onDamageTypesChange: (damageTypes: DamageType[]) => void;
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
    traits,
    allTraits,
    alliance,
    attackType,
    minHits,
    maxHits,
    hitsOptions,
    movement,
    movementOptions,
    minRange,
    maxRange,
    rangeOptions,
    damageTypes,
    damageTypesOptions,
    allowLockedUnits,
    onSearchTextChange,
    onMinRarityChange,
    onMaxRarityChange,
    onMinRankChange,
    onMaxRankChange,
    onFactionsChange,
    onTraitsChange,
    onAllianceChange,
    onAttackTypeChange,
    onMinHitsChange,
    onMaxHitsChange,
    onMovementChange,
    onMinRangeChange,
    onMaxRangeChange,
    onDamageTypesChange,
    onAllowLockedUnitsChange,
}) => {
    const handleFactionChange = (value: FactionId[]) => {
        onFactionsChange(value);
    };

    const handleTraitChange = (value: Trait[]) => {
        onTraitsChange(value);
    };

    const handleResetAllFilters = () => {
        onSearchTextChange('');
        onMinRarityChange(Rarity.Common);
        onMaxRarityChange(Rarity.Mythic);
        onMinRankChange(Rank.Stone1);
        onMaxRankChange(Rank.Adamantine3);
        onFactionsChange([]);
        onTraitsChange([]);
        onAllianceChange([]);
        onAttackTypeChange('');
        onMinHitsChange('');
        onMaxHitsChange('');
        onMovementChange('');
        onMinRangeChange('');
        onMaxRangeChange('');
        onDamageTypesChange([]);
        onAllowLockedUnitsChange(true);
    };

    return (
        // No card chrome here — the parent's <section>/<details> (add-team-dialog.tsx) already
        // supplies the border, background, and padding; a second layer nested a box-in-a-box.
        <div className="grid grid-cols-1 gap-6">
            {/* SEARCH + ALLOW LOCKED UNITS — share a row on wide screens; wrap to their own
                rows once the row gets too narrow to hold both comfortably. */}
            <div className="flex flex-wrap items-end gap-4">
                <div className="w-full max-w-sm">
                    <label
                        htmlFor="unit-filter-search"
                        className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Search Unit
                    </label>
                    <input
                        id="unit-filter-search"
                        type="text"
                        placeholder="e.g. Bellator..."
                        value={searchText}
                        onChange={event => onSearchTextChange(event.target.value)}
                        className="w-full rounded-lg border border-(--input-border) bg-(--bg) px-4 py-2 text-sm text-(--fg) outline-none focus:ring-2 focus:ring-(--ring)"
                    />
                </div>

                <div className="flex items-center gap-2 pb-2.5">
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
            </div>

            {/* RANGE FILTERS — every tile here is a Min/Max pair, so they're all the same height.
                    Kept in their own grid (not mixed with the single-value tiles below) so a row
                    never has to stretch a short tile to match a tall neighbor: 1, 2, and 4 columns
                    all divide these 4 tiles evenly, so there's never a half-empty row either. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Rarity
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        <MinMaxRow tag="Min">
                            <RaritySelect
                                rarityValues={RARITIES}
                                value={minRarity}
                                valueChanges={onMinRarityChange}
                                ariaLabel="Rarity, Min"
                            />
                        </MinMaxRow>
                        <MinMaxRow tag="Max">
                            <RaritySelect
                                rarityValues={RARITIES}
                                value={maxRarity}
                                valueChanges={onMaxRarityChange}
                                ariaLabel="Rarity, Max"
                            />
                        </MinMaxRow>
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Rank
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        <MinMaxRow tag="Min">
                            <RankSelect
                                label=""
                                rankValues={RANKS}
                                value={minRank}
                                valueChanges={onMinRankChange}
                                ariaLabel="Rank, Min"
                            />
                        </MinMaxRow>
                        <MinMaxRow tag="Max">
                            <RankSelect
                                label=""
                                rankValues={RANKS}
                                value={maxRank}
                                valueChanges={onMaxRankChange}
                                ariaLabel="Rank, Max"
                            />
                        </MinMaxRow>
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Hits
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        <MinMaxRow tag="Min">
                            <Select<number | ''>
                                options={['', ...hitsOptions]}
                                value={minHits}
                                onChange={onMinHitsChange}
                                renderOption={renderAnyOption}
                                renderValue={renderAnyOption}
                                ariaLabel="Hits, Min"
                            />
                        </MinMaxRow>
                        <MinMaxRow tag="Max">
                            <Select<number | ''>
                                options={['', ...hitsOptions]}
                                value={maxHits}
                                onChange={onMaxHitsChange}
                                renderOption={renderAnyOption}
                                renderValue={renderAnyOption}
                                ariaLabel="Hits, Max"
                            />
                        </MinMaxRow>
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Range
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        <MinMaxRow tag="Min">
                            <Select<number | ''>
                                options={['', ...rangeOptions]}
                                value={minRange}
                                onChange={onMinRangeChange}
                                renderOption={renderAnyOption}
                                renderValue={renderAnyOption}
                                ariaLabel="Range, Min"
                            />
                        </MinMaxRow>
                        <MinMaxRow tag="Max">
                            <Select<number | ''>
                                options={['', ...rangeOptions]}
                                value={maxRange}
                                onChange={onMaxRangeChange}
                                renderOption={renderAnyOption}
                                renderValue={renderAnyOption}
                                ariaLabel="Range, Max"
                            />
                        </MinMaxRow>
                    </div>
                </div>
            </div>

            {/* OTHER FILTERS — every tile here is a single select, so they're all the same
                    height too. 1, 2, and 3 columns all divide these 6 tiles evenly. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Attack Type
                    </label>
                    <Select<string>
                        options={['', 'melee', 'range']}
                        value={attackType}
                        onChange={onAttackTypeChange}
                        renderOption={attackTypeLabel}
                        renderValue={attackTypeLabel}
                        ariaLabel="Attack Type"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Movement
                    </label>
                    <Select<number | ''>
                        options={['', ...movementOptions]}
                        value={movement}
                        onChange={onMovementChange}
                        renderOption={renderAnyOption}
                        renderValue={renderAnyOption}
                        ariaLabel="Movement"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Factions
                    </label>
                    <FactionSelect
                        label=""
                        value={factions}
                        factionValues={allFactions}
                        valueChanges={handleFactionChange}
                        ariaLabel="Factions"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Traits
                    </label>
                    <TraitSelect
                        label=""
                        value={traits}
                        traitValues={allTraits}
                        valueChanges={handleTraitChange}
                        ariaLabel="Traits"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Alliance
                    </label>
                    <SelectMulti<Alliance>
                        options={Object.values(Alliance)}
                        value={alliance}
                        onChange={onAllianceChange}
                        placeholder="All alliances"
                        ariaLabel="Alliance"
                        renderOption={a => (
                            <div className="flex items-center gap-2">
                                <AllianceImage alliance={a} size={20} />
                                <span>{a}</span>
                            </div>
                        )}
                        renderValue={selected => (
                            <div className="flex flex-wrap items-center gap-1">
                                {selected.map(a => (
                                    <AllianceImage key={a} alliance={a} size={18} />
                                ))}
                            </div>
                        )}
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Damage Types
                    </label>
                    <SelectMulti<DamageType>
                        options={damageTypesOptions}
                        value={damageTypes}
                        onChange={onDamageTypesChange}
                        placeholder="All damage types"
                        ariaLabel="Damage Types"
                        renderOption={dt => (
                            <div className="flex items-center gap-2">
                                <MiscIcon icon={`damage${dt.replaceAll(' ', '')}` as never} width={20} height={20} />
                                <span>{dt}</span>
                            </div>
                        )}
                        renderValue={selected => (
                            <div className="flex flex-wrap items-center gap-1">
                                {selected.map(dt => (
                                    <MiscIcon
                                        key={dt}
                                        icon={`damage${dt.replaceAll(' ', '')}` as never}
                                        width={18}
                                        height={18}
                                    />
                                ))}
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* RESET BUTTON */}
            <div className="flex justify-end pt-2">
                <Button intent="primary" size="small" onPress={handleResetAllFilters}>
                    Reset All Filters
                </Button>
            </div>
        </div>
    );
};
