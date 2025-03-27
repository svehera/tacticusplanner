﻿import React, { useContext, useMemo, useState } from 'react';
import { PersonalGoalType, Rank } from 'src/models/enums';

import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { ArrowForward, DeleteForever, DragHandle, Edit } from '@mui/icons-material';
import { charsUnlockShards, rarityToStars } from 'src/models/constants';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';
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
import { MowMaterialsTotal } from 'src/v2/features/lookup/mow-materials-total';
import { CharacterAbilitiesTotal } from 'src/v2/features/characters/components/character-abilities-total';
import { XpTotal } from 'src/v2/features/goals/xp-total';
import { DispatchContext } from 'src/reducers/store.provider';

interface Props {
    goal: CharacterRaidGoalSelect;
    goalEstimate?: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete') => void;
    containerRef?: React.RefObject<HTMLDivElement | null>;
    goalList?: CharacterRaidGoalSelect[];
}

export const GoalCard: React.FC<Props> = ({ goal, menuItemSelect, goalEstimate: passed, containerRef, goalList }) => {
    const dispatch = useContext(DispatchContext);

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
                const params = `?character=${goal.unitName}&rankStart=${Rank[goal.rankStart]}&rankEnd=${
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
                        {xpEstimate && <XpTotal {...xpEstimate} />}
                        <Button
                            size="small"
                            variant={'outlined'}
                            component={Link}
                            to={linkBase + params}
                            target={'_self'}>
                            <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Lookup</span>
                        </Button>
                    </div>
                );
            }
            case PersonalGoalType.MowAbilities: {
                const linkBase = isMobile ? '/mobile/learn/mowLookup' : '/learn/mowLookup';
                const params = `?mow=${goal.unitId}&pStart=${goal.primaryStart}&pEnd=${goal.primaryEnd}&sStart=${goal.secondaryStart}&sEnd=${goal.secondaryEnd}`;
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
                                        <RarityImage key={x} rarity={x} />
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
                            <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Lookup</span>
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

    const [isDragging, setIsDragging] = useState(false);

    const draggable = !isGoalCompleted && isDragging;

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setIsDragging(false);

        // Get the current card's position and calculate new position
        const cards = containerRef?.current?.querySelectorAll('.MuiCard-root');
        if (!cards) {
            return;
        }
        const currentCard = e.currentTarget;
        const currentIndex = Array.from(cards).indexOf(currentCard);
        const mouseY = e.clientY;

        // Find potential new position based on mouse position
        let newPosition = currentIndex;
        cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            if (mouseY > rect.top && mouseY < rect.bottom && index !== currentIndex) {
                newPosition = index;
            }
        });

        // For debugging
        console.log(`Current position: ${currentIndex}, Potential new position: ${newPosition}`);

        // Find priority of card in newPosition
        const priority = goalList?.[newPosition]?.priority;
        if (!priority) {
            return;
        }

        console.log(`Priority: ${priority}`);

        const updatedGoal = { ...goal, priority: priority };
        dispatch.goals({ type: 'Update', goal: updatedGoal });
    };

    return (
        <Card
            variant="outlined"
            className={isGoalCompleted ? '!bg-[var(--success)]' : ''}
            sx={{
                width: 350,
                minHeight: 200,
                cursor: draggable ? 'grab' : 'default',
            }}
            draggable={draggable}
            onDragEnd={handleDragEnd}>
            <CardHeader
                action={
                    menuItemSelect ? (
                        <>
                            {!isGoalCompleted ? (
                                <>
                                    <IconButton
                                        className="drag-handle"
                                        sx={{ cursor: 'grab' }}
                                        aria-label="Drag to reorder goal"
                                        onMouseDown={() => setIsDragging(true)}>
                                        <DragHandle fontSize="small" />
                                    </IconButton>
                                    <IconButton onClick={() => menuItemSelect('edit')}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </>
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
                        <CharacterImage icon={goal.unitIcon} height={30} />
                        <span style={{ fontSize: '1.2rem' }}>{goal.unitName}</span>
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
