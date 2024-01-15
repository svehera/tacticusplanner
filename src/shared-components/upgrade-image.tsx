import { Tooltip } from '@mui/material';
import React from 'react';
import { Rarity } from '../models/enums';
import { getImageUrl } from '../shared-logic/functions';

export const UpgradeImage = ({
    material,
    iconPath,
    rarity,
    size,
}: {
    material: string;
    iconPath: string;
    rarity: Rarity;
    size?: number;
}) => {
    try {
        // const
        const imagePath = iconPath || material.toLowerCase() + '.png';
        const image = getImageUrl(`upgrades/${imagePath}`);

        return (
            <Tooltip title={material} enterTouchDelay={0} placement={'top'}>
                <div
                    style={{ width: size ?? 50, height: size ?? 50 }}
                    className={Rarity[rarity]?.toLowerCase() + '-upgrade upgrade'}>
                    <img
                        loading={'lazy'}
                        style={{}}
                        src={image}
                        height={size ?? 50}
                        width={size ?? 50}
                        alt={material}
                    />
                </div>
            </Tooltip>
        );
    } catch (error) {
        // console.log(`Image for "${material}" with path "${iconPath}" does not exist`);
        return (
            <Tooltip title={material} enterTouchDelay={0} placement={'top'}>
                <div>{material}</div>
            </Tooltip>
        );
    }
};
