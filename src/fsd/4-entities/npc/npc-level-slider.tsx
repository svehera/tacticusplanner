import React from 'react';

import { Slider } from '@/fsd/5-shared/ui';
import { RankIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { INpcData } from './model';

interface Props {
    npc: INpcData;
    index: number;
    indexChanges: (value: number) => void;
}

/** Horizontal slider over an NPC's progression levels. The stars sit above the thumb and the rank below it. */
export const NpcLevelSlider: React.FC<Props> = ({ npc, index, indexChanges }) => {
    const lastIndex = npc.stats.length - 1;
    const current = npc.stats[Math.min(index, lastIndex)];
    const percent = lastIndex > 0 ? (index / lastIndex) * 100 : 0;

    if (lastIndex < 1) {
        return (
            <div className="flex flex-col items-center gap-1 py-2">
                <StarsIcon stars={current.rarityStars} />
                <RankIcon rank={current.rank} size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="flex items-baseline justify-between text-xs text-(--soft-fg)">
                <span className="font-bold tracking-widest uppercase">NPC level</span>
                <span className="tabular-nums">
                    {index + 1} / {npc.stats.length}
                </span>
            </div>
            <div className="px-12 pt-8 pb-10">
                <div className="relative">
                    <Slider
                        value={index}
                        min={0}
                        max={lastIndex}
                        step={1}
                        onChange={indexChanges}
                        aria-label="NPC level"
                    />
                    <div
                        className="pointer-events-none absolute bottom-full flex -translate-x-1/2 justify-center pb-1"
                        style={{ left: `${percent}%` }}>
                        <StarsIcon stars={current.rarityStars} />
                    </div>
                    <div
                        className="pointer-events-none absolute top-full flex -translate-x-1/2 justify-center pt-1"
                        style={{ left: `${percent}%` }}>
                        <RankIcon rank={current.rank} size={32} />
                    </div>
                </div>
            </div>
        </div>
    );
};
