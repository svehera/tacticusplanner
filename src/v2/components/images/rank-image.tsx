import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

import { Rank } from '@/fsd/4-entities/character';

export const RankImage = ({
    rank,
    rankPoint5,
    size = 30,
    resized = false,
}: {
    rank: Rank;
    rankPoint5?: boolean;
    size?: number;
    resized?: boolean;
}) => {
    if (!rank || rank > Rank.Diamond3) {
        return <span>{Rank[Rank.Locked]}</span>;
    }

    const rankTextValue = Rank[rank];

    const image = resized
        ? getImageUrl(`ranks/resized/${rankTextValue.toLowerCase()}.png`)
        : getImageUrl(`ranks/${rankTextValue.toLowerCase()}.png`);
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
