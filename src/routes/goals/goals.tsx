import React, { useContext, useState } from 'react';
import { EditGoalDialog, SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { ICharacter, IPersonalGoal } from '../../models/interfaces';
import { PersonalGoalType } from '../../models/enums';

import { RankImage } from '../../shared-components/rank-image';
import { RarityImage } from '../../shared-components/rarity-image';
import { CharacterTitle } from '../../shared-components/character-title';
import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { DeleteForever, ArrowForward, Edit } from '@mui/icons-material';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';

export const Goals = () => {
    const { goals } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [editGoal, setEditGoal] = useState<IPersonalGoal | null>(null);

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
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className={'goals'}>
                {goals.map((goal, index) => (
                    <GoalCard
                        key={goal.id}
                        goal={goal}
                        priority={index + 1}
                        menuItemSelect={item => handleMenuItemSelect(goal, item)}
                    />
                ))}
            </div>
        </div>
    );
};

export default function GoalCard({
    goal,
    priority,
    menuItemSelect,
}: {
    goal: IPersonalGoal;
    priority: number;
    menuItemSelect: (item: 'edit' | 'delete') => void;
}) {
    const { characters } = useContext(StoreContext);
    const character = characters.find(x => x.name === goal.character) as ICharacter;

    return (
        <React.Fragment>
            <Card
                sx={{
                    width: 350,
                    minHeight: 200,
                    backgroundColor:
                        (goal.type === PersonalGoalType.UpgradeRank && goal.targetRank === character.rank) ||
                        (goal.type === PersonalGoalType.Ascend && goal.targetRarity === character.initialRarity)
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
                            <span>#{priority}</span>{' '}
                            <CharacterTitle character={character} short={true} imageSize={30} />
                        </div>
                    }
                    subheader={PersonalGoalType[goal.type]}
                />
                <CardContent>
                    {goal.type === PersonalGoalType.UpgradeRank ? (
                        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <RankImage rank={character.rank} /> <ArrowForward />{' '}
                            <RankImage rank={goal.targetRank ?? 0} />
                        </div>
                    ) : undefined}

                    {goal.type === PersonalGoalType.Ascend ? (
                        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <RarityImage rarity={character.initialRarity} />
                            <ArrowForward /> <RarityImage rarity={goal.targetRarity ?? 0} />
                        </div>
                    ) : undefined}
                    <span>{goal.notes}</span>
                </CardContent>
            </Card>
        </React.Fragment>
    );
}
