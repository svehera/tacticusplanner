/* eslint-disable import-x/no-internal-modules */

import { Badge, Tooltip } from '@mui/material';
import React from 'react';

import { Alliance, Rarity } from '@/fsd/5-shared/model';
import { OrbIcon } from '@/fsd/5-shared/ui/icons/orb-image';

interface Props {
    alliance: Alliance;
    orbs: Record<Rarity, number>;
    // TODO: BadgesTotal uses 'small' | 'medium', unify these types across the app
    size?: number;
}

const rarityNameMapping: Record<number, string> = {
    [Rarity.Common]: 'Common',
    [Rarity.Uncommon]: 'Uncommon',
    [Rarity.Rare]: 'Rare',
    [Rarity.Epic]: 'Epic',
    [Rarity.Legendary]: 'Legendary',
    [Rarity.Mythic]: 'Mythic',
};

export const OrbsTotal: React.FC<Props> = ({ orbs, alliance, size = 35 }) => {
    return (
        <div className="flex-box gap20">
            {[Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary, Rarity.Mythic].map(rarity => {
                const orbsCount = orbs[rarity];
                const rarityName = rarityNameMapping[rarity];
                return (
                    orbsCount >= 0 && (
                        <Tooltip key={rarity} title={rarityName ? `${rarityName} Orb` : ''}>
                            <Badge badgeContent={<b>{orbsCount}</b>}>
                                <OrbIcon alliance={alliance} rarity={rarity} size={size} />
                            </Badge>
                        </Tooltip>
                    )
                );
            })}
        </div>
    );
};
