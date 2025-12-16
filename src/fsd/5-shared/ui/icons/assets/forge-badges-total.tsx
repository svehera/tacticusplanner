/* eslint-disable import-x/no-internal-modules */

import { Badge } from '@mui/material';
import React from 'react';

import { Rarity } from '@/fsd/5-shared/model/enums';

import { MiscIcon } from '../misc.icon';

interface Props {
    badges: Record<Rarity, number>;
    size?: 'small' | 'medium';
}

export const ForgeBadgesTotal: React.FC<Props> = ({ badges, size = 'small' }) => {
    const sizePx = size === 'small' ? 25 : 35;
    return (
        <div className="flex-box gap20">
            {[Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary, Rarity.Mythic].map(rarity => {
                const badgesCount = badges[rarity];
                const badgeName = Rarity[rarity].toLowerCase() + 'ForgeBadge';
                return (
                    badgesCount >= 0 && (
                        <Badge key={rarity} badgeContent={<b>{badgesCount}</b>}>
                            <MiscIcon icon={badgeName} width={sizePx} height={sizePx} />
                        </Badge>
                    )
                );
            })}
        </div>
    );
};
