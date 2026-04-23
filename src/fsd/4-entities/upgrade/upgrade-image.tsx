/* eslint-disable import-x/no-internal-modules */
import React, { forwardRef, useState } from 'react';

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

interface UpgradeImageBaseProps {
    material: string;
    iconPath: string;
    size?: number;
    rarity?: RarityString;
}

const UpgradeImageBase = forwardRef<HTMLDivElement, UpgradeImageBaseProps & React.HTMLAttributes<HTMLDivElement>>(
    ({ material, iconPath, size, rarity, ...htmlProps }, reference) => {
        const [imgError, setImgError] = useState(false);
        const width = size ?? 50;
        const height = size ?? 50;
        const imagePath = iconPath || material.toLowerCase() + '.png';
        const image = getImageUrl(imagePath);
        const frameImgUrl = rarity ? FRAME_URL_BY_RARITY[rarity] : undefined;

        // Tailwind handles most styles; fontSize remains dynamic
        const imageMissingFontSize = `clamp(8px, ${width / 4.5}px, 14px)`;

        return (
            <div ref={reference} {...htmlProps} style={{ width, height }} className="upgrade">
                {imgError ? (
                    <div
                        className="flex h-full w-full items-center justify-center overflow-hidden text-center leading-[0.9] break-words whitespace-pre-wrap"
                        style={{ fontSize: imageMissingFontSize }}>
                        {material}
                    </div>
                ) : (
                    <div className="relative mx-auto my-0 block" style={{ width, height }}>
                        <img
                            className="absolute top-1/2 left-1/2 max-h-full max-w-full -translate-x-1/2 -translate-y-1/2"
                            src={bgUnderlayUrl}
                            alt={`${rarity} upgrade`}
                        />
                        <img
                            loading="lazy"
                            className="absolute top-1/2 left-1/2 h-[78%] max-h-full max-w-full -translate-x-1/2 -translate-y-1/2"
                            src={image}
                            alt={material}
                            onError={() => {
                                console.error(`Image not found: ${imagePath}`);
                                setImgError(true);
                            }}
                        />
                        <img
                            loading="lazy"
                            className="absolute top-1/2 left-1/2 max-h-full max-w-full -translate-x-1/2 -translate-y-1/2"
                            src={frameImgUrl}
                        />
                    </div>
                )}
            </div>
        );
    }
);
UpgradeImageBase.displayName = 'UpgradeImageBase';

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
