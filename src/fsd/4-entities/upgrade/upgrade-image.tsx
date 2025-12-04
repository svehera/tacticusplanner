import React, { useState, CSSProperties, useMemo } from 'react';

import { RarityString } from '@/fsd/5-shared/model';
import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

import { UpgradesService } from './upgrades.service';

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
    rarity?: RarityString;
}) => {
    const [imgError, setImgError] = useState(false);
    const width = size ?? 50;
    const height = size ?? 50;
    const imagePath = iconPath || material.toLowerCase() + '.png';
    const image = getImageUrl(imagePath);
    const frameImageDir = 'snowprint_assets/frames';
    const bgImgUrl = getImageUrl(`${frameImageDir}/ui_underlay_upgrades.png`);
    const upgradeHeightRatio = 0.78;

    function getFrameUrl(rarity?: RarityString) {
        switch (rarity) {
            case RarityString.Mythic:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_mythic.png`);
            case RarityString.Legendary:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_legendary.png`);
            case RarityString.Epic:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_epic.png`);
            case RarityString.Rare:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_rare.png`);
            case RarityString.Uncommon:
                return getImageUrl(`${frameImageDir}/ui_frame_upgrades_uncommon.png`);
            case RarityString.Common:
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

    const tooltipText = useMemo(() => {
        if (tooltip) {
            return tooltip;
        }
        return UpgradesService.getUpgradeMaterial(material)?.material ?? material;
    }, [material, tooltip]);

    return (
        <AccessibleTooltip title={tooltipText}>
            <div style={{ width, height }} className={'upgrade'}>
                {!imgError ? (
                    <div className="relative block my-0 mx-auto" style={{ width, height }}>
                        <img style={centeredImageStackStyles} src={bgImgUrl} alt={`${rarity} upgrade`} />
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
                        <img loading={'lazy'} style={centeredImageStackStyles} src={frameImgUrl} />
                    </div>
                ) : (
                    <div style={imageMissingStyles}>{material}</div>
                )}
            </div>
        </AccessibleTooltip>
    );
};
