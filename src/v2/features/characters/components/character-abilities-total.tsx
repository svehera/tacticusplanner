import { Badge } from '@mui/material';
import React from 'react';

import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { Rarity } from '@/fsd/5-shared/model';
import { BadgeImage } from '@/fsd/5-shared/ui/icons/badge-image';

import { ICharacterAbilitiesMaterialsTotal } from 'src/v2/features/characters/characters.models';

export const CharacterAbilitiesTotal: React.FC<ICharacterAbilitiesMaterialsTotal> = ({ gold, badges, alliance }) => {
    return (
        <div className="flex-box gap20 wrap">
            <div className="flex-box gap5">
                {[Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon, Rarity.Common].map(rarity => {
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
            <div className="flex-box gap5">
                <b>{numberToThousandsString(gold)}</b>
                <span>Gold</span>
            </div>
        </div>
    );
};
