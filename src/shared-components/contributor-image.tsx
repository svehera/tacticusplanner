import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const ContributorImage = ({
    iconPath,
    height,
    width,
    borderRadius,
}: {
    iconPath: string;
    height: number;
    width: number;
    borderRadius?: boolean;
}) => {
    const image = getImageUrl(`contributors/${iconPath}`);

    return (
        <img
            loading={'lazy'}
            style={{
                contentVisibility: 'auto',
                borderRadius: borderRadius ? '50%' : undefined,
            }}
            src={image}
            height={height}
            width={width}
            alt={iconPath}
        />
    );
};
