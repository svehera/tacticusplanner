import { Badge } from '@mui/material';
import React from 'react';

import { Alliance, Rarity } from '@/fsd/5-shared/model';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { OrbIcon } from '@/fsd/5-shared/ui/icons/orb-image';

interface Props {
    alliance: Alliance;
    orbs: Record<Rarity, number>;
    // TODO: BadgesTotal uses 'small' | 'medium', unify these types across the app
    size?: number;
}

export const OrbsTotal: React.FC<Props> = ({ orbs, alliance, size = 35 }) => {
    return (
        <div className="flex-box gap20">
            {[Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary, Rarity.Mythic].map(rarity => {
                const orbsCount = orbs[rarity];
                return (
                    orbsCount >= 0 && (
                        <Badge key={rarity} badgeContent={<b>{orbsCount}</b>}>
                            <OrbIcon alliance={alliance} rarity={rarity} size={size} />
                        </Badge>
                    )
                );
            })}
        </div>
    );
};
