import { createContext } from 'react';
import { ICharactersContext } from 'src/v2/features/characters/characters.models';

export const CharactersViewContext = createContext<ICharactersContext>({
    showAbilities: true,
    showBadges: true,
    showBsValue: true,
    showPower: true,
    showCharacterLevel: true,
    showCharacterRarity: true,
});
