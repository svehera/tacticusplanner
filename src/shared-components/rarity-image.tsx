import { Rarity } from '../models/enums';
import { Tooltip } from '@fluentui/react-components';
import React from 'react';

export const RarityImage = ({ rarity }: { rarity: Rarity}) => {
    return  <Tooltip content={Rarity[rarity]} relationship="description" hideDelay={1000}><span>({Rarity[rarity][0]})</span></Tooltip>;
};