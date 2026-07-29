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

// Not memoised on purpose: dnd-kit re-renders every sortable on each reorder transition via the
// useSortable context subscription, which React.memo cannot block. The cost that mattered was the
// per-card estimate lookup, which GoalSection now does through a keyed map.
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
    // Grid cards are stretched to the row height by `h-full`, which resolves to `auto` inside the
    // overlay — pin both dimensions so the dragged card doesn't collapse to its content height.
    const [activeSize, setActiveSize] = useState<{ width: number; height: number } | undefined>();

    // `items` comes back through the global store, which commits in a POST-PAINT effect — so the
    // reordered list arrives a render after the drop, and the grid would otherwise paint the old
    // order first and visibly jump. Holding the dropped order locally paints it immediately, and
    // also lets dnd-kit's drop animation land on the slot the card was actually dropped into.
    const [dropOrder, setDropOrder] = useState<string[]>();

    const propertyIdsKey = items.map(item => item.goalId).join('|');
    // Release the optimistic order once the store catches up, or the section changes underneath us.
    useEffect(() => {
        setDropOrder(undefined);
    }, [propertyIdsKey]);

    const orderedItems = useMemo(() => {
        if (!dropOrder) return items;
        const byId = new Map(items.map(item => [item.goalId, item]));
        const reordered = filterMap(dropOrder, id => byId.get(id));
        // Fall back to the props order if the section membership changed while we held a drop order.
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
