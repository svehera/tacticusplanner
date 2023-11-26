import React, { useContext, useMemo, useState } from 'react';
import { EditGoalDialog, SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { ICharacter2, ICharacterRankRange, IPersonalGoal } from '../../models/interfaces';
import { PersonalGoalType, Rank } from '../../models/enums';

import { RankImage } from '../../shared-components/rank-image';
import { RarityImage } from '../../shared-components/rarity-image';
import { CharacterTitle } from '../../shared-components/character-title';
import { Card, CardContent, CardHeader, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { ArrowForward, DeleteForever, Edit, Info } from '@mui/icons-material';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { StaticDataService } from '../../services';
import { defaultCampaignsProgress } from '../../models/constants';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';

export const Goals = () => {
    const { goals, characters, campaignsProgress, dailyRaidsPreferences, inventory, dailyRaids } =
        useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [editGoal, setEditGoal] = useState<IPersonalGoal | null>(null);
    const [editCharacter, setEditCharacter] = useState<ICharacter2>(characters[0]);

    const estimatedDaysTotal = useMemo(() => {
        const chars = goals
            .filter(x => x.type === PersonalGoalType.UpgradeRank)
            .map(g => {
                const char = characters.find(c => c.name === g.character);
                if (char) {
                    return {
                        id: g.character,
                        rankStart: char.rank,
                        rankEnd: g.targetRank!,
                        appliedUpgrades: char.upgrades,
                    } as ICharacterRankRange;
                }
                return null;
            })
            .filter(x => !!x) as ICharacterRankRange[];

        const estimate = StaticDataService.getRankUpgradeEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy - dailyRaidsPreferences.shardsEnergy,
                campaignsProgress: dailyRaidsPreferences.useCampaignsProgress
                    ? campaignsProgress
                    : defaultCampaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: dailyRaidsPreferences.useInventory ? inventory.upgrades : {},
                completedLocations: dailyRaids.completedLocations ?? [],
            },
            ...chars
        );

        return estimate;
    }, [goals]);

    const removeGoal = (goalId: string): void => {
        dispatch.goals({ type: 'Delete', goalId });
    };

    const handleMenuItemSelect = (goal: IPersonalGoal, item: 'edit' | 'delete') => {
        if (item === 'delete') {
            if (confirm('Are you sure? The goal will be permanently deleted!')) {
                removeGoal(goal.id);
            }
        }

        if (item === 'edit') {
            const relatedCharacter = characters.find(x => x.name === goal.character);
            if (relatedCharacter) {
                setEditCharacter(relatedCharacter);
                setEditGoal({
                    ...goal,
                    currentRank: relatedCharacter.rank,
                    currentRarity: relatedCharacter.rarity,
                    upgrades: relatedCharacter.upgrades,
                });
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10 }}>
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
                <span style={{ fontSize: 20 }}>
                    Total Days: {estimatedDaysTotal.raids.length}{' '}
                    <IconButton
                        color={'primary'}
                        component={Link}
                        to={isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids'}>
                        <Tooltip title={'Go To Daily Raids'}>
                            <Info />
                        </Tooltip>
                    </IconButton>{' '}
                </span>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className={'goals'}>
                {goals.map(goal => (
                    <GoalCard
                        key={goal.id + goal.priority}
                        goal={goal}
                        higherPriorityGoals={goals.filter(g => g.type === goal.type && g.priority < goal.priority)}
                        menuItemSelect={item => handleMenuItemSelect(goal, item)}
                    />
                ))}
            </div>
        </div>
    );
};

export const GoalCard = ({
    goal,
    menuItemSelect,
    higherPriorityGoals,
    onClick,
}: {
    goal: IPersonalGoal;
    higherPriorityGoals: IPersonalGoal[];
    menuItemSelect?: (item: 'edit' | 'delete') => void;
    onClick?: () => void;
}) => {
    const { characters, campaignsProgress, dailyRaidsPreferences, inventory, dailyRaids } = useContext(StoreContext);
    const character = characters.find(x => x.name === goal.character) as ICharacter2;
    const isGoalCompleted = useMemo(() => {
        return (
            (goal.type === PersonalGoalType.UpgradeRank && character.rank >= goal.targetRank!) ||
            (goal.type === PersonalGoalType.Ascend && character.rarity >= goal.targetRarity!) ||
            (goal.type === PersonalGoalType.Unlock && character.rank > Rank.Locked)
        );
    }, [goal, character]);

    const estimatedDays = useMemo(() => {
        if (goal.type !== PersonalGoalType.UpgradeRank) {
            return {
                total: 0,
                byOrder: 0,
            };
        }
        const charactersRankRange = higherPriorityGoals
            .map(g => {
                const char = characters.find(c => c.name === g.character);
                if (char) {
                    return {
                        id: g.character,
                        rankStart: char.rank,
                        rankEnd: g.targetRank!,
                        appliedUpgrades: char.upgrades,
                    } as ICharacterRankRange;
                }
            })
            .filter(x => !!x) as ICharacterRankRange[];

        const estimate = StaticDataService.getRankUpgradeEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy - dailyRaidsPreferences.shardsEnergy,
                campaignsProgress: dailyRaidsPreferences.useCampaignsProgress
                    ? campaignsProgress
                    : defaultCampaignsProgress,
                preferences: dailyRaidsPreferences, // { ...dailyRaidsPreferences, farmByPriorityOrder: true },
                upgrades: dailyRaidsPreferences.useInventory ? inventory.upgrades : {},
                completedLocations: dailyRaids.completedLocations ?? [],
            },
            ...[
                ...charactersRankRange,
                {
                    id: character.name,
                    rankStart: character.rank,
                    rankEnd: goal.targetRank!,
                    appliedUpgrades: character.upgrades,
                },
            ]
        );

        const firstFarmDay = estimate.raids.findIndex(x =>
            x.raids.flatMap(raid => raid.characters).includes(character.name)
        );

        return {
            total: estimate.raids.length,
            byOrder:
                firstFarmDay +
                estimate.raids.filter(x => x.raids.flatMap(raid => raid.characters).includes(character.name)).length,
        };
    }, [character.name, character.rank, goal.targetRank, higherPriorityGoals]);

    return (
        <Card
            onClick={onClick}
            sx={{
                width: 350,
                minHeight: 200,
                backgroundColor: isGoalCompleted ? 'lightgreen' : 'white',
                cursor: onClick ? 'pointer' : undefined,
            }}>
            <CardHeader
                action={
                    menuItemSelect ? (
                        <React.Fragment>
                            {!isGoalCompleted ? (
                                <IconButton onClick={() => menuItemSelect('edit')}>
                                    <Edit fontSize="small" />
                                </IconButton>
                            ) : undefined}
                            <IconButton onClick={() => menuItemSelect('delete')}>
                                <DeleteForever fontSize="small" />
                            </IconButton>
                        </React.Fragment>
                    ) : undefined
                }
                title={
                    <div style={{ display: 'flex', gap: 5 }}>
                        <span>#{goal.priority}</span>{' '}
                        <CharacterTitle character={character} short={true} imageSize={30} />
                    </div>
                }
                subheader={PersonalGoalType[goal.type]}
            />
            <CardContent>
                {goal.type === PersonalGoalType.UpgradeRank ? (
                    <div>
                        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <RankImage rank={character.rank} /> <ArrowForward />{' '}
                            <RankImage rank={goal.targetRank ?? 0} />
                        </div>
                        {isGoalCompleted ? undefined : (
                            <Tooltip
                                title={'Day/s left takes into consideration the highest planned item across all goals'}>
                                <span>
                                    Days Left: {estimatedDays.total} ({estimatedDays.byOrder})
                                </span>
                            </Tooltip>
                        )}
                    </div>
                ) : undefined}

                {goal.type === PersonalGoalType.Ascend ? (
                    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <RarityImage rarity={character.rarity} />
                        <ArrowForward /> <RarityImage rarity={goal.targetRarity ?? 0} />
                    </div>
                ) : undefined}
                <span>{goal.notes}</span>
            </CardContent>
        </Card>
    );
};
