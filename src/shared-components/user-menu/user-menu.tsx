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
import { Avatar, Badge, Divider, IconButton, ListItemIcon, MenuItem, Popover, Switch } from '@mui/material';
import ListItemText from '@mui/material/ListItemText';
import { enqueueSnackbar } from 'notistack';
import { ChangeEvent, useContext, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { usePopupManager } from 'react-popup-manager';
import { useLocation, useNavigate } from 'react-router-dom';

import { GlobalState } from 'src/models/global-state';
import { IPersonalData2 } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { convertData, PersonalDataLocalStorage } from 'src/services';
import { AdminToolsDialog } from 'src/shared-components/user-menu/admin-tools-dialog';

import { useAuth, UserRole } from '@/fsd/5-shared/model';
import { usePopUpControls } from '@/fsd/5-shared/ui';

import { TacticusIntegrationDialog } from '@/fsd/3-features/tacticus-integration/tacticus-integration.dialog';

import { LoginUserDialog } from './login-user-dialog';
import { OverrideDataDialog } from './override-data-dialog';
import { RegisterUserDialog } from './register-user-dialog';
import { RestoreBackupDialog } from './restore-backup-dialog';

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

function stringAvatar(name: string) {
    return {
        className: '!w-8 !h-8',
        style: { backgroundColor: stringToColor(name) },
        children: `${name.slice(0, 2)}`,
    };
}

interface UserMenuProps {
    compact?: boolean;
}

export const UserMenu = ({ compact = false }: UserMenuProps) => {
    const store = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const popupManager = usePopupManager();
    const { isAuthenticated, logout, username, userInfo } = useAuth();
    const [showAdminTools, setShowAdminTools] = useState(false);
    const inputReference = useRef<HTMLInputElement>(null);
    const [showRegisterUser, setShowRegisterUser] = useState(false);
    const [showLoginUser, setShowLoginUser] = useState(false);
    const [showRestoreBackup, setShowRestoreBackup] = useState(false);
    const [debugMode, setDebugMode] = useState(() => localStorage.getItem('debugMode') === 'true');
    const [showOverrideDataWarning, setShowOverrideDataWarning] = useState(false);
    const userMenuControls = usePopUpControls();
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktopView = !location.pathname.includes('mobile');
    const hasRejectedGuides = userInfo.rejectedTeamsCount > 0;

    const navigateToDesktopView = () => {
        localStorage.setItem('preferredView', 'desktop');
        navigate('/home');
    };

    const navigateToMobileView = () => {
        localStorage.setItem('preferredView', 'mobile');
        navigate('/mobile/home');
    };

    const navigateToReviewTeams = () => {
        let tabId = 2;

        if (userInfo.pendingTeamsCount > 0) {
            tabId = 3;
        }

        if (hasRejectedGuides) {
            tabId = 2;
        }

        let url = `/learn/guides?activeTab=${tabId}`;

        if (isMobile) {
            url = '/mobile' + url;
        }

        navigate(url);
    };

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (file) {
            try {
                const content = await file.text();
                const personalData: IPersonalData2 = convertData(JSON.parse(content));
                personalData.modifiedDate = new Date();

                // When we import JSON, we need to bump the local version to ensure
                // we pick it up. It should always be considered the freshest data, and
                // definitely fresher than what we have in the backend.
                dispatch.setStore(
                    {
                        ...new GlobalState(personalData),
                        __localVersion: store.__localVersion ? store.__localVersion + 1 : 1,
                    },
                    /*modified=*/ true,
                    /*reset=*/ false
                );
                enqueueSnackbar('Import successful', { variant: 'success' });
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

        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        };
        const formattedDate = new Intl.DateTimeFormat(navigator.language, options).format(date);
        const realUsername = isAuthenticated ? username : (localStorage.getItem('userOld') ?? username);

        link.download = `${realUsername}-data-${formattedDate}.json`;
        link.click();

        URL.revokeObjectURL(url);
    };

    const restoreData = () => {
        const localStorage = new PersonalDataLocalStorage();
        const restoredData = localStorage.restoreData();
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

    function syncWithTacticus(): void {
        popupManager.open(TacticusIntegrationDialog, {
            tacticusApiKey: userInfo.tacticusApiKey,
            tacticusUserId: userInfo.tacticusUserId,
            tacticusGuildApiKey: userInfo.tacticusGuildApiKey,
            shareInGameName: userInfo.shareInGameName ?? false,
            shareRosterData: userInfo.shareRosterData ?? false,
            shareGuildMemberPerformance: userInfo.shareGuildMemberPerformance ?? false,
            combinedGuildTags: userInfo.combinedGuildTags ?? [],
            guildTag: userInfo.guildTag ?? '',
            onClose: () => {},
        });
    }

    const itemClass =
        'w-full flex items-center text-left gap-2.5 px-2 py-1.5 rounded-[7px] border-none cursor-pointer text-[13px] text-[var(--soft-fg)] bg-transparent hover:bg-[var(--primary)]/[.18] hover:text-[var(--fg)] transition-colors';
    const iconClass = 'flex-shrink-0 !text-[18px]';

    const close = () => userMenuControls.handleClose();

    return (
        <div className={`flex items-center ${compact ? 'justify-center' : 'w-full justify-start'}`}>
            <input ref={inputReference} className="hidden" type="file" accept=".json" onChange={handleFileUpload} />
            <div className="flex items-center gap-2">
                <IconButton
                    onClick={userMenuControls.handleClick}
                    size="small"
                    aria-controls={userMenuControls.open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={userMenuControls.open ? 'true' : undefined}>
                    {isAuthenticated ? (
                        <Avatar {...stringAvatar(username)} />
                    ) : (
                        <Avatar className="!h-8 !w-8">TP</Avatar>
                    )}
                </IconButton>
                {!compact && <span className="truncate text-sm font-semibold">{username}</span>}
            </div>

            <Popover
                id="account-menu"
                anchorEl={userMenuControls.anchorEl}
                open={userMenuControls.open}
                onClose={userMenuControls.handleClose}
                onClick={userMenuControls.handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                {isAuthenticated ? (
                    <MenuItem onClick={() => logout()}>
                        <ListItemIcon>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText>Logout</ListItemText>
                    </MenuItem>
                ) : (
                    <div>
                        <MenuItem onClick={() => openLoginForm()}>
                            <ListItemIcon>
                                <LoginIcon />
                            </ListItemIcon>
                            <ListItemText>Login</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => setShowRegisterUser(true)}>
                            <ListItemIcon>
                                <RegisterIcon />
                            </ListItemIcon>
                            <ListItemText>Register</ListItemText>
                        </MenuItem>
                    </div>
                )}

                <Divider />
                {isAuthenticated && (
                    <MenuItem onClick={syncWithTacticus}>
                        <ListItemIcon>
                            <SyncIcon />
                        </ListItemIcon>
                        <ListItemText>Sync via Tacticus API</ListItemText>
                    </MenuItem>
                )}

                <MenuItem onClick={() => inputReference.current?.click()}>
                    <ListItemIcon>
                        <UploadIcon />
                    </ListItemIcon>
                    <ListItemText>Import JSON</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => downloadJson()}>
                    <ListItemIcon>
                        <DownloadIcon />
                    </ListItemIcon>
                    <ListItemText>Export JSON</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => restoreData()}>
                    <ListItemIcon>
                        <SettingsBackupRestoreIcon />
                    </ListItemIcon>
                    <ListItemText>Restore Backup</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => {
                        const next = !debugMode;
                        localStorage.setItem('debugMode', String(next));
                        setDebugMode(next);
                    }}>
                    <ListItemText>Debug Mode</ListItemText>
                    <Switch checked={debugMode} size="small" />
                </MenuItem>

                <Divider />
                {isDesktopView ? (
                    <MenuItem onClick={() => navigateToMobileView()}>
                        <ListItemIcon>
                            <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText>Use mobile view</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => navigateToDesktopView()}>
                        <ListItemIcon>
                            <ComputerIcon />
                        </ListItemIcon>
                        <ListItemText>Use desktop view</ListItemText>
                    </MenuItem>
                )}

                <Divider />

                {[UserRole.admin, UserRole.moderator].includes(userInfo.role) && (
                    <MenuItem onClick={() => setShowAdminTools(true)}>
                        <ListItemIcon>
                            <SupervisorAccountIcon />
                        </ListItemIcon>
                        <ListItemText>Admin tools</ListItemText>
                    </MenuItem>
                )}

                <MenuItem onClick={() => navigateToReviewTeams()}>
                    <ListItemIcon>
                        <GroupWorkIcon />
                    </ListItemIcon>
                    {userInfo.rejectedTeamsCount > 0 ? (
                        <Badge badgeContent={userInfo.rejectedTeamsCount} color="error">
                            <ListItemText>Review guides</ListItemText>
                        </Badge>
                    ) : (
                        <ListItemText>Review guides</ListItemText>
                    )}
                </MenuItem>

                {/* Identity row */}
                <div className="mb-1 flex items-center gap-2.5 border-b border-[var(--border)] px-2 py-2">
                    {isAuthenticated ? (
                        <Avatar {...stringAvatar(username)} />
                    ) : (
                        <Avatar className="!h-8 !w-8">TP</Avatar>
                    )}
                    <span className="truncate text-[13px] font-semibold text-[var(--fg)]">{username}</span>
                </div>

                {/* Auth */}
                {isAuthenticated ? (
                    <button
                        className={itemClass}
                        onClick={() => {
                            logout();
                            close();
                        }}>
                        <LogoutIcon className={iconClass} />
                        <span>Logout</span>
                    </button>
                ) : (
                    <>
                        <button
                            className={itemClass}
                            onClick={() => {
                                openLoginForm();
                                close();
                            }}>
                            <LoginIcon className={iconClass} />
                            <span>Login</span>
                        </button>
                        <button
                            className={itemClass}
                            onClick={() => {
                                setShowRegisterUser(true);
                                close();
                            }}>
                            <RegisterIcon className={iconClass} />
                            <span>Register</span>
                        </button>
                    </>
                )}

                {isAuthenticated && (
                    <>
                        <hr className="my-1 border-[var(--border)]" />
                        <button
                            className={itemClass}
                            onClick={() => {
                                syncWithTacticus();
                                close();
                            }}>
                            <SyncIcon className={iconClass} />
                            <span>Sync via Tacticus API</span>
                        </button>
                    </>
                )}

                <hr className="my-1 border-[var(--border)]" />
                <button
                    className={itemClass}
                    onClick={() => {
                        inputReference.current?.click();
                        close();
                    }}>
                    <UploadIcon className={iconClass} />
                    <span>Import JSON</span>
                </button>
                <button
                    className={itemClass}
                    onClick={() => {
                        downloadJson();
                        close();
                    }}>
                    <DownloadIcon className={iconClass} />
                    <span>Export JSON</span>
                </button>
                <button
                    className={itemClass}
                    onClick={() => {
                        restoreData();
                        close();
                    }}>
                    <SettingsBackupRestoreIcon className={iconClass} />
                    <span>Restore Backup</span>
                </button>

                <hr className="my-1 border-[var(--border)]" />
                {isDesktopView ? (
                    <button
                        className={itemClass}
                        onClick={() => {
                            navigateToMobileView();
                            close();
                        }}>
                        <PhoneIcon className={iconClass} />
                        <span>Use mobile view</span>
                    </button>
                ) : (
                    <button
                        className={itemClass}
                        onClick={() => {
                            navigateToDesktopView();
                            close();
                        }}>
                        <ComputerIcon className={iconClass} />
                        <span>Use desktop view</span>
                    </button>
                )}

                <hr className="my-1 border-[var(--border)]" />
                {[UserRole.admin, UserRole.moderator].includes(userInfo.role) && (
                    <button
                        className={itemClass}
                        onClick={() => {
                            setShowAdminTools(true);
                            close();
                        }}>
                        <SupervisorAccountIcon className={iconClass} />
                        <span>Admin tools</span>
                    </button>
                )}
                <button
                    className={itemClass}
                    onClick={() => {
                        navigateToReviewTeams();
                        close();
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
            </Popover>
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
                    if (proceed) {
                        setShowLoginUser(true);
                    }
                }}
            />
            <AdminToolsDialog
                isOpen={showAdminTools}
                onClose={() => {
                    setShowAdminTools(false);
                }}
            />
        </div>
    );
};
