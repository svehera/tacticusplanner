import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { clsx } from 'clsx';
import { useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import powerIcon from '@/assets/images/icons/power.png';

import { BadgeImage } from '@/fsd/5-shared/ui/icons';

import { KillzoneList } from './KillzoneList';
import type { OnslaughtBadgeAlliance, OnslaughtSector } from './types';

export function SectorCard({
    sector,
    badgeAlliance,
}: {
    sector: OnslaughtSector;
    badgeAlliance: OnslaughtBadgeAlliance;
}) {
    const { name, minHeroPower, killzones, maxBadgeRarity } = sector;

    // Performance optimization to stop React from rendering the contents of closed sections
    // Without it, React lags from rendering thousands of badge icons
    const [isOpen, setOpen] = useState(false);

    return (
        <details
            className="group w-full overflow-hidden rounded border bg-stone-100 shadow-sm transition-shadow hover:shadow-xl dark:bg-stone-900"
            open={isOpen}
            onToggle={() => setOpen(prev => !prev)}>
            <summary
                className={clsx(
                    'flex w-full cursor-pointer items-center justify-between bg-linear-to-r px-2 text-stone-200 select-none',
                    badgeAlliance === 'Imperial' && 'from-teal-950 to-emerald-950 hover:from-teal-900', // Xenos Track
                    badgeAlliance === 'Xenos' && 'from-red-950 to-pink-950 hover:from-red-900', // Chaos Track
                    badgeAlliance === 'Chaos' && 'from-indigo-950 to-blue-900 hover:from-indigo-900' // Imperial Track
                )}>
                <div>
                    <div className="text-lg font-bold">{name}</div>
                    <div className="inline-block text-sm">
                        <span className="pr-1">
                            <span className="hidden sm:inline">Character</span> Power required:
                        </span>
                        <img alt="Power" src={powerIcon} className="aspect-auto w-2.5 self-baseline" />
                        <span className="">{minHeroPower}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-sm">Max Badge</div>
                    <BadgeImage alliance={badgeAlliance} rarity={maxBadgeRarity} size="small" />
                </div>
                <span className="text-sm">{isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}</span>
            </summary>

            {isOpen && (
                <div className="rounded-b border-t bg-linear-to-b from-stone-100 to-stone-200 px-2 pt-1 dark:from-stone-900 dark:to-stone-950">
                    <KillzoneList killzones={killzones} badgeAlliance={badgeAlliance} />
                </div>
            )}
        </details>
    );
}
