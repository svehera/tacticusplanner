/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { Target } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { PersonalGoalType } from 'src/models/enums';
import { EditGoalDialog } from 'src/shared-components/goals/edit-goal-dialog';

import { Button, PortalDialog } from '@/fsd/5-shared/ui';

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
        if (!goalToEdit) return;

        const unitId = goalToEdit.type === PersonalGoalType.UpgradeMaterial ? undefined : goalToEdit.unitId;
        const characterToEdit =
            unitId === undefined ? undefined : units.find(x => x.id === unitId || x.snowprintId === unitId);

        if (goalToEdit.type === PersonalGoalType.UpgradeMaterial || characterToEdit) {
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
            <div className="flex flex-col items-start gap-1">
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
                appearance="outline"
                size="small"
                isDisabled={!goals?.length}
                onPress={() => {
                    setCurrentGoalsSelect(goals);
                    setOpenGoals(true);
                }}>
                <Target data-slot="icon" /> {selectedGoalsCount} of {goals.length}
            </Button>

            <PortalDialog
                open={openGoals}
                onClose={() => {
                    setCurrentGoalsSelect(goals);
                    setOpenGoals(false);
                }}
                aria-label="Active goals"
                size="xl">
                <PortalDialog.Header>
                    <span className="flex items-center gap-1 text-xl">
                        <Target className="size-5" />
                        <span>
                            <b>{currentSelectedGoalsCount}</b> of {goals.length} active goals
                        </span>
                    </span>
                </PortalDialog.Header>
                <PortalDialog.Body>
                    <div className="flex items-center justify-end border-b border-(--border) pb-2.5">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={currentGoalsSelect.every(x => x.include)}
                                ref={element => {
                                    if (element)
                                        element.indeterminate =
                                            currentGoalsSelect.some(x => x.include) &&
                                            !currentGoalsSelect.every(x => x.include);
                                }}
                                onChange={handleSelectAll}
                                className="size-4 cursor-pointer accent-(--primary)"
                            />
                            Select all
                        </label>
                    </div>
                    <div className="flex flex-wrap items-start gap-4">
                        {upgradeRankGoals.length > 0 && renderGoalsGroup('Upgrade rank', upgradeRankGoals)}
                        {upgradeMowGoals.length > 0 && renderGoalsGroup('Upgrade MoW', upgradeMowGoals)}
                        {ascendGoals.length > 0 && renderGoalsGroup('Ascend/Promote', ascendGoals)}
                        {unlockGoals.length > 0 && renderGoalsGroup('Unlock', unlockGoals)}
                        {upgradeMaterialGoals.length > 0 && renderGoalsGroup('Upgrade Material', upgradeMaterialGoals)}
                    </div>
                </PortalDialog.Body>

                <PortalDialog.Footer>
                    <Button
                        appearance="outline"
                        onPress={() => {
                            setCurrentGoalsSelect(goals);
                            setOpenGoals(false);
                        }}>
                        Cancel
                    </Button>
                    <Button intent="success" isDisabled={!hasChanges} onPress={handleSaveChanges}>
                        Save changes
                    </Button>
                </PortalDialog.Footer>
            </PortalDialog>

            {editGoal !== undefined &&
                (editUnit !== undefined || editGoal.type === PersonalGoalType.UpgradeMaterial) && (
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
