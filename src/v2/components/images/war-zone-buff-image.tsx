import React from 'react';
import { ZoneId } from 'src/v2/features/guild-war/guild-war.models';
import { getImageUrl } from 'src/shared-logic/functions';

export const WarZoneBuffImage = ({ zoneId }: { zoneId: ZoneId }) => {
    const imageUrl = getImageUrl(`zonesBuffs/${zoneId}.jpg`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={imageUrl} height={30} alt={zoneId} />;
};
