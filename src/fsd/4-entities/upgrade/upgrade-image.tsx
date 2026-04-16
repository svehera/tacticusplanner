/* eslint-disable import-x/no-internal-modules */
import React, { useState, CSSProperties } from 'react';

import frameCommonUrl from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_common.png';
import frameEpicUrl from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_epic.png';
import frameLegendaryUrl from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_legendary.png';
import frameMythicUrl from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_mythic.png';
import frameRareUrl from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_rare.png';
import frameUncommonUrl from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_uncommon.png';
import bgUnderlayUrl from '@/assets/images/snowprint_assets/frames/ui_underlay_upgrades.png';

import { RarityString } from '@/fsd/5-shared/model';
import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

import { recipeDataByName } from './data';

// Static assets — resolved to hashed URLs by Vite at build time. Zero
// per-render cost (just string references), unlike getImageUrl which
// runs new URL(...) at runtime.
const FRAME_URL_BY_RARITY: Partial<Record<RarityString, string>> = {
    [RarityString.Mythic]: frameMythicUrl,
    [RarityString.Legendary]: frameLegendaryUrl,
    [RarityString.Epic]: frameEpicUrl,
    [RarityString.Rare]: frameRareUrl,
    [RarityString.Uncommon]: frameUncommonUrl,
    [RarityString.Common]: frameCommonUrl,
};

const UPGRADE_HEIGHT_RATIO = 0.78;

const CENTERED_STACK_STYLES: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '100%',
    maxHeight: '100%',
};

const CENTERED_STACK_STYLES_MAIN_IMG: CSSProperties = {
    ...CENTERED_STACK_STYLES,
    height: `${UPGRADE_HEIGHT_RATIO * 100}%`,
};

interface UpgradeImageBaseProps {
    material: string;
    iconPath: string;
    size?: number;
    rarity?: RarityString;
}

const UpgradeImageBase = ({ material, iconPath, size, rarity }: UpgradeImageBaseProps) => {
    const [imgError, setImgError] = useState(false);
    const width = size ?? 50;
    const height = size ?? 50;
    const imagePath = iconPath || material.toLowerCase() + '.png';
    const image = getImageUrl(imagePath);
    const frameImgUrl = rarity ? FRAME_URL_BY_RARITY[rarity] : undefined;

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
        <div style={{ width, height }} className={'upgrade'}>
            {imgError ? (
                <div style={imageMissingStyles}>{material}</div>
            ) : (
                <div className="relative mx-auto my-0 block" style={{ width, height }}>
                    <img style={CENTERED_STACK_STYLES} src={bgUnderlayUrl} alt={`${rarity} upgrade`} />
                    <img
                        loading={'lazy'}
                        style={CENTERED_STACK_STYLES_MAIN_IMG}
                        src={image}
                        alt={material}
                        onError={() => {
                            console.error(`Image not found: ${imagePath}`);
                            setImgError(true);
                        }}
                    />
                    <img loading={'lazy'} style={CENTERED_STACK_STYLES} src={frameImgUrl} />
                </div>
            )}
        </div>
    );
};

export const UpgradeImage = ({
    material,
    iconPath,
    size,
    tooltip,
    rarity,
    showTooltip = true,
}: UpgradeImageBaseProps & {
    tooltip?: React.ReactNode;
    showTooltip?: boolean;
}) => {
    if (!showTooltip) return <UpgradeImageBase material={material} iconPath={iconPath} size={size} rarity={rarity} />;

    const tooltipText = tooltip ?? recipeDataByName[material]?.material ?? material;

    return (
        <AccessibleTooltip title={tooltipText}>
            <UpgradeImageBase material={material} iconPath={iconPath} size={size} rarity={rarity} />
        </AccessibleTooltip>
    );
};
