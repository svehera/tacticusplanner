import { createContext } from 'react';

import { ICharactersContext } from '@/fsd/3-features/characters/characters.models';

export const CharactersViewContext = createContext<ICharactersContext>({
    showAbilitiesLevel: true,
    showBadges: true,
    showBsValue: true,
    showPower: true,
    showCharacterLevel: true,
    showCharacterRarity: true,
});
