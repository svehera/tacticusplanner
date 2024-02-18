import { ICharacter2 } from 'src/models/interfaces';

export const filterImperial = (character: ICharacter2) => {
    const Alliance = character.alliance === 'Imperial';
    return Alliance;
};
