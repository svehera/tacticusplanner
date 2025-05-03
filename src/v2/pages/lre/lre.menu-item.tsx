import React from 'react';

import { LegendaryEventEnum } from 'src/models/enums';
import { IUnitData } from 'src/models/interfaces';
import { StaticDataService } from 'src/services';
import { MenuItem } from 'src/v2/models/menu-item';

import { CharacterShardIcon } from '@/fsd/4-entities/character';

const createMenuItem = (character: IUnitData) =>
    new MenuItem(
        character.name,
        <CharacterShardIcon icon={character.icon} height={24} />,
        `/plan/lre?character=${LegendaryEventEnum[character.lre!.id]}`
    );

export const activeLreMenuItems = StaticDataService.lreCharacters.filter(x => !x.lre?.finished).map(createMenuItem);

export const inactiveLreMenuItems = StaticDataService.lreCharacters.filter(x => !!x.lre?.finished).map(createMenuItem);
