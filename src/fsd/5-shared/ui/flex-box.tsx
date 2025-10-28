﻿import React, { CSSProperties, MouseEventHandler } from 'react';
import { isMobile } from 'react-device-detect';

export const FlexBox = ({
    alignItems = 'center',
    gap,
    justifyContent,
    children,
    useColumnForMobile,
    wrap,
    onClick,
    style = {},
}: React.PropsWithChildren<{
    alignItems?: CSSProperties['alignItems'];
    justifyContent?: CSSProperties['justifyContent'];
    gap?: CSSProperties['gap'];
    useColumnForMobile?: boolean;
    wrap?: boolean;
    onClick?: MouseEventHandler<HTMLDivElement>;
    style?: CSSProperties;
}>) => {
    const flexDirection = isMobile && useColumnForMobile ? 'column' : 'row';
    const flexWrap = wrap ? 'wrap' : 'nowrap';
    return (
        <div
            onClick={onClick}
            style={{ display: 'flex', alignItems, gap, justifyContent, flexDirection, flexWrap, ...style }}>
            {children}
        </div>
    );
};
