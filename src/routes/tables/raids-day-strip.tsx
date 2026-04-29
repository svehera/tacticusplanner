import Button from '@mui/material/Button';
import { FC, lazy, Suspense, useCallback, useMemo, useState } from 'react';

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

    const navigateToDay = useCallback(
        (dayIndex: number, inline: ScrollLogicalPosition = 'start') => {
            const doScroll = () => {
                const card = scrollRef.current?.querySelector(`[data-day-index="${dayIndex}"]`);
                card?.scrollIntoView({ behavior: 'smooth', inline, block: 'nearest' });
            };
            if (dayIndex >= days.length && showShowAll) {
                onShowAll();
                setTimeout(doScroll, 100);
            } else {
                doScroll();
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
                className="w-full overflow-x-auto overflow-y-hidden"
                style={{ cursor: 'grab' }}
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
