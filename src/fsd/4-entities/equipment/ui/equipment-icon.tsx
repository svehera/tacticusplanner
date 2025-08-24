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
    const imageUrl = getImageUrl(equipment.icon);

    const image = (
        <img loading={'lazy'} style={{ pointerEvents: 'none', width, height }} src={imageUrl} alt={equipment.name} />
    );

    return tooltip ? <AccessibleTooltip title={equipment.name}>{image}</AccessibleTooltip> : image;
};
