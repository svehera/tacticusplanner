import { Rank } from '../models/enums';
import { Tooltip } from '@fluentui/react-components';
import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const RankImage = ({ rank }: { rank: Rank }) => {
    const rankTextValue = Rank[rank];

    if (rank === Rank.Locked) {
        return <span>{Rank[rank]}</span>;
    }

    const image = getImageUrl(`ranks/${rankTextValue.toLowerCase()}.png`);
    return (
        <Tooltip content={rankTextValue} relationship="label" hideDelay={1000}>
            <span style={{ height: 30 }}>
                <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={30} alt={rankTextValue} />
            </span>
        </Tooltip>
    );
};
