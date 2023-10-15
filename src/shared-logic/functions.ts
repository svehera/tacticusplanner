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
        const rarity = Rarity[character.initialRarity];
        const rank = Rank[character.rank];
        const emoji = character.alwaysRecommend ? starEmoji : character.neverRecommend ? pooEmoji : '';
        return `${character.name} (${rarity} ${rank}) ${emoji}`;
    }
};

export const rankToString = (rank: Rank): string => {
    switch (rank) {
        case Rank.Stone1:
            return 'Stone I';
        case Rank.Stone2:
            return 'Stone II';
        case Rank.Stone3:
            return 'Stone III';
        case Rank.Iron1:
            return 'Iron I';
        case Rank.Iron2:
            return 'Iron II';
        case Rank.Iron3:
            return 'Iron III';
        case Rank.Bronze1:
            return 'Bronze I';
        case Rank.Bronze2:
            return 'Bronze II';
        case Rank.Bronze3:
            return 'Bronze III';
        case Rank.Silver1:
            return 'Silver I';
        case Rank.Silver2:
            return 'Silver II';
        case Rank.Silver3:
            return 'Silver III';
        case Rank.Gold1:
            return 'Gold I';
        case Rank.Gold2:
            return 'Gold II';
        case Rank.Gold3:
            return 'Gold III';
        case Rank.Diamond1:
            return 'Diamond I';
        case Rank.Diamond2:
            return 'Diamond II';
        case Rank.Diamond3:
            return 'Diamond III';
        default:
            return '';
    }
};

export const getEnumValues = (enumObj: any): number[] => {
    return Object.keys(enumObj)
        .filter(key => typeof enumObj[key] === 'number')
        .map(key => enumObj[key]);
};

export const getCompletionRateColor = (curr: number, total: number): string => {
    if (!curr) {
        return 'white';
    }
    if (curr === total) {
        return 'lightgreen';
    }

    const average = total / 2;

    if (curr <= average) {
        return 'lightcoral';
    }

    if (curr > average) {
        return 'yellow';
    }

    return 'white';
};
