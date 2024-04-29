import React, { useMemo } from 'react';
import { PersonalGoalType, Rank } from '../../models/enums';

import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { ArrowForward, DeleteForever, Edit, Info } from '@mui/icons-material';
import { charsUnlockShards, rankToLevel, rarityToStars } from '../../models/constants';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';
import { CharactersXpService } from 'src/v2/features/characters/characters-xp.service';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { CharacterRaidGoalSelect } from 'src/v2/features/goals/goals.models';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import { CharacterImage } from 'src/shared-components/character-image';
import { StarsImage } from 'src/v2/components/images/stars-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { CampaignImage } from 'src/v2/components/images/campaign-image';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface Props {
    goal: CharacterRaidGoalSelect;
    daysEstimate: { daysLeft: number; tokens: number; energy: number };
    menuItemSelect?: (item: 'edit' | 'delete') => void;
}

export const GoalCard: React.FC<Props> = ({ goal, menuItemSelect, daysEstimate }) => {
    const isGoalCompleted = GoalsService.isGoalCompleted(goal);

    const calendarDate: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysEstimate.daysLeft - 1);

        return formatDateWithOrdinal(nextDate);
    }, [daysEstimate.daysLeft]);

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
                            <AccessibleTooltip title={`${daysEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                <div className="flex-box gap3">
                                    <CalendarMonthIcon /> {daysEstimate.daysLeft}
                                </div>
                            </AccessibleTooltip>
                            <AccessibleTooltip title={`${daysEstimate.energy} energy`}>
                                <div className="flex-box gap3">
                                    <MiscIcon icon={'energy'} height={18} width={15} /> {daysEstimate.energy}
                                </div>
                            </AccessibleTooltip>

                            <AccessibleTooltip title={`${daysEstimate.tokens} Onslaught tokens`}>
                                <div className="flex-box gap3">
                                    <CampaignImage campaign={'Onslaught'} size={18} /> {daysEstimate.tokens}
                                </div>
                            </AccessibleTooltip>
                        </div>
                    </div>
                );
            }
            case PersonalGoalType.UpgradeRank: {
                const targetLevel = rankToLevel[((goal.rankEnd ?? 1) - 1) as Rank];
                const xpEstimate = CharactersXpService.getLegendaryTomesCount(goal.level, goal.xp, targetLevel);
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
                            <AccessibleTooltip title={`${daysEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                <div className="flex-box gap3">
                                    <CalendarMonthIcon /> {daysEstimate.daysLeft}
                                </div>
                            </AccessibleTooltip>
                            <AccessibleTooltip title={`${daysEstimate.energy} energy`}>
                                <div className="flex-box gap3">
                                    <MiscIcon icon={'energy'} height={18} width={15} /> {daysEstimate.energy}
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
                            <AccessibleTooltip title={`${daysEstimate.daysLeft} days. Estimated date ${calendarDate}`}>
                                <div className="flex-box gap3">
                                    <CalendarMonthIcon /> {daysEstimate.daysLeft}
                                </div>
                            </AccessibleTooltip>
                            <AccessibleTooltip title={`${daysEstimate.energy} energy`}>
                                <div className="flex-box gap3">
                                    <MiscIcon icon={'energy'} height={18} width={15} /> {daysEstimate.energy}
                                </div>
                            </AccessibleTooltip>
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
                        <React.Fragment>
                            {!isGoalCompleted ? (
                                <IconButton onClick={() => menuItemSelect('edit')}>
                                    <Edit fontSize="small" />
                                </IconButton>
                            ) : undefined}
                            <IconButton onClick={() => menuItemSelect('delete')}>
                                <DeleteForever fontSize="small" />
                            </IconButton>
                        </React.Fragment>
                    ) : undefined
                }
                title={
                    <div className="flex-box gap5">
                        <span>#{goal.priority}</span>
                        <CharacterImage icon={goal.characterIcon} imageSize={30} />
                        <span style={{ fontSize: '1.2rem' }}>{goal.characterName}</span>
                    </div>
                }
                subheader={PersonalGoalType[goal.type]}
            />
            <CardContent>
                {getGoalInfo(goal)}
                <span>{goal.notes}</span>
            </CardContent>
        </Card>
    );
};
