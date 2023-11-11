import React, { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Tooltip } from '@mui/material';
import ViewSwitch from '../../shared-components/view-switch';
import { UserMenu } from '../../shared-components/user-menu/user-menu';
import { discordInvitationLink } from '../../models/constants';
import CampaignIcon from '@mui/icons-material/Campaign';
import { StoreContext } from '../../reducers/store.provider';
import { WhatsNewDialog } from '../../shared-components/whats-new.dialog';
import IconButton from '@mui/material/IconButton';
import { DiscordIcon } from '../../shared-components/icons/discord.icon';
import { Home } from '../../features/misc/home/home';

export const MobileHome = () => {
    const { seenAppVersion } = useContext(StoreContext);

    const [showWhatsNew, setShowWhatsNew] = useState(false);

    const hasNewVersion = useMemo(() => {
        const currentAppVersion = localStorage.getItem('appVersion');
        return currentAppVersion === seenAppVersion;
    }, [seenAppVersion]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <ViewSwitch />
                    <Tooltip title="What's new">
                        <IconButton onClick={() => setShowWhatsNew(true)}>
                            <Badge color="secondary" variant="dot" invisible={hasNewVersion}>
                                <CampaignIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Join Tacticus Planner community on Discord">
                        <IconButton component={Link} to={discordInvitationLink} target={'_blank'}>
                            <DiscordIcon />
                        </IconButton>
                    </Tooltip>
                </div>
                <UserMenu />
            </div>

            <Home />

            <WhatsNewDialog isOpen={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
        </div>
    );
};
