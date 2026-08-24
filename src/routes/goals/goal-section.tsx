import { rectSortingStrategy } from '@dnd-kit/sortable';
import React, { useMemo } from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { Accordion, AccordionBody, AccordionHeader, SortableList } from '@/fsd/5-shared/ui';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { IMow2 } from '@/fsd/4-entities/mow';

import { IGoalEstimate, TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';

import { GoalCard } from '@/fsd/1-pages/goals/goal-card';

import { GoalColorMode } from './goal-color-coding-toggle';
import { GoalService } from './goal-service';
import { GoalsTable, GoalsTableVariant } from './goals-table';

const GRID_CLASS = 'grid [grid-template-columns:repeat(auto-fill,minmax(min(310px,100%),1fr))] gap-3';

interface Props {
    /** Accordion header content (section title + totals). */
    header: React.ReactNode;
    expanded: boolean;
    onToggle: (expanded: boolean) => void;
    /** Card grid when false, ag-grid table when true. */
    tableView: boolean;
    /** This section's goals, already priority-sorted. */
    items: TypedGoalSelect[];
    variant: GoalsTableVariant;
    estimates: IGoalEstimate[];
    colorMode: GoalColorMode;
    bookRarity: Rarity;
    characters: ICharacter2[];
    mows: IMow2[];
    /** Section-scoped drag reorder — ids of this section's goals in their new order. */
    onReorder: (orderedIds: string[], movedId: string) => void;
    /** Priority-arrow move by one position in the GLOBAL order; may cross a section boundary. */
    onMove: (goalId: string, delta: number) => void;
    /** Total goal count across all sections — the upper bound of the global priority range. */
    totalGoals: number;
    onMenuItemSelect: (goalId: string, item: 'edit' | 'delete') => void;
    onToggleInclude: (goalId: string) => void;
}

/** One collapsible goals section rendered either as the card grid or the table, sharing all wiring. */
export const GoalSection: React.FC<Props> = ({
    header,
    expanded,
    onToggle,
    tableView,
    items,
    variant,
    estimates,
    colorMode,
    bookRarity,
    characters,
    mows,
    onReorder,
    onMove,
    totalGoals,
    onMenuItemSelect,
    onToggleInclude,
}) => {
    // Keyed lookup — cards would otherwise scan the estimate list once each, per render.
    const estimateById = useMemo(() => new Map(estimates.map(estimate => [estimate.goalId, estimate])), [estimates]);

    return (
        <Accordion expanded={expanded} onToggle={onToggle}>
            <AccordionHeader>{header}</AccordionHeader>
            <AccordionBody>
                {tableView ? (
                    <GoalsTable
                        variant={variant}
                        rows={items}
                        estimate={estimates}
                        goalsColorCoding={colorMode}
                        menuItemSelect={onMenuItemSelect}
                        onToggleInclude={onToggleInclude}
                        onReorder={onReorder}
                        onMove={onMove}
                        totalGoals={totalGoals}
                    />
                ) : (
                    <SortableList
                        items={items}
                        getId={goal => goal.goalId}
                        onReorder={onReorder}
                        strategy={rectSortingStrategy}
                        className={GRID_CLASS}
                        renderItem={(goal, dragHandle) => (
                            <GoalCard
                                goal={goal}
                                goalEstimate={estimateById.get(goal.goalId)}
                                bookRarity={bookRarity}
                                characters={characters}
                                mows={mows}
                                menuItemSelect={item => onMenuItemSelect(goal.goalId, item)}
                                onToggleInclude={() => onToggleInclude(goal.goalId)}
                                bgColor={GoalService.getBackgroundColor(colorMode, estimateById.get(goal.goalId))}
                                dragHandle={dragHandle}
                                onMove={delta => onMove(goal.goalId, delta)}
                                canMoveUp={goal.priority > 1}
                                canMoveDown={goal.priority < totalGoals}
                            />
                        )}
                    />
                )}
            </AccordionBody>
        </Accordion>
    );
};
