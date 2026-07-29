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
import React, { useEffect, useMemo, useState } from 'react';

import { filterMap } from '@/fsd/5-shared/lib';

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

// Deliberately not memoised: dnd-kit re-renders every sortable through the useSortable context
// subscription, which React.memo cannot block.
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
    // `h-full` resolves to `auto` inside the overlay, so pin both dimensions or the card collapses.
    const [activeSize, setActiveSize] = useState<{ width: number; height: number } | undefined>();

    // `items` returns through the global store, which commits in a POST-PAINT effect — so without
    // this the grid paints the pre-drop order first and visibly jumps.
    const [dropOrder, setDropOrder] = useState<string[]>();

    // Keyed on id CONTENT: the goals page rebuilds these arrays with .toSorted() every render, so an
    // identity-keyed effect would clear the order immediately.
    const itemIdsKey = items.map(item => item.goalId).join('|');
    useEffect(() => {
        setDropOrder(undefined);
    }, [itemIdsKey]);

    const orderedItems = useMemo(() => {
        if (!dropOrder) return items;
        const byId = new Map(items.map(item => [item.goalId, item]));
        const reordered = filterMap(dropOrder, id => byId.get(id));
        // Section membership changed while we held a drop order — defer to props.
        return reordered.length === items.length ? reordered : items;
    }, [items, dropOrder]);

    const ids = orderedItems.map(item => item.goalId);
    const activeItem = orderedItems.find(item => item.goalId === activeId);

    const handleStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
        const rect = event.active.rect.current.initial;
        setActiveSize(rect ? { width: rect.width, height: rect.height } : undefined);
    };
    const handleEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = ids.indexOf(active.id as string);
            const newIndex = ids.indexOf(over.id as string);
            if (oldIndex !== -1 && newIndex !== -1) {
                const next = arrayMove(ids, oldIndex, newIndex);
                setDropOrder(next);
                onReorder(next, active.id as string);
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
                    {orderedItems.map(item => (
                        <SortableGoalCard key={item.goalId} item={item} renderCard={renderCard} />
                    ))}
                </div>
            </SortableContext>
            <DragOverlay>
                {activeItem ? <div style={activeSize}>{renderCard(activeItem, {})}</div> : undefined}
            </DragOverlay>
        </DndContext>
    );
};
