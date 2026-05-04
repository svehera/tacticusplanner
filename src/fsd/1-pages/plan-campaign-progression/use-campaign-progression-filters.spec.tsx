import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useCampaignProgressionFilters } from './use-campaign-progression-filters';

const FiltersHarness = () => {
    const {
        expandedCardId,
        hideCE,
        hideLocked,
        hideNoDrops,
        setExpandedCardId,
        setHideCE,
        setHideLocked,
        setHideNoDrops,
        setSortMode,
        sortMode,
    } = useCampaignProgressionFilters();

    return (
        <div>
            <span data-testid="sort-mode">{sortMode}</span>
            <span data-testid="expanded-card">{expandedCardId ?? ''}</span>
            <span data-testid="hide-no-drops">{String(hideNoDrops)}</span>
            <span data-testid="hide-locked">{String(hideLocked)}</span>
            <span data-testid="hide-ce">{String(hideCE)}</span>

            <button onClick={() => setSortMode('goalPriority')}>set sort</button>
            <button onClick={() => setExpandedCardId('octarius')}>set campaign</button>
            <button onClick={() => setHideNoDrops(false)}>show no drops</button>
            <button onClick={() => setHideLocked(false)}>show locked</button>
            <button onClick={() => setHideCE(true)}>show ce</button>
        </div>
    );
};

function renderFilters(initialEntry = '/'): void {
    globalThis.history.replaceState({}, '', initialEntry);
    render(
        <BrowserRouter>
            <FiltersHarness />
        </BrowserRouter>
    );
}

describe('useCampaignProgressionFilters', () => {
    it('syncs search param changes back into local state', async () => {
        renderFilters('/?sort=unlocks');

        expect(screen.getByTestId('sort-mode')).toHaveTextContent('unlocks');

        await act(async () => {
            globalThis.history.pushState(
                {},
                '',
                '/?sort=earlyPayoff&campaign=saim-hann&dropsOnly=false&hideLocked=false&hideCE=true'
            );
            globalThis.dispatchEvent(new PopStateEvent('popstate'));
        });

        await waitFor(() => {
            expect(screen.getByTestId('sort-mode')).toHaveTextContent('earlyPayoff');
            expect(screen.getByTestId('expanded-card')).toHaveTextContent('saim-hann');
            expect(screen.getByTestId('hide-no-drops')).toHaveTextContent('false');
            expect(screen.getByTestId('hide-locked')).toHaveTextContent('false');
            expect(screen.getByTestId('hide-ce')).toHaveTextContent('true');
        });
    });

    it('pushes local state changes back into the URL', async () => {
        renderFilters('/');

        fireEvent.click(screen.getByRole('button', { name: 'set sort' }));
        fireEvent.click(screen.getByRole('button', { name: 'set campaign' }));
        fireEvent.click(screen.getByRole('button', { name: 'show no drops' }));
        fireEvent.click(screen.getByRole('button', { name: 'show locked' }));
        fireEvent.click(screen.getByRole('button', { name: 'show ce' }));

        await waitFor(() => {
            const params = new URLSearchParams(globalThis.location.search);

            expect(params.get('sort')).toBe('goalPriority');
            expect(params.get('campaign')).toBe('octarius');
            expect(params.get('dropsOnly')).toBe('false');
            expect(params.get('hideLocked')).toBe('false');
            expect(params.get('hideCE')).toBe('true');
        });
    });
});
