import React from 'react';
import { Rank } from 'src/models/enums';
import { getImageUrl } from 'src/shared-logic/functions';

export const RankImage = ({ rank, rankPoint5, size = 30 }: { rank: Rank; rankPoint5?: boolean; size?: number }) => {
    if (!rank) {
        return <span>{Rank[Rank.Locked]}</span>;
    }

    const rankTextValue = Rank[rank];
    const image = getImageUrl(`ranks/resized/${rankTextValue.toLowerCase()}.png`);
    return (
        <>
            <img
                loading={'lazy'}
                style={{ pointerEvents: 'none', width: 'auto', height: 'auto', maxWidth: size, maxHeight: size }}
                src={image}
                alt={rankTextValue}
            />
            {rankPoint5 && '.5'}
        </>
    );
};
