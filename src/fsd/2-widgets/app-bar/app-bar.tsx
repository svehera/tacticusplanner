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
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
    inputSubMenu,
    learnSubMenu,
    menuItemById,
    miscMenuItems,
    NAV_SECTIONS,
    planSubMenu,
    // eslint-disable-next-line import-x/no-internal-modules
} from '@/models/menu-items'; // TODO refactor for FSD
// eslint-disable-next-line import-x/no-internal-modules
import { UserMenu } from '@/shared-components/user-menu/user-menu'; // TODO refactor for FSD

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
        <ListSubheader disableSticky disableGutters className="pl-2 leading-[1.75]">
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

    const breadcrumb = useMemo(() => {
        const activeSegment = location.pathname.split('/').at(-1) ?? '';
        const section = NAV_SECTIONS.find(s =>
            s.items.some(
                item =>
                    (!!item.routeWeb && item.routeWeb.split('/').at(-1) === activeSegment) ||
                    item.subMenu.some(sub => sub.routeWeb.split('/').at(-1) === activeSegment)
            )
        );
        if (!section) return title;
        const activeItem = section.items.find(
            item =>
                (!!item.routeWeb && item.routeWeb.split('/').at(-1) === activeSegment) ||
                item.subMenu.some(sub => sub.routeWeb.split('/').at(-1) === activeSegment)
        );
        const activeSub = activeItem?.subMenu.find(sub => sub.routeWeb.split('/').at(-1) === activeSegment);
        return `${section.key} / ${activeSub?.label ?? activeItem?.label ?? title}`;
    }, [location.pathname, title]);

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
            {renderMenuGroup('My Game', inputSubMenu)}

            <Divider />

            {renderMenuGroup('Plan', planSubMenu)}

            <Divider />

            {renderMenuGroup('Library', learnSubMenu)}

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
        <>
            <div className="flex h-[60px] flex-shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--sidebar)] px-4 text-[var(--fg)]">
                {isTabletOrMobile ? (
                    <FlexBox onClick={() => navigate('./home')} className="cursor-pointer">
                        <img src="/android-chrome-192x192.png" height="40px" width="40px" alt="logo" />
                        <Typography variant="h5" component="div">
                            {title}
                        </Typography>
                    </FlexBox>
                ) : (
                    <span className="font-medium">{breadcrumb}</span>
                )}
                <div className="flex items-center">
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
                        <SyncButton showText={false} iconButton={true} />
                    </Tooltip>
                    <ThemeSwitch />
                    <Tooltip title="What's new">
                        <IconButton color="inherit" onClick={() => setShowWhatsNew(true)}>
                            <Badge color="secondary" variant="dot" invisible={seenNewVersion}>
                                <CampaignIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    {isTabletOrMobile && (
                        <>
                            <Button
                                id="basic-button"
                                aria-controls={navigationMenuControls.open ? 'basic-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={navigationMenuControls.open ? 'true' : undefined}
                                color="inherit"
                                onClick={navigationMenuControls.handleClick}>
                                <MenuIcon />
                            </Button>
                            <UserMenu />
                            {navigationMenu}
                        </>
                    )}
                </div>
            </div>
            <WhatsNewDialog
                isOpen={showWhatsNew}
                onClose={() => {
                    onCloseWhatsNew();
                    setShowWhatsNew(false);
                }}
            />
        </>
    );
};
