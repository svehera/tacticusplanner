import React from 'react';
import { Rank } from 'src/models/enums';
import { getImageUrl } from 'src/shared-logic/functions';

export const RankImage = ({ rank, rankPoint5 }: { rank: Rank; rankPoint5?: boolean }) => {
    if (!rank) {
        return <span>{Rank[Rank.Locked]}</span>;
    }

    const rankTextValue = Rank[rank];
    const image = getImageUrl(`ranks/${rankTextValue.toLowerCase()}.png`);
    return (
        <>
            <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={30} alt={rankTextValue} />
            {rankPoint5 && '.5'}
        </>
    );
};
