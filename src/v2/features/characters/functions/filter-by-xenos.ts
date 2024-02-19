import { ICharacter2 } from 'src/models/interfaces';

export const filterXenos = (character: ICharacter2) => {
    const Alliance = character.alliance === 'Xenos';
    return Alliance;
};
