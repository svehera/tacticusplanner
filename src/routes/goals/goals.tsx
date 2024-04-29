import React, { useContext, useMemo, useState } from 'react';
import { SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { EditGoalDialog } from '../../shared-components/goals/edit-goal-dialog';
import { ICharacter2 } from '../../models/interfaces';
import { PersonalGoalType } from '../../models/enums';

import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { StaticDataService } from '../../services';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import Button from '@mui/material/Button';
import LinkIcon from '@mui/icons-material/Link';
import { GoalCard } from 'src/routes/goals/goal-card';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import {
    CharacterRaidGoalSelect,
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeRankGoal,
} from 'src/v2/features/goals/goals.models';
import { ShardsService } from 'src/v2/features/goals/shards.service';

export const Goals = () => {
    const { goals, characters, campaignsProgress, dailyRaidsPreferences, inventory, dailyRaids } =
        useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [editGoal, setEditGoal] = useState<CharacterRaidGoalSelect | null>(null);
    const [editCharacter, setEditCharacter] = useState<ICharacter2>(characters[0]);

    const typedGoals = useMemo<CharacterRaidGoalSelect[]>(() => {
        return goals
            .map(g => {
                const relatedCharacter = characters.find(x => x.name === g.character);
                if (
                    ![PersonalGoalType.UpgradeRank, PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(g.type)
                ) {
                    return null;
                }
                return GoalsService.convertToTypedGoal(g, relatedCharacter);
            })
            .filter(g => !!g) as CharacterRaidGoalSelect[];
    }, [goals, characters]);

    const upgradesGoals = typedGoals.filter(
        g => g.type === PersonalGoalType.UpgradeRank
    ) as ICharacterUpgradeRankGoal[];

    const shardsGoals = typedGoals.filter(g =>
        [PersonalGoalType.Unlock, PersonalGoalType.Ascend].includes(g.type)
    ) as Array<ICharacterAscendGoal | ICharacterUnlockGoal>;

    const estimatedUpgradesTotal = useMemo(() => {
        return StaticDataService.getRankUpgradeEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy - dailyRaidsPreferences.shardsEnergy,
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: inventory.upgrades,
                completedLocations: dailyRaids.completedLocations ?? [],
            },
            ...upgradesGoals
        );
    }, [typedGoals]);

    const estimatedShardsTotal = useMemo(() => {
        return ShardsService.getShardsEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                completedLocations: dailyRaids.completedShardsLocations ?? [],
            },
            ...shardsGoals
        );
    }, [typedGoals]);

    const removeGoal = (goalId: string): void => {
        dispatch.goals({ type: 'Delete', goalId });
    };

    const handleMenuItemSelect = (goal: CharacterRaidGoalSelect, item: 'edit' | 'delete') => {
        if (item === 'delete') {
            if (confirm('Are you sure? The goal will be permanently deleted!')) {
                removeGoal(goal.goalId);
            }
        }

        if (item === 'edit') {
            const relatedCharacter = characters.find(x => x.name === goal.characterName);
            if (relatedCharacter) {
                setEditCharacter(relatedCharacter);
                setEditGoal(goal);
            }
        }
    };

    const getDaysEstimate = (goal: CharacterRaidGoalSelect): { daysLeft: number; tokens: number; energy: number } => {
        if ([PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(goal.type)) {
            const estimate = estimatedShardsTotal.materials.find(x => x.id === goal.characterName);
            return {
                daysLeft: estimate?.daysTotal ?? 0,
                tokens: estimate?.onslaughtTokensTotal ?? 0,
                energy: estimate?.energyTotal ?? 0,
            };
        }

        if (goal.type === PersonalGoalType.UpgradeRank) {
            const estimateOverall = StaticDataService.getRankUpgradeEstimatedDays(
                {
                    dailyEnergy: dailyRaidsPreferences.dailyEnergy - dailyRaidsPreferences.shardsEnergy,
                    campaignsProgress: campaignsProgress,
                    preferences: dailyRaidsPreferences,
                    upgrades: inventory.upgrades,
                    completedLocations: dailyRaids.completedLocations ?? [],
                },
                ...upgradesGoals.filter(x => x.priority <= goal.priority)
            );
            const estimateSpecific = StaticDataService.getRankUpgradeEstimatedDays(
                {
                    dailyEnergy: dailyRaidsPreferences.dailyEnergy - dailyRaidsPreferences.shardsEnergy,
                    campaignsProgress: campaignsProgress,
                    preferences: dailyRaidsPreferences,
                    upgrades: inventory.upgrades,
                    completedLocations: dailyRaids.completedLocations ?? [],
                },
                goal
            );

            const firstFarmDay = estimateOverall.raids.findIndex(x =>
                x.raids.flatMap(raid => raid.characters).includes(goal.characterName)
            );

            return {
                daysLeft:
                    firstFarmDay +
                    estimateOverall.raids.filter(x =>
                        x.raids.flatMap(raid => raid.characters).includes(goal.characterName)
                    ).length,
                tokens: 0,
                energy: estimateSpecific.totalEnergy,
            };
        }

        return {
            daysLeft: 0,
            tokens: 0,
            energy: 0,
        };
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10 }}>
                <Button
                    variant={'contained'}
                    component={Link}
                    to={isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids'}>
                    <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Raids</span>
                </Button>
                <SetGoalDialog key={goals.length} />
                {editGoal ? (
                    <EditGoalDialog
                        isOpen={true}
                        goal={editGoal}
                        character={editCharacter}
                        onClose={() => {
                            setEditGoal(null);
                        }}
                    />
                ) : undefined}
                <span style={{ fontSize: 20 }}>
                    {goals.length}/{20}
                </span>
                <span style={{ fontSize: 20 }}>Total Days: {estimatedUpgradesTotal.raids.length}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className={'goals'}>
                {typedGoals.map(goal => (
                    <GoalCard
                        key={goal.goalId}
                        goal={goal}
                        daysEstimate={getDaysEstimate(goal)}
                        menuItemSelect={item => handleMenuItemSelect(goal, item)}
                    />
                ))}
            </div>
        </div>
    );
};
