import React, { useEffect, useMemo } from 'react';
import Button from '@mui/material/Button';
import { Checkbox, FormControlLabel } from '@mui/material';
import { CharacterRaidGoalSelect } from 'src/v2/features/goals/goals.models';
import { PersonalGoalType } from 'src/models/enums';
import { CharactersRaidsGoal } from 'src/v2/features/goals/characters-raids-goal';

interface Props {
    goalsSelect: CharacterRaidGoalSelect[];
    onGoalsSelectChange: (chars: CharacterRaidGoalSelect[]) => void;
    onGoalEdit: (goalId: string) => void;
}

export const CharactersRaidsSelect: React.FC<Props> = ({ goalsSelect, onGoalsSelectChange, onGoalEdit }) => {
    const [currentGoalsSelect, setCurrentGoalsSelect] = React.useState<CharacterRaidGoalSelect[]>([]);

    useEffect(() => {
        setCurrentGoalsSelect(goalsSelect);
    }, [goalsSelect]);

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentGoalsSelect(value => value.map(x => ({ ...x, include: event.target.checked })));
    };

    const handleChildChange = (goalId: string, selected: boolean) => {
        setCurrentGoalsSelect(value => value.map(x => ({ ...x, include: x.goalId === goalId ? selected : x.include })));
    };

    const handleSaveChanges = () => {
        onGoalsSelectChange(currentGoalsSelect);
    };

    const hasChanges = useMemo(() => {
        const currentSelected = currentGoalsSelect
            .filter(x => x.include)
            .map(x => x.goalId)
            .join();
        const initialSelected = goalsSelect
            .filter(x => x.include)
            .map(x => x.goalId)
            .join();
        return currentSelected !== initialSelected;
    }, [currentGoalsSelect, goalsSelect]);

    const upgradeRankGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.UpgradeRank);
    const ascendGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.Ascend);
    const unlockGoals = currentGoalsSelect.filter(x => x.type === PersonalGoalType.Unlock);

    const renderGoalsGroup = (name: string, goals: CharacterRaidGoalSelect[]) => {
        return (
            <div className="flex-box column gap5 start">
                <h5>{name}</h5>
                {goals.map(goal => (
                    <CharactersRaidsGoal
                        key={goal.goalId}
                        goal={goal}
                        onSelectChange={handleChildChange}
                        onGoalEdit={() => onGoalEdit(goal.goalId)}
                    />
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className="flex-box gap10">
                <Button variant={'contained'} disabled={!hasChanges} color="success" onClick={handleSaveChanges}>
                    Save changes
                </Button>
                <FormControlLabel
                    label="Select all"
                    control={
                        <Checkbox
                            checked={currentGoalsSelect.every(x => x.include)}
                            indeterminate={
                                currentGoalsSelect.some(x => x.include) && !currentGoalsSelect.every(x => x.include)
                            }
                            onChange={handleSelectAll}
                        />
                    }
                />
            </div>
            <div className="flex-box gap20 start wrap">
                {!!upgradeRankGoals.length && renderGoalsGroup('Upgrade rank', upgradeRankGoals)}
                {!!ascendGoals.length && renderGoalsGroup('Ascend/Promote', ascendGoals)}
                {!!unlockGoals.length && renderGoalsGroup('Unlock', unlockGoals)}
            </div>
        </div>
    );
};
