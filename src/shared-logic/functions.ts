import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Rank, Rarity, RarityStars } from '../models/enums';
import { ICharacter2 } from '../models/interfaces';
import { rankToLevel } from '../models/constants';
import { isMobile } from 'react-device-detect';

export const useFitGridOnWindowResize = (gridRef: React.RefObject<AgGridReact | null>) => {
    function handleResize() {
        gridRef.current?.api.sizeColumnsToFit();
    }

    React.useEffect(() => {
        if (isMobile) {
            return;
        }
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });

    return handleResize;
};

export const rarityStarsToString = (rarity: RarityStars): string => {
    switch (rarity) {
        case RarityStars.None:
            return 'None';
        default:
            return '';
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

export const needToAscendCharacter = (character: ICharacter2) => {
    const maxCommon = character.rarity === Rarity.Common && character.rank === Rank.Iron1;
    const maxUncommon = character.rarity === Rarity.Uncommon && character.rank === Rank.Bronze1;
    const maxRare = character.rarity === Rarity.Rare && character.rank === Rank.Silver1;
    const maxEpic = character.rarity === Rarity.Epic && character.rank === Rank.Gold1;
    return maxCommon || maxUncommon || maxRare || maxEpic;
};
export const needToLevelCharacter = (character: ICharacter2) => {
    const isUnlocked = character.rank > Rank.Locked;
    const needToAscend = needToAscendCharacter(character);
    return (
        isUnlocked &&
        !needToAscend &&
        character.level < rankToLevel[character.rank] &&
        6 - (rankToLevel[character.rank] - character.level) <= character.upgrades.length
    );
};

export const stringToRank = (rankString: string): Rank => {
    switch (rankString) {
        case 'Stone I':
            return Rank.Stone1;
        case 'Stone II':
            return Rank.Stone2;
        case 'Stone III':
            return Rank.Stone3;
        case 'Iron I':
            return Rank.Iron1;
        case 'Iron II':
            return Rank.Iron2;
        case 'Iron III':
            return Rank.Iron3;
        case 'Bronze I':
            return Rank.Bronze1;
        case 'Bronze II':
            return Rank.Bronze2;
        case 'Bronze III':
            return Rank.Bronze3;
        case 'Silver I':
            return Rank.Silver1;
        case 'Silver II':
            return Rank.Silver2;
        case 'Silver III':
            return Rank.Silver3;
        case 'Gold I':
            return Rank.Gold1;
        case 'Gold II':
            return Rank.Gold2;
        case 'Gold III':
            return Rank.Gold3;
        case 'Diamond I':
            return Rank.Diamond1;
        case 'Diamond II':
            return Rank.Diamond2;
        case 'Diamond III':
            return Rank.Diamond3;
        default:
            throw new Error('Invalid rank string');
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

    const completionPercentage = (curr / total) * 100;

    if (completionPercentage === 100) {
        return 'green';
    } else if (completionPercentage >= 75) {
        return 'lightgreen';
    } else if (completionPercentage >= 50) {
        return 'yellow';
    } else if (completionPercentage >= 25) {
        return 'orange';
    } else {
        return 'lightcoral';
    }
};

export function getImageUrl(image: string): string {
    return new URL(`src/assets/images/${image}`, new URL(import.meta.url).origin).href;
}

export function formatDateWithOrdinal(date: Date, withYear: boolean = false): string {
    const day = date.getDate();
    const month = date.toLocaleString('en', { month: 'long' });
    const suffix = getDaySuffix(day);
    const year = date.getFullYear();

    return withYear ? `${day}${suffix} of ${month} ${year}` : `${day}${suffix} of ${month}`;
}

function getDaySuffix(day: number) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}
