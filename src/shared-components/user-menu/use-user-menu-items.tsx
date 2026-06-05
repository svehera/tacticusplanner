import { Computer as ComputerIcon } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import RegisterIcon from '@mui/icons-material/PersonAdd';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import PhoneIcon from '@mui/icons-material/Smartphone';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SyncIcon from '@mui/icons-material/Sync';
import UploadIcon from '@mui/icons-material/Upload';
import { enqueueSnackbar } from 'notistack';
import { type ChangeEvent, useContext, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useLocation, useNavigate } from 'react-router-dom';

import { GlobalState } from 'src/models/global-state';
import { type IPersonalData2 } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { convertData, PersonalDataLocalStorage } from 'src/services';

import { setDebugMode, useAuth, useDebugMode, UserRole } from '@/fsd/5-shared/model';
import { trackEvent } from '@/fsd/5-shared/monitoring';
import { Badge } from '@/fsd/5-shared/ui';

import { useOpenTacticusSettings } from '@/fsd/3-features/tacticus-integration';

import { AdminToolsDialog } from './admin-tools-dialog';
import { LoginUserDialog } from './login-user-dialog';
import { OverrideDataDialog } from './override-data-dialog';
import { RegisterUserDialog } from './register-user-dialog';
import { RestoreBackupDialog } from './restore-backup-dialog';

const itemClass =
    'group w-full flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer text-[13px] font-medium text-(--soft-fg) bg-transparent hover:bg-(--fg)/[.06] hover:text-(--fg) transition-colors duration-100 text-left focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--primary)';
const dangerItemClass =
    'group w-full flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer text-[13px] font-medium text-(--danger) bg-transparent hover:bg-(--danger)/[.14] hover:text-red-300 transition-colors duration-100 text-left focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--primary)';
const iconClass = 'flex-shrink-0 !text-[16px] text-(--soft-fg) group-hover:text-(--fg)';
const dangerIconClass = 'flex-shrink-0 !text-[16px] text-(--danger) group-hover:text-red-300';

/**
 * Returns `buttons` (menu items JSX) and `dialogs` (always-mounted dialogs + hidden file input).
 *
 * Render `buttons` inside any open-gate (Popover, conditional block, etc.).
 * Render `dialogs` unconditionally so dialog state survives the menu closing.
 */
export function useUserMenuItems({ onClose }: { onClose: () => void }) {
    const store = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { isAuthenticated, logout, username, userInfo } = useAuth();
    const { openTacticusSettings } = useOpenTacticusSettings();
    const inputReference = useRef<HTMLInputElement>(null);
    const [showAdminTools, setShowAdminTools] = useState(false);
    const [showRegisterUser, setShowRegisterUser] = useState(false);
    const [showLoginUser, setShowLoginUser] = useState(false);
    const [showRestoreBackup, setShowRestoreBackup] = useState(false);
    const [showOverrideDataWarning, setShowOverrideDataWarning] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktopView = !location.pathname.includes('mobile');
    const debugMode = useDebugMode();

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
                    true,
                    false
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
        const date = new Date(dateTimestamp ?? '');
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
        const ls = new PersonalDataLocalStorage();
        const restoredData = ls.restoreData();
        if (restoredData) {
            setShowRestoreBackup(true);
        } else {
            enqueueSnackbar('No Backup Found', { variant: 'error' });
        }
    };

    const openLoginForm = () => {
        const hasAnyChanges = !!store.modifiedDate;
        if (hasAnyChanges) {
            setShowOverrideDataWarning(true);
        } else {
            setShowLoginUser(true);
        }
    };

    const navigateToDesktopView = () => {
        localStorage.setItem('preferredView', 'desktop');
        trackEvent('nav_menu_select', {
            feature: 'navigation',
            action: 'switch_view',
            destination_path: '/home',
            source: 'user_menu',
            authenticated: isAuthenticated,
        });
        navigate('/home');
    };

    const navigateToMobileView = () => {
        localStorage.setItem('preferredView', 'mobile');
        trackEvent('nav_menu_select', {
            feature: 'navigation',
            action: 'switch_view',
            destination_path: '/mobile/home',
            source: 'user_menu',
            authenticated: isAuthenticated,
        });
        navigate('/mobile/home');
    };

    const navigateToReviewTeams = () => {
        let tabId = 2;
        if (userInfo.pendingTeamsCount > 0) tabId = 3;
        if (userInfo.rejectedTeamsCount > 0) tabId = 2;
        let url = `/learn/guides?activeTab=${tabId}`;
        if (isMobile) url = '/mobile' + url;
        navigate(url);
    };

    const buttons = (
        <>
            {/* Data group */}
            <div className="px-2.5 pt-2.5 pb-1 text-[10px] font-semibold tracking-[.13em] text-(--soft-fg) uppercase">
                Data
            </div>
            {isAuthenticated && (
                <button
                    role="menuitem"
                    className={itemClass}
                    onClick={() => {
                        openTacticusSettings();
                        onClose();
                    }}>
                    <SyncIcon className={iconClass} />
                    Tacticus API settings
                </button>
            )}
            <button
                role="menuitem"
                className={itemClass}
                onClick={() => {
                    inputReference.current?.click();
                    onClose();
                }}>
                <UploadIcon className={iconClass} />
                Import JSON
            </button>
            <button
                role="menuitem"
                className={itemClass}
                onClick={() => {
                    downloadJson();
                    onClose();
                }}>
                <DownloadIcon className={iconClass} />
                Export JSON
            </button>
            <button
                role="menuitem"
                className={itemClass}
                onClick={() => {
                    restoreData();
                    onClose();
                }}>
                <SettingsBackupRestoreIcon className={iconClass} />
                Restore Backup
            </button>

            {/* App group */}
            <hr className="mx-2 my-1.5 border-(--hairline)" />
            <div className="px-2.5 pt-2.5 pb-1 text-[10px] font-semibold tracking-[.13em] text-(--soft-fg) uppercase">
                App
            </div>
            {isDesktopView ? (
                <button
                    role="menuitem"
                    className={itemClass}
                    onClick={() => {
                        navigateToMobileView();
                        onClose();
                    }}>
                    <PhoneIcon className={iconClass} />
                    Use mobile view
                </button>
            ) : (
                <button
                    role="menuitem"
                    className={itemClass}
                    onClick={() => {
                        navigateToDesktopView();
                        onClose();
                    }}>
                    <ComputerIcon className={iconClass} />
                    Use desktop view
                </button>
            )}
            {isAuthenticated && (
                <button
                    role="menuitem"
                    className={itemClass}
                    onClick={() => {
                        navigateToReviewTeams();
                        onClose();
                    }}>
                    <GroupWorkIcon className={iconClass} />
                    Review guides
                    {(userInfo.rejectedTeamsCount > 0 || userInfo.pendingTeamsCount > 0) && (
                        <Badge intent={userInfo.rejectedTeamsCount > 0 ? 'danger' : 'warning'}>
                            {userInfo.rejectedTeamsCount > 0 ? userInfo.rejectedTeamsCount : userInfo.pendingTeamsCount}
                        </Badge>
                    )}
                </button>
            )}
            {isAuthenticated && [UserRole.admin, UserRole.moderator].includes(userInfo.role) && (
                <button
                    role="menuitem"
                    className={itemClass}
                    onClick={() => {
                        setShowAdminTools(true);
                        onClose();
                    }}>
                    <SupervisorAccountIcon className={iconClass} />
                    Admin tools
                </button>
            )}
            <button role="menuitem" className={itemClass} onClick={() => setDebugMode(!debugMode)}>
                <span className="flex-1">Debug Mode</span>
                <span
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${debugMode ? 'bg-(--primary)' : 'bg-zinc-400 dark:bg-zinc-600'}`}>
                    <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${debugMode ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                </span>
            </button>

            {/* Auth section */}
            <hr className="mx-2 my-1.5 border-(--hairline)" />
            {isAuthenticated ? (
                <button
                    role="menuitem"
                    className={dangerItemClass}
                    onClick={() => {
                        logout();
                        onClose();
                    }}>
                    <LogoutIcon className={dangerIconClass} />
                    Logout
                </button>
            ) : (
                <>
                    <button
                        role="menuitem"
                        className={itemClass}
                        onClick={() => {
                            openLoginForm();
                            onClose();
                        }}>
                        <LoginIcon className={iconClass} />
                        Login
                    </button>
                    <button
                        role="menuitem"
                        className={itemClass}
                        onClick={() => {
                            setShowRegisterUser(true);
                            onClose();
                        }}>
                        <RegisterIcon className={iconClass} />
                        Register
                    </button>
                </>
            )}
        </>
    );

    const dialogs = (
        <>
            {/* Hidden file input — must stay mounted so the change event fires after the file picker closes */}
            <input ref={inputReference} className="hidden" type="file" accept=".json" onChange={handleFileUpload} />
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

    return { buttons, dialogs };
}
