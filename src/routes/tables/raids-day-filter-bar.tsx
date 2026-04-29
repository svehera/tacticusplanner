import { FC, memo } from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { getCharacterIcon, getDisplayName } from '@/fsd/3-features/goals/raid-day-helpers';

interface DayFilterBarProps {
    characterIds: string[];
    selectedCharId: string | undefined;
    characterDayMap: Record<string, number[]>;
    onToggle: (id: string) => void;
    onNavigate: (dayIndex: number, inline: ScrollLogicalPosition) => void;
}

const DayFilterBarComponent: FC<DayFilterBarProps> = ({
    characterIds,
    selectedCharId,
    characterDayMap,
    onToggle,
    onNavigate,
}) => {
    const filterActive = selectedCharId !== undefined;

    const selectedDays = selectedCharId ? (characterDayMap[selectedCharId] ?? []) : [];
    const firstDay = selectedDays[0];
    const lastDay = selectedDays.at(-1);

    return (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            {characterIds.map(id => {
                const isSelected = id === selectedCharId;
                return (
                    <button
                        key={id}
                        type="button"
                        title={getDisplayName(id)}
                        aria-pressed={isSelected}
                        aria-label={getDisplayName(id)}
                        onClick={() => onToggle(id)}
                        className={`cursor-pointer rounded-full p-0.5 transition-[opacity,transform] duration-100 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring) ${
                            isSelected
                                ? 'scale-105 ring-2 ring-(--primary) ring-offset-2 ring-offset-(--card-bg)'
                                : filterActive
                                  ? 'opacity-50 hover:opacity-100'
                                  : ''
                        }`}>
                        <UnitShardIcon icon={getCharacterIcon(id)} height={40} width={40} />
                    </button>
                );
            })}

            {filterActive && firstDay !== undefined && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onNavigate(firstDay, 'start')}
                        className="inline-flex min-h-[36px] items-center rounded-full border border-(--card-border) bg-(--card-bg) px-3 py-2 text-xs font-medium text-(--card-fg) transition-colors hover:bg-(--secondary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring)">
                        ← Day {firstDay + 1}
                    </button>
                    {lastDay !== undefined && lastDay !== firstDay && (
                        <button
                            type="button"
                            onClick={() => onNavigate(lastDay, 'end')}
                            className="inline-flex min-h-[36px] items-center rounded-full border border-(--card-border) bg-(--card-bg) px-3 py-2 text-xs font-medium text-(--card-fg) transition-colors hover:bg-(--secondary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring)">
                            Day {lastDay + 1} →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export const DayFilterBar = memo(DayFilterBarComponent);
