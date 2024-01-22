import { Rank } from '../models/enums';
import { Tooltip } from '@mui/material';
import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const RankImage = ({ rank }: { rank: Rank }) => {
    const rankTextValue = Rank[rank];

    if (!rank) {
        return <span>{Rank[Rank.Locked]}</span>;
    }

    const image = getImageUrl(`ranks/${rankTextValue.toLowerCase()}.png`);
    return (
        <Tooltip title={rankTextValue} leaveDelay={1000}>
            <span style={{ height: 30 }}>
                <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={30} alt={rankTextValue} />
            </span>
        </Tooltip>
    );
};
