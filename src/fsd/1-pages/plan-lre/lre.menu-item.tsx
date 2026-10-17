import { MenuItemTP } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, ICharacterData } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, LegendaryEventService } from '@/fsd/4-entities/lre';

const createMenuItem = (character: ICharacterData) =>
    new MenuItemTP(
        character.name,
        <UnitShardIcon icon={character.roundIcon} width={24} height={24} />,
        `/plan/lre?character=${LegendaryEventEnum[LegendaryEventService.getEventByCharacterSnowprintId(character.snowprintId)!.id]}`
    );

const activeLreChars = LegendaryEventService.sortForDisplay(
    CharactersService.lreCharacters.filter(x => !x.lre?.finished),
    x => x.lre?.nextEventDateUtc
);

export const activeLreMenuItems = [activeLreChars.map(character => createMenuItem(character))].flat();

export const inactiveLreMenuItems = CharactersService.lreCharacters
    .filter(x => !!x.lre?.finished)
    .map(character => createMenuItem(character));
