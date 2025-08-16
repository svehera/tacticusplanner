export enum Rank {
    Locked,
    Stone1,
    Stone2,
    Stone3,
    Iron1,
    Iron2,
    Iron3,
    Bronze1,
    Bronze2,
    Bronze3,
    Silver1,
    Silver2,
    Silver3,
    Gold1,
    Gold2,
    Gold3,
    Diamond1,
    Diamond2,
    Diamond3,
    Adamantine1,
}

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
        case Rank.Adamantine1:
            return 'Adamantine I';
        default:
            return '';
    }
};
