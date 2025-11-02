import { Badge } from '@mui/material';
import React from 'react';

import { Alliance, Rarity } from '@/fsd/5-shared/model';
import { BadgeImage } from '@/fsd/5-shared/ui/icons/badge-image';

interface Props {
    alliance: Alliance;
    badges: Record<Rarity, number>;
}

export const BadgesTotal: React.FC<Props> = ({ badges, alliance }) => {
    return (
        <div className="flex-box gap20">
            {[Rarity.Mythic, Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon, Rarity.Common].map(rarity => {
                const badgesCount = badges[rarity];
                return (
                    badgesCount > 0 && (
                        <Badge key={rarity} badgeContent={<b>{badgesCount}</b>}>
                            <BadgeImage alliance={alliance} rarity={rarity} size={'small'} />
                        </Badge>
                    )
                );
            })}
        </div>
    );
};
