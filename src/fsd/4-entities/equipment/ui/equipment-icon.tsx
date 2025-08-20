import React from 'react';

import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

import { EquipmentService } from '../equipment.service';
import type { IEquipment } from '../model';

export const EquipmentIcon = ({
    equipment,
    height,
    width,
    tooltip,
}: {
    equipment: IEquipment;
    height?: number;
    width?: number;
    tooltip?: boolean;
}) => {
    const imageUrl = getImageUrl(EquipmentService.getEquipmentIconPath(equipment));

    const image = (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', width, height }}
            src={imageUrl}
            alt={equipment.displayName}
        />
    );

    return tooltip ? <AccessibleTooltip title={equipment.displayName}>{image}</AccessibleTooltip> : image;
};
