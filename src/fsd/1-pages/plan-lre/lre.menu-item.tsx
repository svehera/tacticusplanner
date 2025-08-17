import React from 'react';

import { MenuItemTP } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, ICharacterData } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, LegendaryEventService } from '@/fsd/4-entities/lre';

const createMenuItem = (character: ICharacterData) =>
    new MenuItemTP(
        character.name,
        <UnitShardIcon icon={character.icon} height={24} />,
        `/plan/lre?character=${LegendaryEventEnum[LegendaryEventService.getEventByCharacterSnowprintId(character.snowprintId!)!.id]}`
    );

export const activeLreMenuItems = CharactersService.lreCharacters.filter(x => !x.lre?.finished).map(createMenuItem);

export const inactiveLreMenuItems = CharactersService.lreCharacters.filter(x => !!x.lre?.finished).map(createMenuItem);
