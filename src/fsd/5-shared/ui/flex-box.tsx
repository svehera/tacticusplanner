import React, { CSSProperties, MouseEventHandler } from 'react';
import { isMobile } from 'react-device-detect';
import { twMerge } from 'tailwind-merge';

export const FlexBox = ({
    alignItems = 'center',
    gap,
    justifyContent,
    children,
    useColumnForMobile,
    wrap,
    onClick,
    style = {},
    className = '',
}: React.PropsWithChildren<{
    alignItems?: CSSProperties['alignItems'];
    justifyContent?: CSSProperties['justifyContent'];
    gap?: CSSProperties['gap'];
    useColumnForMobile?: boolean;
    wrap?: boolean;
    onClick?: MouseEventHandler<HTMLDivElement>;
    style?: CSSProperties;
    className?: string;
}>) => {
    const combinedClassName = twMerge(
        'flex',
        wrap ? 'flex-wrap' : 'flex-nowrap',
        isMobile && useColumnForMobile ? 'flex-col' : 'flex-row',
        className
    );
    return (
        <div onClick={onClick} className={combinedClassName} style={{ alignItems, gap, justifyContent, ...style }}>
            {children}
        </div>
    );
};
