import Button from '@mui/material/Button';
import { FC, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDragScroll } from '@/fsd/5-shared/lib/use-drag-scroll';

import { IUpgradesRaidsDay } from '@/fsd/3-features/goals/goals.models';

import { DayFilterBar } from './raids-day-filter-bar';

const RaidsDayView = lazy(() =>
    import('@/fsd/3-features/goals/raids-day-view').then(m => ({ default: m.RaidsDayView }))
);

interface DayStripProps {
    days: IUpgradesRaidsDay[];
    allDays: IUpgradesRaidsDay[];
    allDaysExpanded: boolean;
    energyPerDay: number;
    showShowAll: boolean;
    onShowAll: () => void;
}

export const DayStrip: FC<DayStripProps> = ({
    days,
    allDays,
    allDaysExpanded,
    energyPerDay,
    showShowAll,
    onShowAll,
}) => {
    const [selectedCharId, setSelectedCharId] = useState<string | undefined>();

    // Seed first 3 so they render immediately on expand without waiting for the observer
    const [visibleSet, setVisibleSet] = useState<Set<number>>(() => new Set([0, 1, 2]));

    // Pending scroll after Show All expands days — resolved once days.length updates
    const pendingScrollReference = useRef<{ dayIndex: number; inline: ScrollLogicalPosition } | undefined>(undefined);

    const {
        scrollRef,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseLeave,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onTouchCancel,
    } = useDragScroll();

    const characterDayMap = useMemo<Record<string, number[]>>(() => {
        const map: Record<string, number[]> = {};
        for (const [index, day] of allDays.entries()) {
            for (const raid of day.raids) {
                if (raid.raidLocations.length === 0 || raid.isFinished) continue;
                for (const charId of raid.relatedCharacters) {
                    (map[charId] ??= []).push(index);
                }
            }
        }
        return map;
    }, [allDays]);

    const allCharacterIds = useMemo(() => Object.keys(characterDayMap), [characterDayMap]);

    const toggleCharId = useCallback(
        (id: string) => setSelectedCharId(previous => (previous === id ? undefined : id)),
        []
    );

    useEffect(() => {
        if (!allDaysExpanded) {
            setVisibleSet(new Set([0, 1, 2]));
            return;
        }
        const container = scrollRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            entries => {
                setVisibleSet(previous => {
                    const next = new Set(previous);
                    for (const entry of entries) {
                        if (entry.isIntersecting) {
                            next.add(Number((entry.target as HTMLElement).dataset.dayIndex));
                        }
                        // Never remove — keep grid mounted once visible
                    }
                    return next;
                });
            },
            {
                root: container,
                rootMargin: '0px 340px 0px 340px', // pre-render ~1 card width ahead on each side
                threshold: 0,
            }
        );

        for (const card of container.querySelectorAll('[data-day-index]')) {
            observer.observe(card);
        }

        return () => observer.disconnect();
    }, [allDaysExpanded, days.length, scrollRef]);

    // Scroll to pending target once new cards are in the DOM (days.length has updated)
    useEffect(() => {
        if (!pendingScrollReference.current) return;
        const { dayIndex, inline } = pendingScrollReference.current;
        const card = scrollRef.current?.querySelector(`[data-day-index="${dayIndex}"]`);
        if (card) {
            pendingScrollReference.current = undefined;
            card.scrollIntoView({ behavior: 'smooth', inline, block: 'nearest' });
        }
    }, [days.length, scrollRef]);

    const navigateToDay = useCallback(
        (dayIndex: number, inline: ScrollLogicalPosition = 'start') => {
            // Pre-mount target grid before scrolling so content is ready on arrival
            setVisibleSet(previous => new Set([...previous, dayIndex]));
            if (dayIndex >= days.length && showShowAll) {
                pendingScrollReference.current = { dayIndex, inline };
                onShowAll();
            } else {
                const card = scrollRef.current?.querySelector(`[data-day-index="${dayIndex}"]`);
                card?.scrollIntoView({ behavior: 'smooth', inline, block: 'nearest' });
            }
        },
        [days.length, scrollRef, showShowAll, onShowAll]
    );

    return (
        <div className="flex flex-col">
            {allDaysExpanded && allCharacterIds.length > 0 && (
                <DayFilterBar
                    characterIds={allCharacterIds}
                    selectedCharId={selectedCharId}
                    characterDayMap={characterDayMap}
                    onToggle={toggleCharId}
                    onNavigate={navigateToDay}
                />
            )}
            <div
                ref={scrollRef}
                className="w-full cursor-grab overflow-x-auto overflow-y-hidden"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchCancel}>
                <div className="flex">
                    <Suspense fallback={undefined}>
                        {days.map((day, index) => (
                            <div key={index} data-day-index={index} className="shrink-0 pr-2.5">
                                <RaidsDayView
                                    day={day}
                                    title={'Day ' + (index + 1)}
                                    dayIndex={index}
                                    expanded={allDaysExpanded}
                                    energyPerDay={energyPerDay}
                                    selectedCharId={selectedCharId}
                                    gridVisible={visibleSet.has(index)}
                                />
                            </div>
                        ))}
                    </Suspense>
                    {showShowAll && (
                        <Button
                            variant="outlined"
                            className="min-w-[300px] shrink-0 items-start pt-5"
                            onClick={onShowAll}>
                            Show All
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
