import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/fsd/5-shared/ui';

interface Props {
    onEdit: () => void;
    onDelete: () => void;
    /** Moves the team by one position in the global order. Negative is up. */
    onMove: (delta: number) => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

const actionButton = '[--btn-accent:var(--soft-fg)]';

/** Renders the edit/delete/priority action buttons for a team card header as a compact 2×2 grid. */
export const TeamCardActions: React.FC<Props> = ({ onEdit, onDelete, onMove, canMoveUp, canMoveDown }) => (
    <div className="grid grid-cols-2 gap-0.5 text-(--soft-fg)">
        <Button
            size="square-petite"
            appearance="plain"
            className={actionButton}
            aria-label="Increase Team Priority"
            isDisabled={!canMoveUp}
            onPress={() => onMove(-1)}>
            <ArrowUp data-slot="icon" />
        </Button>
        <Button
            size="square-petite"
            appearance="plain"
            className={actionButton}
            aria-label="Edit Team"
            onPress={onEdit}>
            <Pencil data-slot="icon" />
        </Button>
        <Button
            size="square-petite"
            appearance="plain"
            className={actionButton}
            aria-label="Decrease Team Priority"
            isDisabled={!canMoveDown}
            onPress={() => onMove(1)}>
            <ArrowDown data-slot="icon" />
        </Button>
        <Button
            size="square-petite"
            appearance="plain"
            className="[--btn-accent:var(--soft-fg)] data-hovered:[--btn-accent:var(--danger)]"
            aria-label="Delete Team"
            onPress={onDelete}>
            <Trash2 data-slot="icon" />
        </Button>
    </div>
);
