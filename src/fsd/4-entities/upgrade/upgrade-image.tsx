import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

export const UpgradeImage = ({
    material,
    iconPath,
    rarity,
    size,
    tooltip,
}: {
    material: string;
    iconPath: string;
    rarity?: Rarity;
    size?: number;
    tooltip?: React.ReactNode;
}) => {
    try {
        // const
        const imagePath = iconPath || material.toLowerCase() + '.png';
        const image = getImageUrl(`upgrades/${imagePath}`);

        return (
            <AccessibleTooltip title={tooltip ?? material}>
                <div style={{ width: size ?? 50, height: size ?? 50 }} className={'upgrade'}>
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
