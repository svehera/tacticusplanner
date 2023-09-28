import { Rank } from '../models/enums';
import { Tooltip } from '@fluentui/react-components';
import React from 'react';

export const RankImage = ({ rank }: { rank: Rank}) => {
    try {
        // Import image on demand
        const rankTextValue = Rank[rank];

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/ranks/${rankTextValue.toLowerCase()}.png`);

        // If the image doesn't exist. return null
        if (!image) return <span>{Rank[rank]}</span>;
        return <Tooltip content={rankTextValue} relationship="label" hideDelay={1000}><img src={image} height={30} alt={rankTextValue}/></Tooltip>;
    } catch (error) {
        console.log(`Image with name "${Rank[rank]}" does not exist`);
        return <span>{Rank[rank]}</span>;
    }
};