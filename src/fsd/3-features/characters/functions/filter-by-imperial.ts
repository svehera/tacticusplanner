import { IUnit } from '@/fsd/3-features/characters/characters.models';

export const filterImperial = (character: IUnit) => {
    const Alliance = character.alliance === 'Imperial';
    return Alliance;
};
