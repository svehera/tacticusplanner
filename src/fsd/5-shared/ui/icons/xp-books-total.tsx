/* eslint-disable import-x/no-internal-modules */

import { Badge, Tooltip } from '@mui/material';
import React, { useMemo } from 'react';

import { RarityMapper, XP_BOOK_VALUE, XP_BOOK_ORDER } from '@/fsd/5-shared/model';
import { Rarity } from '@/fsd/5-shared/model/enums';

import { MiscIcon } from './misc.icon';

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
        let remaining = xp;
        for (let index = 0; index < XP_BOOK_ORDER.length; index++) {
            const rarity = XP_BOOK_ORDER[index];
            const isLast = index === XP_BOOK_ORDER.length - 1;
            books[rarity] = isLast
                ? Math.ceil(remaining / XP_BOOK_VALUE[rarity])
                : Math.floor(remaining / XP_BOOK_VALUE[rarity]);
            remaining %= XP_BOOK_VALUE[rarity];
        }
        return books;
    }, [xp]);
    return (
        <div className="flex-box gap20">
            {[...XP_BOOK_ORDER].reverse().map(rarity => {
                const booksCount = xpBooks[rarity];
                const bookName = Rarity[rarity].toLowerCase() + 'Book';
                return (
                    booksCount > 0 && (
                        <Tooltip key={rarity} title={`${RarityMapper.rarityToRarityString(rarity)} XP Books`}>
                            <Badge badgeContent={<b>{booksCount}</b>}>
                                <MiscIcon icon={bookName} width={sizePx} height={sizePx} />
                            </Badge>
                        </Tooltip>
                    )
                );
            })}
        </div>
    );
};
