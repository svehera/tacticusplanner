import React from 'react';

import { Rank } from '@/fsd/5-shared/model';
import { LazyTooltip } from '@/fsd/5-shared/ui';
import { RankIcon } from '@/fsd/5-shared/ui/icons';

interface Props {
    rank: Rank;
    rankPoint5?: boolean;
    /** Accessible role of this emblem in a progression (e.g. "Current rank"). */
    role: string;
}

/**
 * Rank emblem in a fixed, centered box. Rank PNGs vary in aspect ratio / internal padding, so a
 * uniform footprint keeps the two emblems (and the arrow) visually aligned in a progression row.
 */
export const RankEmblem: React.FC<Props> = ({ rank, rankPoint5, role }) => (
    <LazyTooltip title={`${role}: ${Rank[rank].replace(/(\d)$/, ' $1')}${rankPoint5 ? '.5' : ''}`}>
        <span className="inline-flex h-[30px] min-w-[30px] shrink-0 items-center justify-center">
            <RankIcon rank={rank} rankPoint5={rankPoint5} />
        </span>
    </LazyTooltip>
);
