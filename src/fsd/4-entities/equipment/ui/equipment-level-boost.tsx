import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/fsd/5-shared/lib';

import type { IEquipment } from '../model';

import { EquipmentBoost } from './equipment-boost';

/** Shows an equipment's fully-upgraded stats by default, with the full per-level progression behind a disclosure. */
export const EquipmentLevelBoost = ({ equipment }: { equipment: IEquipment }) => {
    const [expanded, setExpanded] = useState(false);
    const maxLevel = equipment.levels.length;

    return (
        <div className="flex flex-col gap-1 py-1">
            <div className="flex items-center gap-2">
                <span className="text-xs text-(--soft-fg)">Lvl {maxLevel} (max)</span>
                <EquipmentBoost
                    type={equipment.type}
                    stats={equipment.levels[maxLevel - 1].stats}
                    width={20}
                    height={20}
                />
                {maxLevel > 1 && (
                    <button
                        type="button"
                        onClick={() => setExpanded(current => !current)}
                        aria-expanded={expanded}
                        className="flex items-center gap-0.5 text-[11px] text-(--soft-fg) hover:text-(--fg)">
                        <ChevronDown
                            aria-hidden="true"
                            className={cn('size-3 shrink-0 transition-transform', expanded || '-rotate-90')}
                        />
                        {expanded ? 'Hide levels' : 'Show all levels'}
                    </button>
                )}
            </div>
            {expanded && (
                <div className="flex flex-col gap-0.5 border-t border-(--border) pt-1">
                    {equipment.levels.map((level, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className="w-10 text-[11px] text-(--soft-fg)">Lvl {index + 1}</span>
                            <EquipmentBoost type={equipment.type} stats={level.stats} width={16} height={16} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
