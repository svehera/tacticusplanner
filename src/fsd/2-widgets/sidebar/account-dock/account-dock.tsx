/* eslint-disable import-x/no-internal-modules */
import { Computer as ComputerIcon, Smartphone as PhoneIcon } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import RegisterIcon from '@mui/icons-material/PersonAdd';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SyncIcon from '@mui/icons-material/Sync';
import UploadIcon from '@mui/icons-material/Upload';
import { Avatar, Badge, IconButton, Popover, Tooltip } from '@mui/material';
import { ChevronDown } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';
import { usePopupManager } from 'react-popup-manager';
import { useLocation, useNavigate } from 'react-router-dom';

import { GlobalState } from 'src/models/global-state';
import { IPersonalData2 } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { convertData, PersonalDataLocalStorage } from 'src/services';
import { AdminToolsDialog } from 'src/shared-components/user-menu/admin-tools-dialog';
import { LoginUserDialog } from 'src/shared-components/user-menu/login-user-dialog';
import { OverrideDataDialog } from 'src/shared-components/user-menu/override-data-dialog';
import { RegisterUserDialog } from 'src/shared-components/user-menu/register-user-dialog';
import { RestoreBackupDialog } from 'src/shared-components/user-menu/restore-backup-dialog';

import { toDesktopPath, toMobilePath } from '@/fsd/5-shared/lib';
import { useAuth, UserRole } from '@/fsd/5-shared/model';
import { trackEvent } from '@/fsd/5-shared/monitoring';
import { Switch } from '@/fsd/5-shared/ui';

import { TacticusIntegrationDialog } from '@/fsd/3-features/tacticus-integration/tacticus-integration.dialog';

/** Deterministically maps a string to a hex colour. Used to generate consistent avatar background colours from a username. */
function stringToColor(string: string) {
    let hash = 0;
    let index;
    for (index = 0; index < string.length; index += 1) {
        const character = string.codePointAt(index);
        if (!character) throw new Error('invalid codePoint');
        hash = character + ((hash << 5) - hash);
    }
    let color = '#';
    for (index = 0; index < 3; index += 1) {
        const value = (hash >> (index * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
}

/** Returns MUI Avatar props (className, style, children) derived from a username string. */
function stringAvatar(name: string) {
    return {
        className: '!w-[34px] !h-[34px] !text-[13px] !font-extrabold',
        style: { backgroundColor: stringToColor(name) },
        children: `${name.slice(0, 2)}`,
    };
}

/**
 * Formats a human-readable relative sync time string from a UTC epoch seconds timestamp.
 * Returns "Synced just now", "Synced X min ago", "Synced X hr ago", "Synced X days ago",
 * or "Not synced" when no timestamp is available.
 */
function getSyncMeta(lastSyncSec: number | undefined): string {
    if (!lastSyncSec) return 'Not synced';
    const diffSec = Math.floor(Date.now() / 1000) - lastSyncSec;
    if (diffSec < 60) return 'Synced just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Synced ${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Synced ${diffHr} hr ago`;
    return `Synced ${Math.floor(diffHr / 24)} day${Math.floor(diffHr / 24) === 1 ? '' : 's'} ago`;
}

/** Props for the {@link AccountDock} component. */
interface AccountDockProps {
    /** When true the sidebar is in icon-only mode; the dock renders a compact avatar button with a floating popover instead of the inline expanding menu. */
    collapsed?: boolean;
}

/**
 * Bottom-of-sidebar account dock (Variant F).
 *
 * - **Expanded sidebar**: trigger row shows avatar, username, and a live sync meta line.
 *   Clicking opens an inline menu that slides up above the trigger row.
 * - **Collapsed sidebar**: renders a compact avatar icon button; clicking opens a floating
 *   MUI Popover (the `aside` has `overflow: hidden` which would clip an inline menu).
 */
export const AccountDock = ({ collapsed = false }: AccountDockProps) => {
    const store = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const popupManager = usePopupManager();
    const { isAuthenticated, logout, username, userInfo } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktopView = !location.pathname.includes('mobile');

    // Inline menu state (expanded sidebar)
    const [open, setOpen] = useState(false);
    const dockReference = useRef<HTMLDivElement>(null);
    const trigReference = useRef<HTMLButtonElement>(null);
    const inputReference = useRef<HTMLInputElement>(null);

    // Popover anchor (collapsed sidebar fallback)
    const [anchorElement, setAnchorElement] = useState<HTMLElement | undefined>();

    const [debugMode, setDebugMode] = useState(() => localStorage.getItem('debugMode') === 'true');

    // Dialog states
    const [showAdminTools, setShowAdminTools] = useState(false);
    const [showRegisterUser, setShowRegisterUser] = useState(false);
    const [showLoginUser, setShowLoginUser] = useState(false);
    const [showRestoreBackup, setShowRestoreBackup] = useState(false);
    const [showOverrideDataWarning, setShowOverrideDataWarning] = useState(false);

    const lastSyncSec = store.gameModeTokens?.tokens?.lastSetAtSecondsUtc;
    const syncMeta = getSyncMeta(lastSyncSec);

    // Click-away + Esc for inline menu
    useEffect(() => {
        if (!open) return;
        const onDocument = (event_: MouseEvent) => {
            if (dockReference.current && !dockReference.current.contains(event_.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (event_: KeyboardEvent) => {
            if (event_.key === 'Escape') {
                setOpen(false);
                trigReference.current?.focus();
            }
        };
        document.addEventListener('mousedown', onDocument);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocument);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const closeMenu = () => {
        setOpen(false);
        setAnchorElement(undefined);
    };

    const openLoginForm = () => {
        const hasAnyChanges = !!store.modifiedDate;
        if (hasAnyChanges) {
            setShowOverrideDataWarning(true);
        } else {
            setShowLoginUser(true);
        }
    };

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) {
            try {
                const content = await file.text();
                const personalData: IPersonalData2 = convertData(JSON.parse(content));
                personalData.modifiedDate = new Date();
                dispatch.setStore(
                    {
                        ...new GlobalState(personalData),
                        __localVersion: store.__localVersion ? store.__localVersion + 1 : 1,
                    },
                    /*modified=*/ true,
                    /*reset=*/ false
                );
                enqueueSnackbar('Import successful', { variant: 'success' });
                trackEvent('data_import', {
                    feature: 'backup',
                    action: 'import',
                    status: 'success',
                    source: 'json',
                    authenticated: isAuthenticated,
                });
            } catch {
                enqueueSnackbar('Import failed. Error parsing JSON.', { variant: 'error' });
            }
        }
    };

    const downloadJson = () => {
        const data = GlobalState.toStore(store);
        const jsonData = JSON.stringify(data, undefined, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateTimestamp =
            typeof data.modifiedDate === 'string' ? data.modifiedDate : data.modifiedDate?.toISOString();
        const date = new Date(dateTimestamp ?? Date.now());
        const formattedDate = new Intl.DateTimeFormat(navigator.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        }).format(date);
        const realUsername = isAuthenticated ? username : (localStorage.getItem('userOld') ?? username);
        link.download = `${realUsername}-data-${formattedDate}.json`;
        link.click();
        URL.revokeObjectURL(url);
        trackEvent('data_export', {
            feature: 'backup',
            action: 'export',
            status: 'success',
            source: 'json',
            authenticated: isAuthenticated,
        });
    };

    const restoreData = () => {
        const storage = new PersonalDataLocalStorage();
        const restoredData = storage.restoreData();
        if (restoredData) {
            setShowRestoreBackup(true);
        } else {
            enqueueSnackbar('No Backup Found', { variant: 'error' });
        }
    };

    const navigateToDesktopView = () => {
        localStorage.setItem('preferredView', 'desktop');
        const destination = toDesktopPath(location.pathname);
        trackEvent('nav_menu_select', {
            feature: 'navigation',
            action: 'switch_view',
            destination_path: destination,
            source: 'account_dock',
            authenticated: isAuthenticated,
        });
        navigate({ pathname: destination, search: location.search });
    };

    const navigateToMobileView = () => {
        localStorage.setItem('preferredView', 'mobile');
        const destination = toMobilePath(location.pathname);
        trackEvent('nav_menu_select', {
            feature: 'navigation',
            action: 'switch_view',
            destination_path: destination,
            source: 'account_dock',
            authenticated: isAuthenticated,
        });
        navigate({ pathname: destination, search: location.search });
    };

    const navigateToReviewTeams = () => {
        let tabId = 2;
        if (userInfo.pendingTeamsCount > 0) tabId = 3;
        if (userInfo.rejectedTeamsCount > 0) tabId = 2;
        navigate(`/learn/guides?activeTab=${tabId}`);
    };

    const syncWithTacticus = () => {
        popupManager.open(TacticusIntegrationDialog, {
            tacticusApiKey: userInfo.tacticusApiKey,
            tacticusUserId: userInfo.tacticusUserId,
            tacticusGuildApiKey: userInfo.tacticusGuildApiKey,
            shareInGameName: userInfo.shareInGameName ?? false,
            shareRosterData: userInfo.shareRosterData ?? false,
            shareGuildMemberPerformance: userInfo.shareGuildMemberPerformance ?? false,
            guildTag: userInfo.guildTag ?? '',
            onClose: () => {},
        });
    };

    // Shared item styles
    const itemClass =
        'w-full flex items-center text-left gap-2.5 px-2.5 py-2 rounded-lg border-none cursor-pointer text-[13px] text-(--soft-fg) bg-transparent hover:bg-(--primary)/10 hover:text-(--fg) transition-colors focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-inset';
    const dangerItemClass =
        'w-full flex items-center text-left gap-2.5 px-2.5 py-2 rounded-lg border-none cursor-pointer text-[13px] text-(--danger) bg-transparent hover:bg-(--danger)/14 hover:text-red-500 dark:hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-inset';
    const iconClass = 'flex-shrink-0 !text-[16px]';
    const groupLabelClass = 'px-2.5 pb-1 pt-2.5 text-xs font-bold uppercase tracking-widest text-(--soft-fg)';

    // The grouped menu items (shared between inline and collapsed popover)
    const menuItems = (
        <>
            {/* Data */}
            <div className={groupLabelClass}>Data</div>
            {isAuthenticated && (
                <button
                    className={itemClass}
                    role="menuitem"
                    onClick={() => {
                        syncWithTacticus();
                        closeMenu();
                    }}>
                    <SyncIcon className={iconClass} />
                    <span>Sync via Tacticus API</span>
                </button>
            )}
            <button
                className={itemClass}
                role="menuitem"
                onClick={() => {
                    inputReference.current?.click();
                    closeMenu();
                }}>
                <UploadIcon className={iconClass} />
                <span>Import JSON</span>
            </button>
            <button
                className={itemClass}
                role="menuitem"
                onClick={() => {
                    downloadJson();
                    closeMenu();
                }}>
                <DownloadIcon className={iconClass} />
                <span>Export JSON</span>
            </button>
            <button
                className={itemClass}
                role="menuitem"
                onClick={() => {
                    restoreData();
                    closeMenu();
                }}>
                <SettingsBackupRestoreIcon className={iconClass} />
                <span>Restore Backup</span>
            </button>

            {/* App */}
            <hr className="mx-2 my-1 border-(--border)" />
            <div className={groupLabelClass}>App</div>
            {isDesktopView ? (
                <button
                    className={itemClass}
                    role="menuitem"
                    onClick={() => {
                        navigateToMobileView();
                        closeMenu();
                    }}>
                    <PhoneIcon className={iconClass} />
                    <span>Use mobile view</span>
                </button>
            ) : (
                <button
                    className={itemClass}
                    role="menuitem"
                    onClick={() => {
                        navigateToDesktopView();
                        closeMenu();
                    }}>
                    <ComputerIcon className={iconClass} />
                    <span>Use desktop view</span>
                </button>
            )}
            <button
                className={itemClass}
                role="menuitem"
                onClick={() => {
                    navigateToReviewTeams();
                    closeMenu();
                }}>
                <GroupWorkIcon className={iconClass} />
                <Badge
                    badgeContent={
                        userInfo.rejectedTeamsCount > 0 ? userInfo.rejectedTeamsCount : userInfo.pendingTeamsCount
                    }
                    color={userInfo.rejectedTeamsCount > 0 ? 'error' : 'warning'}>
                    <span>Review guides</span>
                </Badge>
            </button>
            {[UserRole.admin, UserRole.moderator].includes(userInfo.role) && (
                <button
                    className={itemClass}
                    role="menuitem"
                    onClick={() => {
                        setShowAdminTools(true);
                        closeMenu();
                    }}>
                    <SupervisorAccountIcon className={iconClass} />
                    <span>Admin tools</span>
                </button>
            )}

            {/* Auth */}
            <hr className="mx-2 my-1 border-(--border)" />
            {isAuthenticated ? (
                <button
                    className={dangerItemClass}
                    role="menuitem"
                    onClick={() => {
                        logout();
                        closeMenu();
                    }}>
                    <LogoutIcon className="flex-shrink-0 !text-[16px]" />
                    <span>Logout</span>
                </button>
            ) : (
                <>
                    <button
                        className={itemClass}
                        role="menuitem"
                        onClick={() => {
                            openLoginForm();
                            closeMenu();
                        }}>
                        <LoginIcon className={iconClass} />
                        <span>Login</span>
                    </button>
                    <button
                        className={itemClass}
                        role="menuitem"
                        onClick={() => {
                            setShowRegisterUser(true);
                            closeMenu();
                        }}>
                        <RegisterIcon className={iconClass} />
                        <span>Register</span>
                    </button>
                </>
            )}

            {/* Debug */}
            <hr className="mx-2 my-1 border-(--border)" />
            <div className="w-full rounded-lg px-2.5 py-2 transition-colors hover:bg-(--primary)/10">
                <Switch
                    isSelected={debugMode}
                    onChange={v => {
                        localStorage.setItem('debugMode', String(v));
                        setDebugMode(v);
                    }}>
                    Debug Mode
                </Switch>
            </div>
        </>
    );

    return (
        <>
            <input ref={inputReference} className="hidden" type="file" accept=".json" onChange={handleFileUpload} />

            {collapsed ? (
                /* ── Collapsed: icon button + floating Popover ── */
                <div className="flex justify-center py-2">
                    <Tooltip title={username} placement="right">
                        <IconButton
                            size="small"
                            onClick={event_ => setAnchorElement(event_.currentTarget)}
                            aria-haspopup="menu"
                            aria-expanded={Boolean(anchorElement)}>
                            {isAuthenticated ? (
                                <Avatar {...stringAvatar(username)} />
                            ) : (
                                <Avatar className="!h-8 !w-8 !text-xs">TP</Avatar>
                            )}
                        </IconButton>
                    </Tooltip>
                    <Popover
                        open={Boolean(anchorElement)}
                        anchorEl={anchorElement}
                        onClose={closeMenu}
                        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                        <div className="min-w-[220px] p-1.5" role="menu">
                            {menuItems}
                        </div>
                    </Popover>
                </div>
            ) : (
                /* ── Expanded: Variant F inline dock ── */
                <div ref={dockReference} className="border-t border-(--border)">
                    {/* Inline menu — renders above trigger when open */}
                    {open && (
                        <div className="overflow-hidden" role="menu">
                            <div className="account-dock-menu-in p-2">{menuItems}</div>
                        </div>
                    )}

                    {/* Trigger row */}
                    <button
                        ref={trigReference}
                        className={`group flex w-full cursor-pointer items-center gap-[11px] border-t border-none bg-(--sidebar) px-[13px] py-[11px] text-left font-[inherit] transition-colors hover:bg-(--primary)/8 focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-inset ${open ? 'border-t-transparent' : 'border-t-(--border)'}`}
                        onClick={() => setOpen(o => !o)}
                        aria-label="Account menu"
                        aria-expanded={open}
                        aria-haspopup="menu">
                        {isAuthenticated ? (
                            <Avatar {...stringAvatar(username)} />
                        ) : (
                            <Avatar className="!h-[34px] !w-[34px] !text-[13px]">TP</Avatar>
                        )}
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] leading-[1.25] font-bold text-(--fg)">
                                {username}
                            </span>
                            <span className="block text-[11px] leading-[1.3] text-(--soft-fg) transition-colors group-hover:text-(--fg)">
                                {syncMeta}
                            </span>
                        </span>
                        <ChevronDown
                            className={`size-[18px] flex-shrink-0 text-(--soft-fg) transition-[color,transform] duration-200 group-hover:text-(--fg) ${open ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>
            )}

            {/* Dialogs */}
            <RegisterUserDialog
                isOpen={showRegisterUser}
                onClose={success => {
                    setShowRegisterUser(false);
                    setShowLoginUser(success);
                }}
            />
            <LoginUserDialog isOpen={showLoginUser} onClose={() => setShowLoginUser(false)} />
            <RestoreBackupDialog isOpen={showRestoreBackup} onClose={() => setShowRestoreBackup(false)} />
            <OverrideDataDialog
                isOpen={showOverrideDataWarning}
                onClose={(proceed: boolean) => {
                    setShowOverrideDataWarning(false);
                    if (proceed) setShowLoginUser(true);
                }}
            />
            <AdminToolsDialog isOpen={showAdminTools} onClose={() => setShowAdminTools(false)} />
        </>
    );
};
