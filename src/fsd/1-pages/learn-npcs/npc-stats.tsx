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
        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</div>
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
        <div className="p-6 space-y-6">
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Health" icon="health" value={currentStats?.health} />
                <StatCard label="Armor" icon="armour" value={currentStats?.armor} />
                <StatCard label="Damage" icon="damage" value={currentStats?.damage} />
            </div>

            {/* Attack Profiles Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Melee Profile */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MiscIcon icon="meleeAttack" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                                <MiscIcon icon={'damage' + npc.meleeDamage!} />
                            </div>
                            <div className="flex items-center gap-1 font-mono font-bold text-lg dark:text-white">
                                <MiscIcon icon="hits" />
                                <span>{npc.meleeHits!}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ranged Profile (Conditional) */}
                {npc.rangeDamage !== undefined ? (
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MiscIcon icon="rangedAttack" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                                    <MiscIcon icon={'damage' + npc.rangeDamage!} />
                                </div>
                                <div className="flex items-center gap-1 font-mono font-bold text-lg dark:text-white">
                                    <MiscIcon icon="hits" />
                                    <span>{npc.rangeHits!}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No Ranged Attack</span>
                    </div>
                )}
            </div>

            {/* Traits Section */}
            {npc.traits.length > 0 && (
                <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Traits</div>
                    <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                        {npc.traits.map(trait => {
                            const icon = NpcService.getTraitIcon(trait);
                            if (!icon) return null;
                            return (
                                <div key={trait} className="relative group">
                                    <img
                                        src={getImageUrl(icon)}
                                        alt={trait}
                                        className="w-8 h-8 transition-transform transform group-hover:scale-110"
                                    />
                                    {/* Optional: Tooltip on hover */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
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
