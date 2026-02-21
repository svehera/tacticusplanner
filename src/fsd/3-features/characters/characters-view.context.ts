import { createContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ICharactersContext } from '@/fsd/3-features/characters/characters.models';

export const CharactersViewContext = createContext<ICharactersContext>({
    showAbilitiesLevel: true,
    showBadges: true,
    showBsValue: true,
    showPower: true,
    showCharacterLevel: true,
    showCharacterRarity: true,
    showEquipment: true,
});
