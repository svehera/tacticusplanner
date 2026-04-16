import React, { lazy, Suspense, useMemo, useState } from 'react';

import { getEstimatedDate } from '@/fsd/5-shared/lib';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { IUpgradeRaid, IUpgradesRaidsDay } from './goals.models';
import { getCharacterIcon, getDisplayName } from './raid-day-helpers';

const RaidMaterialDialog = lazy(() => import('./raid-material-dialog').then(m => ({ default: m.RaidMaterialDialog })));
const RaidMaterialIcon = lazy(() => import('./raid-material-icon').then(m => ({ default: m.RaidMaterialIcon })));

interface Props {
    day: IUpgradesRaidsDay;
    title: string;
    dayIndex: number;
    expanded: boolean;
    energyPerDay: number;
}

const buildTooltip = (label: string, relatedCharacters: string[]) => (
    <div>
        {label}
        {relatedCharacters.length > 0 && (
            <ul className="ps-[15px]">
                {[...new Set(relatedCharacters.map(name => getDisplayName(name)))].map(name => (
                    <li key={name}>{name}</li>
                ))}
            </ul>
        )}
    </div>
);

export const RaidsDayView: React.FC<Props> = ({ day, title, dayIndex, expanded, energyPerDay }) => {
    const [selectedRaid, setSelectedRaid] = useState<IUpgradeRaid | undefined>();

    const calendarDate = useMemo(() => getEstimatedDate(dayIndex + 1), [dayIndex]);

    const characterIds = useMemo(() => {
        const seen = new Set<string>();
        const ids: string[] = [];
        for (const raid of day.raids) {
            if (raid.isFinished) continue;
            for (const charId of raid.relatedCharacters) {
                if (!seen.has(charId)) {
                    seen.add(charId);
                    ids.push(charId);
                }
            }
        }
        return ids;
    }, [day.raids]);

    const farmableRaids = useMemo(() => day.raids.filter(raid => raid.raidLocations.length > 0), [day.raids]);

    const energyFillPct = energyPerDay > 0 ? Math.min((day.energyTotal / energyPerDay) * 100, 100) : 0;
    const energyFull = energyFillPct >= 95;

    return (
        <div className="flex min-w-[220px] flex-col rounded-xl border border-(--card-border) bg-(--card-bg) p-3 text-(--card-fg) shadow-sm">
            {/* Header - always visible */}
            <div className="flex flex-col gap-2">
                {/* Title row */}
                <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{dayIndex === 0 ? 'Today' : title}</span>
                    <span className="text-xs opacity-60">{calendarDate}</span>
                </div>

                {/* Stats chips */}
                <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-full bg-(--secondary) px-2 py-0.5 text-xs">
                        <MiscIcon icon="energy" height={12} width={12} />
                        <span>{day.energyTotal}</span>
                        {energyPerDay > 0 && <span className="opacity-50">/{energyPerDay}</span>}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-(--secondary) px-2 py-0.5 text-xs">
                        <MiscIcon icon="raidTicket" height={12} width={12} />
                        {day.raidsTotal}
                    </span>
                </div>

                {/* Energy fill bar */}
                {energyPerDay > 0 && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--secondary)">
                        <div
                            className={`h-full rounded-full transition-all ${energyFull ? 'bg-green-500' : 'bg-amber-400'}`}
                            style={{ width: `${energyFillPct}%` }}
                        />
                    </div>
                )}

                {/* Character icons */}
                {characterIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {characterIds.map(id => (
                            <AccessibleTooltip key={id} title={getDisplayName(id)}>
                                <span>
                                    <UnitShardIcon icon={getCharacterIcon(id)} height={24} width={24} />
                                </span>
                            </AccessibleTooltip>
                        ))}
                    </div>
                )}
            </div>

            {/* Expanded: 3-col material icon grid */}
            {expanded && farmableRaids.length > 0 && (
                <Suspense fallback={undefined}>
                    <div className="mt-3 grid grid-cols-3 gap-1 border-t border-(--card-border) pt-3">
                        {farmableRaids.map((raid, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setSelectedRaid(raid)}
                                className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-(--secondary)">
                                <RaidMaterialIcon
                                    raid={raid}
                                    size={40}
                                    tooltip={buildTooltip(raid.label, raid.relatedCharacters)}
                                />
                            </button>
                        ))}
                    </div>
                </Suspense>
            )}

            {selectedRaid && (
                <Suspense fallback={undefined}>
                    <RaidMaterialDialog raid={selectedRaid} onClose={() => setSelectedRaid(undefined)} />
                </Suspense>
            )}
        </div>
    );
};
