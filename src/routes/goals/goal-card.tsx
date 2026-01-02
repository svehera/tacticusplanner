import { ArrowForward, DeleteForever, Edit } from '@mui/icons-material';
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

import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';
import { StarsIcon } from '@/fsd/5-shared/ui/icons/stars.icon';

import { CampaignImage } from '@/fsd/4-entities/campaign/campaign.icon';
import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';

import { CharacterAbilitiesTotal } from '@/fsd/3-features/characters/components/character-abilities-total';
import { CharacterRaidGoalSelect, IGoalEstimate } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { ShardsService } from '@/fsd/3-features/goals/shards.service';
import { XpTotal } from '@/fsd/3-features/goals/xp-total';

import { MowMaterialsTotal } from '@/fsd/1-pages/learn-mow/mow-materials-total';

import { XpGoalProgressBar } from './xp-book-progress-bar';

interface Props {
    goal: CharacterRaidGoalSelect;
    goalEstimate?: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete') => void;
    bgColor: string;
}

export const GoalCard: React.FC<Props> = ({ goal, menuItemSelect, goalEstimate: passed, bgColor }) => {
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
                const targetMythicShards = ShardsService.getTargetMythicShards(goal);
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
                        {targetShards > 0 && (
                            <div>
                                <b>
                                    {goal.shards} of {targetShards}
                                </b>{' '}
                                Shards
                            </div>
                        )}
                        {targetMythicShards > 0 && (
                            <div>
                                <b>
                                    {goal.mythicShards} of {targetMythicShards}
                                </b>{' '}
                                Mythic Shards
                            </div>
                        )}
                        <div className="flex-box gap10 wrap">
                            <AccessibleTooltip title={`${goalEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                <div className="flex-box gap-[3px]">
                                    <CalendarMonthIcon /> {goalEstimate.daysLeft}
                                </div>
                            </AccessibleTooltip>
                            {!!goalEstimate.energyTotal && (
                                <AccessibleTooltip title={`${goalEstimate.energyTotal} energy`}>
                                    <div className="flex-box gap-[3px]">
                                        <MiscIcon icon={'energy'} height={18} width={15} /> {goalEstimate.energyTotal}
                                    </div>
                                </AccessibleTooltip>
                            )}

                            {!!goalEstimate.oTokensTotal && (
                                <AccessibleTooltip title={`${goalEstimate.oTokensTotal} Onslaught tokens`}>
                                    <div className="flex-box gap-[3px]">
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
                        </div>
                        <div className="flex-box gap10 wrap">
                            <AccessibleTooltip title={`${goalEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                <div className="flex-box gap-[3px]">
                                    <CalendarMonthIcon /> {goalEstimate.daysLeft}
                                </div>
                            </AccessibleTooltip>
                            <AccessibleTooltip title={`${goalEstimate.energyTotal} energy`}>
                                <div className="flex-box gap-[3px]">
                                    <MiscIcon icon={'energy'} height={18} width={15} /> {goalEstimate.energyTotal}
                                </div>
                            </AccessibleTooltip>
                        </div>
                        {goalEstimate.xpDaysLeft !== undefined && (
                            <div className="flex-box gap10 wrap">
                                <AccessibleTooltip
                                    title={`${goalEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                    <div className="flex-box gap3">
                                        <CalendarMonthIcon /> {goalEstimate.xpDaysLeft}
                                    </div>
                                </AccessibleTooltip>
                                {goalEstimate.xpBooksApplied !== undefined &&
                                    goalEstimate.xpBooksRequired !== undefined && (
                                        <XpGoalProgressBar
                                            applied={goalEstimate.xpBooksApplied}
                                            required={goalEstimate.xpBooksRequired}
                                        />
                                    )}
                            </div>
                        )}
                        {goalEstimate.xpDaysLeft === undefined && xpEstimate && <XpTotal {...xpEstimate} />}
                        <Button
                            size="small"
                            variant={'outlined'}
                            component={Link}
                            to={linkBase + params}
                            target={'_self'}>
                            <LinkIcon /> <span className="pl-[5px]">Go to Raids Table</span>
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
                                    <div className="flex-box gap-[3px]">
                                        <span>Primary:</span> <b>{goal.primaryStart}</b> <ArrowForward />
                                        <b>{goal.primaryEnd}</b>
                                    </div>
                                )}

                                {hasSecondaryGoal && (
                                    <div className="flex-box gap-[3px]">
                                        <span>Secondary:</span> <b>{goal.secondaryStart}</b> <ArrowForward />
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
                        <div>
                            <b>
                                {goal.shards} of {targetShards}
                            </b>{' '}
                            Shards
                        </div>
                        {goalEstimate.mowEstimate && (
                            <div className="py-2.5 px-0">
                                <MowMaterialsTotal
                                    size="small"
                                    mowAlliance={goal.unitAlliance}
                                    total={goalEstimate.mowEstimate}
                                />
                            </div>
                        )}
                        <div className="flex-box gap10 wrap">
                            <AccessibleTooltip title={`${goalEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                <div className="flex-box gap-[3px]">
                                    <CalendarMonthIcon /> {goalEstimate.daysLeft}
                                </div>
                            </AccessibleTooltip>
                            <AccessibleTooltip title={`${goalEstimate.energyTotal} energy`}>
                                <div className="flex-box gap-[3px]">
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
                            <LinkIcon /> <span className="pl-[5px]">Go to Raids Table</span>
                        </Button>
                    </div>
                );
            }
            case PersonalGoalType.CharacterAbilities: {
                const hasActiveGoal = goal.activeEnd > goal.activeStart;
                const hasPassiveGoal = goal.passiveEnd > goal.passiveStart;
                const { xpEstimateAbilities: xpEstimate } = goalEstimate;
                return (
                    <div>
                        <div className="flex-box gap10">
                            <div className="flex-box column start">
                                {hasActiveGoal && (
                                    <div className="flex-box gap-[3px]">
                                        <span>Active:</span> <b>{goal.activeStart}</b> <ArrowForward />
                                        <b>{goal.activeEnd}</b>
                                    </div>
                                )}

                                {hasPassiveGoal && (
                                    <div className="flex-box gap-[3px]">
                                        <span>Passive:</span> <b>{goal.passiveStart}</b> <ArrowForward />
                                        <b>{goal.passiveEnd}</b>
                                    </div>
                                )}
                            </div>
                        </div>
                        {goalEstimate.xpDaysLeft !== undefined && (
                            <div className="flex-box gap10 wrap">
                                <AccessibleTooltip
                                    title={`${goalEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                    <div className="flex-box gap3">
                                        <CalendarMonthIcon /> {goalEstimate.xpDaysLeft}
                                    </div>
                                </AccessibleTooltip>
                                {goalEstimate.xpBooksApplied !== undefined &&
                                    goalEstimate.xpBooksRequired !== undefined && (
                                        <XpGoalProgressBar
                                            applied={goalEstimate.xpBooksApplied}
                                            required={goalEstimate.xpBooksRequired}
                                        />
                                    )}
                            </div>
                        )}
                        {goalEstimate.xpDaysLeft === undefined && xpEstimate && <XpTotal {...xpEstimate} />}
                        {goalEstimate.abilitiesEstimate && (
                            <div className="py-2.5 px-0">
                                <CharacterAbilitiesTotal {...goalEstimate.abilitiesEstimate} />
                            </div>
                        )}
                        {goalEstimate.xpDaysLeft !== undefined && <span> (XP in {goalEstimate.xpDaysLeft} days)</span>}
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
                                        <div className="flex-box gap-[3px]">
                                            <CalendarMonthIcon /> {goalEstimate.daysLeft}
                                        </div>
                                    </AccessibleTooltip>
                                    <AccessibleTooltip title={`${goalEstimate.energyTotal} energy`}>
                                        <div className="flex-box gap-[3px]">
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
                background: bgColor,
            }}>
            <CardHeader
                action={
                    menuItemSelect ? (
                        <>
                            <IconButton onClick={() => menuItemSelect('edit')}>
                                <Edit fontSize="small" />
                            </IconButton>
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
                        <span className="text-[1.2rem]">{goal.unitName ?? goal.unitId}</span>
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
