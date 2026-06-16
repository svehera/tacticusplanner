import { Info } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { v4 } from 'uuid';

import { goalsLimit, rarityToMaxRank } from 'src/models/constants';
import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
import { ICampaignsProgress, IPersonalGoal, ShardFarmType } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { StaticDataService } from 'src/services';
import { RankGoalSelect } from 'src/shared-components/goals/rank-goal-select';
import { SetAscendGoal } from 'src/shared-components/goals/set-ascend-goal';
import { UpgradesRaritySelect } from 'src/shared-components/goals/upgrades-rarity-select';
import { getEnumValues } from 'src/shared-logic/functions';

import { Rarity, RarityStars, Rank, allianceFromString } from '@/fsd/5-shared/model';
import { AccessibleTooltip, Button, Conditional, PortalDialog } from '@/fsd/5-shared/ui';
import { NumberInput } from '@/fsd/5-shared/ui/input/number-input';
import { Select } from '@/fsd/5-shared/ui/selects';
import { Switch } from '@/fsd/5-shared/ui/switch';

import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
import { MowsService } from '@/fsd/4-entities/mow/mows.service';
import { UnitTitle } from '@/fsd/4-entities/unit/ui/unit-title';
import { UnitsAutocomplete } from '@/fsd/4-entities/unit/ui/units-autocomplete';
import { isCharacter, isMow } from '@/fsd/4-entities/unit/units.functions';
import { IMaterial, UpgradeMaterialAutocomplete, UpgradesService } from '@/fsd/4-entities/upgrade';

import { CharactersAbilitiesService } from '@/fsd/3-features/characters/characters-abilities.service';
import { ICharacter2, IUnit } from '@/fsd/3-features/characters/characters.models';

const GOAL_TYPE_OPTIONS = [
    PersonalGoalType.UpgradeRank,
    PersonalGoalType.Ascend,
    PersonalGoalType.Unlock,
    PersonalGoalType.MowAbilities,
    PersonalGoalType.CharacterAbilities,
    PersonalGoalType.UpgradeMaterial,
];

const GOAL_TYPE_LABELS: Record<number, string> = {
    [PersonalGoalType.UpgradeRank]: 'Upgrade Rank',
    [PersonalGoalType.Ascend]: 'Ascend',
    [PersonalGoalType.Unlock]: 'Unlock',
    [PersonalGoalType.MowAbilities]: 'MoW Abilities',
    [PersonalGoalType.CharacterAbilities]: 'Character Abilities',
    [PersonalGoalType.UpgradeMaterial]: 'Specific Upgrade Material',
};

const getDefaultForm = (priority: number): IPersonalGoal => ({
    id: v4(),
    character: '',
    type: PersonalGoalType.UpgradeRank,
    startingRank: Rank.Stone1,
    startingRankPoint5: false,
    targetRarity: Rarity.Common,
    targetRank: Rank.Stone1,
    targetStars: RarityStars.None,
    campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
    mythicCampaignsUsage: CampaignsLocationsUsage.LeastEnergy,
    priority,
    dailyRaids: true,
    rankPoint5: false,
    upgradesRarity: [],
    upgradeMaterialId: undefined,
    upgradeMaterialQuantity: 0,
});

export const SetGoalDialog = ({ onClose }: { onClose?: (goal?: IPersonalGoal) => void }) => {
    const { characters, mows, goals, campaignsProgress, onslaughtPreferences } = useContext(StoreContext);

    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);

    const allAvailableMaterials = useMemo(
        () =>
            Object.entries(UpgradesService.recipeDataByName)
                .filter(object => !object[1].craftable)
                .map(object => UpgradesService.getUpgradeMaterial(object[0]))
                .filter(x => x !== undefined) as IMaterial[],
        []
    );

    const dispatch = useContext(DispatchContext);

    const [openDialog, setOpenDialog] = React.useState(false);
    const [ignoreRankRarity, setIgnoreRankRarity] = React.useState(false);
    const [unit, setUnit] = React.useState<IUnit>();

    const [form, setForm] = useState<IPersonalGoal>(() => getDefaultForm(goals.length + 1));

    const disableNewGoals = useMemo(() => goals.length === goalsLimit, [goals.length]);
    const triggerReference = useRef<HTMLButtonElement | null>(null);
    const dialogWasOpen = useRef(false);

    useEffect(() => {
        if (dialogWasOpen.current && !openDialog) {
            triggerReference.current?.focus();
        }
        dialogWasOpen.current = openDialog;
    }, [openDialog]);

    const handleClose = (goal?: IPersonalGoal | undefined): void => {
        if (goal) {
            goal.dailyRaids = true;
            dispatch.goals({ type: 'Add', goal });
            if (goal.type == PersonalGoalType.UpgradeMaterial) {
                enqueueSnackbar(
                    `Goal to farm ${goal.upgradeMaterialQuantity}x ${UpgradesService.getUpgradeMaterial(goal.upgradeMaterialId ?? '(none)')?.material} is added`,
                    {
                        variant: 'success',
                    }
                );
            } else {
                const character = characters.find(c => c.snowprintId === goal.character);
                const mow = resolvedMows.find(m => m.snowprintId === goal.character);
                enqueueSnackbar(`Goal for ${character?.shortName ?? mow?.name ?? goal.character} is added`, {
                    variant: 'success',
                });
            }
        }
        setOpenDialog(false);
        setUnit(undefined);
        setForm(getDefaultForm(goal ? goal.priority + 1 : goals.length + 1));
        if (onClose) {
            onClose(goal);
        }
    };

    const handleAscendGoalChanges = (key: keyof IPersonalGoal, value: number | ShardFarmType) => {
        setForm(current => ({ ...current, [key]: value }));
    };

    const maxRank = useMemo(() => {
        return ignoreRankRarity ? Rank.Adamantine2 : rarityToMaxRank[unit?.rarity ?? 0];
    }, [unit?.rarity, ignoreRankRarity]);

    const rankValues = useMemo(() => {
        if (isMow(unit)) {
            return [];
        }

        return getEnumValues(Rank).filter(x => x > 0 && (!unit || x >= unit.rank) && x <= maxRank);
    }, [unit, maxRank]);

    useEffect(() => {
        setForm(current => ({ ...current, targetRank: rankValues[0] }));
    }, [rankValues]);

    const allowedCharacters: IUnit[] = useMemo(() => {
        switch (form.type) {
            case PersonalGoalType.Ascend: {
                return ignoreRankRarity
                    ? [...characters, ...resolvedMows]
                    : [...characters.filter(x => x.rank > Rank.Locked), ...resolvedMows.filter(x => x.unlocked)];
            }
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
    }, [form.type, ignoreRankRarity, resolvedMows, characters]);

    const getAscensionShardsName = (unit: IUnit | undefined): string => {
        if (!unit) return '';
        return 'shards_' + unit.snowprintId;
    };

    const getAscensionMythicShardsName = (unit: IUnit | undefined): string => {
        if (!unit) return '';
        return 'mythicShards_' + unit.snowprintId;
    };

    const possibleLocations =
        [PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(form.type) && !!unit
            ? StaticDataService.getItemLocations(getAscensionShardsName(unit))
            : [];

    const unlockedLocations = possibleLocations
        .filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        })
        .map(x => x.id);

    const possibleMythicLocations =
        [PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(form.type) && !!unit
            ? StaticDataService.getItemLocations(getAscensionMythicShardsName(unit))
            : [];

    const unlockedMythicLocations = possibleMythicLocations
        .filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        })
        .map(x => x.id);

    const handleGoalTypeChange = (newGoalType: PersonalGoalType) => {
        if (
            (newGoalType === PersonalGoalType.Unlock && form.type !== PersonalGoalType.Unlock) ||
            (newGoalType !== PersonalGoalType.Unlock && form.type === PersonalGoalType.Unlock) ||
            (newGoalType === PersonalGoalType.MowAbilities && form.type !== PersonalGoalType.MowAbilities) ||
            (newGoalType !== PersonalGoalType.MowAbilities && form.type === PersonalGoalType.MowAbilities) ||
            newGoalType === PersonalGoalType.UpgradeMaterial
        ) {
            setUnit(undefined);
        }

        setForm(current => ({ ...current, type: newGoalType }));
    };

    // Autocomplete required `null` instead of `undefined`
    const handleUnitChange = (value: IUnit | null) => {
        setUnit(value ?? undefined);

        if (isCharacter(value)) {
            setForm(current => ({
                ...current,
                targetRank: value.rank,
                targetStars: value.stars,
                targetRarity: value.rarity,
                firstAbilityLevel: value.activeAbilityLevel,
                secondAbilityLevel: value.passiveAbilityLevel,
            }));
        }

        if (isMow(value)) {
            setForm(current => ({
                ...current,
                firstAbilityLevel: value.primaryAbilityLevel,
                secondAbilityLevel: value.secondaryAbilityLevel,
            }));
        }
    };

    const isDisabled = () => {
        if (unit === undefined && form.type !== PersonalGoalType.UpgradeMaterial) return true;

        if (form.type === PersonalGoalType.UpgradeRank && isCharacter(unit)) {
            const startingRank = (form.startingRank ?? unit.rank ?? Rank.Stone1) as number;
            const targetRank = (form.targetRank ?? unit.rank ?? Rank.Stone1) as number;
            const startPartial =
                startingRank >= Rank.Diamond3
                    ? (form.startingRankAppliedUpgrades ?? 0) / 6
                    : form.startingRankPoint5
                      ? 0.5
                      : 0;
            const endPartial =
                targetRank >= Rank.Diamond3 ? (form.rankAppliedUpgrades ?? 0) / 6 : form.rankPoint5 ? 0.5 : 0;
            return startingRank + startPartial >= targetRank + endPartial;
        }

        if (form.type === PersonalGoalType.Ascend) {
            if (unit === undefined) return true;
            return unit.rarity === form.targetRarity && unit.stars === form.targetStars;
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

        if (form.type === PersonalGoalType.UpgradeMaterial) {
            return (
                UpgradesService.getUpgradeMaterial(form.upgradeMaterialId ?? '(none)')?.material === undefined ||
                form.upgradeMaterialQuantity === undefined ||
                form.upgradeMaterialQuantity <= 0
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
                        isDisabled={disableNewGoals}
                        ref={triggerReference}
                        onPress={() => setOpenDialog(true)}>
                        Set Goal
                    </Button>
                </span>
            </AccessibleTooltip>

            <PortalDialog open={openDialog} onClose={() => handleClose()} aria-label="Set Goal" size="xl">
                <PortalDialog.Header>
                    <span>Set Goal</span> {!!unit && <UnitTitle character={unit} />}
                </PortalDialog.Header>

                <PortalDialog.Body>
                    <Conditional
                        condition={[
                            PersonalGoalType.UpgradeRank,
                            PersonalGoalType.MowAbilities,
                            PersonalGoalType.CharacterAbilities,
                        ].includes(form.type)}>
                        <div className="flex items-center gap-2">
                            <Switch isSelected={ignoreRankRarity} onChange={setIgnoreRankRarity}>
                                Ignore Unlock/Rarity restrictions
                            </Switch>
                            <AccessibleTooltip title="If you toggle on this switch then you will be able to set goal for a character you have not unlocked or ascended to required rarity yet">
                                <Info className="size-5 text-(--primary)" />
                            </AccessibleTooltip>
                        </div>
                    </Conditional>

                    <div className="flex gap-3">
                        <Select<PersonalGoalType>
                            value={form.type}
                            onChange={handleGoalTypeChange}
                            options={GOAL_TYPE_OPTIONS}
                            renderOption={type => GOAL_TYPE_LABELS[type]}
                            label="Goal Type"
                        />
                        <Select<number>
                            value={form.priority}
                            onChange={priority => setForm(current => ({ ...current, priority }))}
                            options={Array.from({ length: goals.length + 1 }, (_, index) => index + 1)}
                            label="Priority"
                        />
                    </div>

                    <Conditional condition={form.type !== PersonalGoalType.UpgradeMaterial}>
                        <UnitsAutocomplete
                            // eslint-disable-next-line unicorn/no-null -- Autocomplete requires null
                            unit={unit ?? null}
                            options={allowedCharacters}
                            onUnitChange={handleUnitChange}
                        />
                    </Conditional>

                    <Conditional condition={!!unit && form.type === PersonalGoalType.UpgradeRank}>
                        <RankGoalSelect
                            allowedValues={rankValues}
                            startingRank={form.startingRank ?? (unit as ICharacter2).rank ?? Rank.Stone1}
                            startingPoint5={!!form.startingRankPoint5}
                            startingAppliedUpgrades={form.startingRankAppliedUpgrades ?? 0}
                            onStartChange={(startingRank, startingRankPoint5, startingRankAppliedUpgrades) =>
                                setForm(current => ({
                                    ...current,
                                    startingRank,
                                    startingRankPoint5,
                                    startingRankAppliedUpgrades,
                                }))
                            }
                            rank={form.targetRank ?? (unit as ICharacter2).rank ?? Rank.Stone1}
                            point5={!!form.rankPoint5}
                            appliedUpgrades={form.rankAppliedUpgrades ?? 0}
                            onChange={(targetRank, rankPoint5, rankAppliedUpgrades) =>
                                setForm(current => ({
                                    ...current,
                                    targetRank,
                                    rankPoint5,
                                    rankAppliedUpgrades,
                                }))
                            }
                        />
                        <UpgradesRaritySelect
                            upgradesRarity={form.upgradesRarity ?? []}
                            upgradesRarityChange={values => {
                                setForm(current => ({
                                    ...current,
                                    upgradesRarity: values,
                                }));
                            }}
                        />
                        <Switch
                            isSelected={form.manuallyFarmXp ?? false}
                            onChange={manuallyFarmXp => {
                                setForm(current => ({ ...current, manuallyFarmXp }));
                            }}>
                            Manually Farm XP
                        </Switch>
                    </Conditional>

                    {form.type === PersonalGoalType.MowAbilities && isMow(unit) && (
                        <>
                            <div className="flex gap-3">
                                <NumberInput
                                    key={unit.id + 'primary'}
                                    fullWidth
                                    label="Primary target level"
                                    min={unit.primaryAbilityLevel}
                                    max={CharactersAbilitiesService.getMaximumAbilityLevel()}
                                    value={form.firstAbilityLevel!}
                                    valueChange={primaryAbilityLevel => {
                                        setForm(current => ({
                                            ...current,
                                            firstAbilityLevel: primaryAbilityLevel,
                                        }));
                                    }}
                                />
                                <NumberInput
                                    key={unit.id + 'secondary'}
                                    fullWidth
                                    label="Secondary target level"
                                    min={unit.secondaryAbilityLevel}
                                    max={CharactersAbilitiesService.getMaximumAbilityLevel()}
                                    value={form.secondAbilityLevel!}
                                    valueChange={secondaryAbilityLevel => {
                                        setForm(current => ({
                                            ...current,
                                            secondAbilityLevel: secondaryAbilityLevel,
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
                        </>
                    )}

                    {form.type === PersonalGoalType.CharacterAbilities && isCharacter(unit) && (
                        <div className="flex gap-3">
                            <NumberInput
                                key={unit.id + 'primary'}
                                fullWidth
                                label="Active target level"
                                min={unit.activeAbilityLevel}
                                max={CharactersAbilitiesService.getMaximumAbilityLevel()}
                                value={form.firstAbilityLevel!}
                                valueChange={primaryAbilityLevel => {
                                    setForm(current => ({
                                        ...current,
                                        firstAbilityLevel: primaryAbilityLevel,
                                    }));
                                }}
                            />
                            <NumberInput
                                key={unit.id + 'secondary'}
                                fullWidth
                                label="Passive target level"
                                min={unit.passiveAbilityLevel}
                                max={CharactersAbilitiesService.getMaximumAbilityLevel()}
                                value={form.secondAbilityLevel!}
                                valueChange={secondaryAbilityLevel => {
                                    setForm(current => ({
                                        ...current,
                                        secondAbilityLevel: secondaryAbilityLevel,
                                    }));
                                }}
                            />
                        </div>
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
                            possibleMythicLocations={possibleMythicLocations}
                            unlockedMythicLocations={unlockedMythicLocations}
                            mythicCampaignsUsage={form.mythicCampaignsUsage!}
                            farmType={form.shardFarmType ?? 'both'}
                            alliance={isCharacter(unit) || isMow(unit) ? allianceFromString(unit.alliance) : undefined}
                            onslaughtPreferences={onslaughtPreferences}
                            onChange={handleAscendGoalChanges}
                        />
                    )}

                    {form.type === PersonalGoalType.UpgradeMaterial && (
                        <div className="flex flex-col gap-4">
                            <UpgradeMaterialAutocomplete
                                value={UpgradesService.getUpgradeMaterial(form.upgradeMaterialId ?? '(none)')}
                                options={allAvailableMaterials}
                                onChange={material =>
                                    setForm(current => ({
                                        ...current,
                                        upgradeMaterialId: material?.snowprintId,
                                    }))
                                }
                            />
                            <NumberInput
                                fullWidth
                                label="Upgrade Material Quantity"
                                min={0}
                                max={10_000}
                                value={form.upgradeMaterialQuantity ?? 0}
                                valueChange={quantity => {
                                    setForm(current => ({
                                        ...current,
                                        upgradeMaterialQuantity: Math.max(1, quantity),
                                    }));
                                }}
                            />
                            <Conditional
                                condition={!form.upgradeMaterialId || (form.upgradeMaterialQuantity ?? 0) <= 0}>
                                <div className="text-sm text-(--danger)">Please select material and quantity</div>
                            </Conditional>
                        </div>
                    )}

                    <Conditional condition={!!unit && form.type === PersonalGoalType.Unlock}>
                        <div className="flex flex-wrap items-center gap-1">
                            {possibleLocations.map(location => (
                                <CampaignLocation
                                    key={location.id}
                                    location={location}
                                    unlocked={unlockedLocations.includes(location.id)}
                                />
                            ))}
                        </div>
                    </Conditional>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-(--soft-fg)">Notes</label>
                        <textarea
                            className="w-full rounded-lg border border-(--input-border) bg-(--bg) px-3 py-2 text-sm text-(--fg) placeholder:text-(--soft-fg) focus:ring-2 focus:ring-(--ring) focus:outline-none"
                            placeholder="Notes"
                            rows={3}
                            value={form.notes ?? ''}
                            onChange={event =>
                                setForm(current => ({
                                    ...current,
                                    notes: event.target.value.slice(0, 200),
                                }))
                            }
                        />
                        <p className="text-xs text-(--soft-fg)">Optional. Max length 200 characters.</p>
                    </div>
                </PortalDialog.Body>

                <PortalDialog.Footer>
                    <Button intent="secondary" appearance="plain" onPress={() => handleClose()}>
                        Cancel
                    </Button>
                    <Button
                        isDisabled={isDisabled()}
                        onPress={() => handleClose({ ...form, character: unit?.snowprintId ?? '' })}>
                        Set
                    </Button>
                </PortalDialog.Footer>
            </PortalDialog>
        </>
    );
};
