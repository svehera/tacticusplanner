import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Collapse, Tooltip, useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// eslint-disable-next-line import-x/no-internal-modules
import { NAV_SECTIONS } from '@/models/menu-items'; // TODO refactor for FSD
// eslint-disable-next-line import-x/no-internal-modules
import { UserMenu } from '@/shared-components/user-menu/user-menu'; // TODO refactor for FSD

import { MenuItemTP, isTabletOrMobileMediaQuery } from '@/fsd/5-shared/ui';

export const Sidebar = () => {
    const isSmall = useMediaQuery(isTabletOrMobileMediaQuery);
    const navigate = useNavigate();
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
    const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>(() => {
        const defaultSections = { 'My Game': true, Plan: true, Library: true };
        try {
            const raw = localStorage.getItem('sidebar-sections');
            return raw ? (JSON.parse(raw) ?? defaultSections) : defaultSections;
        } catch {
            return defaultSections;
        }
    });
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    if (isSmall) return;

    const activeSegment = location.pathname.split('/').at(-1) ?? '';

    const isItemActive = (item: MenuItemTP): boolean =>
        (!!item.routeWeb && item.routeWeb.split('/').at(-1) === activeSegment) ||
        item.subMenu.some(sub => sub.routeWeb.split('/').at(-1) === activeSegment);

    const toggleCollapsed = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebar-collapsed', String(next));
    };

    const toggleSection = (key: string) => {
        const next = { ...sectionsOpen, [key]: !sectionsOpen[key] };
        setSectionsOpen(next);
        localStorage.setItem('sidebar-sections', JSON.stringify(next));
    };

    const toggleItem = (label: string) => setExpandedItems(previous => ({ ...previous, [label]: !previous[label] }));

    const itemBase =
        'w-full flex items-center text-left px-2 py-1.5 gap-2.5 rounded-[7px] border-none cursor-pointer whitespace-nowrap text-[13px] border-l-2';
    const itemActiveClass = 'border-l-[var(--primary)] bg-[var(--primary)]/[.18] text-[var(--fg)] font-semibold';
    const itemInactiveClass =
        'border-l-transparent bg-transparent text-[var(--soft-fg)] font-medium hover:bg-[var(--primary)]/[.08] hover:text-[var(--fg)]';

    const subBase =
        'w-full block text-left pl-9 pr-2 py-1.5 rounded-[7px] border-none cursor-pointer whitespace-nowrap text-[12px] border-l-2';
    const subActiveClass = 'border-l-[var(--primary)] bg-[var(--primary)]/[.18] text-[var(--fg)] font-semibold';
    const subInactiveClass =
        'border-l-transparent bg-transparent text-[var(--soft-fg)] font-normal hover:bg-[var(--primary)]/[.08] hover:text-[var(--fg)]';

    return (
        <div
            className={`sticky top-0 z-40 h-screen flex-shrink-0 overflow-visible transition-[width] duration-200 ease-in-out ${collapsed ? 'w-16' : 'w-[248px]'}`}>
            {/* Edge toggle — lives outside aside so overflow-hidden doesn't clip it */}
            <button
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={toggleCollapsed}
                className="absolute top-[22px] -right-[11px] z-10 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--overlay)] text-[var(--fg)] shadow-md transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]">
                {collapsed ? (
                    <ChevronRightIcon className="!text-[14px]" />
                ) : (
                    <ChevronLeftIcon className="!text-[14px]" />
                )}
            </button>

            <aside className="flex h-full flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--sidebar)]">
                {/* Brand row */}
                <div
                    className="flex h-[60px] flex-shrink-0 cursor-pointer items-center gap-2.5 border-b border-[var(--border)] px-4"
                    onClick={() => navigate('./home')}>
                    <img
                        src="/android-chrome-192x192.png"
                        height={28}
                        width={28}
                        alt="logo"
                        className="flex-shrink-0"
                    />
                    {!collapsed && (
                        <span className="text-[15px] font-semibold tracking-tight whitespace-nowrap text-[var(--fg)]">
                            Tacticus Planner
                        </span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-x-hidden overflow-y-auto p-2">
                    {NAV_SECTIONS.map(({ key, items }) => (
                        <div key={key} className="mt-2.5">
                            {collapsed ? (
                                <hr className="my-1 border-[var(--border)]" />
                            ) : (
                                <button
                                    onClick={() => toggleSection(key)}
                                    className="flex w-full cursor-pointer items-center gap-1 border-none bg-transparent px-1 py-1 text-left text-[var(--soft-fg)]">
                                    {sectionsOpen[key] ? (
                                        <ExpandLessIcon className="!text-[11px]" />
                                    ) : (
                                        <ExpandMoreIcon className="!text-[11px]" />
                                    )}
                                    <span className="flex-1 text-left text-[10px] font-bold tracking-[.14em] uppercase">
                                        {key}
                                    </span>
                                </button>
                            )}

                            {(collapsed || sectionsOpen[key]) &&
                                items.map(item => {
                                    const active = isItemActive(item);
                                    const isGroup = !item.routeWeb;
                                    const expanded = expandedItems[item.label] ?? false;

                                    return (
                                        <React.Fragment key={item.label}>
                                            <Tooltip
                                                title={collapsed ? item.label : ''}
                                                placement="right"
                                                enterDelay={200}>
                                                <button
                                                    onClick={() =>
                                                        isGroup || item.subMenu.length > 0
                                                            ? toggleItem(item.label)
                                                            : navigate(item.routeWeb)
                                                    }
                                                    className={`${itemBase} ${active ? itemActiveClass : itemInactiveClass}`}>
                                                    <span className="flex flex-shrink-0 text-[18px]">{item.icon}</span>
                                                    {!collapsed && (
                                                        <>
                                                            <span className="flex-1">{item.label}</span>
                                                            {item.subMenu.length > 0 &&
                                                                (expanded ? (
                                                                    <ExpandLessIcon className="!text-[14px]" />
                                                                ) : (
                                                                    <ExpandMoreIcon className="!text-[14px]" />
                                                                ))}
                                                        </>
                                                    )}
                                                </button>
                                            </Tooltip>

                                            {!collapsed && item.subMenu.length > 0 && (
                                                <Collapse in={expanded} timeout="auto" unmountOnExit>
                                                    {item.subMenu.map(sub => {
                                                        const subActive =
                                                            sub.routeWeb.split('/').at(-1) === activeSegment;
                                                        return (
                                                            <button
                                                                key={sub.label}
                                                                onClick={() => navigate(sub.routeWeb)}
                                                                className={`${subBase} ${subActive ? subActiveClass : subInactiveClass}`}>
                                                                {sub.label}
                                                            </button>
                                                        );
                                                    })}
                                                </Collapse>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                        </div>
                    ))}
                </nav>

                {/* User footer */}
                <div className="flex-shrink-0 border-t border-[var(--border)] px-3 py-2">
                    <UserMenu compact={collapsed} />
                </div>
            </aside>
        </div>
    );
};
