import { ArrowDown, ArrowUp, Ban, Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { AccessibleTooltip, Button } from '@/fsd/5-shared/ui';

import { IGoalEstimate } from '@/fsd/3-features/goals';

interface Props {
    goalEstimate: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete' | 'moveUp' | 'moveDown') => void;
}

/** Renders the action buttons and status indicators (completion, blocked) for a goal card. */
export const GoalCardActions: React.FC<Props> = ({ goalEstimate, menuItemSelect }) => (
    <div className="flex items-center gap-0.5 text-(--soft-fg)">
        {!!goalEstimate.blocked && (
            <AccessibleTooltip title="Goal is blocked because required farm nodes are not accessible. See Plan > Daily Raids > Raids Plan > Blocked Upgrades for details.">
                <span className="flex items-center" tabIndex={0}>
                    <Ban className="size-4 text-(--danger)" />
                </span>
            </AccessibleTooltip>
        )}
        {menuItemSelect && (
            <>
                <Button
                    size="square-petite"
                    appearance="plain"
                    className="[--btn-accent:var(--soft-fg)]"
                    aria-label="Increase Goal Priority"
                    onPress={() => menuItemSelect('moveUp')}>
                    <ArrowUp data-slot="icon" />
                </Button>
                <Button
                    size="square-petite"
                    appearance="plain"
                    className="[--btn-accent:var(--soft-fg)]"
                    aria-label="Decrease Goal Priority"
                    onPress={() => menuItemSelect('moveDown')}>
                    <ArrowDown data-slot="icon" />
                </Button>
                <Button
                    size="square-petite"
                    appearance="plain"
                    className="[--btn-accent:var(--soft-fg)]"
                    aria-label="Edit Goal"
                    onPress={() => menuItemSelect('edit')}>
                    <Pencil data-slot="icon" />
                </Button>
                <Button
                    size="square-petite"
                    appearance="plain"
                    className="[--btn-accent:var(--soft-fg)]"
                    aria-label="Delete Goal"
                    onPress={() => menuItemSelect('delete')}>
                    <Trash2 data-slot="icon" />
                </Button>
            </>
        )}
    </div>
);
