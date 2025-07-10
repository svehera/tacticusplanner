import React, { useState } from 'react';

import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

export const UpgradeImage = ({
    material,
    iconPath,
    size,
    tooltip,
}: {
    material: string;
    iconPath: string;
    size?: number;
    tooltip?: React.ReactNode;
}) => {
    const [imgError, setImgError] = useState(false);
    const width = size ?? 50;
    const height = size ?? 50;
    const imagePath = iconPath || material.toLowerCase() + '.png';
    const image = getImageUrl(`upgrades/${imagePath}`);

    return (
        <AccessibleTooltip title={tooltip ?? material}>
            <div style={{ width, height }} className={'upgrade'}>
                {!imgError ? (
                    <img
                        loading={'lazy'}
                        src={image}
                        height={height}
                        width={width}
                        alt={material}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div
                        style={{
                            height,
                            width,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: `clamp(8px, ${width / 4.5}px, 14px)`,
                            textAlign: 'center',
                            overflow: 'hidden',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            lineHeight: '0.9',
                        }}>
                        {material}
                    </div>
                )}
            </div>
        </AccessibleTooltip>
    );
};
