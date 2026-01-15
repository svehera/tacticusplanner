// eslint-disable-next-line import-x/no-internal-modules
import chaos from '@/assets/images/mowComponents/resized/chaos.png';
// eslint-disable-next-line import-x/no-internal-modules
import imperial from '@/assets/images/mowComponents/resized/imperial.png';
// eslint-disable-next-line import-x/no-internal-modules
import xenos from '@/assets/images/mowComponents/resized/xenos.png';

import { Alliance } from '@/fsd/5-shared/model';

const imageMap = {
    [Alliance.Chaos]: chaos,
    [Alliance.Imperial]: imperial,
    [Alliance.Xenos]: xenos,
};

export const ComponentImage = ({ alliance, size = 'medium' }: { alliance: Alliance; size?: 'small' | 'medium' }) => (
    <img
        loading={'lazy'}
        className="pointer-events-none"
        src={imageMap[alliance]}
        height={size === 'medium' ? 35 : 25}
        alt={alliance}
    />
);
