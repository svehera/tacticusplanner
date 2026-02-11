import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

// eslint-disable-next-line import-x/no-internal-modules
import onslaughtData from '@/data/onslaught/data.generated.json';

import { Onslaught } from './index';

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location">{location.search}</div>;
}

describe('Onslaught page', () => {
    it('renders the correct track for a given query parameter', () => {
        render(
            <MemoryRouter initialEntries={['/learn/onslaught?track=Imperial']}>
                <Onslaught />
            </MemoryRouter>
        );

        expect(screen.getByRole('tab', { name: 'Imperial' })).toHaveAttribute('aria-selected', 'true');
    });

    it('switching track is reflected in the query parameters', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/learn/onslaught?track=Imperial']}>
                <>
                    <Onslaught />
                    <LocationDisplay />
                </>
            </MemoryRouter>
        );

        // Click another track and verify the URL search params update
        const xenosTab = screen.getByRole('tab', { name: 'Xenos' });
        await user.click(xenosTab);

        expect(await screen.findByTestId('location')).toHaveTextContent('track=Xenos');
        expect(screen.getByRole('tab', { name: 'Xenos' })).toHaveAttribute('aria-selected', 'true');
    });

    it('renders a collection of details elements for the active track', () => {
        const { container } = render(
            <MemoryRouter initialEntries={['/learn/onslaught?track=Imperial']}>
                <Onslaught />
            </MemoryRouter>
        );

        const sectors = onslaughtData[0].sectors;
        const detailsEls = container.querySelectorAll('details');

        expect(detailsEls.length).toBe(Object.keys(sectors).length);
    });

    it('details elements can be opened to show a table of information', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <MemoryRouter initialEntries={['/learn/onslaught?track=Imperial']}>
                <Onslaught />
            </MemoryRouter>
        );

        const firstSector = onslaughtData[0].sectors[0];
        if (!firstSector) throw new Error('First sector data not found');

        // Open the first sector
        await user.click(screen.getByText(firstSector.name));

        // Table and headers should now be visible
        const table = await screen.findByRole('table');
        expect(table).toBeInTheDocument();
        expect(screen.getByText('Killzone')).toBeInTheDocument();

        // Verify the number of rows equals the number of killzones
        const tbodyRows = container.querySelectorAll('tbody tr');
        expect(tbodyRows.length).toBe(firstSector.killzones.length);
    });
});
