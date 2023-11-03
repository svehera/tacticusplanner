import React, { useContext, useMemo, useState } from 'react';
import { EditGoalDialog, SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { ICharacter, ICharacterRankRange, IPersonalGoal } from '../../models/interfaces';
import { PersonalGoalType, Rank } from '../../models/enums';

import { RankImage } from '../../shared-components/rank-image';
import { RarityImage } from '../../shared-components/rarity-image';
import { CharacterTitle } from '../../shared-components/character-title';
import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { ArrowForward, DeleteForever, Edit } from '@mui/icons-material';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { StaticDataService } from '../../services';

export const Goals = () => {
    const { goals, characters, campaignsProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [editGoal, setEditGoal] = useState<IPersonalGoal | null>(null);

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
                    } as ICharacterRankRange;
                }
                return null;
            })
            .filter(x => !!x) as ICharacterRankRange[];

        const estimate = StaticDataService.getRankUpgradeEstimatedDays(
            {
                dailyEnergy: 288 + 50 + 100,
                campaignsProgress,
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
            setEditGoal(goal);
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
                        onClose={() => {
                            setEditGoal(null);
                        }}
                    />
                ) : undefined}
                <span style={{ fontSize: 20 }}>
                    {goals.length}/{20}
                </span>
                <span style={{ fontSize: 20 }}>Estimated Total Days Worst: {estimatedDaysTotal.raids.length}</span>
                <span style={{ fontSize: 20 }}>
                    Estimated Total Days Best: {estimatedDaysTotal.raids.filter(x => x.energyLeft < 10).length}
                </span>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className={'goals'}>
                {goals.map(goal => (
                    <GoalCard
                        key={goal.id + goal.priority}
                        goal={goal}
                        menuItemSelect={item => handleMenuItemSelect(goal, item)}
                    />
                ))}
            </div>
        </div>
    );
};

export default function GoalCard({
    goal,
    menuItemSelect,
}: {
    goal: IPersonalGoal;
    menuItemSelect: (item: 'edit' | 'delete') => void;
}) {
    const { characters, campaignsProgress } = useContext(StoreContext);
    const character = characters.find(x => x.name === goal.character) as ICharacter;

    const estimatedDays = useMemo(() => {
        const estimate = StaticDataService.getRankUpgradeEstimatedDays(
            {
                dailyEnergy: 288 + 50 + 100,
                campaignsProgress,
            },
            {
                id: character.name,
                rankStart: character.rank,
                rankEnd: goal.targetRank!,
            }
        );

        return estimate.raids.length;
    }, [character.name, character.rank, goal.targetRank]);

    return (
        <React.Fragment>
            <Card
                sx={{
                    width: 350,
                    minHeight: 200,
                    backgroundColor:
                        (goal.type === PersonalGoalType.UpgradeRank && goal.targetRank === character.rank) ||
                        (goal.type === PersonalGoalType.Ascend && goal.targetRarity === character.rarity) ||
                        (goal.type === PersonalGoalType.Unlock && character.rank > Rank.Locked)
                            ? 'lightgreen'
                            : 'white',
                }}>
                <CardHeader
                    action={
                        <React.Fragment>
                            <IconButton onClick={() => menuItemSelect('edit')}>
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton onClick={() => menuItemSelect('delete')}>
                                <DeleteForever fontSize="small" />
                            </IconButton>
                        </React.Fragment>
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
                            <div>Estimated Days: {estimatedDays}</div>
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
        </React.Fragment>
    );
}
