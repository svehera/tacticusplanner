/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { snowprintIcons } from '@/fsd/5-shared/assets';

import { OnslaughtSector, OnslaughtTier } from '@/fsd/1-pages/input-onslaught/onslaught-rewards';

const ONSLAUGHT_ICON_KEYS: Record<OnslaughtSector, Record<1 | 2 | 3 | 4, keyof typeof snowprintIcons>> = {
    stone: { 1: 'onslaughtStone1', 2: 'onslaughtStone2', 3: 'onslaughtStone3', 4: 'onslaughtStone4' },
    iron: { 1: 'onslaughtIron1', 2: 'onslaughtIron2', 3: 'onslaughtIron3', 4: 'onslaughtIron4' },
    bronze: { 1: 'onslaughtBronze1', 2: 'onslaughtBronze2', 3: 'onslaughtBronze3', 4: 'onslaughtBronze4' },
    silver: { 1: 'onslaughtSilver1', 2: 'onslaughtSilver2', 3: 'onslaughtSilver3', 4: 'onslaughtSilver4' },
    gold: { 1: 'onslaughtGold1', 2: 'onslaughtGold2', 3: 'onslaughtGold3', 4: 'onslaughtGold4' },
    diamond: { 1: 'onslaughtDiamond1', 2: 'onslaughtDiamond2', 3: 'onslaughtDiamond3', 4: 'onslaughtDiamond4' },
    adamantine: {
        1: 'onslaughtAdamantine1',
        2: 'onslaughtAdamantine2',
        3: 'onslaughtAdamantine3',
        4: 'onslaughtAdamantine4',
    },
};

export const OnslaughtIcon = ({
    sector,
    tier,
    size = 50,
}: {
    sector: OnslaughtSector;
    tier: OnslaughtTier | 4;
    size?: number;
}) => {
    const icon = snowprintIcons[ONSLAUGHT_ICON_KEYS[sector][tier]];
    return (
        <img
            loading="lazy"
            className="pointer-events-none h-auto w-auto"
            style={{ maxWidth: size, maxHeight: size }}
            src={icon.file}
            alt={icon.label}
        />
    );
};
