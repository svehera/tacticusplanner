import React from 'react';

import { LazyTooltip } from '@/fsd/5-shared/ui';

export interface ResourceCostItem {
    key: string;
    icon: React.ReactNode;
    label: React.ReactNode;
    /** Optional hover tooltip describing the resource (e.g. "Epic Orb"). */
    tooltip?: React.ReactNode;
}

interface Props {
    items: ResourceCostItem[];
}

/** Inline `icon ×N` cost row (orbs, badges, components, gold). Token-styled, no MUI. */
export const ResourceCostRow: React.FC<Props> = ({ items }) => {
    if (items.length === 0) return;

    return (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-(--soft-fg) tabular-nums">
            {items.map(item => {
                const content = (
                    <span className="inline-flex items-center gap-1">
                        {item.icon}
                        {item.label}
                    </span>
                );
                return item.tooltip === undefined ? (
                    <React.Fragment key={item.key}>{content}</React.Fragment>
                ) : (
                    <LazyTooltip key={item.key} title={item.tooltip}>
                        {content}
                    </LazyTooltip>
                );
            })}
        </div>
    );
};
