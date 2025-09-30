﻿import { ArrowForward, DeleteForever, Edit } from '@mui/icons-material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LinkIcon from '@mui/icons-material/Link';
import { Card, CardContent, CardHeader } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import React, { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { charsUnlockShards, rarityToStars } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';
import { StaticDataService } from 'src/services';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';

import { Rank } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';
import { StarsIcon } from '@/fsd/5-shared/ui/icons/stars.icon';

import { CampaignImage } from '@/fsd/4-entities/campaign/campaign.icon';
import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';

import { CharacterAbilitiesTotal } from 'src/v2/features/characters/components/character-abilities-total';
import { CharacterRaidGoalSelect, IGoalEstimate } from 'src/v2/features/goals/goals.models';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { XpTotal } from 'src/v2/features/goals/xp-total';

import { MowMaterialsTotal } from '@/fsd/1-pages/learn-mow/mow-materials-total';

interface Props {
    goal: CharacterRaidGoalSelect;
    goalEstimate?: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete') => void;
}

export const GoalCard: React.FC<Props> = ({ goal, menuItemSelect, goalEstimate: passed }) => {
    const goalEstimate: IGoalEstimate = passed ?? {
        daysLeft: 0,
        daysTotal: 0,
        oTokensTotal: 0,
        energyTotal: 0,
        xpBooksTotal: 0,
        goalId: '',
    };
    const isGoalCompleted = GoalsService.isGoalCompleted(goal, goalEstimate);

    const calendarDate: string = useMemo(() => {
        if (!goalEstimate.daysLeft) {
            return '';
        }
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + goalEstimate.daysLeft - 1);

        return formatDateWithOrdinal(nextDate);
    }, [goalEstimate.daysLeft]);

    const getGoalInfo = (goal: CharacterRaidGoalSelect) => {
        switch (goal.type) {
            case PersonalGoalType.Ascend: {
                const isSameRarity = goal.rarityStart === goal.rarityEnd;
                const minStars = rarityToStars[goal.rarityEnd];
                const isMinStars = minStars === goal.starsEnd;

                const targetShards = ShardsService.getTargetShards(goal);
                return (
                    <div>
                        <div className="flex-box between">
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
                        </div>
                        <div>
                            <b>
                                {goal.shards} of {targetShards}
                            </b>{' '}
                            Shards
                        </div>
                        <div className="flex-box gap10 wrap">
                            <AccessibleTooltip title={`${goalEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                <div className="flex-box gap3">
                                    <CalendarMonthIcon /> {goalEstimate.daysLeft}
                                </div>
                            </AccessibleTooltip>
                            {!!goalEstimate.energyTotal && (
                                <AccessibleTooltip title={`${goalEstimate.energyTotal} energy`}>
                                    <div className="flex-box gap3">
                                        <MiscIcon icon={'energy'} height={18} width={15} /> {goalEstimate.energyTotal}
                                    </div>
                                </AccessibleTooltip>
                            )}

                            {!!goalEstimate.oTokensTotal && (
                                <AccessibleTooltip title={`${goalEstimate.oTokensTotal} Onslaught tokens`}>
                                    <div className="flex-box gap3">
                                        <CampaignImage campaign={'Onslaught'} size={18} /> {goalEstimate.oTokensTotal}
                                    </div>
                                </AccessibleTooltip>
                            )}
                        </div>
                    </div>
                );
            }
            case PersonalGoalType.UpgradeRank: {
                const { xpEstimate } = goalEstimate;
                const linkBase = isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids';
                const params = `?charSnowprintId=${encodeURIComponent(goal.unitId)}`;

                return (
                    <div>
                        <div className="flex-box between">
                            <div className="flex-box gap3">
                                <RankIcon rank={goal.rankStart} /> <ArrowForward />
                                <RankIcon rank={goal.rankEnd} rankPoint5={goal.rankPoint5} />
                                {!!goal.upgradesRarity.length && (
                                    <div className="flex-box gap3">
                                        {goal.upgradesRarity.map(x => (
                                            <RarityIcon key={x} rarity={x} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-box gap10 wrap">
                            <AccessibleTooltip title={`${goalEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                <div className="flex-box gap3">
                                    <CalendarMonthIcon /> {goalEstimate.daysLeft}
                                </div>
                            </AccessibleTooltip>
                            <AccessibleTooltip title={`${goalEstimate.energyTotal} energy`}>
                                <div className="flex-box gap3">
                                    <MiscIcon icon={'energy'} height={18} width={15} /> {goalEstimate.energyTotal}
                                </div>
                            </AccessibleTooltip>
                        </div>
                        {xpEstimate && <XpTotal {...xpEstimate} />}
                        <Button
                            size="small"
                            variant={'outlined'}
                            component={Link}
                            to={linkBase + params}
                            target={'_self'}>
                            <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Raids Table</span>
                        </Button>
                    </div>
                );
            }
            case PersonalGoalType.MowAbilities: {
                const linkBase = isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids';
                const params = `?charSnowprintId=${encodeURIComponent(goal.unitId)}`;
                const hasPrimaryGoal = goal.primaryEnd > goal.primaryStart;
                const hasSecondaryGoal = goal.secondaryEnd > goal.secondaryStart;
                const targetShards = ShardsService.getTargetShardsForMow(goal);
                return (
                    <div>
                        <div className="flex-box gap10">
                            <div className="flex-box column start">
                                {hasPrimaryGoal && (
                                    <div className="flex-box gap3">
                                        <span>Primary:</span> <b>{goal.primaryStart}</b> <ArrowForward />
                                        <b>{goal.primaryEnd}</b>
                                    </div>
                                )}

                                {hasSecondaryGoal && (
                                    <div className="flex-box gap3">
                                        <span>Secondary:</span> <b>{goal.secondaryStart}</b> <ArrowForward />
                                        <b>{goal.secondaryEnd}</b>
                                    </div>
                                )}
                            </div>
                            {!!goal.upgradesRarity.length && (
                                <div className="flex-box gap3">
                                    {goal.upgradesRarity.map(x => (
                                        <RarityIcon key={x} rarity={x} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <b>
                                {goal.shards} of {targetShards}
                            </b>{' '}
                            Shards
                        </div>
                        {goalEstimate.mowEstimate && (
                            <div style={{ padding: '10px 0' }}>
                                <MowMaterialsTotal
                                    size="small"
                                    mowAlliance={goal.unitAlliance}
                                    total={goalEstimate.mowEstimate}
                                />
                            </div>
                        )}
                        <div className="flex-box gap10 wrap">
                            <AccessibleTooltip title={`${goalEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                <div className="flex-box gap3">
                                    <CalendarMonthIcon /> {goalEstimate.daysLeft}
                                </div>
                            </AccessibleTooltip>
                            <AccessibleTooltip title={`${goalEstimate.energyTotal} energy`}>
                                <div className="flex-box gap3">
                                    <MiscIcon icon={'energy'} height={18} width={15} /> {goalEstimate.energyTotal}
                                </div>
                            </AccessibleTooltip>
                        </div>
                        <Button
                            size="small"
                            variant={'outlined'}
                            component={Link}
                            to={linkBase + params}
                            target={'_self'}>
                            <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Raids Table</span>
                        </Button>
                    </div>
                );
            }
            case PersonalGoalType.CharacterAbilities: {
                const hasActiveGoal = goal.activeEnd > goal.activeStart;
                const hasPassiveGoal = goal.passiveEnd > goal.passiveStart;
                return (
                    <div>
                        <div className="flex-box gap10">
                            <div className="flex-box column start">
                                {hasActiveGoal && (
                                    <div className="flex-box gap3">
                                        <span>Active:</span> <b>{goal.activeStart}</b> <ArrowForward />
                                        <b>{goal.activeEnd}</b>
                                    </div>
                                )}

                                {hasPassiveGoal && (
                                    <div className="flex-box gap3">
                                        <span>Passive:</span> <b>{goal.passiveStart}</b> <ArrowForward />
                                        <b>{goal.passiveEnd}</b>
                                    </div>
                                )}
                            </div>
                        </div>
                        {goalEstimate.xpEstimateAbilities && <XpTotal {...goalEstimate.xpEstimateAbilities} />}
                        {goalEstimate.abilitiesEstimate && (
                            <div style={{ padding: '10px 0' }}>
                                <CharacterAbilitiesTotal {...goalEstimate.abilitiesEstimate} />
                            </div>
                        )}
                    </div>
                );
            }
            case PersonalGoalType.Unlock: {
                const targetShards = charsUnlockShards[goal.rarity];

                return (
                    <div>
                        <div className="flex-box between">
                            <div>
                                <b>
                                    {goal.shards} of {targetShards}
                                </b>{' '}
                                Shards
                            </div>
                        </div>
                        <div className="flex-box gap10 wrap">
                            {!goalEstimate.daysLeft && !goalEstimate.energyTotal && (
                                <div>{StaticDataService.getFactionPray(goal.faction)}</div>
                            )}
                            {(!!goalEstimate.daysLeft || !!goalEstimate.energyTotal) && (
                                <>
                                    <AccessibleTooltip
                                        title={`${goalEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                        <div className="flex-box gap3">
                                            <CalendarMonthIcon /> {goalEstimate.daysLeft}
                                        </div>
                                    </AccessibleTooltip>
                                    <AccessibleTooltip title={`${goalEstimate.energyTotal} energy`}>
                                        <div className="flex-box gap3">
                                            <MiscIcon icon={'energy'} height={18} width={15} />{' '}
                                            {goalEstimate.energyTotal}
                                        </div>
                                    </AccessibleTooltip>
                                </>
                            )}
                        </div>
                    </div>
                );
            }
        }
    };

    return (
        <Card
            variant="outlined"
            className={isGoalCompleted ? '!bg-[var(--success)]' : ''}
            sx={{
                width: 350,
                minHeight: 200,
            }}>
            <CardHeader
                action={
                    menuItemSelect ? (
                        <>
                            {!isGoalCompleted ? (
                                <IconButton onClick={() => menuItemSelect('edit')}>
                                    <Edit fontSize="small" />
                                </IconButton>
                            ) : undefined}
                            <IconButton onClick={() => menuItemSelect('delete')}>
                                <DeleteForever fontSize="small" />
                            </IconButton>
                        </>
                    ) : undefined
                }
                title={
                    <div className="flex-box gap5">
                        <span>#{goal.priority}</span>
                        <UnitShardIcon icon={goal.unitRoundIcon} height={30} />
                        <span style={{ fontSize: '1.2rem' }}>{goal.unitName ?? goal.unitId}</span>
                    </div>
                }
                subheader={calendarDate}
            />
            <CardContent>
                {getGoalInfo(goal)}
                <span>{goal.notes}</span>
            </CardContent>
        </Card>
    );
};
