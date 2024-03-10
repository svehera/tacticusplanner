import { Rank } from '../models/enums';
import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const RankImage = ({ rank }: { rank: Rank }) => {
    const rankTextValue = Rank[rank];

    if (!rank) {
        return <span>{Rank[Rank.Locked]}</span>;
    }

    const image = getImageUrl(`ranks/${rankTextValue.toLowerCase()}.png`);
    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={30} alt={rankTextValue} />;
};
