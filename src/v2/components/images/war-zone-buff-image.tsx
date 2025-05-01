import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';
import { ZoneId } from 'src/v2/features/guild-war/guild-war.models';

export const WarZoneBuffImage = ({ zoneId }: { zoneId: string }) => {
    const imageUrl = getImageUrl(`zonesBuffs/${zoneId}.jpg`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={imageUrl} height={30} alt={zoneId} />;
};
