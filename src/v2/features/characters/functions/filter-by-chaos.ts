import { IUnit } from 'src/v2/features/characters/characters.models';

export const filterChaos = (character: IUnit) => {
    const Alliance = character.alliance === 'Chaos';
    return Alliance;
};
