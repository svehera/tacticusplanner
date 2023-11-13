import { Tooltip } from '@fluentui/react-components';
import React from 'react';

export const UpgradeImage = ({ material, iconPath }: { material: string; iconPath: string }) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/upgrades/${iconPath}`);

        return (
            <Tooltip content={material} relationship="label" hideDelay={1000}>
                <span style={{ display: 'inline-block', height: 50 }}>
                    <img
                        loading={'lazy'}
                        style={{ pointerEvents: 'none', contentVisibility: 'auto' }}
                        src={image}
                        height={50}
                        alt={material}
                    />
                </span>
            </Tooltip>
        );
    } catch (error) {
        console.log(`Image with name "${iconPath}" does not exist`);
        return <span>{material}</span>;
    }
};
