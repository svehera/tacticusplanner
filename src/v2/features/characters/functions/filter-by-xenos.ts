import { IUnit } from 'src/v2/features/characters/characters.models';

export const filterXenos = (character: IUnit) => {
    const Alliance = character.alliance === 'Xenos';
    return Alliance;
};
