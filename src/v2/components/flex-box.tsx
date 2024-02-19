import React from 'react';
import { Property } from 'csstype';
import { isMobile } from 'react-device-detect';

export const FlexBox = ({
    alignItems = 'center',
    gap,
    justifyContent,
    children,
    useColumnForMobile,
    wrap,
}: React.PropsWithChildren<{
    alignItems?: Property.AlignItems;
    justifyContent?: Property.JustifyContent;
    gap?: Property.Gap<string | number>;
    useColumnForMobile?: boolean;
    wrap?: boolean;
}>) => {
    const flexDirection: Property.FlexDirection = isMobile && useColumnForMobile ? 'column' : 'row';
    const flexWrap: Property.FlexWrap = wrap ? 'wrap' : 'nowrap';
    return <div style={{ display: 'flex', alignItems, gap, justifyContent, flexDirection, flexWrap }}>{children}</div>;
};
