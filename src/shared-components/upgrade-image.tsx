import { Tooltip } from '@mui/material';
import React from 'react';

export const UpgradeImage = ({ material, iconPath, size }: { material: string; iconPath: string; size?: number }) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/upgrades/${iconPath}`);

        return (
            <Tooltip title={material} enterTouchDelay={0} placement={'right'}>
                <div style={{ width: size ?? 50, height: size ?? 50 }}>
                    <img loading={'lazy'} style={{}} src={image} height={size ?? 50} alt={material} />
                </div>
            </Tooltip>
        );
    } catch (error) {
        // console.log(`Image for "${material}" with path "${iconPath}" does not exist`);
        return (
            <Tooltip title={material} enterTouchDelay={0} placement={'right'}>
                <div>{material}</div>
            </Tooltip>
        );
    }
};
