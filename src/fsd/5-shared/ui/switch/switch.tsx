import React from 'react';
import {
    Switch as SwitchPrimitive,
    type SwitchProps as SwitchPrimitiveProps,
    composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

const switchStyles = tv({
    slots: {
        root: [
            'group/switch flex cursor-pointer items-center gap-2.5',
            'data-disabled:cursor-not-allowed data-disabled:opacity-50',
        ],
        track: [
            'inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors',
            'bg-(--neutral)',
            'group-data-selected/switch:bg-(--primary)',
            'group-data-focus-visible/switch:ring-2 group-data-focus-visible/switch:ring-(--primary)',
            'group-data-focus-visible/switch:ring-offset-2 group-data-focus-visible/switch:ring-offset-(--bg)',
        ],
        thumb: [
            'pointer-events-none block h-4 w-4 translate-x-0 rounded-full bg-(--fg) shadow-sm transition-transform',
            'group-data-selected/switch:translate-x-4',
        ],
        label: 'select-none text-sm text-(--fg)',
    },
});

interface SwitchProps extends Omit<SwitchPrimitiveProps, 'children'> {
    children?: React.ReactNode;
}

const Switch = ({ children, className, ...props }: SwitchProps) => {
    const { root, track, thumb, label } = switchStyles();
    return (
        <SwitchPrimitive {...props} className={composeRenderProps(className, cls => root({ className: cls }))}>
            <div className={track()}>
                <span className={thumb()} />
            </div>
            {children && <span className={label()}>{children}</span>}
        </SwitchPrimitive>
    );
};

export { Switch };
export type { SwitchProps };
