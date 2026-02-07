import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { onslaughtData } from './data';
import { indexToRomanNumeral } from './utils';

import { Onslaught } from './index';

function renderOnslaught(initialRoute = '?track=Imperial') {
    return render(
        <MemoryRouter initialEntries={[`/learn/onslaught${initialRoute}`]}>
            <Onslaught />
        </MemoryRouter>
    );
}

describe('Onslaught page', () => {
    describe('rendering', () => {
        it('renders the page heading', () => {
            renderOnslaught();
            expect(screen.getByRole('heading', { level: 1, name: 'Onslaught' })).toBeInTheDocument();
        });

        it('renders a tab for each alliance track', () => {
            renderOnslaught();
            expect(screen.getByRole('tab', { name: 'Imperial' })).toBeInTheDocument();
            expect(screen.getByRole('tab', { name: 'Xenos' })).toBeInTheDocument();
            expect(screen.getByRole('tab', { name: 'Chaos' })).toBeInTheDocument();
        });

        it('renders the correct number of sectors for the active track', () => {
            renderOnslaught('?track=Imperial');
            const summaries = screen.getAllByText(/^Sector /);
            expect(summaries).toHaveLength(onslaughtData.Imperial.length);
        });
    });

    describe('tab switching', () => {
        it('marks the active track tab as selected', () => {
            renderOnslaught('?track=Chaos');
            expect(screen.getByRole('tab', { name: 'Chaos', selected: true })).toBeInTheDocument();
            expect(screen.getByRole('tab', { name: 'Imperial', selected: false })).toBeInTheDocument();
        });

        it('switches displayed sectors when clicking a different tab', async () => {
            renderOnslaught('?track=Imperial');
            expect(screen.getByRole('tab', { name: 'Imperial', selected: true })).toBeInTheDocument();

            await userEvent.click(screen.getByRole('tab', { name: 'Xenos' }));

            expect(screen.getByRole('tab', { name: 'Xenos', selected: true })).toBeInTheDocument();
            const xenosSectors = screen.getAllByText(/^Sector /);
            expect(xenosSectors).toHaveLength(onslaughtData.Xenos.length);
        });

        it('defaults to the first track when no query param is provided', () => {
            renderOnslaught('');
            const firstTrack = Object.keys(onslaughtData)[0];
            expect(screen.getByRole('tab', { name: firstTrack, selected: true })).toBeInTheDocument();
        });
    });

    describe('sector display', () => {
        it('displays sectors in descending order (highest index first)', () => {
            renderOnslaught('?track=Imperial');
            const sectorSummaries = screen.getAllByText(/^Sector /);
            const lastIndex = onslaughtData.Imperial.length - 1;

            expect(sectorSummaries[0].textContent).toContain(`Sector ${indexToRomanNumeral(lastIndex)}`);
            expect(sectorSummaries[sectorSummaries.length - 1].textContent).toContain('Sector I');
        });

        it('displays the character power requirement in each sector summary', () => {
            renderOnslaught('?track=Imperial');
            // The last rendered summary corresponds to Sector I (index 0)
            const sectorSummaries = screen.getAllByText(/^Sector /);
            const sectorISummary = sectorSummaries[sectorSummaries.length - 1];
            const firstSector = onslaughtData.Imperial[0];
            expect(sectorISummary.closest('summary')?.textContent).toContain(
                `Character Power required: ${firstSector.minHeroPower}`
            );
        });
    });

    describe('killzone display', () => {
        // Note: jsdom does not implement <details> show/hide, so all content is always in the DOM.
        // We use `within` to scope queries to specific sectors.

        it('renders the correct number of killzones for Sector I', () => {
            renderOnslaught('?track=Imperial');
            const sectorISummary = screen.getAllByText(/^Sector /).pop()!;
            const sectorDetails = sectorISummary.closest('details')!;
            const killzoneCount = onslaughtData.Imperial[0].killzones.length;

            const killzoneSummaries = within(sectorDetails).getAllByText(/^Killzone /);
            expect(killzoneSummaries).toHaveLength(killzoneCount);
        });

        it('displays killzones in descending order (last killzone first)', () => {
            renderOnslaught('?track=Imperial');
            const sectorISummary = screen.getAllByText(/^Sector /).pop()!;
            const sectorDetails = sectorISummary.closest('details')!;

            const killzoneSummaries = within(sectorDetails).getAllByText(/^Killzone /);
            // Last in the list should be Alpha (index 0), first should be the highest
            expect(killzoneSummaries[killzoneSummaries.length - 1].textContent).toBe('Killzone Alpha');
        });
    });

    describe('wave display', () => {
        it('displays enemy info, badge reward, and XP reward for waves in a killzone', () => {
            renderOnslaught('?track=Imperial');

            // Scope to Sector I
            const sectorISummary = screen.getAllByText(/^Sector /).pop()!;
            const sectorDetails = sectorISummary.closest('details')!;
            const sectorScope = within(sectorDetails);

            // Scope to Killzone Alpha (last in the rendered list)
            const killzoneSummaries = sectorScope.getAllByText(/^Killzone /);
            const killzoneAlphaSummary = killzoneSummaries[killzoneSummaries.length - 1];
            const killzoneDetails = killzoneAlphaSummary.closest('details')!;
            const killzoneScope = within(killzoneDetails);

            const killzone = onslaughtData.Imperial[0].killzones[0];
            const waves = Object.values(killzone);

            // Check that XP rewards are rendered for each wave
            const xpTexts = killzoneScope.getAllByText(/^XP reward:/);
            expect(xpTexts).toHaveLength(waves.length);

            // Check that badge rewards are rendered for each wave
            const badgeTexts = killzoneScope.getAllByText(/^Badge reward:/);
            expect(badgeTexts).toHaveLength(waves.length);

            // Check that the first wave's enemies are rendered
            const firstWave = waves[0];
            for (const [key, quantity] of Object.entries(firstWave.enemies)) {
                const lastColon = key.lastIndexOf(':');
                const enemyId = key.slice(0, lastColon);
                const level = key.slice(lastColon + 1);
                expect(killzoneScope.getByText(`${quantity}x ${enemyId} (Level ${level})`)).toBeInTheDocument();
            }
        });
    });
});
