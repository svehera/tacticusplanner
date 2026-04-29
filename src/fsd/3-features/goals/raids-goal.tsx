/* eslint-disable import-x/no-internal-modules */
import { ArrowForward, Edit } from '@mui/icons-material';
import { Checkbox, FormControlLabel, IconButton } from '@mui/material';
import React from 'react';

import { rarityToStars } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';

import { RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { RankIcon, RarityIcon, StarsIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';

interface Props {
    goal: TypedGoalSelect;
    onSelectChange: (goalId: string, selected: boolean) => void;
    onGoalEdit: () => void;
}

export const RaidsGoal: React.FC<Props> = ({ goal, onSelectChange, onGoalEdit }) => {
    const material =
        goal.type === PersonalGoalType.UpgradeMaterial
            ? UpgradesService.getUpgradeMaterial(goal.upgradeMaterialId ?? '')
            : undefined;

    const tooltopText = goal.type === PersonalGoalType.UpgradeMaterial ? material?.label : goal.unitName;

    const getGoalInfo = (goal: TypedGoalSelect) => {
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
                            {goal.upgradesRarity.length > 0 && (
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
                        <div className="flex-box column start">
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

                        {goal.upgradesRarity.length > 0 && (
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
            case PersonalGoalType.UpgradeMaterial: {
                return (
                    <AccessibleTooltip title={'Upgrade material goal'}>
                        <div className="flex-box gap5">
                            <span>
                                {goal.quantity}× {material?.label ?? ''}
                            </span>
                        </div>
                    </AccessibleTooltip>
                );
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
                    <AccessibleTooltip title={tooltopText}>
                        <div>
                            {goal.type === PersonalGoalType.UpgradeMaterial && (
                                <UpgradeImage
                                    material={material!.snowprintId}
                                    iconPath={material!.icon!}
                                    rarity={RarityMapper.stringToRarityString(material?.rarity ?? '')}
                                    size={40}
                                />
                            )}
                            {goal.type !== PersonalGoalType.UpgradeMaterial && (
                                <UnitShardIcon icon={goal.unitRoundIcon} name={goal.unitName} />
                            )}
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
