import React from 'react';

import { getImageUrl } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { INpcData, NpcService, INpcStats } from '@/fsd/4-entities/npc';

interface Props {
    npc: INpcData;
    currentStats?: INpcStats;
}

interface StatCardProps {
    label: string;
    value: number | undefined;
    icon: string;
    subIcons?: React.ReactNode[];
}

export const NpcStats: React.FC<Props> = ({ npc, currentStats }) => {
    // Helper component for stat cards to reduce repetition
    const StatCard = ({ label, value, icon, subIcons = [] }: StatCardProps) => (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-100 p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-1 text-xs tracking-wider text-gray-500 uppercase dark:text-gray-400">{label}</div>
            <div className="flex items-center gap-2">
                <MiscIcon icon={icon} />
                {subIcons.map((s: any, i: number) => (
                    <React.Fragment key={i}>{s}</React.Fragment>
                ))}
                <span className="text-xl font-bold text-gray-900 dark:text-white">{value}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-6">
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Health" icon="health" value={currentStats?.health} />
                <StatCard label="Armor" icon="armour" value={currentStats?.armor} />
                <StatCard label="Damage" icon="damage" value={currentStats?.damage} />
            </div>

            {/* Attack & Movement Profiles Section */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Movement Profile */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MiscIcon icon="movement" />
                        </div>
                        <div className="flex items-center gap-1 font-mono text-lg font-bold dark:text-white">
                            <span>{npc.movement}</span>
                        </div>
                    </div>
                </div>

                {/* Melee Profile */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MiscIcon icon="meleeAttack" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center rounded bg-slate-200 px-2 py-1 dark:bg-slate-700">
                                <MiscIcon icon={'damage' + npc.meleeDamage!} />
                            </div>
                            <div className="flex items-center gap-1 font-mono text-lg font-bold dark:text-white">
                                <MiscIcon icon="hits" />
                                <span>{npc.meleeHits!}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ranged Profile (Conditional) */}
                {npc.rangeDamage !== undefined ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="flex items-center gap-4">
                            {/* Relative Container to stack Number on top of Icon */}
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                                <MiscIcon icon="rangedAttack" />
                                <span className="absolute inset-0 mt-0.5 flex items-center justify-center text-sm font-black text-gray-900 dark:text-white">
                                    {npc.rangeDistance!}
                                </span>
                            </div>

                            {/* Damage Icon */}
                            <div className="flex items-center rounded-md bg-slate-200 p-1 dark:bg-slate-700">
                                <MiscIcon icon={'damage' + npc.rangeDamage!} />
                            </div>

                            {/* Hits */}
                            <div className="flex items-center gap-1 font-mono text-lg font-bold dark:text-white">
                                <MiscIcon icon="hits" />
                                <span>{npc.rangeHits!}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-4 dark:border-slate-700">
                        <span className="text-sm text-gray-400">No Ranged Attack</span>
                    </div>
                )}
            </div>

            {/* Traits Section */}
            {npc.traits.length > 0 && (
                <div>
                    <div className="mb-3 text-xs tracking-wider text-gray-500 uppercase dark:text-gray-400">Traits</div>
                    <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                        {npc.traits.map(trait => {
                            const icon = NpcService.getTraitIcon(trait);
                            if (!icon) return null;
                            return (
                                <div key={trait} className="group relative">
                                    <img
                                        src={getImageUrl(icon)}
                                        alt={trait}
                                        className="h-8 w-8 transform transition-transform group-hover:scale-110"
                                    />
                                    {/* Optional: Tooltip on hover */}
                                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded bg-black px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                                        {trait}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
