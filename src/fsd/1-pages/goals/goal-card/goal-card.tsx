/* eslint-disable import-x/no-internal-modules */
import { BadgeCheck, Lock, Pause, Play } from 'lucide-react';
import React, { useMemo } from 'react';

import { GoToRaidsButton } from 'src/routes/goals/raids-button';

import { getEstimatedDate } from '@/fsd/5-shared/lib';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { PersonalGoalType } from '@/fsd/4-entities/goal';
import { IMow2 } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { IGoalEstimate } from '@/fsd/3-features/goals';
import { TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';

import { GoalCardActions } from './actions';
import { GoalCardAscend } from './ascend';
import { GoalCardCharacterAbilities } from './character-abilities';
import { GoalCardMowAbilities } from './mow-abilities';
import { GoalCardUnlock } from './unlock';
import { GoalCardUpgradeMaterial } from './upgrade-material';
import { GoalCardUpgradeRank } from './upgrade-rank';

/** Returns true if the goal type has an associated daily-raids shortcut button. */
const showRaidsButton = (goal: TypedGoalSelect): boolean =>
    goal.type === PersonalGoalType.UpgradeRank ||
    goal.type === PersonalGoalType.MowAbilities ||
    goal.type === PersonalGoalType.UpgradeMaterial;

interface Props {
    goal: TypedGoalSelect;
    goalEstimate?: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete' | 'moveUp' | 'moveDown') => void;
    onToggleInclude?: () => void;
    bgColor: string;
    characters: ICharacter2[];
    mows: IMow2[];
    bookRarity: Rarity;
}

/** Renders a full goal card including header, type-specific body, and optional footer actions. */
export const GoalCard: React.FC<Props> = ({
    goal,
    menuItemSelect,
    onToggleInclude,
    goalEstimate: passed,
    bgColor,
    characters,
    mows,
    bookRarity,
}: Props) => {
    const goalEstimate: IGoalEstimate = passed ?? {
        goalId: goal.goalId,
        daysLeft: 0,
        daysTotal: 0,
        oTokensTotal: 0,
        energyTotal: 0,
        xpBooksTotal: 0,
    };
    const calendarDate = useMemo(() => (passed ? getEstimatedDate(passed.daysLeft) : undefined), [passed]);

    const renderBody = () => {
        switch (goal.type) {
            case PersonalGoalType.Ascend: {
                return (
                    <GoalCardAscend
                        goal={goal}
                        goalEstimate={goalEstimate}
                        calendarDate={calendarDate}
                        characters={characters}
                        mows={mows}
                    />
                );
            }
            case PersonalGoalType.UpgradeRank: {
                return (
                    <GoalCardUpgradeRank
                        goal={goal}
                        goalEstimate={goalEstimate}
                        calendarDate={calendarDate}
                        bookRarity={bookRarity}
                    />
                );
            }
            case PersonalGoalType.MowAbilities: {
                return <GoalCardMowAbilities goal={goal} goalEstimate={goalEstimate} calendarDate={calendarDate} />;
            }
            case PersonalGoalType.CharacterAbilities: {
                return <GoalCardCharacterAbilities goal={goal} goalEstimate={goalEstimate} />;
            }
            case PersonalGoalType.Unlock: {
                return <GoalCardUnlock goal={goal} goalEstimate={goalEstimate} calendarDate={calendarDate} />;
            }
            case PersonalGoalType.UpgradeMaterial: {
                return <GoalCardUpgradeMaterial goalEstimate={goalEstimate} calendarDate={calendarDate} />;
            }
        }
    };

    const isReached = !!goalEstimate.completed && !goalEstimate.blocked;
    const isBlocked = !!goalEstimate.blocked;
    const hasFooter = isReached || isBlocked || !!onToggleInclude || showRaidsButton(goal);

    const stripeClass = isReached
        ? 'border-l-[3px] border-l-(--success)'
        : isBlocked
          ? 'border-l-[3px] border-l-amber-500'
          : '';

    const cardBackgroundStyle =
        isReached || bgColor === 'rgba(0, 0, 0, 0)'
            ? { backgroundColor: 'var(--card)' }
            : {
                  backgroundColor: 'var(--card)',
                  backgroundImage: `linear-gradient(${bgColor}, ${bgColor})`,
              };

    const material =
        goal.type === PersonalGoalType.UpgradeMaterial
            ? UpgradesService.getUpgradeMaterial(goal.upgradeMaterialId)
            : undefined;

    return (
        <div
            className={`flex min-h-[200px] w-[350px] flex-col overflow-hidden rounded-xl border border-(--card-border) text-(--card-fg) shadow-sm transition-colors ${stripeClass}`}
            style={cardBackgroundStyle}>
            {/* Header: 3-column grid — [#n + icon] | name + date | actions */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 border-b border-(--card-border) px-4 py-3">
                <div className="flex items-center gap-1">
                    <span className="text-[1.35rem] leading-none font-semibold text-(--soft-fg)">#{goal.priority}</span>
                    {goal.type === PersonalGoalType.UpgradeMaterial && (
                        <UpgradeImage
                            material={goal.upgradeMaterialId}
                            iconPath={material?.icon ?? ''}
                            rarity={RarityMapper.stringToRarityString(material?.rarity ?? '')}
                            size={40}
                        />
                    )}
                    {goal.type !== PersonalGoalType.UpgradeMaterial && (
                        <UnitShardIcon icon={goal.unitRoundIcon} height={40} />
                    )}
                </div>
                <div className="flex min-w-0 flex-col">
                    <span className="text-[1.05rem] leading-snug font-semibold text-(--fg)">
                        {goal.type === PersonalGoalType.UpgradeMaterial && (
                            <span>{UpgradesService.getUpgradeMaterial(goal.upgradeMaterialId)?.material}</span>
                        )}
                        {goal.type !== PersonalGoalType.UpgradeMaterial && (goal.unitName ?? goal.unitId)}
                    </span>
                    {calendarDate && <span className="text-xs text-(--soft-fg)">{calendarDate}</span>}
                </div>
                <GoalCardActions menuItemSelect={menuItemSelect} />
            </div>
            <div className="flex flex-1 flex-col px-4 pt-3 pb-3 text-sm">
                <div className="flex-1">
                    {renderBody()}
                    {goal.notes && <p className="mt-2 text-sm text-(--soft-fg)">{goal.notes}</p>}
                </div>
                {hasFooter && (
                    <>
                        <div className="mt-3 mb-2 border-t border-(--card-border)" />
                        <div className="flex items-center justify-between gap-2">
                            {/* Status pill — one slot, four states */}
                            {isReached ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-(--success)/15 px-3 py-1.5 text-sm font-medium text-(--success)">
                                    <BadgeCheck className="size-3.5" />
                                    Reached
                                </span>
                            ) : isBlocked ? (
                                onToggleInclude ? (
                                    <button
                                        type="button"
                                        onClick={onToggleInclude}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-amber-500/15 px-3 py-1.5 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/25">
                                        <Lock className="size-3.5" />
                                        Locked
                                    </button>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-sm font-medium text-amber-500">
                                        <Lock className="size-3.5" />
                                        Locked
                                    </span>
                                )
                            ) : onToggleInclude ? (
                                <button
                                    type="button"
                                    onClick={onToggleInclude}
                                    className={[
                                        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 py-1.5 text-sm font-medium transition-colors',
                                        goal.include
                                            ? 'bg-(--primary)/15 text-(--primary) hover:bg-(--primary)/25'
                                            : 'bg-(--soft-fg)/10 text-(--soft-fg) hover:bg-(--soft-fg)/20',
                                    ].join(' ')}>
                                    {goal.include ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                                    {goal.include ? 'In Progress' : 'Paused'}
                                </button>
                            ) : undefined}
                            {/* Raids shortcut — disabled (muted) when blocked, hidden when reached */}
                            {!isReached &&
                                showRaidsButton(goal) &&
                                (isBlocked ? (
                                    <span className="cursor-not-allowed text-sm text-(--soft-fg)/50">
                                        Open in raids →
                                    </span>
                                ) : (
                                    <GoToRaidsButton
                                        unitId={
                                            goal.type === PersonalGoalType.UpgradeMaterial
                                                ? goal.upgradeMaterialId
                                                : goal.unitId
                                        }
                                    />
                                ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
