/* eslint-disable import-x/no-internal-modules */
import { Badge } from '@mui/material';
import React, { useMemo } from 'react';

import { Rarity } from '@/fsd/5-shared/model/enums';

import { MiscIcon } from '../misc.icon';

interface Props {
    xp: number;
    size?: 'small' | 'medium';
}

export const XpBooksTotal: React.FC<Props> = ({ xp, size = 'small' }) => {
    const sizePx = size === 'small' ? 25 : 35;
    const xpBooks = useMemo(() => {
        const books: Record<Rarity, number> = {
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 0,
            [Rarity.Rare]: 0,
            [Rarity.Epic]: 0,
            [Rarity.Legendary]: 0,
            [Rarity.Mythic]: 0,
        };
        books[Rarity.Mythic] = Math.floor(xp / 62500);
        let remainingXp = xp % 62500;
        books[Rarity.Legendary] = Math.floor(remainingXp / 12500);
        remainingXp = remainingXp % 12500;
        books[Rarity.Epic] = Math.floor(remainingXp / 2500);
        remainingXp = remainingXp % 2500;
        books[Rarity.Rare] = Math.floor(remainingXp / 500);
        remainingXp = remainingXp % 500;
        books[Rarity.Uncommon] = Math.floor(remainingXp / 100);
        remainingXp = remainingXp % 100;
        books[Rarity.Common] = Math.ceil(remainingXp / 20);
        return books;
    }, [xp]);
    return (
        <div className="flex-box gap20">
            {[Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary, Rarity.Mythic].map(rarity => {
                const booksCount = xpBooks[rarity];
                const bookName = Rarity[rarity].toLowerCase() + 'Book';
                return (
                    booksCount >= 0 && (
                        <Badge key={rarity} badgeContent={<b>{booksCount}</b>}>
                            <MiscIcon icon={bookName} width={sizePx} height={sizePx} />
                        </Badge>
                    )
                );
            })}
        </div>
    );
};
