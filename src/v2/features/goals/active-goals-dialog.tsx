import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { Checkbox, DialogActions, DialogContent, DialogTitle, FormControlLabel } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useEffect, useMemo, useState } from 'react';

import { PersonalGoalType } from 'src/models/enums';
import { EditGoalDialog } from 'src/shared-components/goals/edit-goal-dialog';

import { IUnit } from 'src/v2/features/characters/characters.models';
import { CharactersRaidsGoal } from 'src/v2/features/goals/characters-raids-goal';
import { CharacterRaidGoalSelect } from 'src/v2/features/goals/goals.models';

interface Props {
    goals: CharacterRaidGoalSelect[];
    units: IUnit[];
    onGoalsSelectChange: (chars: CharacterRaidGoalSelect[]) => void;
}

export const ActiveGoalsDialog: React.FC<Props> = ({ goals, units, onGoalsSelectChange }) => {
    const [openGoals, setOpenGoals] = useState<boolean>(false);
    const [editGoal, setEditGoal] = useState<CharacterRaidGoalSelect | null>(null);
    const [editUnit, setEditUnit] = useState<IUnit | null>(null);

    const [currentGoalsSelect, setCurrentGoalsSelect] = useState<CharacterRaidGoalSelect[]>(goals);

    // Sync currentGoalsSelect with goals prop when goals change while dialog is open
    useEffect(() => {
        if (openGoals) {
            setCurrentGoalsSelect(prevGoals =>
                goals.map(goal => {
                    const prevGoal = prevGoals.find(g => g.goalId === goal.goalId);
                    // Preserve include state if goal exists, otherwise use the new goal's include value
                    return prevGoal ? { ...goal, include: prevGoal.include } : goal;
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
        // August 2025: we're transitioning between IDs for characters. Previously be used a short version
        // of the character's name (i.e. Ragnar, Darkstrider). Now we're moving to IDs from snowprints internal data (datamined).
        // During this transition, it's possibly for legacy goals to have legacy IDs, which are then overwritten with
        // Snowprint IDs. For this reason, we cater to both IDs for lookup here, with the expectation we can consolidate
        // on snowprintIDs down the track.
        const characterToEdit = units.find(x => x.id === goalToEdit?.unitId || x.snowprintId === goalToEdit?.unitId);

        if (goalToEdit && characterToEdit) {
            setEditGoal(goalToEdit);
            setEditUnit(characterToEdit);
        }
    };

    const hasChanges = useMemo(() => {
        const currentSelected = currentGoalsSelect
            .filter(x => x.include)
            .map(x => x.goalId)
            .join();
        const initialSelected = goals
            .filter(x => x.include)
            .map(x => x.goalId)
            .join();
        return currentSelected !== initialSelected;
    }, [currentGoalsSelect, goals]);

    const upgradeRankGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.UpgradeRank);
    const upgradeMowGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.MowAbilities);
    const ascendGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.Ascend);
    const unlockGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.Unlock);

    const selectedGoalsCount = goals.filter(x => x.include).length;
    const currentSelectedGoalsCount = currentGoalsSelect.filter(x => x.include).length;

    const renderGoalsGroup = (name: string, goals: CharacterRaidGoalSelect[]) => {
        return (
            <div className="flex-box column gap5 start">
                <h5 style={{ marginTop: 0 }}>{name}</h5>
                {goals.map(goal => (
                    <CharactersRaidsGoal
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
                    <div className="flex-box gap5" style={{ fontSize: 20 }}>
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
                    <div className="flex-box start wrap">
                        {!!upgradeRankGoals.length && renderGoalsGroup('Upgrade rank', upgradeRankGoals)}
                        {!!upgradeMowGoals.length && renderGoalsGroup('Upgrade MoW', upgradeMowGoals)}
                        {!!ascendGoals.length && renderGoalsGroup('Ascend/Promote', ascendGoals)}
                        {!!unlockGoals.length && renderGoalsGroup('Unlock', unlockGoals)}
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
                        setEditGoal(null);
                    }}
                />
            )}
        </>
    );
};
