import { ICharacter2 } from 'src/models/interfaces';
import { Rank } from 'src/models/enums';
import { rankToLevel } from 'src/models/constants';

import { needToAscendCharacter } from './need-to-ascend';

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
