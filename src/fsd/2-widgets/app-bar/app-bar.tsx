import CampaignIcon from '@mui/icons-material/Campaign';
import MenuIcon from '@mui/icons-material/Menu';
import { Divider, ListSubheader, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery } from '@mui/material';
import MuiButton from '@mui/material/Button';
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
    Button,
    FlexBox,
    LazyTooltip,
    MenuItemTP,
    bmcLink,
    discordInvitationLink,
    isTabletOrMobileMediaQuery,
    usePopUpControls,
} from '@/fsd/5-shared/ui';
import { DiscordIcon, BmcIcon } from '@/fsd/5-shared/ui/icons';
import { LinkButton } from '@/fsd/5-shared/ui/link';
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
            <span className="text-sm tracking-wide text-(--soft-fg) uppercase">{label}</span>
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
            <div className="flex h-[60px] flex-shrink-0 items-center justify-between border-b border-(--border) bg-(--sidebar) px-4 text-(--fg)">
                {isTabletOrMobile ? (
                    <FlexBox onClick={() => navigate('./home')} className="cursor-pointer">
                        <img src="/android-chrome-192x192.png" height="40px" width="40px" alt="logo" />
                        <span className="text-xl font-bold">{title}</span>
                    </FlexBox>
                ) : (
                    <span className="font-medium">{breadcrumb}</span>
                )}
                <div className="flex items-center">
                    <LazyTooltip title="Frequently Asked Questions">
                        <Button
                            size="square-petite"
                            appearance="plain"
                            intent="secondary"
                            onPress={() => navigate('./faq')}>
                            {menuItemById.faq.icon}
                        </Button>
                    </LazyTooltip>
                    <LazyTooltip title="Join Tacticus Planner community on Discord">
                        <LinkButton
                            size="square-petite"
                            appearance="plain"
                            intent="secondary"
                            href={discordInvitationLink}
                            target="_blank">
                            <DiscordIcon />
                        </LinkButton>
                    </LazyTooltip>
                    <LazyTooltip title="Buy me a trooper">
                        <LinkButton
                            size="square-petite"
                            appearance="plain"
                            intent="secondary"
                            href={bmcLink}
                            target="_blank">
                            <BmcIcon />
                        </LinkButton>
                    </LazyTooltip>
                    <LazyTooltip title="Sync with the Tacticus API">
                        <SyncButton showText={false} iconButton={true} />
                    </LazyTooltip>
                    <ThemeSwitch />
                    <LazyTooltip title="What's new">
                        <Button
                            size="square-petite"
                            appearance="plain"
                            intent="secondary"
                            onPress={() => setShowWhatsNew(true)}>
                            <span className="relative">
                                <CampaignIcon />
                                {!seenNewVersion && (
                                    <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-(--primary)" />
                                )}
                            </span>
                        </Button>
                    </LazyTooltip>
                    {isTabletOrMobile && (
                        <>
                            <MuiButton
                                id="basic-button"
                                aria-controls={navigationMenuControls.open ? 'basic-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={navigationMenuControls.open ? 'true' : undefined}
                                color="inherit"
                                onClick={navigationMenuControls.handleClick}>
                                <MenuIcon />
                            </MuiButton>
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
