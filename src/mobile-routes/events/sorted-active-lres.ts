import { CharactersService } from '@/fsd/4-entities/character';
import { ICharacterData } from '@/fsd/4-entities/character/model';
import { LegendaryEventService } from '@/fsd/4-entities/lre';

export const getSortedActiveLres = (): ICharacterData[] =>
    LegendaryEventService.sortForDisplay(CharactersService.activeLres, x => x.lre?.nextEventDateUtc);
