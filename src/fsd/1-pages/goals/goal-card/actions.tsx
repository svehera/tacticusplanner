import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/fsd/5-shared/ui';

interface Props {
    menuItemSelect?: (item: 'edit' | 'delete' | 'moveUp' | 'moveDown') => void;
}

const actionButton = '[--btn-accent:var(--soft-fg)]';

/** Renders the edit/delete/priority action buttons for a goal card header as a compact 2×2 grid. */
export const GoalCardActions: React.FC<Props> = ({ menuItemSelect }) => {
    if (!menuItemSelect) return;
    return (
        <div className="grid grid-cols-2 gap-0.5 text-(--soft-fg)">
            <Button
                size="square-petite"
                appearance="plain"
                className={actionButton}
                aria-label="Increase Goal Priority"
                onPress={() => menuItemSelect('moveUp')}>
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
                onPress={() => menuItemSelect('moveDown')}>
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
