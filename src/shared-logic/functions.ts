import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ICharacter } from '../models/interfaces';
import { Rank, Rarity } from '../models/enums';
import { pooEmoji, starEmoji } from '../models/constants';

export const fitGridOnWindowResize = (gridRef: React.RefObject<AgGridReact>) => {
    function handleResize() {
        gridRef.current?.api.sizeColumnsToFit();
    }

    React.useEffect(() => {


        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);

        };
    });

    return handleResize;
};

export const getCharName = (character: ICharacter): string => {
    if (!character.unlocked) {
        return character.name;
    } else {
        const rarity = Rarity[character.rarity];
        const rank = Rank[character.rank];
        const emoji = character.alwaysRecommend ? starEmoji : character.neverRecommend ? pooEmoji : '';
        return `${character.name} (${rarity} ${rank}) ${emoji}`;
    }
};