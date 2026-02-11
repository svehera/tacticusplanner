import CampaignIcon from '@mui/icons-material/Campaign';
import { Badge, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link, useNavigate } from 'react-router-dom';

// TODO refactor for FSD
// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';
// eslint-disable-next-line import-x/no-internal-modules
import { UserMenu } from '@/shared-components/user-menu/user-menu';
// eslint-disable-next-line import-x/no-internal-modules
import { menuItemById } from 'src/models/menu-items';

import { discordInvitationLink, bmcLink } from '@/fsd/5-shared/ui';
import { DiscordIcon, BmcIcon } from '@/fsd/5-shared/ui/icons';

import { ThemeSwitch } from '@/fsd/3-features/theme-switch';
import { WhatsNewDialog } from 'src/fsd/3-features/whats-new';

import { AddToHomeScreen } from './addToHomeScreen';
import { DesktopHome } from './desktop-home';
import { usePwaInstall } from './usePwaInstall';

export const MobileHome = () => {
    const dispatch = useContext(DispatchContext);
    const { seenAppVersion } = useContext(StoreContext);
    const navigate = useNavigate();
    const { deviceLink, isInstalled } = usePwaInstall();

    const [showPwaInstall, setShowPwaInstall] = useState(isMobile);
    const [showWhatsNew, setShowWhatsNew] = useState(false);

    const seenNewVersion = useMemo(() => {
        const currentAppVersion = localStorage.getItem('appVersion');
        return currentAppVersion === seenAppVersion;
    }, [seenAppVersion]);

    const handleWhatsNewClose = () => {
        const currentAppVersion = localStorage.getItem('appVersion');
        if (seenAppVersion !== currentAppVersion) {
            dispatch.seenAppVersion(currentAppVersion);
        }
    };

    return (
        <div>
            <div className="flex justify-between">
                <div className="flex items-center gap-2.5">
                    <ThemeSwitch />
                    <IconButton color="inherit" onClick={() => navigate('/mobile/faq')}>
                        <Tooltip title="Frequently Asked Questions">{menuItemById.faq.icon}</Tooltip>
                    </IconButton>
                    <Tooltip title="What's new">
                        <IconButton onClick={() => setShowWhatsNew(true)}>
                            <Badge color="secondary" variant="dot" invisible={seenNewVersion}>
                                <CampaignIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Join Tacticus Planner community on Discord">
                        <IconButton component={Link} to={discordInvitationLink} target={'_blank'}>
                            <DiscordIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Buy me a trooper">
                        <IconButton color="inherit" component={Link} to={bmcLink} target={'_blank'}>
                            <BmcIcon />
                        </IconButton>
                    </Tooltip>
                </div>
                <UserMenu />
            </div>

            {!isInstalled && showPwaInstall && (
                <AddToHomeScreen link={deviceLink} dismiss={() => setShowPwaInstall(false)} />
            )}
            <DesktopHome />

            <WhatsNewDialog
                isOpen={showWhatsNew}
                onClose={() => {
                    handleWhatsNewClose();
                    setShowWhatsNew(false);
                }}
            />
        </div>
    );
};
