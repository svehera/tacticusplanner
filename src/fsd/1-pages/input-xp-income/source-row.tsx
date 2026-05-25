import React from 'react';

import { MiscIcon, tacticusIcons } from '@/fsd/5-shared/ui/icons';

import { SourceContribution } from './compute-sources';

interface SourceRowProps {
    source: SourceContribution;
    expanded: boolean;
    onToggle: () => void;
    /** Total weekly value across all sources — used to compute % share */
    total: number;
    children: React.ReactNode;
}

export const SourceRow: React.FC<SourceRowProps> = ({ source, expanded, onToggle, total, children }) => {
    const pct = total > 0 ? (source.weekly / total) * 100 : 0;

    return (
        <div className="border-b border-[var(--border)] last:border-b-0">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--neutral)]">
                {/* Icon tile */}
                <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{
                        background: `color-mix(in oklab, ${source.color} 18%, transparent)`,
                    }}>
                    {source.icon in tacticusIcons ? (
                        <MiscIcon icon={source.icon as keyof typeof tacticusIcons} width={22} height={22} />
                    ) : (
                        <span className="text-base">{source.icon}</span>
                    )}
                </span>

                {/* Label + summary */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[14px] font-semibold text-[var(--fg)]">{source.label}</span>
                        <span className="truncate text-[11px] text-[var(--soft-fg)]">{source.summary}</span>
                    </div>
                </div>

                {/* Per-day + % */}
                <div className="flex-shrink-0 text-right">
                    <div className="text-[13px] font-bold text-[var(--fg)] tabular-nums">
                        {(source.weekly / 7).toFixed(2)}
                    </div>
                    <div className="text-[10px] tracking-wider text-[var(--soft-fg)] uppercase">
                        / day · {pct.toFixed(0)}%
                    </div>
                </div>

                {/* Chevron */}
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="flex-shrink-0 text-[var(--soft-fg)] transition-transform"
                    style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {expanded && (
                <div className="fade-in bg-[var(--neutral)]/30 px-5 pt-1 pb-4">
                    <div className="border-l-2 pl-4" style={{ borderColor: source.color }}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};
