import {
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    MenuItem,
    Select,
    SelectChangeEvent,
    TextField,
} from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import InputLabel from '@mui/material/InputLabel';
import { enqueueSnackbar } from 'notistack';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { v4 } from 'uuid';

import { goalsLimit, rarityToMaxRank } from 'src/models/constants';
import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
import { ICampaignsProgress, IPersonalGoal } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { StaticDataService } from 'src/services';
import { CampaignsUsageSelect } from 'src/shared-components/goals/campaigns-usage-select';
import { PrioritySelect } from 'src/shared-components/goals/priority-select';
import { RankGoalSelect } from 'src/shared-components/goals/rank-goal-select';
import { SetAscendGoal } from 'src/shared-components/goals/set-ascend-goal';
import { UpgradesRaritySelect } from 'src/shared-components/goals/upgrades-rarity-select';
import { getEnumValues } from 'src/shared-logic/functions';

import { Rarity, RarityStars, Rank } from '@/fsd/5-shared/model';
import { AccessibleTooltip, Conditional } from '@/fsd/5-shared/ui';
import { NumberInput } from '@/fsd/5-shared/ui/input/number-input';

import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
import { IMow2 } from '@/fsd/4-entities/mow/@x/unit';
import { MowsService } from '@/fsd/4-entities/mow/mows.service';
import { UnitTitle } from '@/fsd/4-entities/unit/ui/unit-title';
import { UnitsAutocomplete } from '@/fsd/4-entities/unit/ui/units-autocomplete';
import { isCharacter, isMow } from '@/fsd/4-entities/unit/units.functions';

import { IUnit } from 'src/v2/features/characters/characters.models';

import { IgnoreRankRarity } from './ignore-rank-rarity';

const getDefaultForm = (priority: number): IPersonalGoal => ({
    id: v4(),
    character: '',
    type: PersonalGoalType.UpgradeRank,
    targetRarity: Rarity.Common,
    targetRank: Rank.Stone1,
    targetStars: RarityStars.None,
    shardsPerToken: 0,
    campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
    priority,
    dailyRaids: true,
    rankPoint5: false,
    upgradesRarity: [],
});

export const SetGoalDialog = ({ onClose }: { onClose?: (goal?: IPersonalGoal) => void }) => {
    const { characters, mows, goals, campaignsProgress } = useContext(StoreContext);

    const resolvedMows = useMemo(
        () =>
            mows.map(mow => {
                if ('snowprintId' in mow) return mow as IMow2;
                return { ...MowsService.resolveToStatic(mow.tacticusId), ...mow } as IMow2;
            }),
        [mows]
    );

    const dispatch = useContext(DispatchContext);

    const [openDialog, setOpenDialog] = React.useState(false);
    const [ignoreRankRarity, setIgnoreRankRarity] = React.useState(false);
    const [unit, setUnit] = React.useState<IUnit | null>(null);

    const [form, setForm] = useState<IPersonalGoal>(() => getDefaultForm(goals.length + 1));

    const disableNewGoals = useMemo(() => goals.length === goalsLimit, [goals.length]);

    const handleClose = (goal?: IPersonalGoal | undefined): void => {
        if (goal) {
            goal.dailyRaids = [PersonalGoalType.UpgradeRank, PersonalGoalType.MowAbilities].includes(goal.type);
            dispatch.goals({ type: 'Add', goal });
            const character = characters.find(c => c.snowprintId === goal.character);
            enqueueSnackbar(`Goal for ${character?.shortName ?? goal.character} is added`, { variant: 'success' });
        }
        setOpenDialog(false);
        setUnit(null);
        setForm(getDefaultForm(goal ? goal.priority + 1 : goals.length + 1));
        if (onClose) {
            onClose(goal);
        }
    };

    const handleAscendGoalChanges = (key: keyof IPersonalGoal, value: number) => {
        setForm(curr => ({ ...curr, [key]: value }));
    };

    const maxRank = useMemo(() => {
        return ignoreRankRarity ? Rank.Adamantine1 : rarityToMaxRank[unit?.rarity ?? 0];
    }, [unit?.rarity, ignoreRankRarity]);

    const rankValues = useMemo(() => {
        if (isMow(unit)) {
            return [];
        }

        return getEnumValues(Rank).filter(x => x > 0 && (!unit || x >= unit.rank) && x <= maxRank);
    }, [unit, maxRank]);

    useEffect(() => {
        setForm(curr => ({ ...curr, targetRank: rankValues[0] }));
    }, [rankValues]);

    const allowedCharacters: IUnit[] = useMemo(() => {
        switch (form.type) {
            case PersonalGoalType.Ascend:
            case PersonalGoalType.CharacterAbilities:
            case PersonalGoalType.UpgradeRank: {
                return ignoreRankRarity ? characters : characters.filter(x => x.rank > Rank.Locked);
            }
            case PersonalGoalType.Unlock: {
                return characters.filter(x => x.rank === Rank.Locked);
            }
            case PersonalGoalType.MowAbilities: {
                return ignoreRankRarity ? resolvedMows : resolvedMows.filter(x => x.unlocked);
            }
            default: {
                return characters;
            }
        }
    }, [form.type, ignoreRankRarity]);

    const getAscenscionShardsName = (unit: IUnit | null): string => {
        if (!unit) return '';
        return 'shards_' + unit.snowprintId;
    };

    const possibleLocations =
        [PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(form.type) && !!unit
            ? StaticDataService.getItemLocations(getAscenscionShardsName(unit))
            : [];

    const unlockedLocations = possibleLocations
        .filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        })
        .map(x => x.id);

    const handleGoalTypeChange = (event: SelectChangeEvent<number>) => {
        const newGoalType = +event.target.value;

        if (
            (newGoalType === PersonalGoalType.Unlock && form.type !== PersonalGoalType.Unlock) ||
            (newGoalType !== PersonalGoalType.Unlock && form.type === PersonalGoalType.Unlock) ||
            (newGoalType === PersonalGoalType.MowAbilities && form.type !== PersonalGoalType.MowAbilities) ||
            (newGoalType !== PersonalGoalType.MowAbilities && form.type === PersonalGoalType.MowAbilities)
        ) {
            setUnit(null);
        }

        setForm(curr => ({ ...curr, type: newGoalType }));
    };

    const handleUnitChange = (value: IUnit | null) => {
        setUnit(value);

        if (isCharacter(value)) {
            setForm(curr => ({
                ...curr,
                targetRank: value.rank,
                targetStars: value.stars,
                targetRarity: value.rarity,
                firstAbilityLevel: value.activeAbilityLevel,
                secondAbilityLevel: value.passiveAbilityLevel,
            }));
        }

        if (isMow(value)) {
            setForm(curr => ({
                ...curr,
                firstAbilityLevel: value.primaryAbilityLevel,
                secondAbilityLevel: value.secondaryAbilityLevel,
            }));
        }
    };

    const isDisabled = () => {
        if (!unit) {
            return true;
        }

        if (form.type === PersonalGoalType.UpgradeRank && isCharacter(unit)) {
            return unit.rank === form.targetRank && !form.rankPoint5;
        }

        if (form.type === PersonalGoalType.Ascend) {
            return (
                (unit.rarity === form.targetRarity && unit.stars === form.targetStars) ||
                (!unlockedLocations.length && form.shardsPerToken! <= 0)
            );
        }

        if (form.type === PersonalGoalType.MowAbilities && isMow(unit)) {
            return (
                (form.firstAbilityLevel ?? 0) <= unit.primaryAbilityLevel &&
                (form.secondAbilityLevel ?? 0) <= unit.secondaryAbilityLevel
            );
        }

        if (form.type === PersonalGoalType.CharacterAbilities && isCharacter(unit)) {
            return (
                (form.firstAbilityLevel ?? 0) <= unit.activeAbilityLevel &&
                (form.secondAbilityLevel ?? 0) <= unit.passiveAbilityLevel
            );
        }

        return false;
    };

    return (
        <>
            <AccessibleTooltip title={disableNewGoals ? 'You can have only 20 goals at the same time' : ''}>
                <span>
                    <Button
                        size="small"
                        variant={'contained'}
                        disabled={disableNewGoals}
                        onClick={() => setOpenDialog(true)}>
                        Set Goal
                    </Button>
                </span>
            </AccessibleTooltip>

            <Dialog open={openDialog} onClose={() => handleClose()} fullWidth>
                <DialogTitle className="flex-box gap15">
                    <span>Set Goal</span> {!!unit && <UnitTitle character={unit} />}
                </DialogTitle>

                <DialogContent style={{ paddingTop: 10 }}>
                    <Box id="set-goal-form" className="flex flex-col gap-5">
                        <Conditional
                            condition={[
                                PersonalGoalType.UpgradeRank,
                                PersonalGoalType.MowAbilities,
                                PersonalGoalType.CharacterAbilities,
                            ].includes(form.type)}>
                            <IgnoreRankRarity value={ignoreRankRarity} onChange={setIgnoreRankRarity} />
                        </Conditional>

                        <div className="flex gap-3">
                            <FormControl fullWidth>
                                <InputLabel id="goal-type-label">Goal Type</InputLabel>
                                <Select<PersonalGoalType>
                                    id="goal-type"
                                    labelId="goal-type-label"
                                    label="Goal Type"
                                    defaultValue={PersonalGoalType.UpgradeRank}
                                    onChange={handleGoalTypeChange}>
                                    <MenuItem value={PersonalGoalType.UpgradeRank}>Upgrade Rank</MenuItem>
                                    <MenuItem value={PersonalGoalType.Ascend}>Ascend</MenuItem>
                                    <MenuItem value={PersonalGoalType.Unlock}>Unlock</MenuItem>
                                    <MenuItem value={PersonalGoalType.MowAbilities}>MoW Abilities</MenuItem>
                                    <MenuItem value={PersonalGoalType.CharacterAbilities}>Character Abilities</MenuItem>
                                </Select>
                            </FormControl>
                            <PrioritySelect
                                value={form.priority}
                                maxValue={goals.length + 1}
                                valueChange={value => setForm(curr => ({ ...curr, priority: value }))}
                            />
                        </div>

                        <UnitsAutocomplete unit={unit} options={allowedCharacters} onUnitChange={handleUnitChange} />

                        <Conditional condition={!!unit && form.type === PersonalGoalType.UpgradeRank}>
                            <RankGoalSelect
                                allowedValues={rankValues}
                                rank={form.targetRank}
                                point5={!!form.rankPoint5}
                                onChange={(targetRank, rankPoint5) =>
                                    setForm(curr => ({ ...curr, targetRank, rankPoint5 }))
                                }
                            />
                            <UpgradesRaritySelect
                                upgradesRarity={form.upgradesRarity ?? []}
                                upgradesRarityChange={values => {
                                    setForm(curr => ({
                                        ...curr,
                                        upgradesRarity: values,
                                    }));
                                }}
                            />
                        </Conditional>

                        {form.type === PersonalGoalType.MowAbilities && isMow(unit) && (
                            <>
                                <div className="flex gap-3">
                                    <NumberInput
                                        key={unit.id + 'primary'}
                                        fullWidth
                                        label="Primary target level"
                                        min={unit.primaryAbilityLevel}
                                        value={form.firstAbilityLevel!}
                                        valueChange={primaryAbilityLevel => {
                                            setForm(curr => ({
                                                ...curr,
                                                firstAbilityLevel: primaryAbilityLevel,
                                            }));
                                        }}
                                    />
                                    <NumberInput
                                        key={unit.id + 'secondary'}
                                        fullWidth
                                        label="Secondary target level"
                                        min={unit.secondaryAbilityLevel}
                                        value={form.secondAbilityLevel!}
                                        valueChange={secondaryAbilityLevel => {
                                            setForm(curr => ({
                                                ...curr,
                                                secondAbilityLevel: secondaryAbilityLevel,
                                            }));
                                        }}
                                    />
                                </div>
                                <UpgradesRaritySelect
                                    upgradesRarity={form.upgradesRarity ?? []}
                                    upgradesRarityChange={values => {
                                        setForm(curr => ({
                                            ...curr,
                                            upgradesRarity: values,
                                        }));
                                    }}
                                />
                            </>
                        )}

                        {form.type === PersonalGoalType.CharacterAbilities && isCharacter(unit) && (
                            <>
                                <div className="flex gap-3">
                                    <NumberInput
                                        key={unit.id + 'primary'}
                                        fullWidth
                                        label="Active target level"
                                        min={unit.activeAbilityLevel}
                                        value={form.firstAbilityLevel!}
                                        valueChange={primaryAbilityLevel => {
                                            setForm(curr => ({
                                                ...curr,
                                                firstAbilityLevel: primaryAbilityLevel,
                                            }));
                                        }}
                                    />
                                    <NumberInput
                                        key={unit.id + 'secondary'}
                                        fullWidth
                                        label="Passive target level"
                                        min={unit.passiveAbilityLevel}
                                        value={form.secondAbilityLevel!}
                                        valueChange={secondaryAbilityLevel => {
                                            setForm(curr => ({
                                                ...curr,
                                                secondAbilityLevel: secondaryAbilityLevel,
                                            }));
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        {form.type === PersonalGoalType.Ascend && !!unit && (
                            <SetAscendGoal
                                currentRarity={unit.rarity}
                                targetRarity={form.targetRarity!}
                                currentStars={unit.stars}
                                targetStars={form.targetStars!}
                                possibleLocations={possibleLocations}
                                unlockedLocations={unlockedLocations}
                                campaignsUsage={form.campaignsUsage!}
                                shardsPerToken={form.shardsPerToken!}
                                onChange={handleAscendGoalChanges}
                            />
                        )}

                        <Conditional condition={!!unit && form.type === PersonalGoalType.Unlock}>
                            <div className="flex-box gap5 wrap">
                                {possibleLocations.map(location => (
                                    <CampaignLocation
                                        key={location.id}
                                        location={location}
                                        unlocked={unlockedLocations.includes(location.id)}
                                    />
                                ))}
                            </div>
                            <CampaignsUsageSelect
                                allowIgnore={false}
                                disabled={!unlockedLocations.length}
                                value={form.campaignsUsage ?? CampaignsLocationsUsage.LeastEnergy}
                                valueChange={value => setForm(curr => ({ ...curr, campaignsUsage: value }))}
                            />
                        </Conditional>

                        <TextField
                            fullWidth
                            id="outlined-textarea"
                            label="Notes"
                            placeholder="Notes"
                            multiline
                            helperText="Optional. Max length 200 characters."
                            onChange={event =>
                                setForm(curr => ({
                                    ...curr,
                                    notes: event.target.value.slice(0, 200),
                                }))
                            }
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleClose()}>Cancel</Button>
                    <Button
                        disabled={isDisabled()}
                        onClick={() => handleClose({ ...form, character: unit?.snowprintId ?? '' })}>
                        Set
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
