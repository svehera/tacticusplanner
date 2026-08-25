/* eslint-disable import-x/no-internal-modules */
import TextField from '@mui/material/TextField';

import { rarityToMaxRank, rarityToMaxStars, rarityToStars } from 'src/models/constants';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RankSelect, RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';

import { IUnit } from '@/fsd/4-entities/unit';
import { UnitsAutocomplete } from '@/fsd/4-entities/unit/ui/units-autocomplete';

export interface UnitThresholdPickerProps {
    unit: IUnit | undefined;
    options: IUnit[];
    rank: Rank;
    rarity: Rarity;
    stars: number;
    activeAbilityLevel: number;
    passiveAbilityLevel: number;
    rankValues: Rank[];
    allStarValues: RarityStars[];
    onUnitChange: (unit: IUnit | undefined) => void;
    onRankChange: (rank: Rank) => void;
    onRarityChange: (rarity: Rarity) => void;
    onStarsChange: (stars: number) => void;
    onActiveAbilityLevelChange: (value: number) => void;
    onPassiveAbilityLevelChange: (value: number) => void;
}

/**
 * Pick a character or MoW and set its rank/rarity/stars/active+passive ability level — used both by
 * the bulk goal creator (as a "target to reach") and the guild roster filter (as a "minimum
 * required"). MoWs have no rank, so the Rank select is hidden and the ability fields relabel to
 * Primary/Secondary for them.
 */
export function UnitThresholdPicker({
    unit,
    options,
    rank,
    rarity,
    stars,
    activeAbilityLevel,
    passiveAbilityLevel,
    rankValues,
    allStarValues,
    onUnitChange,
    onRankChange,
    onRarityChange,
    onStarsChange,
    onActiveAbilityLevelChange,
    onPassiveAbilityLevelChange,
}: UnitThresholdPickerProps) {
    const isMow = !!unit && !('rank' in unit);

    return (
        <div className="flex flex-col gap-3">
            <UnitsAutocomplete
                // eslint-disable-next-line unicorn/no-null -- autocomplete requires null
                unit={unit ?? null}
                options={options}
                onUnitChange={argument => onUnitChange(argument ?? undefined)}
            />
            <div className="flex items-end gap-2">
                <RaritySelect
                    label="Rarity"
                    rarityValues={Object.values(Rarity).filter(r => typeof r === 'number') as Rarity[]}
                    value={rarity}
                    valueChanges={onRarityChange}
                    hideText
                />
                {!isMow && (
                    <RankSelect
                        label="Rank"
                        rankValues={rankValues.filter(r => r <= (rarityToMaxRank[rarity] ?? Rank.Adamantine3))}
                        value={rank}
                        valueChanges={onRankChange}
                        hideText
                    />
                )}
                <StarsSelect
                    label="Stars"
                    starsValues={allStarValues.filter(
                        s =>
                            s >= (rarityToStars[rarity] ?? RarityStars.None) &&
                            s <= (rarityToMaxStars[rarity] ?? RarityStars.MythicWings)
                    )}
                    value={stars}
                    valueChanges={onStarsChange}
                    hideText
                />
            </div>
            <div className="flex gap-2">
                <TextField
                    label={isMow ? 'Primary Ability' : 'Active Ability'}
                    type="number"
                    size="small"
                    fullWidth
                    inputProps={{ min: 1, max: 60 }}
                    value={activeAbilityLevel}
                    onChange={event => onActiveAbilityLevelChange(Number.parseInt(event.target.value) || 1)}
                />
                <TextField
                    label={isMow ? 'Secondary Ability' : 'Passive Ability'}
                    type="number"
                    size="small"
                    fullWidth
                    inputProps={{ min: 1, max: 60 }}
                    value={passiveAbilityLevel}
                    onChange={event => onPassiveAbilityLevelChange(Number.parseInt(event.target.value) || 1)}
                />
            </div>
        </div>
    );
}
