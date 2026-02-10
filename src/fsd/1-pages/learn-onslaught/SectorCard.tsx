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
                'group w-full rounded-lg border bg-stone-100/80 shadow-sm transition-shadow hover:shadow-md dark:bg-stone-900/80',
                badgeAlliance === 'Imperial' && 'border-green-700/60 hover:shadow-green-700/60', // Chaos Track
                badgeAlliance === 'Xenos' && 'border-red-700/60 hover:shadow-red-700/60', // Chaos Track
                badgeAlliance === 'Chaos' && 'border-blue-700/60 hover:shadow-blue-700/60' // Imperial Track
            )}
            open={isOpen}
            onToggle={() => setOpen(prev => !prev)}>
            <summary className="flex cursor-pointer items-center gap-2 bg-stone-300/80 px-3 py-2.5 text-sm transition-colors select-none hover:bg-stone-400/50 sm:px-4 sm:py-3 sm:text-base dark:bg-stone-900/80 dark:hover:bg-stone-800/50">
                <span className="w-32 font-semibold dark:text-amber-100">{name}</span>
                <span className="whitespace-nowrap">Min Power:</span>
                <span className="block font-medium sm:inline dark:text-amber-200">{minHeroPower}</span>
                <span className="text-sm dark:text-stone-400"></span>
                <span className="pl-2 text-sm whitespace-nowrap dark:text-stone-400">Max Badge:</span>
                <BadgeImage alliance={badgeAlliance} rarity={maxBadgeRarity} size="small" />
                <span className="ml-auto text-sm dark:text-amber-100">
                    {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </span>
            </summary>

            {isOpen && (
                <div className="w-full border-t border-amber-700/30 px-3 pt-2 pb-3 sm:px-4 sm:pt-3 sm:pb-4">
                    <KillzoneList killzones={killzones} badgeAlliance={badgeAlliance} />
                </div>
            )}
        </details>
    );
}
