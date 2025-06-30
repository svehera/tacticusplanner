import React from 'react';

import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

import { EquipmentService, EquipmentType } from '@/fsd/4-entities/equipment';

export const EquipmentTypeIcon = ({
    equipmentType,
    height,
    width,
    tooltip,
}: {
    equipmentType: EquipmentType;
    height?: number;
    width?: number;
    tooltip?: boolean;
}) => {
    const imageUrl = getImageUrl(EquipmentService.getEquipmentTypeIconPath(equipmentType));

    const image = (
        <img loading={'lazy'} style={{ pointerEvents: 'none', width, height }} src={imageUrl} alt={equipmentType} />
    );

    return tooltip ? <AccessibleTooltip title={equipmentType}>{image}</AccessibleTooltip> : image;
};
