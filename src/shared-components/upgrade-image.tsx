import React from 'react';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { Rarity } from '../models/enums';
import { getImageUrl } from '../shared-logic/functions';

export const UpgradeImage = ({
    material,
    iconPath,
    rarity,
    size,
    tooltip,
}: {
    material: string;
    iconPath: string;
    rarity: Rarity;
    size?: number;
    tooltip?: React.ReactNode;
}) => {
    try {
        // const
        const imagePath = iconPath || material.toLowerCase() + '.png';
        const image = getImageUrl(`upgrades/${imagePath}`);

        return (
            <AccessibleTooltip title={tooltip ?? material}>
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
            </AccessibleTooltip>
        );
    } catch (error) {
        return (
            <AccessibleTooltip title={material}>
                <div>{material}</div>
            </AccessibleTooltip>
        );
    }
};
