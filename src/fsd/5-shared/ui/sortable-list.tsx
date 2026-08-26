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
    type SortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useEffect, useMemo, useState } from 'react';

import { filterMap } from '@/fsd/5-shared/lib';

type SortableReturn = ReturnType<typeof useSortable>;

/** Drag-activator props an item spreads onto its handle (grip). Supplied by the sortable wrapper. */
export interface DragHandleProps {
    ref?: SortableReturn['setActivatorNodeRef'];
    attributes?: SortableReturn['attributes'];
    listeners?: SortableReturn['listeners'];
}

interface SortableItemProps<T> {
    item: T;
    getId: (item: T) => string;
    renderItem: (item: T, dragHandle: DragHandleProps) => React.ReactNode;
}

// Deliberately not memoised: dnd-kit re-renders every sortable through the useSortable context
// subscription, which React.memo cannot block.
const SortableListItem = <T,>({ item, getId, renderItem }: SortableItemProps<T>) => {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: getId(item),
    });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`h-full ${isDragging ? 'opacity-60' : ''}`}>
            {renderItem(item, { ref: setActivatorNodeRef, attributes, listeners })}
        </div>
    );
};

interface Props<T> {
    items: T[];
    getId: (item: T) => string;
    onReorder: (orderedIds: string[], movedId: string) => void;
    renderItem: (item: T, dragHandle: DragHandleProps) => React.ReactNode;
    /** Grid vs vertical-list drag geometry. Defaults to `rectSortingStrategy` (grid). */
    strategy?: SortingStrategy;
    className?: string;
}

/** List/grid of items with dnd-kit reorder (mouse, touch, keyboard). */
export const SortableList = <T,>({
    items,
    getId,
    onReorder,
    renderItem,
    strategy = rectSortingStrategy,
    className,
}: Props<T>) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    const [activeId, setActiveId] = useState<UniqueIdentifier | undefined>();
    // `h-full` resolves to `auto` inside the overlay, so pin both dimensions or the item collapses.
    const [activeSize, setActiveSize] = useState<{ width: number; height: number } | undefined>();

    // `items` returns through the global store, which commits in a POST-PAINT effect — so without
    // this the list paints the pre-drop order first and visibly jumps.
    const [dropOrder, setDropOrder] = useState<string[]>();

    // Keyed on id CONTENT: callers commonly rebuild these arrays with .toSorted() every render, so
    // an identity-keyed effect would clear the order immediately.
    const itemIdsKey = items.map(item => getId(item)).join('|');
    useEffect(() => {
        setDropOrder(undefined);
    }, [itemIdsKey]);

    const orderedItems = useMemo(() => {
        if (!dropOrder) return items;
        const byId = new Map(items.map(item => [getId(item), item]));
        const reordered = filterMap(dropOrder, id => byId.get(id));
        // Membership changed while we held a drop order — defer to props.
        return reordered.length === items.length ? reordered : items;
    }, [items, dropOrder, getId]);

    const ids = orderedItems.map(item => getId(item));
    const activeItem = orderedItems.find(item => getId(item) === activeId);

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
            <SortableContext items={ids} strategy={strategy}>
                <div className={className}>
                    {orderedItems.map(item => (
                        <SortableListItem key={getId(item)} item={item} getId={getId} renderItem={renderItem} />
                    ))}
                </div>
            </SortableContext>
            <DragOverlay>
                {activeItem ? <div style={activeSize}>{renderItem(activeItem, {})}</div> : undefined}
            </DragOverlay>
        </DndContext>
    );
};
