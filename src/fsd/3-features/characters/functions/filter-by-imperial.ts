// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUnit } from '@/fsd/3-features/characters/characters.models';

export const filterImperial = (character: IUnit) => {
    const Alliance = character.alliance === 'Imperial';
    return Alliance;
};
