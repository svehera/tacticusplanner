import React, { useMemo } from 'react';
import { PersonalGoalType, Rank } from '../../models/enums';

import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { ArrowForward, DeleteForever, Edit, Info } from '@mui/icons-material';
import { charsUnlockShards, rankToLevel, rarityToStars } from '../../models/constants';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';
import { CharactersXpService } from 'src/v2/features/characters/characters-xp.service';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { CharacterRaidGoalSelect, IGoalEstimate } from 'src/v2/features/goals/goals.models';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import { CharacterImage } from 'src/shared-components/character-image';
import { StarsImage } from 'src/v2/components/images/stars-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { CampaignImage } from 'src/v2/components/images/campaign-image';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { isMobile } from 'react-device-detect';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import LinkIcon from '@mui/icons-material/Link';
import { StaticDataService } from 'src/services';

interface Props {
    goal: CharacterRaidGoalSelect;
    goalEstimate?: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete') => void;
}

export const GoalCard: React.FC<Props> = ({ goal, menuItemSelect, goalEstimate: passed }) => {
    const goalEstimate = passed ?? {
        daysLeft: 0,
        daysTotal: 0,
        oTokensTotal: 0,
        energyTotal: 0,
        goalId: '',
        xpEstimate: null,
    };
    const isGoalCompleted = GoalsService.isGoalCompleted(goal);

    const calendarDate: string = useMemo(() => {
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
                const linkBase = isMobile ? '/mobile/learn/rankLookup' : '/learn/rankLookup';
                const params = `?character=${goal.characterName}&rankStart=${Rank[goal.rankStart]}&rankEnd=${
                    Rank[goal.rankEnd]
                }&rankPoint5=${goal.rankPoint5}`;

                return (
                    <div>
                        <div className="flex-box between">
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
                        {xpEstimate && (
                            <div className="flex-box gap5">
                                <span>(XP) Codex of War: {xpEstimate.legendaryBooks}</span>
                                <AccessibleTooltip
                                    title={
                                        <span>
                                            Current level: {xpEstimate.currentLevel}
                                            <br />
                                            Target level: {xpEstimate.targetLevel}
                                            <br />
                                            Gold: {xpEstimate.gold}
                                            <br />
                                            XP left: {xpEstimate.xpLeft}
                                        </span>
                                    }>
                                    <Info color="primary" />
                                </AccessibleTooltip>
                            </div>
                        )}
                        <Button
                            size="small"
                            variant={'outlined'}
                            component={Link}
                            to={linkBase + params}
                            target={isMobile ? '_self' : '_blank'}>
                            <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Upgrades</span>
                        </Button>
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
                            {!!goalEstimate.daysLeft ||
                                (!!goalEstimate.energyTotal && (
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
                                ))}
                        </div>
                    </div>
                );
            }
        }
    };

    return (
        <Card
            sx={{
                width: 350,
                minHeight: 200,
                backgroundColor: isGoalCompleted ? 'lightgreen' : 'white',
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
                        <CharacterImage icon={goal.characterIcon} imageSize={30} />
                        <span style={{ fontSize: '1.2rem' }}>{goal.characterName}</span>
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
