import { Tooltip } from '@mui/material';
import { FC, Fragment, lazy, memo, Suspense } from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { IUpgradeRaid } from './goals.models';
import { getCharacterIcon, getDisplayName } from './raid-day-helpers';

const RaidMaterialIcon = lazy(() => import('./raid-material-icon').then(m => ({ default: m.RaidMaterialIcon })));

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

interface MaterialGridProps {
    farmableRaids: IUpgradeRaid[];
    matchesFilter: (raid: IUpgradeRaid) => boolean;
    onSelectRaid: (raid: IUpgradeRaid) => void;
}

const gridSeparator = (label: string) => (
    <div className="col-span-3 flex items-center gap-2 text-[10px] font-medium tracking-wide uppercase opacity-40">
        <div className="h-px flex-1 bg-(--card-border)" />
        {label}
        <div className="h-px flex-1 bg-(--card-border)" />
    </div>
);

const isDone = (raid: IUpgradeRaid) =>
    Math.floor(raid.acquiredCount) >= raid.requiredCount ||
    raid.raidLocations.every(loc => loc.raidsAlreadyPerformed >= loc.raidsToPerform);

const MaterialGridComponent: FC<MaterialGridProps> = ({ farmableRaids, matchesFilter, onSelectRaid }) => {
    const firstUnassignedIndex = farmableRaids.findIndex(r => r.relatedCharacters.length === 0 && !isDone(r));
    const firstDoneIndex = farmableRaids.findIndex(r => isDone(r));
    const hasUnassignedGroup = firstUnassignedIndex > 0;
    const hasDoneGroup = firstDoneIndex > 0;

    return (
        <Suspense fallback={undefined}>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-(--card-border) pt-3">
                {farmableRaids.map((raid, index) => {
                    const uniqueIds = [...new Set(raid.relatedCharacters)];
                    const shown = uniqueIds.slice(0, 2);
                    const overflow = uniqueIds.length - shown.length;
                    const sufficient = Math.floor(raid.acquiredCount) >= raid.requiredCount;
                    const done = isDone(raid);
                    const cellOpacity = matchesFilter(raid) ? (done ? 'opacity-50' : '') : 'opacity-30';
                    return (
                        <Fragment key={index}>
                            {hasUnassignedGroup && index === firstUnassignedIndex && gridSeparator('No goal')}
                            {hasDoneGroup && index === firstDoneIndex && gridSeparator('Raided')}
                            <Tooltip
                                title={buildCellTooltip(raid)}
                                arrow
                                placement="top"
                                enterDelay={500}
                                disableTouchListener>
                                <button
                                    type="button"
                                    aria-label={raid.label}
                                    onClick={() => onSelectRaid(raid)}
                                    className={`flex flex-col items-center gap-2 rounded-lg border border-transparent p-2 transition-[opacity,border-color,background-color] duration-100 ease-out hover:border-(--card-border) hover:bg-(--secondary) ${cellOpacity}`}>
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
                                    {uniqueIds.length > 0 ? (
                                        <div className="flex items-center">
                                            {shown.map((id, index_) => (
                                                <div key={id} className={index_ > 0 ? '-ml-2' : ''}>
                                                    <UnitShardIcon icon={getCharacterIcon(id)} height={24} width={24} />
                                                </div>
                                            ))}
                                            {overflow > 0 && (
                                                <span className="ml-1 text-[10px] leading-none opacity-50">
                                                    +{overflow}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] leading-none opacity-30">—</span>
                                    )}
                                </button>
                            </Tooltip>
                        </Fragment>
                    );
                })}
            </div>
        </Suspense>
    );
};

export const MaterialGrid = memo(MaterialGridComponent);
