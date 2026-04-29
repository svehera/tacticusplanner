import { FC, lazy, memo, Suspense, useCallback, useState } from 'react';

import { getEstimatedDate } from '@/fsd/5-shared/lib';

import { IUpgradeRaid, IUpgradesRaidsDay } from './goals.models';
import { CharacterFilterRow } from './raids-day-view-filter';
import { MaterialGrid } from './raids-day-view-grid';
import { DayCardStats } from './raids-day-view-stats';

const RaidMaterialDialog = lazy(() => import('./raid-material-dialog').then(m => ({ default: m.RaidMaterialDialog })));

// Height of the card when expanded — tune this to fit the desired number of grid rows
// 2px border (top+bottom) + 24px padding (p-3 top+bottom) + 103px header + 567px grid (5 rows × 102px + 4 gaps × 8px + 25px mt/border/pt overhead)
const EXPANDED_CARD_HEIGHT = 700;

// 0: pending+assigned, 1: pending+unassigned, 2: done (sufficient or all locations raided)
const raidSortGroup = (raid: IUpgradeRaid) => {
    const sufficient = Math.floor(raid.acquiredCount) >= raid.requiredCount;
    const allRaided = raid.raidLocations.every(loc => loc.raidsAlreadyPerformed >= loc.raidsToPerform);
    if (sufficient || allRaided) return 2;
    return raid.relatedCharacters.length === 0 ? 1 : 0;
};

interface Props {
    day: IUpgradesRaidsDay;
    title: string;
    dayIndex: number;
    expanded: boolean;
    energyPerDay: number;
    selectedCharId: string | undefined;
}

const RaidsDayViewComponent: FC<Props> = ({ day, title, dayIndex, expanded, energyPerDay, selectedCharId }) => {
    const [selectedRaid, setSelectedRaid] = useState<IUpgradeRaid | undefined>();

    const calendarDate = getEstimatedDate(dayIndex + 1);
    const farmableRaids = day.raids
        .filter(raid => raid.raidLocations.length > 0)
        .toSorted((a, b) => raidSortGroup(a) - raidSortGroup(b));

    const seen = new Set<string>();
    const characterIds: string[] = [];
    for (const raid of farmableRaids) {
        if (raid.isFinished) continue;
        for (const charId of raid.relatedCharacters) {
            if (!seen.has(charId)) {
                seen.add(charId);
                characterIds.push(charId);
            }
        }
    }

    const matchesFilter = useCallback(
        (raid: IUpgradeRaid) => !selectedCharId || raid.relatedCharacters.includes(selectedCharId),
        [selectedCharId]
    );

    return (
        <div
            className="flex max-w-[340px] min-w-[260px] flex-col rounded-xl border border-(--card-border) bg-(--card-bg) p-3 text-(--card-fg) shadow-sm"
            style={{ height: expanded ? `${EXPANDED_CARD_HEIGHT}px` : undefined }}>
            {/* Header - always visible */}
            <div className="flex flex-col gap-2">
                {/* Title row */}
                <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{dayIndex === 0 ? 'Today' : title}</span>
                    <span className="text-xs opacity-60">{calendarDate}</span>
                </div>

                <DayCardStats energyTotal={day.energyTotal} raidsTotal={day.raidsTotal} energyPerDay={energyPerDay} />

                {characterIds.length > 0 && <CharacterFilterRow characterIds={characterIds} />}
            </div>

            {expanded && farmableRaids.length > 0 && (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <MaterialGrid
                        farmableRaids={farmableRaids}
                        matchesFilter={matchesFilter}
                        onSelectRaid={setSelectedRaid}
                    />
                </div>
            )}

            {selectedRaid && (
                <Suspense fallback={undefined}>
                    <RaidMaterialDialog raid={selectedRaid} onClose={() => setSelectedRaid(undefined)} />
                </Suspense>
            )}
        </div>
    );
};

export const RaidsDayView = memo(RaidsDayViewComponent);
