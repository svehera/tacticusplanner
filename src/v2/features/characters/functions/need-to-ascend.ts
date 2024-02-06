import { ICharacter2 } from 'src/models/interfaces';
import { Rank, Rarity } from 'src/models/enums';

export const needToAscendCharacter = (character: ICharacter2) => {
    const maxCommon = character.rarity === Rarity.Common && character.rank === Rank.Iron1;
    const maxUncommon = character.rarity === Rarity.Uncommon && character.rank === Rank.Bronze1;
    const maxRare = character.rarity === Rarity.Rare && character.rank === Rank.Silver1;
    const maxEpic = character.rarity === Rarity.Epic && character.rank === Rank.Gold1;
    return maxCommon || maxUncommon || maxRare || maxEpic;
};
