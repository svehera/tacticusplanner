import { ArrowRight } from 'lucide-react';
import React from 'react';

interface StatBlock {
    label: string;
    start: number;
    end: number;
}

interface Props {
    blocks: StatBlock[];
}

/** Two side-by-side soft-filled blocks — an uppercase label and a `start → end` value on one row. */
export const StatBlockPair: React.FC<Props> = ({ blocks }) => {
    if (blocks.length === 0) return;

    return (
        <div className="flex flex-wrap gap-1.5">
            {blocks.map(block => (
                <div
                    key={block.label}
                    className="flex flex-1 items-center justify-between gap-1.5 rounded-lg bg-(--soft) px-2 py-1">
                    <span className="text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        {block.label}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold text-(--fg) tabular-nums">
                        {block.start}
                        <ArrowRight className="size-3.5 text-(--soft-fg)" />
                        <span className="text-(--primary)">{block.end}</span>
                    </span>
                </div>
            ))}
        </div>
    );
};
