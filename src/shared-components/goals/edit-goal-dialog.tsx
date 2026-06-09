import { enqueueSnackbar } from 'notistack';
import React, { useContext, useMemo, useState } from 'react';

import { PersonalGoalType } from '@/models/enums';
import { ShardFarmType } from '@/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { StaticDataService } from 'src/services';
import { EditAscendGoal } from 'src/shared-components/goals/edit-ascend-goal';
import { NumbersInput } from 'src/shared-components/goals/numbers-input';
import { RankGoalSelect } from 'src/shared-components/goals/rank-goal-select';
import { UpgradesRaritySelect } from 'src/shared-components/goals/upgrades-rarity-select';
import { getEnumValues } from 'src/shared-logic/functions';

import { Alliance, allianceFromString, Rank, RarityMapper } from '@/fsd/5-shared/model';
import { Button, PortalDialog } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { NumberInput } from '@/fsd/5-shared/ui/input/number-input';
import { Select } from '@/fsd/5-shared/ui/selects';

import { ICampaignBattleComposed, ICampaignsProgress } from '@/fsd/4-entities/campaign';
import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
import { MowUpgrades } from '@/fsd/4-entities/mow/mow-upgrades';
import { MowUpgradesUpdate } from '@/fsd/4-entities/mow/mow-upgrades-update';
import { IUnit } from '@/fsd/4-entities/unit';
import { isCharacter, isMow } from '@/fsd/4-entities/unit/units.functions';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { CharactersAbilitiesService } from '@/fsd/3-features/characters/characters-abilities.service';
import { ICharacterAscendGoal, TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';

import { IgnoreRankRarity } from './ignore-rank-rarity';

interface Props {
    isOpen: boolean;
    goal: TypedGoalSelect;
    unit: IUnit | undefined;
    onClose?: (goal?: TypedGoalSelect) => void;
}

export const EditGoalDialog: React.FC<Props> = ({ isOpen, onClose, goal, unit }) => {
    const { goals, campaignsProgress, inventory, onslaughtPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openDialog, setOpenDialog] = React.useState(isOpen);

    const [form, setForm] = useState<TypedGoalSelect>(goal);

    const handleClose = (updatedGoal?: TypedGoalSelect | undefined): void => {
        if (updatedGoal) {
            dispatch.goals({ type: 'Update', goal: updatedGoal });

            if (updatedGoal.type === PersonalGoalType.UpgradeMaterial) {
                const material = UpgradesService.getUpgradeMaterial(updatedGoal.upgradeMaterialId);
                enqueueSnackbar(`Goal for ${material?.material ?? 'unknown material'} was updated`, {
                    variant: 'success',
                });
            } else {
                enqueueSnackbar(`Goal for ${updatedGoal.unitName ?? updatedGoal.unitId} was updated`, {
                    variant: 'success',
                });
            }
        }
        setOpenDialog(false);
        if (onClose) {
            onClose(updatedGoal);
        }
    };

    const handleAscendGoalChanges = (key: keyof ICharacterAscendGoal, value: number | ShardFarmType) => {
        setForm(current => ({ ...current, [key]: value }));
    };

    const [ignoreRankRarity, setIgnoreRankRarity] = React.useState(false);

    const maxRank = useMemo(() => {
        return ignoreRankRarity ? Rank.Adamantine2 : RarityMapper.toMaxRank[unit?.rarity ?? 0];
    }, [unit?.rarity, ignoreRankRarity]);

    let targetRankValues: number[] = [];

    if (form.type === PersonalGoalType.UpgradeRank) {
        const currentRank = isCharacter(unit) ? unit.rank : form.rankStart;
        targetRankValues = getEnumValues(Rank).filter(x => x > 0 && x >= currentRank && x <= maxRank);
    }

    let possibleLocations: ICampaignBattleComposed[] = [];
    // Support for both IDs for characters. Previously we used a short version (i.e. Ragnar, Darkstrider).
    if ([PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(form.type) && !!unit) {
        possibleLocations = StaticDataService.getItemLocations(`shards_${unit.id}`);
        if (possibleLocations.length === 0) {
            possibleLocations = StaticDataService.getItemLocations(`shards_${unit.snowprintId}`);
        }
    }

    let possibleMythicLocations: ICampaignBattleComposed[] = [];
    // Support for both IDs for characters. Previously we used a short version (i.e. Ragnar, Darkstrider).
    if ([PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(form.type) && unit !== undefined) {
        possibleMythicLocations = StaticDataService.getItemLocations(`mythicShards_${unit.id}`);
        if (possibleMythicLocations.length === 0) {
            possibleMythicLocations = StaticDataService.getItemLocations(`mythicShards_${unit.snowprintId}`);
        }
    }

    const unlockedLocations = possibleLocations
        .filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        })
        .map(x => x.id);

    const unlockedMythicLocations = possibleMythicLocations
        .filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        })
        .map(x => x.id);

    const material =
        form.type === PersonalGoalType.UpgradeMaterial
            ? UpgradesService.getUpgradeMaterial(form.upgradeMaterialId)
            : undefined;

    return (
        <PortalDialog open={openDialog} onClose={() => handleClose()} aria-label="Edit goal">
            <PortalDialog.Header>
                <div className="flex items-center gap-2">
                    <span>Edit {PersonalGoalType[goal.type]} Goal</span>
                    {goal.type === PersonalGoalType.UpgradeMaterial ? (
                        <UpgradeImage
                            material={material?.snowprintId ?? ''}
                            iconPath={material?.icon ?? ''}
                            size={40}
                            rarity={RarityMapper.stringToRarityString(material?.rarity ?? '')}
                        />
                    ) : (
                        <UnitShardIcon icon={goal.unitRoundIcon} />
                    )}
                </div>
            </PortalDialog.Header>
            <PortalDialog.Body>
                <div className="flex flex-col gap-5">
                    <div className="min-h-[10px]" />
                    <Select<number>
                        value={form.priority}
                        onChange={priority => setForm(current => ({ ...current, priority }))}
                        options={Array.from({ length: goals.length }, (_, index) => index + 1)}
                        label="Priority"
                    />

                    {form.type === PersonalGoalType.UpgradeRank && (
                        <>
                            <div className="flex gap-5">
                                <IgnoreRankRarity value={ignoreRankRarity} onChange={setIgnoreRankRarity} />
                            </div>
                            <div className="flex gap-5">
                                <RankGoalSelect
                                    allowedValues={targetRankValues}
                                    startingRank={form.rankStart}
                                    startingPoint5={form.rankStartPoint5}
                                    startingAppliedUpgrades={form.rankStartAppliedUpgrades ?? 0}
                                    onStartChange={(startRank, startRankPoint5, startingRankAppliedUpgrades) =>
                                        setForm(current => ({
                                            ...current,
                                            rankStart: startRank,
                                            rankStartPoint5: startRankPoint5,
                                            rankStartAppliedUpgrades: startingRankAppliedUpgrades,
                                        }))
                                    }
                                    rank={form.rankEnd}
                                    point5={form.rankPoint5}
                                    appliedUpgrades={form.rankAppliedUpgrades ?? 0}
                                    onChange={(targetRank, rankPoint5, rankAppliedUpgrades) =>
                                        setForm(current => ({
                                            ...current,
                                            rankEnd: targetRank,
                                            rankPoint5,
                                            rankAppliedUpgrades,
                                        }))
                                    }
                                />
                            </div>
                            <UpgradesRaritySelect
                                upgradesRarity={form.upgradesRarity ?? []}
                                upgradesRarityChange={values => {
                                    setForm(current => ({
                                        ...current,
                                        upgradesRarity: values,
                                    }));
                                }}
                            />

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.manuallyFarmXp ?? false}
                                    onChange={event => {
                                        setForm(current => ({ ...current, manuallyFarmXp: event.target.checked }));
                                    }}
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">Manually Farm XP</span>
                            </label>
                        </>
                    )}

                    {form.type === PersonalGoalType.MowAbilities && isMow(unit) && (
                        <>
                            <div className="flex gap-3">
                                <NumberInput
                                    fullWidth
                                    label="Primary current level"
                                    min={unit.primaryAbilityLevel}
                                    max={CharactersAbilitiesService.getMaximumAbilityLevel()}
                                    value={form.primaryStart}
                                    valueChange={primaryStart => {
                                        setForm(current => ({
                                            ...current,
                                            primaryStart,
                                        }));
                                    }}
                                />
                                <NumberInput
                                    fullWidth
                                    label="Primary target level"
                                    min={unit.primaryAbilityLevel}
                                    max={CharactersAbilitiesService.getMaximumAbilityLevel()}
                                    value={form.primaryEnd}
                                    valueChange={primaryEnd => {
                                        setForm(current => ({
                                            ...current,
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
                                    max={CharactersAbilitiesService.getMaximumAbilityLevel()}
                                    value={form.secondaryStart}
                                    valueChange={secondaryStart => {
                                        setForm(current => ({
                                            ...current,
                                            secondaryStart,
                                        }));
                                    }}
                                />
                                <NumberInput
                                    fullWidth
                                    label="Secondary target level"
                                    min={unit.secondaryAbilityLevel}
                                    max={CharactersAbilitiesService.getMaximumAbilityLevel()}
                                    value={form.secondaryEnd}
                                    valueChange={secondaryEnd => {
                                        setForm(current => ({
                                            ...current,
                                            secondaryEnd,
                                        }));
                                    }}
                                />
                            </div>

                            <UpgradesRaritySelect
                                upgradesRarity={form.upgradesRarity ?? []}
                                upgradesRarityChange={values => {
                                    setForm(current => ({
                                        ...current,
                                        upgradesRarity: values,
                                    }));
                                }}
                            />

                            <MowUpgrades
                                mowId={unit.id}
                                alliance={unit.alliance as Alliance}
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
                                inventoryDecrement={() => {}}
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
                                        setForm(current => ({
                                            ...current,
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
                                        setForm(current => ({
                                            ...current,
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
                                        setForm(current => ({
                                            ...current,
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
                                        setForm(current => ({
                                            ...current,
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
                                valueChange={value => setForm(current => ({ ...current, shards: value }))}
                            />
                            <div className="flex flex-wrap gap-2">
                                {possibleLocations.map(location => (
                                    <CampaignLocation
                                        key={location.id}
                                        location={location}
                                        unlocked={unlockedLocations.includes(location.id)}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {form.type === PersonalGoalType.Ascend && (
                        <>
                            <EditAscendGoal
                                goal={form}
                                possibleLocations={possibleLocations}
                                possibleMythicLocations={possibleMythicLocations}
                                unlockedLocations={unlockedLocations}
                                unlockedMythicLocations={unlockedMythicLocations}
                                farmType={form.farmType ?? 'both'}
                                alliance={
                                    isCharacter(unit) || isMow(unit) ? allianceFromString(unit.alliance) : undefined
                                }
                                onslaughtPreferences={onslaughtPreferences}
                                onChange={handleAscendGoalChanges}
                            />
                        </>
                    )}

                    {form.type === PersonalGoalType.UpgradeMaterial && (
                        <NumberInput
                            fullWidth
                            label="Upgrade Material Quantity"
                            min={0}
                            max={10_000}
                            value={form.quantity ?? 0}
                            valueChange={quantity => {
                                setForm(current => ({
                                    ...current,
                                    quantity: Math.max(1, quantity),
                                }));
                            }}
                        />
                    )}

                    <div className="flex flex-col gap-y-1">
                        <label className="mb-1 block text-sm font-medium text-(--soft-fg)">Notes</label>
                        <textarea
                            id="notes-textarea"
                            placeholder="Notes"
                            rows={3}
                            maxLength={200}
                            value={form.notes ?? ''}
                            onChange={event =>
                                setForm(current => ({ ...current, notes: event.target.value.slice(0, 200) }))
                            }
                            className="w-full resize-y rounded-lg border border-(--border) bg-(--neutral) px-2.5 py-2 text-sm text-(--fg) outline-none placeholder:text-(--soft-fg) focus:ring-2 focus:ring-(--ring)"
                        />
                        <span className="text-xs text-(--soft-fg)">Optional. Max length 200 characters.</span>
                    </div>
                </div>
            </PortalDialog.Body>
            <PortalDialog.Footer>
                <Button appearance="outline" onPress={() => handleClose()}>
                    Cancel
                </Button>
                <Button intent="success" onPress={() => handleClose(form)}>
                    Save
                </Button>
            </PortalDialog.Footer>
        </PortalDialog>
    );
};
