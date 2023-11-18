import React from 'react';

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
    try {
        // Import image on demand
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/contributors/${iconPath}`);

        // If the image doesn't exist. return null
        if (!image) return null;
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
    } catch (error) {
       //  console.log(`Image with name "${iconPath}" does not exist`);
        return null;
    }
};
