/* eslint-disable import-x/no-internal-modules */

import { useEffect } from 'react';

import unknown from '@/assets/images/snowprint_assets/equipment/ui_icon_item_unknown.png';

import { mapSnowprintAssets } from '@/fsd/5-shared/lib';
import { RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/iconList';

import type { IEquipment } from '../model';

const equipmentAssets = import.meta.glob('/src/assets/images/snowprint_assets/equipment/ui_icon_item_*.png', {
    eager: true,
    import: 'default',
});
const equipmentIcons = mapSnowprintAssets(equipmentAssets); // Run at module load time so that the build breaks if the glob is wrong.

// Helper component for a single centered image layer
const ImageLayer = ({
    url,
    size,
    zIndex,
    scaleFactor,
    alt,
}: {
    url: string;
    scaleFactor: number;
    size: { width: number; height: number };
    zIndex: number;
    alt: string;
}) => (
    <img
        src={url}
        alt={alt}
        className="absolute pointer-events-none top-1/2 left-1/2 object-contain"
        style={{
            width: size.width,
            height: size.height,
            transform: 'translate(-50%, -50%) scale(' + scaleFactor + '%, ' + scaleFactor + '%)',
            zIndex: zIndex,
        }}
        loading="lazy"
    />
);

export const EquipmentIcon = ({
    equipment,
    height = 50, // Set default sizes for better control
    width = 50,
    tooltip,
}: {
    equipment: IEquipment;
    height?: number;
    width?: number;
    tooltip?: boolean;
}) => {
    const frameKey = (RarityMapper.rarityToRarityString(equipment.rarity).toLocaleLowerCase() +
        'EquipmentFrame') as keyof typeof tacticusIcons;
    const frameDetails = tacticusIcons[frameKey] ?? { file: '', label: frameKey };
    const relicDetails = tacticusIcons['relicEquipmentFrame'] ?? { file: '', label: 'relicEquipmentFrame' };

    const imageUrl = equipmentIcons[equipment.icon] ?? unknown;
    useEffect(() => {
        if (!(equipment.icon in equipmentIcons))
            console.error(`❌ Equipment icon not found for icon path: ${equipment.icon}`);
    }, [equipment.icon]);

    return (
        <AccessibleTooltip title={tooltip ? equipment.name : ''}>
            <div className="layered-image-stack relative overflow-hidden" style={{ width, height }}>
                <ImageLayer
                    url={imageUrl}
                    size={{ width, height }}
                    zIndex={1}
                    scaleFactor={85}
                    alt={`${equipment.name} image`}
                />
                <ImageLayer url={frameDetails.file} size={{ width, height }} zIndex={2} scaleFactor={100} alt="" />
                {equipment.isRelic && (
                    <ImageLayer url={relicDetails.file} size={{ width, height }} zIndex={3} scaleFactor={100} alt="" />
                )}
            </div>
        </AccessibleTooltip>
    );
};
