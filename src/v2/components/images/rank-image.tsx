import React from 'react';
import { Rank } from 'src/models/enums';
import { getImageUrl } from 'src/shared-logic/functions';

export const RankImage = ({ rank }: { rank: Rank }) => {
    if (!rank) {
        return <span>{Rank[Rank.Locked]}</span>;
    }

    const rankTextValue = Rank[rank];
    const image = getImageUrl(`ranks/${rankTextValue.toLowerCase()}.png`);
    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={30} alt={rankTextValue} />;
};
