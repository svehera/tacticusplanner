import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { enqueueSnackbar } from 'notistack';
import React, { useContext, useMemo, useState } from 'react';

import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { StaticDataService } from 'src/services';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';
import { CampaignsUsageSelect } from 'src/shared-components/goals/campaigns-usage-select';
import { EditAscendGoal } from 'src/shared-components/goals/edit-ascend-goal';
import { NumbersInput } from 'src/shared-components/goals/numbers-input';
import { PrioritySelect } from 'src/shared-components/goals/priority-select';
import { RankGoalSelect } from 'src/shared-components/goals/rank-goal-select';
import { UpgradesRaritySelect } from 'src/shared-components/goals/upgrades-rarity-select';
import { getEnumValues } from 'src/shared-logic/functions';
import { NumberInput } from 'src/v2/components/inputs/number-input';

import { Rank, RarityMapper } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICampaignsProgress } from '@/fsd/4-entities/campaign';
import { RankSelect } from '@/fsd/4-entities/character';
import { IUnit } from '@/fsd/4-entities/unit';
import { isCharacter, isMow } from '@/fsd/4-entities/unit/units.functions';
import { IUpgradeRecipe } from '@/fsd/4-entities/upgrade';

import { CharacterUpgrades } from '@/fsd/3-features/character-details';
import { MowUpgrades } from 'src/v2/features/characters/components/mow-upgrades';
import { MowUpgradesUpdate } from 'src/v2/features/characters/components/mow-upgrades-update';
import { CharacterRaidGoalSelect, ICharacterAscendGoal } from 'src/v2/features/goals/goals.models';

import { IgnoreRankRarity } from './ignore-rank-rarity';

interface Props {
    isOpen: boolean;
    goal: CharacterRaidGoalSelect;
    unit: IUnit;
    onClose?: (goal?: CharacterRaidGoalSelect) => void;
}

export const EditGoalDialog: React.FC<Props> = ({ isOpen, onClose, goal, unit }) => {
    const { goals, campaignsProgress, inventory } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openDialog, setOpenDialog] = React.useState(isOpen);

    const [form, setForm] = useState<CharacterRaidGoalSelect>(goal);
    const [inventoryUpdate, setInventoryUpdate] = useState<Array<IUpgradeRecipe>>([]);
    const handleClose = (updatedGoal?: CharacterRaidGoalSelect | undefined): void => {
        if (updatedGoal) {
            dispatch.goals({ type: 'Update', goal: updatedGoal });

            switch (updatedGoal.type) {
                case PersonalGoalType.Ascend: {
                    dispatch.characters({
                        type: 'UpdateRarity',
                        character: updatedGoal.unitId,
                        value: updatedGoal.rarityStart,
                    });

                    dispatch.characters({
                        type: 'UpdateShards',
                        character: updatedGoal.unitId,
                        value: updatedGoal.shards,
                    });

                    dispatch.characters({
                        type: 'UpdateStars',
                        character: updatedGoal.unitId,
                        value: updatedGoal.starsStart,
                    });
                    break;
                }
                case PersonalGoalType.Unlock: {
                    dispatch.characters({
                        type: 'UpdateShards',
                        character: updatedGoal.unitId,
                        value: updatedGoal.shards,
                    });
                    break;
                }
                case PersonalGoalType.UpgradeRank: {
                    dispatch.characters({
                        type: 'UpdateRank',
                        character: updatedGoal.unitId,
                        value: updatedGoal.rankStart,
                    });
                    dispatch.characters({
                        type: 'UpdateUpgrades',
                        character: updatedGoal.unitId,
                        value: updatedGoal.appliedUpgrades,
                    });
                    break;
                }
                case PersonalGoalType.MowAbilities: {
                    dispatch.mows({
                        type: 'UpdateAbilities',
                        mowId: updatedGoal.unitId,
                        abilities: [updatedGoal.primaryStart, updatedGoal.secondaryStart],
                    });
                    break;
                }

                case PersonalGoalType.CharacterAbilities: {
                    dispatch.characters({
                        type: 'UpdateAbilities',
                        characterId: updatedGoal.unitId,
                        abilities: [updatedGoal.activeStart, updatedGoal.passiveStart],
                    });
                    break;
                }
            }

            if (inventoryUpdate.length) {
                dispatch.inventory({
                    type: 'DecrementUpgradeQuantity',
                    upgrades: inventoryUpdate.map(x => ({ id: x.id, count: x.count })),
                });
            }

            enqueueSnackbar(`Goal for ${updatedGoal.unitName} is updated`, { variant: 'success' });
        }
        setOpenDialog(false);
        if (onClose) {
            onClose(updatedGoal);
        }
    };

    const handleAscendGoalChanges = (key: keyof ICharacterAscendGoal, value: number) => {
        setForm(curr => ({ ...curr, [key]: value }));
    };

    const [ignoreRankRarity, setIgnoreRankRarity] = React.useState(false);

    const maxRank = useMemo(() => {
        return ignoreRankRarity ? Rank.Diamond3 : RarityMapper.toMaxRank[unit?.rarity ?? 0];
    }, [unit?.rarity, ignoreRankRarity]);

    let currentRankValues: number[] = [];
    let targetRankValues: number[] = [];

    if (form.type === PersonalGoalType.UpgradeRank) {
        currentRankValues = getEnumValues(Rank).filter(x => x > 0 && x <= form.rankEnd!);
        targetRankValues = getEnumValues(Rank).filter(x => x > 0 && x >= form.rankStart && x <= maxRank);
    }

    const possibleLocations =
        [PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(form.type) && !!unit
            ? StaticDataService.getItemLocations(unit.id)
            : [];

    const unlockedLocations = possibleLocations
        .filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        })
        .map(x => x.id);

    return (
        <Dialog open={openDialog} onClose={() => handleClose()} fullWidth>
            <DialogTitle className="flex gap3 items-center">
                <span>Edit {PersonalGoalType[goal.type]} Goal</span> <UnitShardIcon icon={goal.unitIcon} />
            </DialogTitle>
            <DialogContent style={{ paddingTop: 20 }}>
                <Box id="edit-goal-form" className="flex flex-col gap-5">
                    <PrioritySelect
                        value={form.priority}
                        maxValue={goals.length}
                        valueChange={value => setForm(curr => ({ ...curr, priority: value }))}
                    />

                    {form.type === PersonalGoalType.UpgradeRank && (
                        <>
                            <div className="flex gap-5">
                                <IgnoreRankRarity value={ignoreRankRarity} onChange={setIgnoreRankRarity} />
                            </div>
                            <div className="flex gap-5">
                                <RankSelect
                                    label={'Current Rank'}
                                    rankValues={currentRankValues}
                                    value={form.rankStart}
                                    valueChanges={value =>
                                        setForm(curr => ({ ...curr, rankStart: value, upgrades: [] }))
                                    }
                                />
                            </div>
                            <div className="flex gap-5">
                                <RankGoalSelect
                                    allowedValues={targetRankValues}
                                    rank={form.rankEnd}
                                    point5={form.rankPoint5}
                                    onChange={(targetRank, rankPoint5) =>
                                        setForm(curr => ({ ...curr, rankEnd: targetRank, rankPoint5 }))
                                    }
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

                            {isCharacter(unit) && form.rankStart > Rank.Locked && (
                                <CharacterUpgrades
                                    character={unit}
                                    upgrades={form.appliedUpgrades}
                                    rank={form.rankStart}
                                    upgradesChanges={(upgrades, updateInventory) => {
                                        setForm({
                                            ...form,
                                            appliedUpgrades: upgrades,
                                        });
                                        setInventoryUpdate(updateInventory);
                                    }}
                                />
                            )}
                        </>
                    )}

                    {form.type === PersonalGoalType.MowAbilities && isMow(unit) && (
                        <>
                            <div className="flex gap-3">
                                <NumberInput
                                    fullWidth
                                    label="Primary current level"
                                    min={unit.primaryAbilityLevel}
                                    value={form.primaryStart}
                                    valueChange={primaryStart => {
                                        setForm(curr => ({
                                            ...curr,
                                            primaryStart,
                                        }));
                                    }}
                                />
                                <NumberInput
                                    fullWidth
                                    label="Primary target level"
                                    min={unit.primaryAbilityLevel}
                                    value={form.primaryEnd}
                                    valueChange={primaryEnd => {
                                        setForm(curr => ({
                                            ...curr,
                                            primaryEnd,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex gap-3">
                                <NumberInput
                                    fullWidth
                                    label="Secondary current level"
                                    min={unit.secondaryAbilityLevel}
                                    value={form.secondaryStart}
                                    valueChange={secondaryStart => {
                                        setForm(curr => ({
                                            ...curr,
                                            secondaryStart,
                                        }));
                                    }}
                                />
                                <NumberInput
                                    fullWidth
                                    label="Secondary target level"
                                    min={unit.secondaryAbilityLevel}
                                    value={form.secondaryEnd}
                                    valueChange={secondaryEnd => {
                                        setForm(curr => ({
                                            ...curr,
                                            secondaryEnd,
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

                            <MowUpgrades
                                mowId={unit.id}
                                alliance={unit.alliance}
                                primaryLevel={form.primaryStart}
                                secondaryLevel={form.secondaryStart}
                            />
                            <MowUpgradesUpdate
                                mowId={unit.id}
                                inventory={inventory.upgrades}
                                currPrimaryLevel={form.primaryStart}
                                currSecondaryLevel={form.secondaryStart}
                                originalPrimaryLevel={unit.primaryAbilityLevel}
                                originalSecondaryLevel={unit.secondaryAbilityLevel}
                                inventoryDecrement={value => {
                                    setInventoryUpdate(Object.entries(value).map(([id, count]) => ({ id, count })));
                                }}
                            />
                        </>
                    )}

                    {form.type === PersonalGoalType.CharacterAbilities && isCharacter(unit) && (
                        <>
                            <div className="flex gap-3">
                                <NumberInput
                                    fullWidth
                                    label="Active current level"
                                    min={unit.activeAbilityLevel}
                                    value={form.activeStart}
                                    valueChange={activeStart => {
                                        setForm(curr => ({
                                            ...curr,
                                            activeStart,
                                        }));
                                    }}
                                />
                                <NumberInput
                                    fullWidth
                                    label="Active target level"
                                    min={unit.activeAbilityLevel}
                                    value={form.activeEnd}
                                    valueChange={activeEnd => {
                                        setForm(curr => ({
                                            ...curr,
                                            activeEnd,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex gap-3">
                                <NumberInput
                                    fullWidth
                                    label="Passive current level"
                                    min={unit.passiveAbilityLevel}
                                    value={form.passiveStart}
                                    valueChange={passiveStart => {
                                        setForm(curr => ({
                                            ...curr,
                                            passiveStart,
                                        }));
                                    }}
                                />
                                <NumberInput
                                    fullWidth
                                    label="Passive target level"
                                    min={unit.passiveAbilityLevel}
                                    value={form.passiveEnd}
                                    valueChange={passiveEnd => {
                                        setForm(curr => ({
                                            ...curr,
                                            passiveEnd,
                                        }));
                                    }}
                                />
                            </div>
                        </>
                    )}

                    {form.type === PersonalGoalType.Unlock && (
                        <>
                            <NumbersInput
                                title="Owned shards"
                                value={form.shards}
                                valueChange={value => setForm(curr => ({ ...curr, shards: value }))}
                            />
                            <div className="flex gap-2 flex-wrap">
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
                        </>
                    )}

                    {form.type === PersonalGoalType.Ascend && (
                        <>
                            <NumbersInput
                                title="Owned shards"
                                value={form.shards}
                                valueChange={value => setForm(curr => ({ ...curr, shards: value }))}
                            />
                            <EditAscendGoal
                                goal={form}
                                possibleLocations={possibleLocations}
                                unlockedLocations={unlockedLocations}
                                onChange={handleAscendGoalChanges}
                            />
                        </>
                    )}

                    <TextField
                        fullWidth
                        id="outlined-textarea"
                        label="Notes"
                        placeholder="Notes"
                        multiline
                        helperText="Optional. Max length 200 characters."
                        value={form.notes}
                        onChange={event => setForm(curr => ({ ...curr, notes: event.target.value.slice(0, 200) }))}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => handleClose()}>Cancel</Button>
                <Button onClick={() => handleClose(form)}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
