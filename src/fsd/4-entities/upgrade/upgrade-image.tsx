import React, { useState, CSSProperties } from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

export const UpgradeImage = ({
    material,
    iconPath,
    size,
    tooltip,
    rarity,
}: {
    material: string;
    iconPath: string;
    size?: number;
    tooltip?: React.ReactNode;
    rarity: Rarity;
}) => {
    const [imgError, setImgError] = useState(false);
    const width = size ?? 50;
    const height = size ?? 50;
    const imagePath = iconPath || material.toLowerCase() + '.png';
    const image = getImageUrl(imagePath);
    const frameImageDir = 'snowprint_assets/frames';
    const bgImgUrl = getImageUrl(`${frameImageDir}/ui_underlay_upgrades.png`);
    const upgradeHeightRatio = 0.78;

    function getFrameUrl(rarity: Rarity) {
        switch (rarity) {
            case Rarity.Mythic:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_mythic.png`);
            case Rarity.Legendary:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_legendary.png`);
            case Rarity.Epic:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_epic.png`);
            case Rarity.Rare:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_rare.png`);
            case Rarity.Uncommon:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_uncommon.png`);
            case Rarity.Common:
            default:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_common.png`);
        }
    }
    const frameImgUrl = getFrameUrl(rarity);

    const centeredImageStackStyles: CSSProperties = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '100%',
        maxHeight: '100%',
    };

    const imageMissingStyles: CSSProperties = {
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
    };

    return (
        <AccessibleTooltip title={tooltip ?? material}>
            <div style={{ width, height }} className={'upgrade'}>
                {!imgError ? (
                    <div style={{ position: 'relative', display: 'block', margin: '0 auto', width, height }}>
                        <img style={{ ...centeredImageStackStyles }} src={bgImgUrl} alt={`${rarity} upgrade`} />
                        <img
                            loading={'lazy'}
                            style={{
                                ...centeredImageStackStyles,
                                height: `${upgradeHeightRatio * 100}%`,
                            }}
                            src={image}
                            alt={material}
                            onError={() => {
                                console.error(`Image not found: ${imagePath}`);
                                setImgError(true);
                            }}
                        />
                        <img loading={'lazy'} style={{ ...centeredImageStackStyles }} src={frameImgUrl} />
                    </div>
                ) : (
                    <div style={imageMissingStyles}>{material}</div>
                )}
            </div>
        </AccessibleTooltip>
    );
};
