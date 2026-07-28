import { ArrowRight } from 'lucide-react';
import React from 'react';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RankIcon, RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { RankStep } from '../model';

interface RankChangeArrowProps {
    start: RankStep;
    end: RankStep;
    filterRarities?: Rarity[];
}

/** "Rank X -> Rank Y" arrow, with an optional pill of rarities the change is restricted to (pre-farm goals). */
export const RankChangeArrow: React.FC<RankChangeArrowProps> = ({ start, end, filterRarities }) => {
    return (
        <div className="flex items-center gap-2">
            <RankIcon rank={start.rank} rankPoint5={start.point5} />
            <ArrowRight className="size-4" />
            <RankIcon rank={end.rank} rankPoint5={end.point5} />
            {!!filterRarities?.length && (
                <span className="flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 dark:bg-slate-700">
                    {filterRarities.map(rarity => (
                        <RarityIcon key={rarity} rarity={rarity} />
                    ))}
                </span>
            )}
        </div>
    );
};

interface AscendChangeArrowProps {
    startRarity: Rarity;
    startStars: RarityStars;
    endRarity: Rarity;
    endStars: RarityStars;
}

/** "Rarity+Stars X -> Rarity+Stars Y" arrow. */
export const AscendChangeArrow: React.FC<AscendChangeArrowProps> = ({
    startRarity,
    startStars,
    endRarity,
    endStars,
}) => {
    return (
        <div className="flex items-center gap-2">
            <RarityIcon rarity={startRarity} />
            <StarsIcon stars={startStars} />
            <ArrowRight className="size-4" />
            <RarityIcon rarity={endRarity} />
            <StarsIcon stars={endStars} />
        </div>
    );
};

interface AbilitiesChangeTextProps {
    startActive: number;
    endActive: number;
    startPassive: number;
    endPassive: number;
    isMow: boolean;
}

/** "Active: 3->7, Passive: 2->5" text (labelled Primary/Secondary for MoWs), omitting parts that didn't change. */
export const AbilitiesChangeText: React.FC<AbilitiesChangeTextProps> = ({
    startActive,
    endActive,
    startPassive,
    endPassive,
    isMow,
}) => {
    const activeLabel = isMow ? 'Primary' : 'Active';
    const passiveLabel = isMow ? 'Secondary' : 'Passive';
    const parts: string[] = [];
    if (endActive > startActive) {
        parts.push(`${activeLabel}: ${startActive}→${endActive}`);
    }
    if (endPassive > startPassive) {
        parts.push(`${passiveLabel}: ${startPassive}→${endPassive}`);
    }
    return <span>{parts.join(', ')}</span>;
};
