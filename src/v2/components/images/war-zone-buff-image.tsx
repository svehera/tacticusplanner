import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

export const WarZoneBuffImage = ({ zoneId }: { zoneId: string }) => {
    const imageUrl = getImageUrl(`zonesBuffs/${zoneId}.jpg`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={imageUrl} height={30} alt={zoneId} />;
};
