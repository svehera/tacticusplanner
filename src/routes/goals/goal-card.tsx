import {
    ArrowForward,
    ArrowUpward,
    ArrowDownward,
    Block,
    CheckCircle,
    DeleteForever,
    Edit,
    FilterListOff,
} from '@mui/icons-material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LinkIcon from '@mui/icons-material/Link';
import { Card, CardContent, CardHeader } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import React, { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { ICharacter2 } from '@/models/interfaces';
import { charsUnlockShards, rarityToStars } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';
import { StaticDataService } from 'src/services';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';

import { Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { RankIcon } from '@/fsd/5-shared/ui/icons/rank.icon';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';
import { StarsIcon } from '@/fsd/5-shared/ui/icons/stars.icon';

import { CampaignImage } from '@/fsd/4-entities/campaign/campaign.icon';
import { IMow2 } from '@/fsd/4-entities/mow/@x/unit';

import { CharacterAbilitiesTotal } from '@/fsd/3-features/characters/components/character-abilities-total';
import { CharacterRaidGoalSelect, IGoalEstimate } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { ShardsService } from '@/fsd/3-features/goals/shards.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';
import { XpTotal } from '@/fsd/3-features/goals/xp-total';

import { MowMaterialsTotal } from '@/fsd/1-pages/learn-mow/mow-materials-total';

import { XpGoalProgressBar } from './xp-book-progress-bar';

interface Props {
    goal: CharacterRaidGoalSelect;
    goalEstimate?: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete' | 'moveUp' | 'moveDown') => void;
    bgColor: string;
    characters: ICharacter2[];
    mows: IMow2[];
    bookRarity: Rarity;
}

/**
 * Shared helper to calculate estimated date based on days left.
 * If this logic is needed in goals-table.tsx, move this to src/shared-logic/functions.ts
 */
const getEstimatedDate = (days: number | undefined): string => {
    if (days === undefined || !Number.isFinite(days) || days <= 0) return '';
    const date = new Date();
    date.setDate(date.getDate() + Math.ceil(days) - 1);
    return formatDateWithOrdinal(date);
};

export const GoalCard: React.FC<Props> = ({
    goal,
    menuItemSelect,
    goalEstimate: passed,
    bgColor,
    characters,
    mows,
    bookRarity,
}: Props) => {
    const goalEstimate: IGoalEstimate = passed ?? {
        daysLeft: 0,
        daysTotal: 0,
        oTokensTotal: 0,
        energyTotal: 0,
        xpBooksTotal: 0,
        goalId: '',
    };
    const isGoalCompleted = GoalsService.isGoalCompleted(goal, goalEstimate);

    // Material/Shards completion date (used in Subheader and general tooltips)
    const calendarDate: string = useMemo(() => getEstimatedDate(goalEstimate.daysLeft), [goalEstimate.daysLeft]);

    const getGoalInfo = (goal: CharacterRaidGoalSelect) => {
        switch (goal.type) {
            case PersonalGoalType.Ascend: {
                const isSameRarity = goal.rarityStart === goal.rarityEnd;
                const minStars = rarityToStars[goal.rarityEnd];
                const isMinStars = minStars === goal.starsEnd;

                const shardsData = UpgradesService.getShardsForGoal(characters, mows, goal);
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
                        {shardsData.totalIncrementalShardsNeeded > 0 && (
                            <div>
                                <b>
                                    {shardsData.incrementalShardsAcquired} of {shardsData.totalIncrementalShardsNeeded}
                                </b>{' '}
                                Shards
                            </div>
                        )}
                        {shardsData.totalIncrementalMythicShardsNeeded > 0 && (
                            <div>
                                <b>
                                    {shardsData.incrementalMythicShardsAcquired} of{' '}
                                    {shardsData.totalIncrementalMythicShardsNeeded}
                                </b>{' '}
                                Mythic Shards
                            </div>
                        )}
                        <div className="flex-box wrap gap-2">
                            {goalEstimate.included && (
                                <>
                                    <AccessibleTooltip
                                        title={`${goalEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                        <div className="flex-box gap-[3px]">
                                            <CalendarMonthIcon /> {goalEstimate.daysLeft}
                                        </div>
                                    </AccessibleTooltip>
                                    {!!goalEstimate.energyTotal && (
                                        <AccessibleTooltip title={`${goalEstimate.energyTotal} energy`}>
                                            <div className="flex-box gap-[3px]">
                                                <MiscIcon icon={'energy'} height={18} width={15} />{' '}
                                                {goalEstimate.energyTotal}
                                            </div>
                                        </AccessibleTooltip>
                                    )}
                                </>
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
                        <div className="flex-box wrap gap-2">
                            {goalEstimate.included && (
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
                        {(goalEstimate.xpDaysLeft !== undefined ||
                            !!goalEstimate.xpBooksApplied ||
                            !!goalEstimate.xpBooksRequired ||
                            goalEstimate.xpDaysLeft === undefined) && (
                            <div className="flex-box gap10 wrap">
                                <AccessibleTooltip
                                    title={
                                        goalEstimate.xpDaysLeft === undefined
                                            ? 'XP Income not set in Daily Raids settings'
                                            : `${Math.ceil(goalEstimate.xpDaysLeft)} days. Estimated date ${getEstimatedDate(goalEstimate.xpDaysLeft)}`
                                    }>
                                    <div className="flex-box gap3">
                                        <CalendarMonthIcon
                                            sx={{
                                                color: goalEstimate.xpDaysLeft === undefined ? 'error.main' : 'inherit',
                                            }}
                                        />
                                        {Math.ceil(goalEstimate.xpDaysLeft ?? 0)}
                                    </div>
                                </AccessibleTooltip>
                                {goalEstimate.xpBooksApplied !== undefined &&
                                    goalEstimate.xpBooksRequired !== undefined && (
                                        <XpGoalProgressBar
                                            applied={goalEstimate.xpBooksApplied ?? 0}
                                            required={goalEstimate.xpBooksRequired ?? 0}
                                            bookRarity={bookRarity}
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
                                    <ArrowForward />
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
                            <div className="px-0 py-2.5">
                                <MowMaterialsTotal
                                    size="small"
                                    mowAlliance={goal.unitAlliance}
                                    total={goalEstimate.mowEstimate}
                                />
                            </div>
                        )}
                        {goalEstimate.included && (
                            <>
                                <div className="flex-box gap10 wrap">
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
                                </div>
                            </>
                        )}
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
                        {(goalEstimate.xpDaysLeft !== undefined || goalEstimate.xpDaysLeft === undefined) && (
                            <div className="flex-box gap10 wrap">
                                <AccessibleTooltip
                                    title={
                                        goalEstimate.xpDaysLeft === undefined
                                            ? 'XP Income not set / No XP needed for this goal'
                                            : `${Math.ceil(goalEstimate.xpDaysLeft)} days. Estimated date ${getEstimatedDate(goalEstimate.xpDaysLeft)}`
                                    }>
                                    <div className="flex-box gap3">
                                        <CalendarMonthIcon
                                            sx={{
                                                color: goalEstimate.xpDaysLeft === undefined ? 'error.main' : 'inherit',
                                            }}
                                        />
                                        {Math.ceil(goalEstimate.xpDaysLeft ?? 0)}
                                    </div>
                                </AccessibleTooltip>
                                {goalEstimate.xpBooksApplied !== undefined &&
                                    goalEstimate.xpBooksRequired !== undefined && (
                                        <XpGoalProgressBar
                                            applied={goalEstimate.xpBooksApplied}
                                            required={goalEstimate.xpBooksRequired}
                                            bookRarity={bookRarity}
                                        />
                                    )}
                            </div>
                        )}
                        {goalEstimate.xpDaysLeft === undefined && xpEstimate && <XpTotal {...xpEstimate} />}
                        {goalEstimate.abilitiesEstimate && (
                            <div className="flex-box gap-[3px]">
                                <CharacterAbilitiesTotal {...goalEstimate.abilitiesEstimate} />
                            </div>
                        )}
                        {goalEstimate.xpDaysLeft !== undefined && (
                            <span> (XP in {Math.ceil(goalEstimate.xpDaysLeft)} days)</span>
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
            className={isGoalCompleted ? 'bg-(--success)!' : ''}
            sx={{
                width: 350,
                minHeight: 200,
                background: bgColor,
            }}>
            <CardHeader
                action={
                    menuItemSelect ? (
                        <div className="flex items-center">
                            {!!goalEstimate?.completed && !goalEstimate?.blocked && (
                                <AccessibleTooltip title={`Goal is completed in current estimation.`}>
                                    <span className="flex-box gap-[3px]" tabIndex={0}>
                                        <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />
                                    </span>
                                </AccessibleTooltip>
                            )}
                            {!!goalEstimate?.blocked && (
                                <AccessibleTooltip
                                    title={`Goal is blocked because required farm nodes are not accessible. See Plan > Daily Raids > Raids Plan > Blocked Upgrades for details.`}>
                                    <span className="flex-box gap-[3px]" tabIndex={0}>
                                        <Block fontSize="small" sx={{ color: 'error.main' }} />
                                    </span>
                                </AccessibleTooltip>
                            )}
                            {!goalEstimate?.included && (
                                <AccessibleTooltip
                                    title={`Goal is excluded from current estimation. Enable it using the goal filter in the Daily Raids page.`}>
                                    <span className="flex-box gap-[3px]" tabIndex={0}>
                                        <FilterListOff fontSize="small" sx={{ color: 'error.main' }} />
                                    </span>
                                </AccessibleTooltip>
                            )}
                            <IconButton aria-label="Increase Goal Priority" onClick={() => menuItemSelect('moveUp')}>
                                <ArrowUpward fontSize="small" />
                            </IconButton>
                            <IconButton aria-label="Decrease Goal Priority" onClick={() => menuItemSelect('moveDown')}>
                                <ArrowDownward fontSize="small" />
                            </IconButton>
                            <IconButton aria-label="Edit Goal" onClick={() => menuItemSelect('edit')}>
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton aria-label="Delete Goal" onClick={() => menuItemSelect('delete')}>
                                <DeleteForever fontSize="small" />
                            </IconButton>
                        </div>
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
