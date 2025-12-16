import { IUnit } from '@/fsd/3-features/characters/characters.models';

export const filterChaos = (character: IUnit) => {
    const Alliance = character.alliance === 'Chaos';
    return Alliance;
};
