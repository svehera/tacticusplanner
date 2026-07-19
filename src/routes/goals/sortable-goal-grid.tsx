import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
    type UniqueIdentifier,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useState } from 'react';

type SortableReturn = ReturnType<typeof useSortable>;

/** Drag-activator props a card spreads onto its handle (grip). Supplied by the sortable wrapper. */
export interface GoalDragHandle {
    ref?: SortableReturn['setActivatorNodeRef'];
    attributes?: SortableReturn['attributes'];
    listeners?: SortableReturn['listeners'];
}

interface SortableItemProps<T> {
    item: T;
    renderCard: (item: T, dragHandle: GoalDragHandle) => React.ReactNode;
}

const SortableGoalCard = <T extends { goalId: string }>({ item, renderCard }: SortableItemProps<T>) => {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: item.goalId,
    });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`h-full ${isDragging ? 'opacity-60' : ''}`}>
            {renderCard(item, { ref: setActivatorNodeRef, attributes, listeners })}
        </div>
    );
};

interface Props<T> {
    items: T[];
    onReorder: (orderedIds: string[], movedId: string) => void;
    renderCard: (item: T, dragHandle: GoalDragHandle) => React.ReactNode;
    className?: string;
}

/** Grid of goal cards with dnd-kit reorder (mouse, touch, keyboard), scoped to this section. */
export const SortableGoalGrid = <T extends { goalId: string }>({
    items,
    onReorder,
    renderCard,
    className,
}: Props<T>) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    const [activeId, setActiveId] = useState<UniqueIdentifier | undefined>();
    const [activeWidth, setActiveWidth] = useState<number>();

    const ids = items.map(item => item.goalId);
    const activeItem = items.find(item => item.goalId === activeId);

    const handleStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
        setActiveWidth(event.active.rect.current.initial?.width);
    };
    const handleEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = ids.indexOf(active.id as string);
            const newIndex = ids.indexOf(over.id as string);
            if (oldIndex !== -1 && newIndex !== -1) {
                onReorder(arrayMove(ids, oldIndex, newIndex), active.id as string);
            }
        }
        setActiveId(undefined);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleStart}
            onDragEnd={handleEnd}
            onDragCancel={() => setActiveId(undefined)}>
            <SortableContext items={ids} strategy={rectSortingStrategy}>
                <div className={className}>
                    {items.map(item => (
                        <SortableGoalCard key={item.goalId} item={item} renderCard={renderCard} />
                    ))}
                </div>
            </SortableContext>
            <DragOverlay>
                {activeItem ? <div style={{ width: activeWidth }}>{renderCard(activeItem, {})}</div> : undefined}
            </DragOverlay>
        </DndContext>
    );
};
