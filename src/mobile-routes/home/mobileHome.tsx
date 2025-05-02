import CampaignIcon from '@mui/icons-material/Campaign';
import { Badge, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import React, { useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link, useNavigate } from 'react-router-dom';

import { usePwaInstall } from '@/v2/hooks/usePwaInstall';
import { menuItemById } from 'src/models/menu-items';

import { discordInvitationLink, bmcLink } from '@/fsd/5-shared/ui';
import { DiscordIcon, BmcIcon } from '@/fsd/5-shared/ui/icons';

import { AddToHomeScreen } from '@/v2/features/pwa/addToHomeScreen';
import { WhatsNewDialog } from 'src/fsd/3-features/whats-new';

import { Home } from '../../features/misc/home/home';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import ThemeSwitch from '../../shared-components/theme-switch';
import { UserMenu } from '../../shared-components/user-menu/user-menu';

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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
            <Home />

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
