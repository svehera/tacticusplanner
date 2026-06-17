import { useContext, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { toMobilePath } from '@/fsd/5-shared/lib';
import { trackPageView } from '@/fsd/5-shared/monitoring';
import { useTitle } from '@/fsd/5-shared/ui/contexts';
import { PageMetaProvider } from '@/fsd/5-shared/ui/page-meta';

import { TopAppBar } from '@/fsd/2-widgets/app-bar';
import { Sidebar } from '@/fsd/2-widgets/sidebar';

const DesktopApp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const preferredView = localStorage.getItem('preferredView');
    const { headerTitle } = useTitle();

    const dispatch = useContext(DispatchContext);
    const { seenAppVersion } = useContext(StoreContext);

    useEffect(() => {
        const redirect = searchParams.get('redirect');

        // Redirect to mobile view if on mobile device and preferred view is not set to desktop.
        // Preserve the current path and query string so deep links (e.g. shared rosters) open in
        // the mobile shell with their params intact instead of being dropped at the home page.
        if (isMobile && !redirect && (!preferredView || preferredView === 'mobile')) {
            navigate({ pathname: toMobilePath(location.pathname), search: location.search });
            return;
        }

        if (redirect) {
            searchParams.delete('redirect');

            navigate({
                pathname: redirect,
                search: '?' + searchParams.toString(),
            });
            return;
        }

        if (!redirect && location.pathname === '/') {
            navigate('/home');
            return;
        }
    }, []);

    useEffect(() => {
        if (location.pathname === '/' || location.pathname === '/mobile') {
            return;
        }

        trackPageView(location.pathname);
    }, [location.pathname]);

    const handleWhatsNewClose = () => {
        const currentAppVersion = localStorage.getItem('appVersion') ?? undefined;
        if (seenAppVersion !== currentAppVersion) {
            dispatch.seenAppVersion(currentAppVersion);
        }
    };

    return (
        <PageMetaProvider>
            <div className="flex">
                <Sidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                    <TopAppBar
                        headerTitle={headerTitle}
                        seenAppVersion={seenAppVersion ?? ''}
                        onCloseWhatsNew={handleWhatsNewClose}
                    />
                    <div className="mx-5 my-2.5">
                        <Outlet />
                    </div>
                </div>
            </div>
        </PageMetaProvider>
    );
};

export default DesktopApp;
