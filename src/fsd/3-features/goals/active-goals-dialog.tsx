/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { Checkbox, DialogActions, DialogContent, DialogTitle, FormControlLabel } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useEffect, useMemo, useState } from 'react';

import { PersonalGoalType } from 'src/models/enums';
import { EditGoalDialog } from 'src/shared-components/goals/edit-goal-dialog';

import { IUnit } from '@/fsd/3-features/characters/characters.models';
import { TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { RaidsGoal } from '@/fsd/3-features/goals/raids-goal';

interface Props {
    goals: TypedGoalSelect[];
    units: IUnit[];
    onGoalsSelectChange: (chars: TypedGoalSelect[]) => void;
}

export const ActiveGoalsDialog: React.FC<Props> = ({ goals, units, onGoalsSelectChange }) => {
    const [openGoals, setOpenGoals] = useState<boolean>(false);
    const [editGoal, setEditGoal] = useState<TypedGoalSelect>();
    const [editUnit, setEditUnit] = useState<IUnit | undefined>();

    const [currentGoalsSelect, setCurrentGoalsSelect] = useState<TypedGoalSelect[]>(goals);

    const unitId =
        editGoal === undefined || editGoal?.type === PersonalGoalType.UpgradeMaterial ? undefined : editGoal.unitId;

    // Sync currentGoalsSelect with goals prop when goals change while dialog is open
    useEffect(() => {
        if (openGoals) {
            setCurrentGoalsSelect(previousGoals =>
                goals.map(goal => {
                    const previousGoal = previousGoals.find(g => g.goalId === goal.goalId);
                    // Preserve include state if goal exists, otherwise use the new goal's include value
                    return previousGoal ? { ...goal, include: previousGoal.include } : goal;
                })
            );
        }
    }, [goals, openGoals]);
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentGoalsSelect(value => value.map(x => ({ ...x, include: event.target.checked })));
    };

    const handleChildChange = (goalId: string, selected: boolean) => {
        setCurrentGoalsSelect(value => value.map(x => ({ ...x, include: x.goalId === goalId ? selected : x.include })));
    };

    const handleSaveChanges = () => {
        onGoalsSelectChange(currentGoalsSelect);
        setOpenGoals(false);
    };

    const handleGoalEdit = (goalId: string) => {
        const goalToEdit = goals.find(x => x.goalId === goalId);
        const characterToEdit = units.find(x => x.id === unitId || x.snowprintId === unitId);

        if (goalToEdit && characterToEdit) {
            setEditGoal(goalToEdit);
            setEditUnit(characterToEdit);
        }
    };

    const hasChanges = useMemo(() => {
        const currentSelected = currentGoalsSelect
            .filter(x => x.include)
            .map(x => x.goalId)
            .join(',');
        const initialSelected = goals
            .filter(x => x.include)
            .map(x => x.goalId)
            .join(',');
        return currentSelected !== initialSelected;
    }, [currentGoalsSelect, goals]);

    const upgradeMaterialGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.UpgradeMaterial);
    const upgradeRankGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.UpgradeRank);
    const upgradeMowGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.MowAbilities);
    const ascendGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.Ascend);
    const unlockGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.Unlock);

    const selectedGoalsCount = goals.filter(x => x.include).length;
    const currentSelectedGoalsCount = currentGoalsSelect.filter(x => x.include).length;

    const renderGoalsGroup = (name: string, goals: TypedGoalSelect[]) => {
        return (
            <div className="flex-box column gap5 start">
                <h5 className="mt-0">{name}</h5>
                {goals.map(goal => (
                    <RaidsGoal
                        key={goal.goalId}
                        goal={goal}
                        onSelectChange={handleChildChange}
                        onGoalEdit={() => handleGoalEdit(goal.goalId)}
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            <Button
                size="small"
                variant={'outlined'}
                disabled={!goals?.length}
                onClick={() => {
                    setCurrentGoalsSelect(goals);
                    setOpenGoals(true);
                }}>
                <TrackChangesIcon /> {selectedGoalsCount} of {goals.length}
            </Button>

            <Dialog
                open={openGoals}
                maxWidth={'xl'}
                onClose={() => {
                    setCurrentGoalsSelect(goals);
                    setOpenGoals(false);
                }}>
                <DialogTitle className="flex-box between">
                    <div className="flex-box gap5 text-[20px]">
                        <TrackChangesIcon />
                        <span>
                            <b>{currentSelectedGoalsCount}</b> of {goals.length} active goals
                        </span>
                    </div>
                    <div className="flex-box gap10">
                        <FormControlLabel
                            label="Select all"
                            control={
                                <Checkbox
                                    checked={currentGoalsSelect.every(x => x.include)}
                                    indeterminate={
                                        currentGoalsSelect.some(x => x.include) &&
                                        !currentGoalsSelect.every(x => x.include)
                                    }
                                    onChange={handleSelectAll}
                                />
                            }
                        />
                    </div>
                </DialogTitle>
                <DialogContent>
                    <div className="flex-box wrap start">
                        {upgradeRankGoals.length > 0 && renderGoalsGroup('Upgrade rank', upgradeRankGoals)}
                        {upgradeMowGoals.length > 0 && renderGoalsGroup('Upgrade MoW', upgradeMowGoals)}
                        {ascendGoals.length > 0 && renderGoalsGroup('Ascend/Promote', ascendGoals)}
                        {unlockGoals.length > 0 && renderGoalsGroup('Unlock', unlockGoals)}
                        {upgradeMaterialGoals.length > 0 && renderGoalsGroup('Upgrade Material', upgradeMaterialGoals)}
                    </div>
                </DialogContent>

                <DialogActions>
                    <Button variant={'outlined'} onClick={() => setOpenGoals(false)}>
                        Cancel
                    </Button>
                    <Button variant={'contained'} disabled={!hasChanges} color="success" onClick={handleSaveChanges}>
                        Save changes
                    </Button>
                </DialogActions>
            </Dialog>

            {editGoal && editUnit && (
                <EditGoalDialog
                    isOpen={true}
                    goal={editGoal}
                    unit={editUnit}
                    onClose={() => {
                        setEditGoal(undefined);
                    }}
                />
            )}
        </>
    );
};
