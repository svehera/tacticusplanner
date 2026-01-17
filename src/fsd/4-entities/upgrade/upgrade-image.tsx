import React, { CSSProperties, useMemo } from 'react';

/* eslint-disable import-x/no-internal-modules */
import unknownItem from '@/assets/images/snowprint_assets/equipment/ui_icon_item_unknown.png';
import commonFrame from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_common.png';
import epicFrame from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_epic.png';
import legendaryFrame from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_legendary.png';
import mythicFrame from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_mythic.png';
import rareFrame from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_rare.png';
import uncommonFrame from '@/assets/images/snowprint_assets/frames/ui_frame_upgrades_uncommon.png';
import bgImageUrl from '@/assets/images/snowprint_assets/frames/ui_underlay_upgrades.png';
/* eslint-enable import-x/no-internal-modules */

import { mapSnowprintAssets } from '@/fsd/5-shared/lib';
import { RarityString } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { UpgradesService } from './upgrades.service';

const snowprintUpgradeAssets = import.meta.glob('/src/assets/images/snowprint_assets/upgrade_materials/*.png', {
    eager: true,
    import: 'default',
});
const upgradeMap = mapSnowprintAssets(snowprintUpgradeAssets); // Run at module load time so that the build breaks if the glob is wrong.

const ourUpgradeAssets = import.meta.glob('/src/assets/images/upgrades/*.png', {
    eager: true,
    import: 'default',
});
Object.entries(ourUpgradeAssets).forEach(([key, value]) => {
    if (typeof value !== 'string') throw new Error(`Unexpected non-string value for upgrade asset: ${key}`);
    const keyFileName = key.split('/').pop();
    const materialName = keyFileName?.split('.').shift();
    if (!materialName) throw new Error(`Failed to parse upgrade asset filename: ${key}`);
    upgradeMap[materialName] = value;
});

const frameImageMap = {
    [RarityString.Mythic]: mythicFrame,
    [RarityString.Legendary]: legendaryFrame,
    [RarityString.Epic]: epicFrame,
    [RarityString.Rare]: rareFrame,
    [RarityString.Uncommon]: uncommonFrame,
    [RarityString.Common]: commonFrame,
} as const;

const centeredImageStackStyles: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '100%',
    maxHeight: '100%',
};

export const UpgradeImage = ({
    material,
    iconPath,
    size = 50,
    tooltip,
    rarity,
}: {
    material: string;
    iconPath: string;
    size?: number;
    tooltip?: React.ReactNode;
    rarity?: RarityString;
}) => {
    const imagePath = iconPath || material.toLowerCase() + '.png';
    let image = upgradeMap[imagePath];
    if (!image) {
        console.error(`image not found for ${imagePath}`);
        image = unknownItem;
    }
    const frameImgUrl = frameImageMap[rarity ?? RarityString.Common];
    const tooltipText = useMemo(
        () => tooltip ?? UpgradesService.getUpgradeMaterial(material)?.material ?? material,
        [material, tooltip]
    );

    return (
        <AccessibleTooltip title={tooltipText}>
            <div style={{ width: size, height: size }} className={'upgrade'}>
                (
                <div className="relative block my-0 mx-auto" style={{ width: size, height: size }}>
                    <img style={centeredImageStackStyles} src={bgImageUrl} alt={`${rarity} upgrade`} />
                    <img
                        loading={'lazy'}
                        style={{
                            ...centeredImageStackStyles,
                            height: '78%',
                        }}
                        src={image}
                        alt={material}
                    />
                    <img loading={'lazy'} style={centeredImageStackStyles} src={frameImgUrl} alt="" />
                </div>
                )
            </div>
        </AccessibleTooltip>
    );
};
