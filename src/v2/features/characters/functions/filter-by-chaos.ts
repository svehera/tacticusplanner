import { ICharacter2 } from 'src/models/interfaces';

export const filterChaos = (character: ICharacter2) => {
    const Alliance = character.alliance === 'Chaos';
    return Alliance;
};
