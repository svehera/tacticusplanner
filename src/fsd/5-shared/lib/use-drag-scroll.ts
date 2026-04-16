import React, { useRef } from 'react';

export const useDragScroll = () => {
    const scrollReference = useRef<HTMLDivElement>(null);
    const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

    const onMouseDown = (event: React.MouseEvent) => {
        const element = scrollReference.current;
        if (!element) return;
        dragState.current = {
            isDragging: true,
            startX: event.pageX - element.offsetLeft,
            scrollLeft: element.scrollLeft,
        };
        element.style.cursor = 'grabbing';
        element.style.userSelect = 'none';
    };

    const onMouseMove = (event: React.MouseEvent) => {
        if (!dragState.current.isDragging || !scrollReference.current) return;
        event.preventDefault();
        scrollReference.current.scrollLeft =
            dragState.current.scrollLeft -
            (event.pageX - scrollReference.current.offsetLeft - dragState.current.startX) * 1.5;
    };

    const onMouseEnd = () => {
        const element = scrollReference.current;
        if (!element) return;
        dragState.current.isDragging = false;
        element.style.cursor = 'grab';
        element.style.userSelect = '';
    };

    const onTouchStart = (event: React.TouchEvent) => {
        const element = scrollReference.current;
        if (!element) return;
        const touch = event.touches[0];
        dragState.current = {
            isDragging: true,
            startX: touch.pageX - element.offsetLeft,
            scrollLeft: element.scrollLeft,
        };
    };

    const onTouchMove = (event: React.TouchEvent) => {
        if (!dragState.current.isDragging || !scrollReference.current) return;
        const touch = event.touches[0];
        scrollReference.current.scrollLeft =
            dragState.current.scrollLeft -
            (touch.pageX - scrollReference.current.offsetLeft - dragState.current.startX) * 1.5;
    };

    const onTouchEnd = () => {
        dragState.current.isDragging = false;
    };

    return {
        scrollRef: scrollReference,
        onMouseDown,
        onMouseMove,
        onMouseUp: onMouseEnd,
        onMouseLeave: onMouseEnd,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onTouchCancel: onTouchEnd,
    };
};
