import antiAirBattery from '@/assets/images/zonesBuffs/antiAirBattery.jpg';
import armoury from '@/assets/images/zonesBuffs/armoury.jpg';
import artilleryPosition from '@/assets/images/zonesBuffs/artilleryPosition.jpg';
import fortifiedPosition from '@/assets/images/zonesBuffs/fortifiedPosition.jpg';
import medicaeStation from '@/assets/images/zonesBuffs/medicaeStation.jpg';
import troopGarrisonInactive from '@/assets/images/zonesBuffs/troopGarrison-inactive.jpg';
import troopGarrison from '@/assets/images/zonesBuffs/troopGarrison.jpg';
import voxStation from '@/assets/images/zonesBuffs/voxStation.jpg';
import warpRift from '@/assets/images/zonesBuffs/warpRift.jpg';

const warZoneBuffImages = {
    antiAirBattery,
    armoury,
    artilleryPosition,
    fortifiedPosition,
    medicaeStation,
    troopGarrisonInactive,
    troopGarrison,
    voxStation,
    warpRift,
} as const;

type WarZone = keyof typeof warZoneBuffImages;
const isValidWarZone = (zoneId: string): zoneId is WarZone => Object.hasOwn(warZoneBuffImages, zoneId);

export const WarZoneBuffImage = ({ zoneId }: { zoneId: WarZone | string }) => {
    return isValidWarZone(zoneId) ? (
        <img
            loading={'lazy'}
            className="pointer-events-none"
            src={warZoneBuffImages[zoneId]}
            height={30}
            alt={zoneId}
        />
    ) : null;
};
