/* eslint-disable import-x/no-internal-modules */
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Avatar, Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { useUserMenuItems } from 'src/shared-components/user-menu/use-user-menu-items';

import { useAuth } from '@/fsd/5-shared/model';

import s from './account-dock.module.css';

function stringToColor(string: string) {
    let hash = 0;
    for (let index = 0; index < string.length; index += 1) {
        const character = string.codePointAt(index);
        if (!character) throw new Error('invalid codePoint');
        hash = character + ((hash << 5) - hash);
    }
    let color = '#';
    for (let index = 0; index < 3; index += 1) {
        const value = (hash >> (index * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
}

interface AccountDockProps {
    collapsed?: boolean;
}

export const AccountDock = ({ collapsed = false }: AccountDockProps) => {
    const { username } = useAuth();
    const [open, setOpen] = useState(false);
    const dockReference = useRef<HTMLDivElement>(null);
    const trigReference = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const onMouseDown = (event: MouseEvent) => {
            if (dockReference.current && !dockReference.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                trigReference.current?.focus();
            }
        };
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const close = () => setOpen(false);
    const { buttons, dialogs } = useUserMenuItems({ onClose: close });

    const avatarProps = {
        className: '!size-[34px] !text-[13px] !font-extrabold',
        style: { backgroundColor: stringToColor(username) },
        children: username.slice(0, 2),
    };

    if (collapsed) {
        return (
            <>
                <div className="flex justify-center py-2">
                    <Tooltip title={username} placement="right">
                        <button
                            onClick={() => setOpen(o => !o)}
                            className="cursor-pointer rounded-full bg-transparent p-0 focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-1 focus-visible:ring-offset-(--sidebar)">
                            <Avatar {...avatarProps} />
                        </button>
                    </Tooltip>
                </div>
                {dialogs}
            </>
        );
    }

    return (
        <>
            <div className="flex-shrink-0" ref={dockReference}>
                {/* Inline menu — rendered only when open, fades in via animation */}
                {open && (
                    <div role="menu" className="overflow-hidden border-t border-t-(--hairline)">
                        <div className={`${s.inner} px-2 pt-[6px] pb-[2px]`}>
                            {buttons}
                            <div className="h-1.5" />
                        </div>
                    </div>
                )}

                {/* Trigger row — the only place the avatar appears */}
                <button
                    ref={trigReference}
                    className={`flex w-full cursor-pointer items-center gap-[11px] border-t bg-(--sidebar) px-[13px] py-[11px] text-left font-[inherit] text-inherit [transition:background_120ms,color_120ms] hover:bg-(--fg)/[.045] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--primary) ${open ? 'border-t-transparent' : 'border-t-(--hairline)'}`}
                    aria-expanded={open}
                    aria-haspopup="menu"
                    onClick={() => setOpen(o => !o)}>
                    <Avatar {...avatarProps} />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] leading-[1.25] font-bold text-(--fg)">
                            {username}
                        </span>
                        <span className="text-[11px] text-(--soft-fg)">Account &amp; data</span>
                    </span>
                    <ExpandMoreIcon
                        className={`!text-[16px] text-(--soft-fg)/70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>
            {dialogs}
        </>
    );
};
