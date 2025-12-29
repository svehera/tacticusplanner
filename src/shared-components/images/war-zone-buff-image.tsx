import { getImageUrl } from 'src/shared-logic/functions';

export const WarZoneBuffImage = ({ zoneId }: { zoneId: string }) => {
    const imageUrl = getImageUrl(`zonesBuffs/${zoneId}.jpg`);

    return <img loading={'lazy'} className="pointer-events-none" src={imageUrl} height={30} alt={zoneId} />;
};
