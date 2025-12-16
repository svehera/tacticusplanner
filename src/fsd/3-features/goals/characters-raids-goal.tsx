import { ArrowForward, Edit } from '@mui/icons-material';
import { Checkbox, FormControlLabel, IconButton } from '@mui/material';
import React from 'react';

import { rarityToStars } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';
import { StarsIcon } from '@/fsd/5-shared/ui/icons/stars.icon';

import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';

import { CharacterRaidGoalSelect } from '@/fsd/3-features/goals/goals.models';

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
                                    <RarityIcon rarity={goal.rarityStart} /> <ArrowForward />
                                    <RarityIcon rarity={goal.rarityEnd} />
                                    {!isMinStars && <StarsIcon stars={goal.starsEnd} />}
                                </>
                            )}

                            {isSameRarity && (
                                <>
                                    <StarsIcon stars={goal.starsStart} /> <ArrowForward />
                                    <StarsIcon stars={goal.starsEnd} />
                                </>
                            )}
                        </div>
                    </AccessibleTooltip>
                );
            }
            case PersonalGoalType.UpgradeRank: {
                return (
                    <AccessibleTooltip title={"Upgrade character's rank"}>
                        <div className="flex-box gap-[3px]">
                            <RankIcon rank={goal.rankStart} /> <ArrowForward />
                            <RankIcon rank={goal.rankEnd} rankPoint5={goal.rankPoint5} />
                            {!!goal.upgradesRarity.length && (
                                <div className="flex-box gap-[3px]">
                                    {goal.upgradesRarity.map(x => (
                                        <RarityIcon key={x} rarity={x} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </AccessibleTooltip>
                );
            }
            case PersonalGoalType.MowAbilities: {
                const hasPrimaryGoal = goal.primaryEnd > goal.primaryStart;
                const hasSecondaryGoal = goal.secondaryEnd > goal.secondaryStart;
                return (
                    <div className="flex-box gap5">
                        <div className="flex-box start column">
                            {hasPrimaryGoal && (
                                <div className="flex-box gap-[3px]">
                                    <span>P:</span> <b>{goal.primaryStart}</b> <ArrowForward />
                                    <b>{goal.primaryEnd}</b>
                                </div>
                            )}

                            {hasSecondaryGoal && (
                                <div className="flex-box gap-[3px]">
                                    <span>S:</span> <b>{goal.secondaryStart}</b> <ArrowForward />
                                    <b>{goal.secondaryEnd}</b>
                                </div>
                            )}
                        </div>

                        {!!goal.upgradesRarity.length && (
                            <div className="flex-box gap-[3px]">
                                {goal.upgradesRarity.map(x => (
                                    <RarityIcon key={x} rarity={x} />
                                ))}
                            </div>
                        )}
                    </div>
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
                    <AccessibleTooltip title={goal.unitName}>
                        <div>
                            <UnitShardIcon icon={goal.unitRoundIcon} name={goal.unitName} />
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
