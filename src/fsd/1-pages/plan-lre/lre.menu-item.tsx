import { MenuItemTP } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, ICharacterData } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, LegendaryEventService } from '@/fsd/4-entities/lre';

const createMenuItem = (character: ICharacterData) =>
    new MenuItemTP(
        character.name,
        <UnitShardIcon icon={character.roundIcon} height={24} />,
        `/plan/lre?character=${LegendaryEventEnum[LegendaryEventService.getEventByCharacterSnowprintId(character.snowprintId!)!.id]}`
    );

const activeLreChars = CharactersService.lreCharacters.filter(x => !x.lre?.finished);

function utcStringToMilliseconds(utcStr?: string): number {
    return utcStr ? Date.parse(utcStr) : Number.POSITIVE_INFINITY;
}

activeLreChars.sort(
    (a, b) => utcStringToMilliseconds(a.lre?.nextEventDateUtc) - utcStringToMilliseconds(b.lre?.nextEventDateUtc)
);

export const activeLreMenuItems = [activeLreChars.map(createMenuItem)].flat();

export const inactiveLreMenuItems = CharactersService.lreCharacters.filter(x => !!x.lre?.finished).map(createMenuItem);
