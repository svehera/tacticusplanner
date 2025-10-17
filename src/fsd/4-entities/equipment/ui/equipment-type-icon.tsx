import React from 'react';

import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

export const EquipmentTypeIcon = ({
    equipmentType,
    height,
    width,
    tooltip,
}: {
    equipmentType: string;
    height?: number;
    width?: number;
    tooltip?: boolean;
}) => {
    const imageUrl = getImageUrl(
        `snowprint_assets/equipment/ui_icon_itemtype_${equipmentType.substring(2).toLowerCase()}.png`
    );

    const image = (
        <img loading={'lazy'} style={{ pointerEvents: 'none', width, height }} src={imageUrl} alt={equipmentType} />
    );

    return tooltip ? <AccessibleTooltip title={equipmentType}>{image}</AccessibleTooltip> : image;
};
