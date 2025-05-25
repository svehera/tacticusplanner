import { Rank } from '../enums';

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
