/* eslint-disable import-x/no-internal-modules */
import { ArrowDownward, ArrowForward, ArrowUpward, DeleteForever } from '@mui/icons-material';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { rarityToMaxRank, rarityToMaxStars, rarityToStars } from 'src/models/constants';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RankSelect2, RaritySelect2, StarsSelect } from '@/fsd/5-shared/ui';
import { RankIcon, RarityIcon } from '@/fsd/5-shared/ui/icons';

import { IUnit } from '@/fsd/4-entities/unit';
import { UnitsAutocomplete } from '@/fsd/4-entities/unit/ui/units-autocomplete';

type IncrementalGoalMode = 'milestones' | 'full' | 'macro';

type BulkUnitEntry = {
    unit: IUnit | null;
    rank: Rank;
    rarity: Rarity;
    stars: number;
    activeAbilityLevel: number;
    passiveAbilityLevel: number;
    unlockMow: boolean;
    preFarmLegendaryMythic: boolean;
    useIncrementalGoals: boolean;
    incrementalGoalMode: IncrementalGoalMode;
};

interface Props {
    entry: BulkUnitEntry;
    index: number;
    unitsCount: number;
    options: IUnit[];
    rankValues: Rank[];
    allStarValues: RarityStars[];
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
    onUnitChange: (unit: IUnit | null) => void;
    onUnlockMowChange: (checked: boolean) => void;
    onPreFarmLegendaryMythicChange: (checked: boolean) => void;
    onUseIncrementalGoalsChange: (checked: boolean) => void;
    onIncrementalGoalModeChange: (mode: IncrementalGoalMode) => void;
    onRarityChange: (rarity: Rarity) => void;
    onRankChange: (rank: Rank) => void;
    onStarsChange: (stars: number) => void;
    onActiveAbilityLevelChange: (value: number) => void;
    onPassiveAbilityLevelChange: (value: number) => void;
}

export const BulkGoalCreatorUnitCard = ({
    entry,
    index,
    unitsCount,
    options,
    rankValues,
    allStarValues,
    onMoveUp,
    onMoveDown,
    onDelete,
    onUnitChange,
    onUnlockMowChange,
    onPreFarmLegendaryMythicChange,
    onUseIncrementalGoalsChange,
    onIncrementalGoalModeChange,
    onRarityChange,
    onRankChange,
    onStarsChange,
    onActiveAbilityLevelChange,
    onPassiveAbilityLevelChange,
}: Props) => {
    const showPreFarmOption =
        ((entry.unit === null || 'rank' in entry.unit) && entry.rank >= Rank.Silver2) ||
        (!!entry.unit && !('rank' in entry.unit) && (entry.activeAbilityLevel > 26 || entry.passiveAbilityLevel > 26));

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-gray-300 p-3 dark:border-gray-600">
            <div className="flex items-center justify-end gap-1">
                {index > 0 && (
                    <IconButton size="small" onClick={onMoveUp} aria-label="Increase Unit Priority">
                        <ArrowUpward fontSize="small" />
                    </IconButton>
                )}
                {index < unitsCount - 1 && (
                    <IconButton size="small" onClick={onMoveDown} aria-label="Decrease Unit Priority">
                        <ArrowDownward fontSize="small" />
                    </IconButton>
                )}
                <IconButton size="small" onClick={onDelete} aria-label="Delete Unit Updater">
                    <DeleteForever fontSize="small" />
                </IconButton>
            </div>
            <UnitsAutocomplete unit={entry.unit} options={options} onUnitChange={onUnitChange} />
            {'unlocked' in (entry.unit ?? {}) && !(entry.unit as { unlocked?: boolean }).unlocked && (
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={entry.unlockMow}
                            onChange={event => onUnlockMowChange(event.target.checked)}
                        />
                    }
                    label="Unlock"
                />
            )}
            <div className="flex flex-wrap items-center gap-2">
                {showPreFarmOption ? (
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={entry.preFarmLegendaryMythic}
                                onChange={event => onPreFarmLegendaryMythicChange(event.target.checked)}
                            />
                        }
                        label={
                            <span className="flex items-center gap-1">
                                <span>Pre-farm</span>
                                <RarityIcon rarity={Rarity.Legendary} />
                                <RarityIcon rarity={Rarity.Mythic} />
                            </span>
                        }
                    />
                ) : null}
                <FormControlLabel
                    control={
                        <Checkbox
                            size="small"
                            checked={entry.useIncrementalGoals}
                            onChange={event => onUseIncrementalGoalsChange(event.target.checked)}
                        />
                    }
                    label="Incremental goals"
                />
                {entry.useIncrementalGoals && (
                    <TextField
                        size="small"
                        select
                        label="Incremental Type"
                        value={entry.incrementalGoalMode}
                        onChange={event => onIncrementalGoalModeChange(event.target.value as IncrementalGoalMode)}
                        className="min-w-[200px]">
                        <MenuItem value="milestones">
                            <div className="flex items-center gap-1">
                                <RankIcon rank={Rank.Stone1} size={20} />
                                <ArrowForward fontSize="small" />
                                <RankIcon rank={Rank.Bronze1} size={20} />
                                <ArrowForward fontSize="small" />
                                <RankIcon rank={Rank.Silver1} size={20} />
                                <ArrowForward fontSize="small" />
                                <RankIcon rank={Rank.Gold1} size={20} />
                                <ArrowForward fontSize="small" />
                                <RankIcon rank={Rank.Diamond1} size={20} />
                                <ArrowForward fontSize="small" />
                                <RankIcon rank={Rank.Diamond3} size={20} />
                                <ArrowForward fontSize="small" />
                                <RankIcon rank={Rank.Adamantine3} size={20} />
                            </div>
                        </MenuItem>
                        <MenuItem value="full">
                            <div className="flex items-center gap-1">
                                <RankIcon rank={Rank.Stone1} size={20} />
                                <ArrowForward fontSize="small" />
                                <span>Every Rank</span>
                                <ArrowForward fontSize="small" />
                                <RankIcon rank={Rank.Adamantine3} size={20} />
                            </div>
                        </MenuItem>
                        <MenuItem value="macro">
                            <div className="flex items-center gap-1">
                                <RankIcon rank={Rank.Stone1} size={20} />
                                <ArrowForward fontSize="small" />
                                <RankIcon rank={Rank.Gold1} size={20} />
                                <ArrowForward fontSize="small" />
                                <RankIcon rank={Rank.Diamond3} size={20} />
                                <ArrowForward fontSize="small" />
                                <RankIcon rank={Rank.Adamantine3} size={20} />
                            </div>
                        </MenuItem>
                    </TextField>
                )}
            </div>
            <RaritySelect2
                label="Rarity"
                rarityValues={Object.values(Rarity).filter(r => typeof r === 'number') as Rarity[]}
                value={entry.rarity}
                valueChanges={onRarityChange}
            />
            {(entry.unit === null || 'rank' in entry.unit) && (
                <RankSelect2
                    label="Rank"
                    rankValues={rankValues.filter(r => r <= (rarityToMaxRank[entry.rarity] ?? Rank.Adamantine3))}
                    value={entry.rank}
                    valueChanges={onRankChange}
                />
            )}
            <StarsSelect
                label="Stars"
                starsValues={allStarValues.filter(
                    s =>
                        s >= (rarityToStars[entry.rarity] ?? RarityStars.None) &&
                        s <= (rarityToMaxStars[entry.rarity] ?? RarityStars.MythicWings)
                )}
                value={entry.stars}
                valueChanges={onStarsChange}
            />
            <TextField
                label={entry.unit && !('rank' in entry.unit) ? 'Primary Ability' : 'Active Ability'}
                type="number"
                size="small"
                fullWidth
                inputProps={{ min: 1, max: 60 }}
                value={entry.activeAbilityLevel}
                onChange={event => onActiveAbilityLevelChange(Number.parseInt(event.target.value) || 1)}
            />
            <TextField
                label={entry.unit && !('rank' in entry.unit) ? 'Secondary Ability' : 'Passive Ability'}
                type="number"
                size="small"
                fullWidth
                inputProps={{ min: 1, max: 60 }}
                value={entry.passiveAbilityLevel}
                onChange={event => onPassiveAbilityLevelChange(Number.parseInt(event.target.value) || 1)}
            />
        </div>
    );
};
