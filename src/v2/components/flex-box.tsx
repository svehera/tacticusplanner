import React from 'react';
import { Property } from 'csstype';

export const FlexBox = ({
    alignItems,
    gap,
    justifyContent,
    children,
}: React.PropsWithChildren<{
    alignItems?: Property.AlignItems;
    justifyContent?: Property.JustifyContent;
    gap?: Property.Gap<string | number>;
}>) => {
    alignItems ??= 'center';
    return <div style={{ display: 'flex', alignItems, gap, justifyContent }}>{children}</div>;
};
