import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { GoalCardActions } from './actions';

/**
 * The shared Button is react-aria's, which reacts to `onPress` rather than `onClick` — a bare
 * `fireEvent.click` never reaches the handler. Fire the pointer sequence `usePress` listens for.
 */
const press = (element: HTMLElement) => {
    fireEvent.pointerDown(element, { pointerId: 1, pointerType: 'mouse', button: 0 });
    fireEvent.pointerUp(element, { pointerId: 1, pointerType: 'mouse', button: 0 });
    fireEvent.click(element);
};

const upButton = () => screen.getByRole('button', { name: 'Increase Goal Priority' });
const downButton = () => screen.getByRole('button', { name: 'Decrease Goal Priority' });

/** Renders with a goal in the middle of its section, so both arrows are live unless overridden. */
const renderActions = (props: Partial<React.ComponentProps<typeof GoalCardActions>> = {}) => {
    const onMove = vi.fn();
    const menuItemSelect = vi.fn();
    render(<GoalCardActions menuItemSelect={menuItemSelect} onMove={onMove} canMoveUp canMoveDown {...props} />);
    return { onMove, menuItemSelect };
};

describe('GoalCardActions priority arrows', () => {
    it('moves the goal up by one position', () => {
        const { onMove } = renderActions();

        press(upButton());

        expect(onMove).toHaveBeenCalledWith(-1);
    });

    it('moves the goal down by one position', () => {
        const { onMove } = renderActions();

        press(downButton());

        expect(onMove).toHaveBeenCalledWith(1);
    });

    it('disables the up arrow only for the globally first goal', () => {
        const { onMove } = renderActions({ canMoveUp: false });

        expect(upButton()).toBeDisabled();
        press(upButton());
        expect(onMove).not.toHaveBeenCalled();
    });

    it('disables the down arrow only for the globally last goal', () => {
        const { onMove } = renderActions({ canMoveDown: false });

        expect(downButton()).toBeDisabled();
        press(downButton());
        expect(onMove).not.toHaveBeenCalled();
    });

    it('enables arrows purely on position, independent of whether a handler is wired up', () => {
        renderActions({ onMove: undefined });

        expect(upButton()).toBeEnabled();
        expect(downButton()).toBeEnabled();
    });

    it('pressing an arrow without a handler is a safe no-op', () => {
        renderActions({ onMove: undefined });

        expect(() => press(upButton())).not.toThrow();
    });

    it('disables an arrow whose direction is not supplied', () => {
        // A caller that omits the position flags gets disabled arrows rather than dead-looking live
        // ones — see GoalSection, which always passes both.
        renderActions({ canMoveUp: undefined, canMoveDown: undefined });

        expect(upButton()).toBeDisabled();
        expect(downButton()).toBeDisabled();
    });

    it('keeps edit and delete working while the arrows are disabled', () => {
        const { menuItemSelect } = renderActions({ canMoveUp: false, canMoveDown: false });

        press(screen.getByRole('button', { name: 'Edit Goal' }));
        press(screen.getByRole('button', { name: 'Delete Goal' }));

        expect(menuItemSelect).toHaveBeenNthCalledWith(1, 'edit');
        expect(menuItemSelect).toHaveBeenNthCalledWith(2, 'delete');
    });
});
