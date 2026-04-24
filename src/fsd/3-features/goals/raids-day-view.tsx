import { Tooltip } from '@mui/material';
import { FC, lazy, Suspense, useState } from 'react';

import { getEstimatedDate } from '@/fsd/5-shared/lib';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { IUpgradeRaid, IUpgradesRaidsDay } from './goals.models';
import { getCharacterIcon, getDisplayName } from './raid-day-helpers';

const buildCellTooltip = (raid: IUpgradeRaid) => {
    const uniqueCharNames = [...new Set(raid.relatedCharacters.map(id => getDisplayName(id)))];
    const visibleLocations = raid.raidLocations.slice(0, 4);
    const overflow = raid.raidLocations.length - visibleLocations.length;
    return (
        <div className="flex flex-col gap-1 text-xs">
            <div className="font-semibold">{raid.label}</div>
            {uniqueCharNames.length > 0 && <div className="opacity-80">{uniqueCharNames.join(', ')}</div>}
            {visibleLocations.length > 0 && (
                <div className="mt-0.5 flex flex-col gap-0.5 border-t border-white/20 pt-0.5 opacity-80">
                    {visibleLocations.map(loc => (
                        <div key={loc.id}>
                            {loc.campaign} {loc.nodeNumber} &times; {loc.raidsToPerform}
                        </div>
                    ))}
                    {overflow > 0 && <div>+{overflow} more</div>}
                </div>
            )}
        </div>
    );
};

const RaidMaterialDialog = lazy(() => import('./raid-material-dialog').then(m => ({ default: m.RaidMaterialDialog })));
const RaidMaterialIcon = lazy(() => import('./raid-material-icon').then(m => ({ default: m.RaidMaterialIcon })));

interface Props {
    day: IUpgradesRaidsDay;
    title: string;
    dayIndex: number;
    expanded: boolean;
    energyPerDay: number;
}

export const RaidsDayView: FC<Props> = ({ day, title, dayIndex, expanded, energyPerDay }) => {
    const [selectedRaid, setSelectedRaid] = useState<IUpgradeRaid | undefined>();

    const calendarDate = getEstimatedDate(dayIndex + 1);
    const seen = new Set<string>();
    const characterIds: string[] = [];
    for (const raid of day.raids) {
        if (raid.isFinished) continue;
        for (const charId of raid.relatedCharacters) {
            if (!seen.has(charId)) {
                seen.add(charId);
                characterIds.push(charId);
            }
        }
    }

    const farmableRaids = day.raids.filter(raid => raid.raidLocations.length > 0);

    const energyFillPct = energyPerDay > 0 ? Math.min((day.energyTotal / energyPerDay) * 100, 100) : 0;
    const energyFull = energyFillPct >= 95;

    return (
        <div className="flex min-w-[260px] flex-col rounded-xl border border-(--card-border) bg-(--card-bg) p-3 text-(--card-fg) shadow-sm">
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

            {/* Expanded: material icon grid with count badge overlay and character avatar stack */}
            {expanded && farmableRaids.length > 0 && (
                <Suspense fallback={undefined}>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-(--card-border) pt-3">
                        {farmableRaids.map((raid, index) => {
                            const uniqueIds = [...new Set(raid.relatedCharacters)];
                            const shown = uniqueIds.slice(0, 2);
                            const overflow = uniqueIds.length - shown.length;
                            const sufficient = Math.floor(raid.acquiredCount) >= raid.requiredCount;
                            return (
                                <Tooltip
                                    key={index}
                                    title={buildCellTooltip(raid)}
                                    arrow
                                    placement="top"
                                    enterDelay={500}
                                    disableTouchListener>
                                    <button
                                        type="button"
                                        aria-label={raid.label}
                                        onClick={() => setSelectedRaid(raid)}
                                        className="flex flex-col items-center gap-2 rounded-lg border border-transparent p-2 transition-all hover:border-(--card-border) hover:bg-(--secondary)">
                                        {/* Icon with count badge overlaid */}
                                        <div className="relative pb-2">
                                            <RaidMaterialIcon raid={raid} size={40} showTooltip={false} />
                                            <span
                                                className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[9px] leading-none font-bold whitespace-nowrap tabular-nums shadow-sm ${
                                                    sufficient
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-(--card-fg)/80 text-(--card-bg)'
                                                }`}>
                                                {Math.floor(raid.acquiredCount)}/{raid.requiredCount}
                                            </span>
                                        </div>
                                        {/* Overlapping avatar stack */}
                                        {uniqueIds.length > 0 && (
                                            <div className="flex items-center">
                                                {shown.map((id, index_) => (
                                                    <div key={id} className={index_ > 0 ? '-ml-2' : ''}>
                                                        <UnitShardIcon
                                                            icon={getCharacterIcon(id)}
                                                            height={24}
                                                            width={24}
                                                        />
                                                    </div>
                                                ))}
                                                {overflow > 0 && (
                                                    <span className="ml-1 text-[10px] leading-none opacity-50">
                                                        +{overflow}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                </Tooltip>
                            );
                        })}
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
