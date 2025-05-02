import { Property } from 'csstype';
import React, { CSSProperties, MouseEventHandler } from 'react';
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
    alignItems?: Property.AlignItems;
    justifyContent?: Property.JustifyContent;
    gap?: Property.Gap<string | number>;
    useColumnForMobile?: boolean;
    wrap?: boolean;
    onClick?: MouseEventHandler<HTMLDivElement>;
    style?: CSSProperties;
}>) => {
    const flexDirection: Property.FlexDirection = isMobile && useColumnForMobile ? 'column' : 'row';
    const flexWrap: Property.FlexWrap = wrap ? 'wrap' : 'nowrap';
    return (
        <div
            onClick={onClick}
            style={{ display: 'flex', alignItems, gap, justifyContent, flexDirection, flexWrap, ...style }}>
            {children}
        </div>
    );
};
