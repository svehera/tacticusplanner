import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { clsx } from 'clsx';
import { useState } from 'react';

import { BadgeImage } from '@/fsd/5-shared/ui/icons';

import { KillzoneList } from './KillzoneList';
import type { OnslaughtBadgeAlliance, OnslaughtSector } from './types';

export function SectorCard({
    name,
    sector,
    badgeAlliance,
}: {
    name: string;
    sector: OnslaughtSector;
    badgeAlliance: OnslaughtBadgeAlliance;
}) {
    const { minHeroPower, ...killzones } = sector;

    // Performance optimization to stop React from rendering the contents of closed sections
    // Without it, React lags from rendering thousands of badge icons
    const [isOpen, setOpen] = useState(false);

    const maxBadgeRarity = Object.values(killzones).reduce((_, kz) => {
        for (const rarity of ['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'] as const) {
            if (kz.badgeCountsByRarity[rarity] > 0) {
                return rarity;
            }
        }
    }, 'Common' as const);

    return (
        <details
            className={clsx(
                'w-full group rounded-lg border shadow-sm transition-shadow hover:shadow-md bg-stone-100/80 dark:bg-stone-900/80',
                badgeAlliance === 'Imperial' && 'border-green-700/60 hover:shadow-green-700/60', // Chaos Track
                badgeAlliance === 'Xenos' && ' border-red-700/60 hover:shadow-red-700/60', // Chaos Track
                badgeAlliance === 'Chaos' && 'border-blue-700/60 hover:shadow-blue-700/60' // Imperial Track
            )}
            open={isOpen}
            onToggle={() => setOpen(prev => !prev)}>
            <summary className="flex items-center cursor-pointer select-none gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-stone-400/50 dark:hover:bg-stone-800/50 sm:px-4 sm:py-3 sm:text-base bg-stone-300/80 dark:bg-stone-900/80">
                <span className="font-semibold dark:text-amber-100 w-32">{name}</span>
                <span className="whitespace-nowrap">Min Power:</span>
                <span className="font-medium dark:text-amber-200 block sm:inline">{minHeroPower}</span>
                <span className="text-sm dark:text-stone-400"></span>
                <span className="text-sm dark:text-stone-400 pl-2 whitespace-nowrap">Max Badge:</span>
                <BadgeImage alliance={badgeAlliance} rarity={maxBadgeRarity} size="small" />
                <span className="ml-auto text-sm dark:text-amber-100">
                    {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </span>
            </summary>

            {isOpen && (
                <div className="border-t border-amber-700/30 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3 w-full">
                    <KillzoneList killzones={killzones} badgeAlliance={badgeAlliance} />
                </div>
            )}
        </details>
    );
}
