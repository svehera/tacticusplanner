import React from 'react';
import { Checkbox, FormControlLabel, IconButton } from '@mui/material';
import { CharacterRaidGoalSelect } from 'src/v2/features/goals/goals.models';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { PersonalGoalType } from 'src/models/enums';
import { CharacterImage } from 'src/shared-components/character-image';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { ArrowForward, Edit } from '@mui/icons-material';
import { StarsImage } from 'src/v2/components/images/stars-image';
import { rarityToStars } from 'src/models/constants';

interface Props {
    goal: CharacterRaidGoalSelect;
    onSelectChange: (goalId: string, selected: boolean) => void;
    onGoalEdit: () => void;
}

export const CharactersRaidsGoal: React.FC<Props> = ({ goal, onSelectChange, onGoalEdit }) => {
    const getGoalInfo = (goal: CharacterRaidGoalSelect) => {
        switch (goal.type) {
            case PersonalGoalType.Ascend: {
                const isSameRarity = goal.rarityStart === goal.rarityEnd;
                const minStars = rarityToStars[goal.rarityEnd];
                const isMinStars = minStars === goal.starsEnd;
                return (
                    <AccessibleTooltip title={'Ascend character'}>
                        <div className="flex-box gap5">
                            {!isSameRarity && (
                                <>
                                    <RarityImage rarity={goal.rarityStart} /> <ArrowForward />
                                    <RarityImage rarity={goal.rarityEnd} />
                                    {!isMinStars && <StarsImage stars={goal.starsEnd} />}
                                </>
                            )}

                            {isSameRarity && (
                                <>
                                    <StarsImage stars={goal.starsStart} /> <ArrowForward />
                                    <StarsImage stars={goal.starsEnd} />
                                </>
                            )}
                        </div>
                    </AccessibleTooltip>
                );
            }
            case PersonalGoalType.UpgradeRank: {
                return (
                    <AccessibleTooltip title={"Upgrade character's rank"}>
                        <div className="flex-box gap3">
                            <RankImage rank={goal.rankStart} /> <ArrowForward />
                            <RankImage rank={goal.rankEnd} rankPoint5={goal.rankPoint5} />
                            {!!goal.upgradesRarity.length && (
                                <div className="flex-box gap3">
                                    {goal.upgradesRarity.map(x => (
                                        <RarityImage key={x} rarity={x} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </AccessibleTooltip>
                );
            }
            case PersonalGoalType.Unlock: {
                return <span>Unlock</span>;
            }
        }
    };

    return (
        <FormControlLabel
            key={goal.goalId}
            label={
                <div className="flex-box gap10">
                    <IconButton onClick={onGoalEdit}>
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
            control={
                <Checkbox
                    checked={goal.include}
                    onChange={({ target }) => onSelectChange(goal.goalId, target.checked)}
                />
            }
        />
    );
};
