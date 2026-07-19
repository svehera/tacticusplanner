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

/** Two side-by-side soft-filled blocks showing an uppercase label over a `start → end` value. */
export const StatBlockPair: React.FC<Props> = ({ blocks }) => {
    if (blocks.length === 0) return;

    return (
        <div className="flex gap-1.5">
            {blocks.map(block => (
                <div
                    key={block.label}
                    className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-(--soft) px-1 py-1.5">
                    <span className="text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        {block.label}
                    </span>
                    <span className="flex items-center gap-1 text-[15px] font-bold text-(--fg) tabular-nums">
                        {block.start}
                        <ArrowRight className="size-3.5 text-(--soft-fg)" />
                        <span className="text-(--primary)">{block.end}</span>
                    </span>
                </div>
            ))}
        </div>
    );
};
