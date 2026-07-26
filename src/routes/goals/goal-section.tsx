import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { Accordion, AccordionBody, AccordionHeader } from '@/fsd/5-shared/ui';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { IMow2 } from '@/fsd/4-entities/mow';

import { IGoalEstimate, TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';

import { GoalCard } from '@/fsd/1-pages/goals/goal-card';

import { GoalColorMode } from './goal-color-coding-toggle';
import { GoalService } from './goal-service';
import { GoalsTable, GoalsTableVariant } from './goals-table';
import { SortableGoalGrid } from './sortable-goal-grid';

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
    onReorder: (orderedIds: string[], movedId: string) => void;
    onMenuItemSelect: (goalId: string, item: 'edit' | 'delete' | 'moveUp' | 'moveDown') => void;
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
    onMenuItemSelect,
    onToggleInclude,
}) => (
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
                />
            ) : (
                <SortableGoalGrid
                    items={items}
                    onReorder={onReorder}
                    className={GRID_CLASS}
                    renderCard={(goal, dragHandle) => {
                        const estimate = estimates.find(x => x.goalId === goal.goalId);
                        return (
                            <GoalCard
                                goal={goal}
                                goalEstimate={estimate}
                                bookRarity={bookRarity}
                                characters={characters}
                                mows={mows}
                                menuItemSelect={item => onMenuItemSelect(goal.goalId, item)}
                                onToggleInclude={() => onToggleInclude(goal.goalId)}
                                bgColor={GoalService.getBackgroundColor(colorMode, estimate)}
                                dragHandle={dragHandle}
                            />
                        );
                    }}
                />
            )}
        </AccordionBody>
    </Accordion>
);
