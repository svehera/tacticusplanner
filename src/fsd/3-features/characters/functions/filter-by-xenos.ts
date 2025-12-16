import { IUnit } from '@/fsd/3-features/characters/characters.models';

export const filterXenos = (character: IUnit) => {
    const Alliance = character.alliance === 'Xenos';
    return Alliance;
};
