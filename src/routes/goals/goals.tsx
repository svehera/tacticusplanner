import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GridViewIcon from '@mui/icons-material/GridView';
import LinkIcon from '@mui/icons-material/Link';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Accordion, AccordionDetails, AccordionSummary, FormControlLabel, Switch } from '@mui/material';
import Button from '@mui/material/Button';
import { cloneDeep, orderBy, sum } from 'lodash';
import { useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { goalsLimit, rankToLevel } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { GoalCard } from 'src/routes/goals/goal-card';
import { GoalsTable } from 'src/routes/goals/goals-table';
import { EditGoalDialog } from 'src/shared-components/goals/edit-goal-dialog';
import { SetGoalDialog } from 'src/shared-components/goals/set-goal-dialog';

import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { Alliance, Rank, Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { ForgeBadgesTotal, MoWComponentsTotal, XpBooksTotal } from '@/fsd/5-shared/ui/icons/assets';

import { MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { BadgesTotal } from '@/v2/features/characters/components/badges-total';
import { CharactersAbilitiesService } from 'src/v2/features/characters/characters-abilities.service';
import { CharactersXpService } from 'src/v2/features/characters/characters-xp.service';
import { CharacterRaidGoalSelect, IGoalEstimate } from 'src/v2/features/goals/goals.models';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

import { MowLookupService } from '@/fsd/1-pages/learn-mow/mow-lookup.service';

import { GoalService } from './goal-service';

interface RevisedGoals {
    goalEstimates: IGoalEstimate[];
    neededBadges: Record<Alliance, Record<Rarity, number>>;
    neededForgeBadges: Record<Rarity, number>;
    neededComponents: Record<Alliance, number>;
    neededXp: number;
}

export const Goals = () => {
    const {
        goals,
        characters,
        mows,
        campaignsProgress,
        dailyRaidsPreferences,
        inventory,
        dailyRaids,
        viewPreferences,
    } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [editGoal, setEditGoal] = useState<CharacterRaidGoalSelect | null>(null);
    const [editUnit, setEditUnit] = useState<IUnit>(characters[0]);

    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);

    const { allGoals, shardsGoals, upgradeRankOrMowGoals, upgradeAbilities } = useMemo(() => {
        return GoalsService.prepareGoals(goals, [...characters, ...resolvedMows], false);
    }, [goals, characters, resolvedMows]);

    const estimatedShardsTotal = useMemo(() => {
        return ShardsService.getShardsEstimatedDays(
            {
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                raidedLocations: [],
            },
            ...shardsGoals
        );
    }, [shardsGoals]);

    const estimatedUpgradesTotal = useMemo(() => {
        return UpgradesService.getUpgradesEstimatedDays(
            {
                dailyEnergy:
                    dailyRaidsPreferences.dailyEnergy -
                    Math.min(estimatedShardsTotal.energyPerDay + dailyRaidsPreferences.shardsEnergy, 90),
                campaignsProgress: campaignsProgress,
                preferences: { ...dailyRaidsPreferences, farmByPriorityOrder: true },
                upgrades: inventory.upgrades,
                completedLocations: [],
            },
            ...upgradeRankOrMowGoals
        );
    }, [upgradeRankOrMowGoals, estimatedShardsTotal.energyPerDay]);

    const removeGoal = (goalId: string): void => {
        dispatch.goals({ type: 'Delete', goalId });
    };

    const updateView = (tableView: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'goalsTableView', value: tableView });
    };

    const updateBattlePassColorCoding = (colorCoding: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'goalsBattlePassSeasonView', value: colorCoding });
    };

    const handleMenuItemSelect = (goalId: string, item: 'edit' | 'delete') => {
        if (item === 'delete') {
            if (confirm('Are you sure? The goal will be permanently deleted!')) {
                removeGoal(goalId);
            }
        }

        if (item === 'edit') {
            const goal = allGoals.find(x => x.goalId === goalId);
            const relatedUnit = [...characters, ...resolvedMows].find(
                // August 2025: we're transitioning between IDs for characters. Previously be used a short version
                // of the character's name (i.e. Ragnar, Darkstrider). Now we're moving to IDs from snowprints internal data (datamined).
                // During this transition, it's possibly for legacy goals to have legacy IDs, which are then overwritten with
                // Snowprint IDs. For this reason, we cater to both IDs for lookup here, with the expectation we can consolidate
                // on snowprintIDs down the track.
                x => x.snowprintId === goal?.unitId || x.id === goal?.unitId
            );
            if (relatedUnit && goal) {
                setEditUnit(relatedUnit);
                setEditGoal(goal);
            }
        }
    };

    const goalsEstimate = useMemo<IGoalEstimate[]>(() => {
        const result: IGoalEstimate[] = [];

        if (shardsGoals.length) {
            const shardsEstimate = ShardsService.getShardsEstimatedDays(
                {
                    campaignsProgress: campaignsProgress,
                    preferences: dailyRaidsPreferences,
                    raidedLocations: dailyRaids.raidedLocations ?? [],
                },
                ...shardsGoals
            );

            const goalsEstimate = shardsEstimate.materials.map(
                x =>
                    ({
                        goalId: x.goalId,
                        energyTotal: x.energyTotal,
                        daysTotal: x.daysTotal,
                        oTokensTotal: x.onslaughtTokensTotal,
                        daysLeft: x.daysTotal,
                    }) as IGoalEstimate
            );

            result.push(...goalsEstimate);
        }

        if (upgradeRankOrMowGoals.length) {
            const goalsEstimate = upgradeRankOrMowGoals.map(goal => {
                const goalEstimate = estimatedUpgradesTotal.byCharactersPriority.find(x => x.goalId === goal.goalId);
                const firstFarmDay = estimatedUpgradesTotal.upgradesRaids.findIndex(x => {
                    const relatedGoals = x.raids.flatMap(raid => raid.relatedGoals);
                    return relatedGoals.includes(goal.goalId);
                });

                const daysTotal = estimatedUpgradesTotal.upgradesRaids.filter(x => {
                    const relatedGoals = x.raids.flatMap(raid => raid.relatedGoals);
                    return relatedGoals.includes(goal.goalId);
                }).length;

                if (goal.type === PersonalGoalType.UpgradeRank) {
                    const targetLevel = rankToLevel[(goal.rankEnd ?? Rank.Stone2) as Rank];
                    const xpEstimate = CharactersXpService.getLegendaryTomesCount(goal.level, goal.xp, targetLevel);

                    return {
                        goalId: goal.goalId,
                        energyTotal: sum(goalEstimate?.upgrades.map(x => x.energyTotal) ?? []),
                        daysTotal: daysTotal,
                        daysLeft: firstFarmDay + daysTotal,
                        oTokensTotal: 0,
                        xpEstimate,
                    } as IGoalEstimate;
                } else {
                    const mowMaterials = MowsService.getMaterialsList(goal.unitId, goal.unitName, goal.unitAlliance);

                    const primaryAbility = mowMaterials.slice(goal.primaryStart - 1, goal.primaryEnd - 1);
                    const secondaryAbility = mowMaterials.slice(goal.secondaryStart - 1, goal.secondaryEnd - 1);

                    const mowEstimate = MowLookupService.getTotals([...primaryAbility, ...secondaryAbility]);

                    return {
                        goalId: goal.goalId,
                        energyTotal: sum(goalEstimate?.upgrades.map(x => x.energyTotal) ?? []),
                        daysTotal: daysTotal,
                        daysLeft: firstFarmDay + daysTotal,
                        oTokensTotal: 0,
                        mowEstimate,
                    } as IGoalEstimate;
                }
            });

            result.push(...goalsEstimate);
        }

        if (upgradeAbilities.length) {
            for (const goal of upgradeAbilities) {
                const targetLevel = Math.max(goal.activeEnd, goal.passiveEnd);
                const xpEstimate = CharactersXpService.getLegendaryTomesCount(goal.level, goal.xp, targetLevel);
                const activeAbility = CharactersAbilitiesService.getMaterials(goal.activeStart, goal.activeEnd);
                const passiveAbility = CharactersAbilitiesService.getMaterials(goal.passiveStart, goal.passiveEnd);

                const abilitiesEstimate = CharactersAbilitiesService.getTotals(
                    [...activeAbility, ...passiveAbility],
                    goal.unitAlliance
                );

                result.push({
                    goalId: goal.goalId,
                    abilitiesEstimate,
                    xpEstimateAbilities: xpEstimate!,
                } as IGoalEstimate);
            }
        }

        return result;
    }, [shardsGoals, upgradeRankOrMowGoals]);

    const totalXpAbilities = sum(
        goalsEstimate.filter(x => !!x.xpEstimateAbilities).map(x => x.xpEstimateAbilities!.legendaryBooks)
    );

    const totalGoldAbilities = sum(
        goalsEstimate.map(x => (x.abilitiesEstimate?.gold ?? 0) + (x.xpEstimateAbilities?.gold ?? 0))
    );

    const colorCodingTooltipText =
        'When enabled, goals to be completed a week before the end of the current battle pass season will ' +
        'be shown with a green background. Goals completed at least a week before the end of the next battle ' +
        'pass season will be shown with a yellow background. And goals completed at least a week before the ' +
        'end of the following battle pass season will be shown in red. Goals to be completed during the final ' +
        'week of a battle pass season ending will have a background between the colors representing the ' +
        'respective battle pass seasons.';

    /**
     * This computes the total number of remaining ability badges needed AND adjusts all goals to use as
     * many possible badges from our existing inventory.
     */
    const adjustedGoalsEstimates = useMemo((): RevisedGoals => {
        const createRarityRecord = (): Record<Rarity, number> => ({
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 0,
            [Rarity.Rare]: 0,
            [Rarity.Epic]: 0,
            [Rarity.Legendary]: 0,
            [Rarity.Mythic]: 0,
        });

        const heldBooks = { ...inventory.xpBooks };

        const neededBadges: Record<Alliance, Record<Rarity, number>> = {
            [Alliance.Chaos]: createRarityRecord(),
            [Alliance.Imperial]: createRarityRecord(),
            [Alliance.Xenos]: createRarityRecord(),
        };

        const neededForgeBadges: Record<Rarity, number> = createRarityRecord();
        const neededComponents: Record<Alliance, number> = {
            [Alliance.Chaos]: 0,
            [Alliance.Imperial]: 0,
            [Alliance.Xenos]: 0,
        };
        const heldBadges: Record<Alliance, Record<Rarity, number>> = {
            [Alliance.Chaos]: createRarityRecord(),
            [Alliance.Imperial]: createRarityRecord(),
            [Alliance.Xenos]: createRarityRecord(),
        };
        Object.entries(inventory.abilityBadges[Alliance.Imperial] ?? []).forEach(([rarity, count]) => {
            heldBadges[Alliance.Imperial][RarityMapper.stringToRarity(rarity) ?? Rarity.Common] = count;
        });
        Object.entries(inventory.abilityBadges[Alliance.Xenos] ?? []).forEach(([rarity, count]) => {
            heldBadges[Alliance.Xenos][RarityMapper.stringToRarity(rarity) ?? Rarity.Common] = count;
        });
        Object.entries(inventory.abilityBadges[Alliance.Chaos] ?? []).forEach(([rarity, count]) => {
            heldBadges[Alliance.Chaos][RarityMapper.stringToRarity(rarity) ?? Rarity.Common] = count;
        });

        const heldForgeBadges: Record<number, number> = createRarityRecord();
        Object.entries(inventory.forgeBadges ?? []).forEach(([rarity, count]) => {
            heldForgeBadges[Number(rarity)] = count;
        });

        const heldComponents: Record<Alliance, number> = {
            [Alliance.Chaos]: 0,
            [Alliance.Imperial]: 0,
            [Alliance.Xenos]: 0,
        };
        Object.entries(inventory.components ?? []).forEach(([alliance, count]) => {
            heldComponents[alliance as Alliance] = count;
        });

        const newGoalsEstimates: IGoalEstimate[] = cloneDeep(goalsEstimate);
        const goalsByPrio = orderBy(
            goals.map(x => ({ id: x.id, priority: x.priority })),
            ['priority'],
            ['asc']
        );
        let totalXpNeeded = 0;
        for (const goalIdAndPriority of goalsByPrio) {
            const goal = newGoalsEstimates.find(x => x.goalId === goalIdAndPriority.id);

            if (goal === undefined) {
                console.error('could not find goal estimate for goal id ' + goalIdAndPriority.id);
                continue;
            }
            if (goal.xpEstimate || goal.xpEstimateAbilities) {
                console.log(goal);
                let xpNeeded = goal.xpEstimate?.xpLeft ?? goal.xpEstimateAbilities?.xpLeft ?? 0;
                while (xpNeeded >= 62500 && heldBooks[Rarity.Mythic] > 0) {
                    xpNeeded -= 62500;
                    heldBooks[Rarity.Mythic] -= 1;
                }
                while (xpNeeded >= 12500 && heldBooks[Rarity.Legendary] > 0) {
                    xpNeeded -= 12500;
                    heldBooks[Rarity.Legendary] -= 1;
                }
                while (xpNeeded >= 2500 && heldBooks[Rarity.Epic] > 0) {
                    xpNeeded -= 2500;
                    heldBooks[Rarity.Epic] -= 1;
                }
                while (xpNeeded >= 500 && heldBooks[Rarity.Rare] > 0) {
                    xpNeeded -= 500;
                    heldBooks[Rarity.Rare] -= 1;
                }
                while (xpNeeded >= 100 && heldBooks[Rarity.Uncommon] > 0) {
                    xpNeeded -= 100;
                    heldBooks[Rarity.Uncommon] -= 1;
                }
                while (xpNeeded >= 20 && heldBooks[Rarity.Common] > 0) {
                    xpNeeded -= 20;
                    heldBooks[Rarity.Common] -= 1;
                }
                console.log('xpNeeded: ' + xpNeeded);
                totalXpNeeded += xpNeeded;
                goal.xpBooksTotal = Math.floor(xpNeeded / 12500);
                if (goal.xpEstimate) {
                    goal.xpEstimate.legendaryBooks = Math.floor(xpNeeded / 12500);
                    goal.xpEstimate.xpLeft = xpNeeded;
                } else {
                    goal.xpEstimateAbilities!.legendaryBooks = Math.floor(xpNeeded / 12500);
                    goal.xpEstimateAbilities!.xpLeft = xpNeeded;
                }
            }

            if (goal.abilitiesEstimate === undefined && goal.mowEstimate === undefined) continue;
            const badges = goal.mowEstimate?.badges ?? goal.abilitiesEstimate!.badges;
            for (const [rarityStr, count] of Object.entries(badges)) {
                const rarity = Number(rarityStr) as Rarity;
                const alliance =
                    goal.abilitiesEstimate?.alliance ??
                    GoalsService.getGoalAlliance(goal.goalId, upgradeRankOrMowGoals)!;
                if (!neededBadges[alliance][rarity]) {
                    neededBadges[alliance][rarity] = 0;
                }
                if (heldBadges[alliance][rarity]) {
                    const toRemove = Math.min(heldBadges[alliance][rarity], count);
                    heldBadges[alliance][rarity] -= toRemove;
                    neededBadges[alliance][rarity] += count - toRemove;
                    badges[rarity] = count - toRemove;
                } else {
                    neededBadges[alliance][rarity] += count;
                }
            }
            if (goal.mowEstimate === undefined) continue;
            const forgeBadges = goal.mowEstimate.forgeBadges;
            forgeBadges.entries().forEach(([rarity, count]) => {
                const toRemove = Math.min(count, heldForgeBadges[rarity] ?? 0);
                goal.mowEstimate!.forgeBadges.set(rarity, count - toRemove);
                heldForgeBadges[rarity] = (heldForgeBadges[rarity] ?? 0) - toRemove;
                neededForgeBadges[rarity] = goal.mowEstimate!.forgeBadges.get(rarity) ?? 0;
            });
            const components = goal.mowEstimate.components;
            const alliance = GoalsService.getGoalAlliance(goal.goalId, upgradeRankOrMowGoals)!;
            const held = heldComponents[alliance] ?? 0;
            const toRemove = Math.min(components, held);
            goal.mowEstimate!.components = components - toRemove;
            heldComponents[alliance] -= toRemove;
            neededComponents[alliance] = (neededComponents[alliance] ?? 0) + goal.mowEstimate!.components;
        }

        return {
            neededBadges,
            neededForgeBadges,
            neededComponents,
            goalEstimates: newGoalsEstimates,
            neededXp: totalXpNeeded,
        };
    }, [goals, goalsEstimate, inventory]);

    return (
        <div>
            <div className="flex gap-5 flex-wrap items-center">
                <Button
                    size="small"
                    variant={'contained'}
                    component={Link}
                    to={isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids'}>
                    <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Raids</span>
                </Button>
                <SetGoalDialog key={goals.length} />
                <span style={{ fontSize: 20 }}>
                    {goals.length}/{goalsLimit}
                </span>
                <FormControlLabel
                    control={
                        <Switch
                            checked={viewPreferences.goalsTableView}
                            onChange={event => updateView(event.target.checked)}
                        />
                    }
                    label={
                        <div className="flex-box gap5">
                            {viewPreferences.goalsTableView ? (
                                <TableRowsIcon color="primary" />
                            ) : (
                                <GridViewIcon color="primary" />
                            )}{' '}
                            view
                        </div>
                    }
                />
                <AccessibleTooltip title={colorCodingTooltipText}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={viewPreferences.goalsBattlePassSeasonView}
                                onChange={event => updateBattlePassColorCoding(event.target.checked)}
                            />
                        }
                        label={
                            <div className="flex-box gap5">
                                <span>Color Coding</span>
                            </div>
                        }
                    />
                </AccessibleTooltip>
            </div>
            <div style={{ width: '350px' }} className="my-2 flex-box gap20">
                <Accordion defaultExpanded={false}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <span>Total Resources Missing</span>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div className="my-2 gap20">
                            <div className="flex flex-wrap items-center gap20 my-2">
                                <MiscIcon icon={'energy'} height={35} width={35} />{' '}
                                <b>{estimatedUpgradesTotal.energyTotal}</b>
                            </div>
                            <div>
                                <XpBooksTotal xp={adjustedGoalsEstimates.neededXp} size={'medium'} />
                            </div>
                            <div>
                                {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                                    <div key={alliance} className="my-2 flex-box gap20">
                                        <BadgesTotal
                                            badges={adjustedGoalsEstimates.neededBadges[alliance]}
                                            alliance={alliance}
                                            size={'medium'}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="my-2 gap20">
                                <ForgeBadgesTotal badges={adjustedGoalsEstimates.neededForgeBadges} size={'medium'} />
                            </div>
                            <div className="my-2 gap20">
                                <MoWComponentsTotal
                                    components={adjustedGoalsEstimates.neededComponents}
                                    size={'medium'}
                                />
                            </div>
                        </div>
                    </AccordionDetails>
                </Accordion>
            </div>

            {!!upgradeRankOrMowGoals.length && (
                <div>
                    <div className="flex gap5 flex-wrap items-center" style={{ fontSize: 20, margin: '20px 0' }}>
                        <span>
                            Upgrade rank/MoW (<b>{estimatedUpgradesTotal.upgradesRaids.length}</b> Days |
                        </span>
                        <span>
                            <b>{estimatedUpgradesTotal.energyTotal}</b>{' '}
                            <MiscIcon icon={'energy'} height={15} width={15} /> |
                        </span>
                        <span>
                            <b>{Math.ceil(adjustedGoalsEstimates.neededXp / 12500)}</b> XP Books)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex gap-3 flex-wrap">
                            {upgradeRankOrMowGoals.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={adjustedGoalsEstimates.goalEstimates.find(
                                        x => x.goalId === goal.goalId
                                    )}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    bgColor={GoalService.getBackgroundColor(
                                        viewPreferences.goalsBattlePassSeasonView ?? false,
                                        adjustedGoalsEstimates.goalEstimates.find(x => x.goalId === goal.goalId)
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={upgradeRankOrMowGoals}
                            estimate={adjustedGoalsEstimates.goalEstimates}
                            menuItemSelect={handleMenuItemSelect}
                            goalsColorCoding={viewPreferences.goalsBattlePassSeasonView ?? false}
                        />
                    )}
                </div>
            )}

            {!!shardsGoals.length && (
                <div>
                    <div className="flex-box gap5 wrap" style={{ fontSize: 20, margin: '20px 0' }}>
                        <span>
                            Ascend/Promote/Unlock (<b>{estimatedShardsTotal.daysTotal}</b> Days |
                        </span>
                        <span>
                            <b>{estimatedShardsTotal.energyTotal}</b>{' '}
                            <MiscIcon icon={'energy'} height={15} width={15} /> |
                        </span>
                        <span>
                            <b>{estimatedShardsTotal.onslaughtTokens}</b> Tokens)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex gap-3 flex-wrap">
                            {shardsGoals.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={adjustedGoalsEstimates.goalEstimates.find(
                                        x => x.goalId === goal.goalId
                                    )}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    bgColor={GoalService.getBackgroundColor(
                                        viewPreferences.goalsBattlePassSeasonView ?? false,
                                        adjustedGoalsEstimates.goalEstimates.find(x => x.goalId === goal.goalId)
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={shardsGoals}
                            estimate={adjustedGoalsEstimates.goalEstimates}
                            menuItemSelect={handleMenuItemSelect}
                            goalsColorCoding={viewPreferences.goalsBattlePassSeasonView ?? false}
                        />
                    )}
                </div>
            )}

            {!!upgradeAbilities.length && (
                <div>
                    <div className="flex-box gap5 wrap" style={{ fontSize: 20, margin: '20px 0' }}>
                        <span>
                            Character Abilities (<b>{numberToThousandsString(totalGoldAbilities)}</b> Gold |
                        </span>
                        <span>
                            <b>{totalXpAbilities}</b> XP Books)
                        </span>
                    </div>
                    {!viewPreferences.goalsTableView && (
                        <div className="flex gap-3 flex-wrap">
                            {upgradeAbilities.map(goal => (
                                <GoalCard
                                    key={goal.goalId}
                                    goal={goal}
                                    goalEstimate={adjustedGoalsEstimates.goalEstimates.find(
                                        x => x.goalId === goal.goalId
                                    )}
                                    menuItemSelect={item => handleMenuItemSelect(goal.goalId, item)}
                                    bgColor={GoalService.getBackgroundColor(
                                        viewPreferences.goalsBattlePassSeasonView ?? false,
                                        adjustedGoalsEstimates.goalEstimates.find(x => x.goalId === goal.goalId)
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {viewPreferences.goalsTableView && (
                        <GoalsTable
                            rows={upgradeAbilities}
                            estimate={adjustedGoalsEstimates.goalEstimates}
                            menuItemSelect={handleMenuItemSelect}
                            goalsColorCoding={viewPreferences.goalsBattlePassSeasonView ?? false}
                        />
                    )}
                </div>
            )}

            {!!editGoal && !!editUnit && (
                <EditGoalDialog
                    isOpen={true}
                    goal={editGoal}
                    unit={editUnit}
                    onClose={() => {
                        setEditGoal(null);
                    }}
                />
            )}
        </div>
    );
};
