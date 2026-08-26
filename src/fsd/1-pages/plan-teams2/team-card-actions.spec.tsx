import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TeamCardActions } from './team-card-actions';

/**
 * The shared Button is react-aria's, which reacts to `onPress` rather than `onClick` — a bare
 * `fireEvent.click` never reaches the handler. Fire the pointer sequence `usePress` listens for.
 */
const press = (element: HTMLElement) => {
    fireEvent.pointerDown(element, { pointerId: 1, pointerType: 'mouse', button: 0 });
    fireEvent.pointerUp(element, { pointerId: 1, pointerType: 'mouse', button: 0 });
    fireEvent.click(element);
};

const upButton = () => screen.getByRole('button', { name: 'Increase Team Priority' });
const downButton = () => screen.getByRole('button', { name: 'Decrease Team Priority' });

const renderActions = (props: Partial<React.ComponentProps<typeof TeamCardActions>> = {}) => {
    const onMove = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<TeamCardActions onEdit={onEdit} onDelete={onDelete} onMove={onMove} canMoveUp canMoveDown {...props} />);
    return { onMove, onEdit, onDelete };
};

describe('TeamCardActions priority arrows', () => {
    it('moves the team up by one position', () => {
        const { onMove } = renderActions();

        press(upButton());

        expect(onMove).toHaveBeenCalledWith(-1);
    });

    it('moves the team down by one position', () => {
        const { onMove } = renderActions();

        press(downButton());

        expect(onMove).toHaveBeenCalledWith(1);
    });

    it('disables the up arrow only for the globally first team', () => {
        const { onMove } = renderActions({ canMoveUp: false });

        expect(upButton()).toBeDisabled();
        press(upButton());
        expect(onMove).not.toHaveBeenCalled();
    });

    it('disables the down arrow only for the globally last team', () => {
        const { onMove } = renderActions({ canMoveDown: false });

        expect(downButton()).toBeDisabled();
        press(downButton());
        expect(onMove).not.toHaveBeenCalled();
    });

    it('keeps edit and delete working while the arrows are disabled', () => {
        const { onEdit, onDelete } = renderActions({ canMoveUp: false, canMoveDown: false });

        press(screen.getByRole('button', { name: 'Edit Team' }));
        press(screen.getByRole('button', { name: 'Delete Team' }));

        expect(onEdit).toHaveBeenCalledOnce();
        expect(onDelete).toHaveBeenCalledOnce();
    });
});
