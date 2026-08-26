/* eslint-disable import-x/no-internal-modules */
import { BadgeCheck, GripVertical, Lock, Pause, Play } from 'lucide-react';
import React, { useMemo } from 'react';

import { GoToRaidsButton } from 'src/routes/goals/raids-button';

import { getEstimatedDateShort } from '@/fsd/5-shared/lib';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip, type DragHandleProps } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { PersonalGoalType } from '@/fsd/4-entities/goal';
import { IMow2 } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { getDoneByDays, IGoalEstimate, isGoalReached } from '@/fsd/3-features/goals';
import { TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';

import { GoalCardActions } from './actions';
import { GoalCardAscend } from './ascend';
import { GoalCardCharacterAbilities } from './character-abilities';
import { GoalCardMetaLine } from './meta-line';
import { GoalCardMowAbilities } from './mow-abilities';
import { GoalCardPreFarmMaterial } from './pre-farm-material';
import { GoalCardUnlock } from './unlock';
import { GoalCardUpgradeMaterial } from './upgrade-material';
import { GoalCardUpgradeRank } from './upgrade-rank';

/** Kind-specific pieces the generic shell renders. The single source of per-type branching. */
interface GoalCardParts {
    portrait: React.ReactNode;
    title: string;
    body: React.ReactNode;
    showRaids: boolean;
    raidsTargetId: string;
}

interface Props {
    goal: TypedGoalSelect;
    goalEstimate?: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete') => void;
    onToggleInclude?: () => void;
    bgColor: string;
    characters: ICharacter2[];
    mows: IMow2[];
    bookRarity: Rarity;
    /** When provided, renders a drag grip in the header wired to the dnd-kit sortable activator. */
    dragHandle?: DragHandleProps;
    /** Moves the goal by one position within its section. Negative is up. */
    onMove?: (delta: number) => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}

/** Renders a full goal card: header, type-specific body, notes, and status/raids footer. */
export const GoalCard: React.FC<Props> = ({
    goal,
    menuItemSelect,
    onToggleInclude,
    goalEstimate: passed,
    bgColor,
    characters,
    mows,
    bookRarity,
    dragHandle,
    onMove,
    canMoveUp,
    canMoveDown,
}: Props) => {
    const goalEstimate: IGoalEstimate = passed ?? {
        goalId: goal.goalId,
        daysLeft: 0,
        daysTotal: 0,
        oTokensTotal: 0,
        energyTotal: 0,
        xpBooksTotal: 0,
    };
    // Done-by = the later of material and XP days, matching the table's "Done By" column.
    const doneByDays = passed ? Math.ceil(getDoneByDays(passed)) : 0;
    const calendarDate = useMemo(() => (passed ? getEstimatedDateShort(doneByDays) : undefined), [passed, doneByDays]);

    const parts: GoalCardParts = ((): GoalCardParts => {
        switch (goal.type) {
            case PersonalGoalType.Ascend: {
                return {
                    portrait: <UnitShardIcon icon={goal.unitRoundIcon} height={40} />,
                    title: goal.unitName ?? goal.unitId,
                    body: (
                        <GoalCardAscend goal={goal} goalEstimate={goalEstimate} characters={characters} mows={mows} />
                    ),
                    showRaids: false,
                    raidsTargetId: goal.unitId,
                };
            }
            case PersonalGoalType.UpgradeRank: {
                return {
                    portrait: <UnitShardIcon icon={goal.unitRoundIcon} height={40} />,
                    title: goal.unitName ?? goal.unitId,
                    body: <GoalCardUpgradeRank goal={goal} goalEstimate={goalEstimate} bookRarity={bookRarity} />,
                    showRaids: true,
                    raidsTargetId: goal.unitId,
                };
            }
            case PersonalGoalType.MowAbilities: {
                return {
                    portrait: <UnitShardIcon icon={goal.unitRoundIcon} height={40} />,
                    title: goal.unitName ?? goal.unitId,
                    body: <GoalCardMowAbilities goal={goal} goalEstimate={goalEstimate} />,
                    showRaids: true,
                    raidsTargetId: goal.unitId,
                };
            }
            case PersonalGoalType.CharacterAbilities: {
                return {
                    portrait: <UnitShardIcon icon={goal.unitRoundIcon} height={40} />,
                    title: goal.unitName ?? goal.unitId,
                    body: (
                        <GoalCardCharacterAbilities goal={goal} goalEstimate={goalEstimate} bookRarity={bookRarity} />
                    ),
                    showRaids: false,
                    raidsTargetId: goal.unitId,
                };
            }
            case PersonalGoalType.Unlock: {
                return {
                    portrait: <UnitShardIcon icon={goal.unitRoundIcon} height={40} />,
                    title: goal.unitName ?? goal.unitId,
                    body: <GoalCardUnlock goal={goal} goalEstimate={goalEstimate} />,
                    showRaids: false,
                    raidsTargetId: goal.unitId,
                };
            }
            case PersonalGoalType.UpgradeMaterial: {
                const material = UpgradesService.getUpgradeMaterial(goal.upgradeMaterialId);
                return {
                    portrait: (
                        <UpgradeImage
                            material={goal.upgradeMaterialId}
                            iconPath={material?.icon ?? ''}
                            rarity={RarityMapper.stringToRarityString(material?.rarity ?? '')}
                            size={40}
                        />
                    ),
                    title: material?.material ?? goal.upgradeMaterialId,
                    body: <GoalCardUpgradeMaterial goalEstimate={goalEstimate} />,
                    showRaids: true,
                    raidsTargetId: goal.upgradeMaterialId,
                };
            }
            case PersonalGoalType.PreFarmMaterialForGoals: {
                const material = UpgradesService.getUpgradeMaterial(goal.upgradeMaterialId);
                return {
                    portrait: (
                        <UpgradeImage
                            material={goal.upgradeMaterialId}
                            iconPath={material?.icon ?? ''}
                            rarity={RarityMapper.stringToRarityString(material?.rarity ?? '')}
                            size={40}
                        />
                    ),
                    title: material?.material ?? goal.upgradeMaterialId,
                    body: <GoalCardPreFarmMaterial goalEstimate={goalEstimate} calendarDate={calendarDate} />,
                    showRaids: true,
                    raidsTargetId: goal.upgradeMaterialId,
                };
            }
        }
    })();

    const isReached = isGoalReached(goalEstimate);
    const isBlocked = !!goalEstimate.blocked;

    const cardBackgroundStyle = isReached
        ? { backgroundColor: 'color-mix(in srgb, var(--success) 8%, var(--card))' }
        : bgColor === 'transparent'
          ? { backgroundColor: 'var(--card)' }
          : { backgroundColor: 'var(--card)', backgroundImage: `linear-gradient(${bgColor}, ${bgColor})` };

    // min-w keeps the button from shifting when Active/Paused toggles between differently-sized labels, and keeps
    // all four states the same width. h-10 (not content-driven padding) matches GoToRaidsButton's own height so the
    // footer row — and the whole card — isn't shorter on goal types where that sibling is absent (e.g. Ascend).
    const statusPillClassName =
        'inline-flex h-10 min-w-[160px] items-center justify-between gap-2 rounded-full bg-(--soft) pr-1 pl-3';
    // 44x44 tap target (mobile minimum) pulled toward the pill's h-10 with a negative margin. Always neutral —
    // it's the next action, not the current state.
    // Hover is --secondary itself, mixed with black/white — the exact formula buttonStyles() uses for its own
    // secondary-intent hover — so it's derived from the token (stays in sync if --secondary ever changes), not a
    // separately hardcoded palette shade.
    const statusActionButtonClassName =
        'flex size-11 shrink-0 -my-[2px] -mr-2 items-center justify-center rounded-full bg-(--secondary) text-(--secondary-fg) transition-colors hover:bg-[color-mix(in_oklab,var(--secondary)_85%,black_15%)] dark:hover:bg-[color-mix(in_oklab,var(--secondary)_90%,white_10%)] focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:outline-none';

    const renderStatusPill = () => {
        if (isReached) {
            const isIncluded = !!goal.include;
            const actionLabel = isIncluded ? 'Pause' : 'Resume';
            return (
                <div className={statusPillClassName}>
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-(--success)">
                        <BadgeCheck className="size-3.5" />
                        Reached
                    </span>
                    {onToggleInclude && (
                        <AccessibleTooltip title={actionLabel}>
                            <button
                                type="button"
                                onClick={onToggleInclude}
                                aria-label={actionLabel}
                                className={statusActionButtonClassName}>
                                {isIncluded ? (
                                    <Pause className="size-3.5" fill="currentColor" stroke="none" />
                                ) : (
                                    <Play className="size-3.5" fill="currentColor" stroke="none" />
                                )}
                            </button>
                        </AccessibleTooltip>
                    )}
                </div>
            );
        }
        if (isBlocked) {
            const isIncluded = !!goal.include;
            const actionLabel = isIncluded ? 'Pause' : 'Resume';
            return (
                <AccessibleTooltip title="Goal is blocked because required farm nodes are not accessible. See Plan > Daily Raids > Raids Plan > Blocked Upgrades for details.">
                    <div tabIndex={0} className={statusPillClassName}>
                        <span className="flex items-center gap-2 text-[13px] font-semibold text-(--warning)">
                            <Lock className="size-3.5" />
                            Locked
                        </span>
                        {onToggleInclude && (
                            <AccessibleTooltip title={actionLabel}>
                                <button
                                    type="button"
                                    onClick={onToggleInclude}
                                    aria-label={actionLabel}
                                    className={statusActionButtonClassName}>
                                    {isIncluded ? (
                                        <Pause className="size-3.5" fill="currentColor" stroke="none" />
                                    ) : (
                                        <Play className="size-3.5" fill="currentColor" stroke="none" />
                                    )}
                                </button>
                            </AccessibleTooltip>
                        )}
                    </div>
                </AccessibleTooltip>
            );
        }
        if (!onToggleInclude) return;
        const statusLabel = goal.include ? 'In Progress' : 'Paused';
        const actionLabel = goal.include ? 'Pause' : 'Resume';
        return (
            <div className={statusPillClassName}>
                <span
                    className={`flex items-center gap-2 text-[13px] font-semibold ${goal.include ? 'text-(--primary)' : 'text-(--soft-fg)'}`}>
                    <span aria-hidden="true" className="flex size-3.5 shrink-0 items-center justify-center">
                        <span className={`size-2 rounded-full ${goal.include ? 'bg-(--primary)' : 'bg-(--soft-fg)'}`} />
                    </span>
                    {statusLabel}
                </span>
                <AccessibleTooltip title={actionLabel}>
                    <button
                        type="button"
                        onClick={onToggleInclude}
                        aria-label={actionLabel}
                        className={statusActionButtonClassName}>
                        {goal.include ? (
                            <Pause className="size-3.5" fill="currentColor" stroke="none" />
                        ) : (
                            <Play className="size-3.5" fill="currentColor" stroke="none" />
                        )}
                    </button>
                </AccessibleTooltip>
            </div>
        );
    };

    return (
        <div
            data-goal-card
            className="flex h-full min-w-0 flex-col gap-2.5 rounded-xl border border-(--card-border) p-3 text-(--card-fg) shadow-sm transition-colors motion-reduce:transition-none"
            style={cardBackgroundStyle}>
            {/* Header: grip + priority + portrait + name/meta + actions */}
            <div className="flex items-center gap-2">
                <div
                    ref={dragHandle?.ref}
                    {...(dragHandle?.attributes ?? {})}
                    {...(dragHandle?.listeners ?? {})}
                    title={dragHandle ? 'Drag to reorder' : undefined}
                    className={`flex shrink-0 items-center gap-1 text-(--soft-fg) ${dragHandle ? 'cursor-grab touch-none py-1 pr-1 select-none active:cursor-grabbing' : ''}`}>
                    {dragHandle && (
                        <GripVertical className="size-4 opacity-40 transition-opacity hover:opacity-80 motion-reduce:transition-none" />
                    )}
                    <span className="text-lg leading-none font-extrabold">#{goal.priority}</span>
                </div>
                <span className="flex-none">{parts.portrait}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-bold text-(--fg)">{parts.title}</span>
                    <GoalCardMetaLine
                        calendarDate={isReached ? undefined : calendarDate}
                        daysLeft={doneByDays}
                        estimate={passed}
                    />
                </div>
                <div className="shrink-0">
                    <GoalCardActions
                        menuItemSelect={menuItemSelect}
                        onMove={onMove}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
                    />
                </div>
            </div>

            <div className="flex flex-1 flex-col text-sm">{parts.body}</div>

            {goal.notes && (
                <div className="border-t border-(--card-border) pt-2.5">
                    <p className="line-clamp-2 border-l-2 border-(--primary)/40 pl-2 text-xs leading-snug text-(--soft-fg)">
                        {goal.notes}
                    </p>
                </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-(--card-border) pt-2.5">
                {renderStatusPill()}
                {parts.showRaids && (
                    <GoToRaidsButton unitId={parts.raidsTargetId} blocked={isBlocked} reached={isReached} />
                )}
            </div>
        </div>
    );
};
