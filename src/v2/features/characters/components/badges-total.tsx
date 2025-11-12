import { Badge } from '@mui/material';
import React from 'react';

import { Alliance, Rarity } from '@/fsd/5-shared/model';
import { BadgeImage } from '@/fsd/5-shared/ui/icons/badge-image';

interface Props {
    alliance: Alliance;
    badges: Record<Rarity, number>;
    size?: 'small' | 'medium';
}

export const BadgesTotal: React.FC<Props> = ({ badges, alliance, size = 'small' }) => {
    return (
        <div className="flex-box gap20">
            {[Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary, Rarity.Mythic].map(rarity => {
                const badgesCount = badges[rarity];
                return (
                    badgesCount > 0 && (
                        <Badge key={rarity} badgeContent={<b>{badgesCount}</b>}>
                            <BadgeImage alliance={alliance} rarity={rarity} size={size} />
                        </Badge>
                    )
                );
            })}
        </div>
    );
};
