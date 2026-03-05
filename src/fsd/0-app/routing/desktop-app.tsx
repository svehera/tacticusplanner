import { useContext, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { useTitle } from '@/fsd/5-shared/ui/contexts';

import { TopAppBar } from '@/fsd/2-widgets/app-bar';

const DesktopApp = () => {
    const navigate = useNavigate();
    const [searchParameters] = useSearchParams();
    const preferredView = localStorage.getItem('preferredView');
    const { headerTitle } = useTitle();

    const dispatch = useContext(DispatchContext);
    const { seenAppVersion } = useContext(StoreContext);

    useEffect(() => {
        const redirect = searchParameters.get('redirect');

        // Redirect to mobile view if on mobile device and preferred view is not set to desktop
        if (isMobile && !redirect && (!preferredView || preferredView === 'mobile')) {
            navigate('/mobile/home');
            return;
        }

        if (redirect) {
            searchParameters.delete('redirect');

            navigate({
                pathname: redirect,
                search: '?' + searchParameters.toString(),
            });
            return;
        }

        if (!redirect && location.pathname === '/') {
            navigate('/home');
            return;
        }
    }, []);

    const handleWhatsNewClose = () => {
        const currentAppVersion = localStorage.getItem('appVersion');
        if (seenAppVersion !== currentAppVersion) {
            dispatch.seenAppVersion(currentAppVersion);
        }
    };

    return (
        <div className="size-full">
            <TopAppBar
                headerTitle={headerTitle}
                seenAppVersion={seenAppVersion ?? ''}
                onCloseWhatsNew={handleWhatsNewClose}
            />
            <div className="mx-5 my-2.5">
                <Outlet />
            </div>
        </div>
    );
};

export default DesktopApp;
