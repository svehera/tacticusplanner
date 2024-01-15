import { Rank, Rarity } from '../models/enums';
import { Tooltip } from '@mui/material';
import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const RarityImage = ({ rarity }: { rarity: Rarity }) => {
    const rarityString = Rarity[rarity];
    try {
        const image = getImageUrl(`rarity/${rarityString.toLowerCase()}.png`);

        // If the image doesn't exist. return null
        if (!image)
            return (
                <Tooltip title={Rarity[rarity]} leaveDelay={1000}>
                    <span>({Rarity[rarity][0]})</span>
                </Tooltip>
            );
        return (
            <Tooltip title={rarityString} leaveDelay={1000}>
                <span style={{ height: 25 }}>
                    <img
                        loading={'lazy'}
                        style={{ pointerEvents: 'none' }}
                        src={image}
                        height={25}
                        alt={rarityString}
                    />
                </span>
            </Tooltip>
        );
    } catch (error) {
        // console.log(`Image with name "${Rank[rank]}" does not exist`);
        return (
            <Tooltip title={Rarity[rarity]} leaveDelay={1000}>
                <span>({Rarity[rarity][0]})</span>
            </Tooltip>
        );
    }
};
