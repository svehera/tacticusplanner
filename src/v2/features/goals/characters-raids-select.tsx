import React, { useEffect, useMemo } from 'react';
import Button from '@mui/material/Button';
import { Checkbox, FormControlLabel, IconButton } from '@mui/material';
import { CharacterRaidGoalSelect } from 'src/v2/features/goals/goals.models';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { PersonalGoalType } from 'src/models/enums';
import { CharacterImage } from 'src/shared-components/character-image';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { Edit } from '@mui/icons-material';

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

    const handleChildChange = (goalId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentGoalsSelect(value =>
            value.map(x => ({ ...x, include: x.goalId === goalId ? event.target.checked : x.include }))
        );
    };

    const handleSaveChanges = () => {
        onGoalsSelectChange(currentGoalsSelect);
    };

    const hasChanges = useMemo(() => {
        const currentSelected = currentGoalsSelect.filter(x => x.include).length;
        const intialSelected = goalsSelect.filter(x => x.include).length;
        return currentSelected !== intialSelected;
    }, [currentGoalsSelect, goalsSelect]);

    const getGoalInfo = (goal: CharacterRaidGoalSelect) => {
        switch (goal.type) {
            case PersonalGoalType.Ascend: {
                return (
                    <AccessibleTooltip title={'Ascend character'}>
                        <div>
                            <RarityImage rarity={goal.rarityStart} /> -&gt; <RarityImage rarity={goal.rarityEnd} />
                        </div>
                    </AccessibleTooltip>
                );
            }
            case PersonalGoalType.UpgradeRank: {
                return (
                    <AccessibleTooltip title={"Upgrade character's rank"}>
                        <div>
                            <RankImage rank={goal.rankStart} /> -&gt;{' '}
                            <RankImage rank={goal.rankEnd} rankPoint5={goal.rankPoint5} />
                        </div>
                    </AccessibleTooltip>
                );
            }
        }
    };

    const handleEdit = (goal: CharacterRaidGoalSelect) => {
        onGoalEdit(goal.goalId);
    };

    return (
        <div>
            <Button variant={'contained'} disabled={!hasChanges} color="success" onClick={handleSaveChanges}>
                Save changes
            </Button>
            <div>
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
                <div className="flex-box column gap5 start">
                    {currentGoalsSelect.map(goal => (
                        <FormControlLabel
                            key={goal.goalId}
                            label={
                                <div className="flex-box gap10">
                                    <IconButton onClick={() => handleEdit(goal)}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <AccessibleTooltip title={goal.characterName}>
                                        <div>
                                            <CharacterImage icon={goal.characterIcon} name={goal.characterName} />
                                        </div>
                                    </AccessibleTooltip>
                                    {getGoalInfo(goal)}
                                </div>
                            }
                            control={<Checkbox checked={goal.include} onChange={handleChildChange(goal.goalId)} />}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
