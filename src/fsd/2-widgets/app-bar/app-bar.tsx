import CampaignIcon from '@mui/icons-material/Campaign';
import MenuIcon from '@mui/icons-material/Menu';
import {
    Badge,
    Divider,
    ListSubheader,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Tooltip,
    useMediaQuery,
} from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
    inputSubMenu,
    learnSubMenu,
    menuItemById,
    miscMenuItems,
    planSubMenu,
    planSubMenuWeb,
    // eslint-disable-next-line import-x/no-internal-modules
} from '@/models/menu-items'; // TODO refactor for FSD

import {
    FlexBox,
    MenuItemTP,
    bmcLink,
    discordInvitationLink,
    isTabletOrMobileMediaQuery,
    usePopUpControls,
} from '@/fsd/5-shared/ui';
import { DiscordIcon, BmcIcon } from '@/fsd/5-shared/ui/icons';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

import { ThemeSwitch } from '@/fsd/3-features/theme-switch';
import { WhatsNewDialog } from 'src/fsd/3-features/whats-new';

import { AppBarSubMenu } from './app-bar-sub-menu';

interface Props {
    headerTitle: string;
    seenAppVersion: string;
    onCloseWhatsNew: () => void;
}

const generateMenuItems = (items: MenuItemTP[]) =>
    items.map(item => (
        <MenuItem key={item.label} component={Link} to={item.routeWeb} color="inherit">
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
        </MenuItem>
    ));

const renderMenuGroup = (label: string, items: MenuItemTP[]) => (
    <>
        <ListSubheader disableSticky disableGutters sx={{ pl: 1, lineHeight: 1.75 }}>
            <Typography variant="body2" className="tracking-wide text-gray-500 uppercase">
                {label}
            </Typography>
        </ListSubheader>
        {generateMenuItems(items)}
    </>
);

export const TopAppBar: React.FC<Props> = ({ headerTitle, seenAppVersion, onCloseWhatsNew }) => {
    const isTabletOrMobile = useMediaQuery(isTabletOrMobileMediaQuery);
    const location = useLocation();
    const navigate = useNavigate();
    const navigationMenuControls = usePopUpControls();

    const [showWhatsNew, setShowWhatsNew] = useState(false);

    const seenNewVersion = useMemo(() => {
        const currentAppVersion = localStorage.getItem('appVersion');
        return currentAppVersion === seenAppVersion;
    }, [seenAppVersion]);

    const title = useMemo(() => {
        const routeSections = location.pathname.split('/');
        const menuItemId = routeSections.at(-1);
        if (Object.hasOwn(menuItemById, menuItemId ?? '')) {
            return menuItemById[menuItemId as keyof typeof menuItemById].title;
        } else if (menuItemId === 'lre') {
            return headerTitle;
        } else {
            return 'Tacticus Planner';
        }
    }, [location.pathname, headerTitle]);

    const nav = isTabletOrMobile ? undefined : (
        <div className="me-5 flex items-center">
            <AppBarSubMenu rootLabel={'Input'} options={inputSubMenu} />

            <AppBarSubMenu rootLabel={'Plan'} options={planSubMenuWeb} />

            <AppBarSubMenu rootLabel={'Learn'} options={learnSubMenu} />
        </div>
    );

    const navigationMenu = (
        <Menu
            id="basic-menu"
            anchorEl={navigationMenuControls.anchorEl}
            open={navigationMenuControls.open}
            onClose={navigationMenuControls.handleClose}
            onClick={navigationMenuControls.handleClose}
            MenuListProps={{
                'aria-labelledby': 'basic-button',
            }}>
            {renderMenuGroup('Input', inputSubMenu)}

            <Divider />

            {renderMenuGroup('Plan', planSubMenu)}

            <Divider />

            {renderMenuGroup('Learn', learnSubMenu)}

            <Divider />

            {renderMenuGroup('Misc', [
                {
                    ...menuItemById.faq,
                    label: "What's new",
                    icon: <CampaignIcon />,
                },
                {
                    label: 'Discord',
                    icon: <DiscordIcon />,
                    routeWeb: discordInvitationLink,
                    title: 'Discord',
                    routeMobile: '',
                    subMenu: [],
                },
                {
                    label: 'Buy me a trooper',
                    icon: <BmcIcon />,
                    routeWeb: bmcLink,
                    title: 'Buy me a trooper',
                    routeMobile: '',
                    subMenu: [],
                },
                ...miscMenuItems,
            ])}
        </Menu>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <FlexBox onClick={() => navigate('./home')} className="cursor-pointer">
                        <img src="/android-chrome-192x192.png" height="50px" width="50px" alt="logo" />
                        <Typography variant={isTabletOrMobile ? 'h5' : 'h4'} component="div">
                            {title}
                        </Typography>
                    </FlexBox>
                    <div className="flex items-center">
                        {nav}
                        <IconButton color="inherit" onClick={() => navigate('./faq')}>
                            <Tooltip title="Frequently Asked Questions">{menuItemById.faq.icon}</Tooltip>
                        </IconButton>
                        <Tooltip title="Join Tacticus Planner community on Discord">
                            <IconButton color="inherit" component={Link} to={discordInvitationLink} target={'_blank'}>
                                <DiscordIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Buy me a trooper">
                            <IconButton color="inherit" component={Link} to={bmcLink} target={'_blank'}>
                                <BmcIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Sync with the Tacticus API">
                            <SyncButton showText={false} variant={'text'} sx={{ minWidth: 0, px: 1 }} />
                        </Tooltip>
                        <ThemeSwitch />
                        <Button
                            id="basic-button"
                            aria-controls={navigationMenuControls.open ? 'basic-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={navigationMenuControls.open ? 'true' : undefined}
                            color="inherit"
                            onClick={navigationMenuControls.handleClick}>
                            <Badge color="secondary" variant="dot" invisible={seenNewVersion}>
                                <MenuIcon />
                            </Badge>
                        </Button>
                        <UserMenu />
                        {navigationMenu}
                    </div>
                </Toolbar>
            </AppBar>
            <WhatsNewDialog
                isOpen={showWhatsNew}
                onClose={() => {
                    onCloseWhatsNew();
                    setShowWhatsNew(false);
                }}
            />
        </Box>
    );
};
