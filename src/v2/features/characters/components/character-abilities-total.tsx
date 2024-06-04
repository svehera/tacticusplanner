import React from 'react';
import { Rarity } from 'src/models/enums';
import { Badge } from '@mui/material';
import { BadgeImage } from 'src/v2/components/images/badge-image';
import { numberToThousandsString } from 'src/v2/functions/number-to-thousands-string';
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
