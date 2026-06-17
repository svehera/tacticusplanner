import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Simulate a mobile device so the desktop shell's auto-redirect-to-mobile path is exercised.
vi.mock('react-device-detect', () => ({ isMobile: true }));

// Stub out the heavy chrome the shell renders; the redirect logic doesn't depend on it.
vi.mock('@/fsd/2-widgets/sidebar', () => ({ Sidebar: () => <></> }));
vi.mock('@/fsd/2-widgets/app-bar', () => ({ TopAppBar: () => <></> }));
vi.mock('@/fsd/5-shared/ui/page-meta', () => ({
    PageMetaProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/fsd/5-shared/ui/contexts', () => ({ useTitle: () => ({ headerTitle: '' }) }));
vi.mock('@/fsd/5-shared/monitoring', () => ({ trackPageView: vi.fn() }));

// Imported after the mocks are registered.
import DesktopApp from './desktop-app';

const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search}</div>;
};

function renderAt(entry: string) {
    return render(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route
                    path="/sharedRoster"
                    element={
                        <>
                            <DesktopApp />
                            <LocationDisplay />
                        </>
                    }
                />
                <Route path="/mobile/sharedRoster" element={<LocationDisplay />} />
                <Route path="/mobile/home" element={<LocationDisplay />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('DesktopApp shared-roster redirect on mobile devices', () => {
    afterEach(() => {
        vi.mocked(localStorage.getItem).mockReset();
    });

    it('forwards a shared-roster link to the mobile shell with its params intact', async () => {
        // No preferred view set -> mobile device should be redirected to the mobile shell.
        vi.mocked(localStorage.getItem).mockReturnValue(undefined as unknown as string);

        renderAt('/sharedRoster?username=alice&shareToken=abc123');

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent(
                '/mobile/sharedRoster?username=alice&shareToken=abc123'
            );
        });
    });

    it('does not redirect when the user has explicitly chosen the desktop view', async () => {
        vi.mocked(localStorage.getItem).mockReturnValue('desktop');

        renderAt('/sharedRoster?username=alice&shareToken=abc123');

        // The shell should leave the user on the desktop shared-roster route.
        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/sharedRoster?username=alice&shareToken=abc123');
        });
        expect(screen.getByTestId('location')).not.toHaveTextContent('/mobile/');
    });
});
