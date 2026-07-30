import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/fsd/5-shared/ui';

interface Props {
    menuItemSelect?: (item: 'edit' | 'delete') => void;
    /** Moves the goal by one position within its section. Negative is up. */
    onMove?: (delta: number) => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}

const actionButton = '[--btn-accent:var(--soft-fg)]';

/** Renders the edit/delete/priority action buttons for a goal card header as a compact 2×2 grid. */
export const GoalCardActions: React.FC<Props> = ({ menuItemSelect, onMove, canMoveUp, canMoveDown }) => {
    if (!menuItemSelect) return;
    return (
        <div className="grid grid-cols-2 gap-0.5 text-(--soft-fg)">
            <Button
                size="square-petite"
                appearance="plain"
                className={actionButton}
                aria-label="Increase Goal Priority"
                isDisabled={!canMoveUp}
                onPress={() => onMove?.(-1)}>
                <ArrowUp data-slot="icon" />
            </Button>
            <Button
                size="square-petite"
                appearance="plain"
                className={actionButton}
                aria-label="Edit Goal"
                onPress={() => menuItemSelect('edit')}>
                <Pencil data-slot="icon" />
            </Button>
            <Button
                size="square-petite"
                appearance="plain"
                className={actionButton}
                aria-label="Decrease Goal Priority"
                isDisabled={!canMoveDown}
                onPress={() => onMove?.(1)}>
                <ArrowDown data-slot="icon" />
            </Button>
            <Button
                size="square-petite"
                appearance="plain"
                className="[--btn-accent:var(--soft-fg)] data-hovered:[--btn-accent:var(--danger)]"
                aria-label="Delete Goal"
                onPress={() => menuItemSelect('delete')}>
                <Trash2 data-slot="icon" />
            </Button>
        </div>
    );
};
