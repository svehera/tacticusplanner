import { CharactersService } from '@/fsd/4-entities/character';
import { mows2Data } from '@/fsd/4-entities/mow';

export const getDisplayName = (idOrName: string): string => {
    const char = CharactersService.getUnit(idOrName);
    if (char) return char.shortName || char.name;
    const mow = mows2Data.mows.find(m => m.snowprintId === idOrName || m.name === idOrName);
    if (mow) return mow.name;
    return idOrName;
};

export const getCharacterIcon = (id: string): string =>
    CharactersService.getUnit(id)?.roundIcon ??
    mows2Data.mows.find(m => m.name === id || m.snowprintId === id)?.roundIcon ??
    id;
