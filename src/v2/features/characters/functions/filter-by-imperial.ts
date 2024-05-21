import { IUnit } from 'src/v2/features/characters/characters.models';

export const filterImperial = (character: IUnit) => {
    const Alliance = character.alliance === 'Imperial';
    return Alliance;
};
