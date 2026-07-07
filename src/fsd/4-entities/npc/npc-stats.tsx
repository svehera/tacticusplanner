import React from 'react';

import { AttackProfileRow, getImageUrl } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { INpcData, INpcStats } from './model';
import { NpcService } from './npc-service';

interface Props {
    npc: INpcData;
    currentStats?: INpcStats;
}

interface StatCardProps {
    label: string;
    value: number | undefined;
    icon: string;
    suffix?: string;
    subIcons?: React.ReactNode[];
}

const StatCard = ({ label, value, icon, suffix, subIcons = [] }: StatCardProps) => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-100 p-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-1 text-xs tracking-wider text-gray-500 uppercase dark:text-gray-400">{label}</div>
        <div className="flex items-center gap-2">
            <MiscIcon icon={icon} />
            {subIcons.map((s: React.ReactNode, index: number) => (
                <React.Fragment key={index}>{s}</React.Fragment>
            ))}
            <span className="text-xl font-bold text-gray-900 dark:text-white">
                {value}
                {suffix}
            </span>
        </div>
    </div>
);

export const NpcStats: React.FC<Props> = ({ npc, currentStats }) => {
    const meleeAttacks =
        npc.meleeAttacks ?? (npc.meleeDamage ? [{ damageType: npc.meleeDamage, hits: npc.meleeHits ?? 0 }] : []);
    const rangedAttacks =
        npc.rangedAttacks ??
        (npc.rangeDamage ? [{ damageType: npc.rangeDamage, hits: npc.rangeHits ?? 0, range: npc.rangeDistance }] : []);

    return (
        <div className="space-y-6 p-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard label="Health" icon="health" value={currentStats?.health} />
                <StatCard label="Armor" icon="armour" value={currentStats?.armor} />
                <StatCard label="Damage" icon="damage" value={currentStats?.damage} />
                <StatCard label="Movement" icon="movement" value={npc.movement} />
                {(currentStats?.critChance !== undefined || currentStats?.critDamage !== undefined) && (
                    <>
                        {currentStats?.critChance !== undefined && (
                            <StatCard
                                label="Crit Chance"
                                icon="critDamage"
                                subIcons={[<MiscIcon key="chance" icon="chance" />]}
                                value={currentStats.critChance}
                                suffix="%"
                            />
                        )}
                        {currentStats?.critDamage !== undefined && (
                            <StatCard label="Crit Damage" icon="critDamage" value={currentStats.critDamage} />
                        )}
                    </>
                )}
                {(currentStats?.blockChance !== undefined || currentStats?.blockDamage !== undefined) && (
                    <>
                        {currentStats?.blockChance !== undefined && (
                            <StatCard
                                label="Block Chance"
                                icon="block"
                                subIcons={[<MiscIcon key="chance" icon="chance" />]}
                                value={currentStats.blockChance}
                                suffix="%"
                            />
                        )}
                        {currentStats?.blockDamage !== undefined && (
                            <StatCard label="Block Damage" icon="block" value={currentStats.blockDamage} />
                        )}
                    </>
                )}
            </div>

            {/* Melee attacks, one per line */}
            {meleeAttacks.length > 0 && (
                <div className="space-y-2">
                    {meleeAttacks.map((attack, index) => (
                        <AttackProfileRow key={index} hits={attack.hits} damageType={attack.damageType} />
                    ))}
                </div>
            )}

            {/* Ranged attacks, one per line */}
            {rangedAttacks.length > 0 && (
                <div className="space-y-2">
                    {rangedAttacks.map((attack, index) => (
                        <AttackProfileRow
                            key={index}
                            hits={attack.hits}
                            damageType={attack.damageType}
                            range={attack.range}
                        />
                    ))}
                </div>
            )}

            {/* Traits Section */}
            {npc.traits.length > 0 && (
                <div>
                    <div className="mb-3 text-xs tracking-wider text-gray-500 uppercase dark:text-gray-400">Traits</div>
                    <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                        {npc.traits.map(trait => {
                            const icon = NpcService.getTraitIcon(trait);
                            if (!icon) return;
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
