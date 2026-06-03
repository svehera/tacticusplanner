import { Avatar, IconButton, Popover } from '@mui/material';

import { useAuth } from '@/fsd/5-shared/model';
import { usePopUpControls } from '@/fsd/5-shared/ui';

import { useUserMenuItems } from './use-user-menu-items';

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
    const { isAuthenticated, username } = useAuth();
    const userMenuControls = usePopUpControls();

    const close = () => userMenuControls.handleClose();
    const { buttons, dialogs } = useUserMenuItems({ onClose: close });

    return (
        <div className={`flex items-center ${compact ? 'justify-center' : 'w-full justify-start'}`}>
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
                onClose={close}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                elevation={0}
                PaperProps={{
                    className: 'bg-(--sidebar) border border-(--border) rounded-lg shadow-xl w-[220px] p-1',
                }}>
                {/* Identity row */}
                <div className="mb-1 flex items-center gap-2.5 border-b border-(--border) px-2 py-2">
                    {isAuthenticated ? (
                        <Avatar {...stringAvatar(username)} />
                    ) : (
                        <Avatar className="!h-8 !w-8">TP</Avatar>
                    )}
                    <span className="truncate text-[13px] font-semibold text-(--fg)">{username}</span>
                </div>
                {buttons}
                <div className="h-1.5" />
            </Popover>
            {dialogs}
        </div>
    );
};
