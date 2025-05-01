import React from 'react';

import { LegendaryEventEnum } from 'src/models/enums';
import { IUnitData } from 'src/models/interfaces';
import { StaticDataService } from 'src/services';
import { CharacterImage } from 'src/shared-components/character-image';
import { MenuItem } from 'src/v2/models/menu-item';

const createMenuItem = (character: IUnitData) =>
    new MenuItem(
        character.name,
        <CharacterImage icon={character.icon} height={24} />,
        `/plan/lre?character=${LegendaryEventEnum[character.lre!.id]}`
    );

export const activeLreMenuItems = StaticDataService.lreCharacters.filter(x => !x.lre?.finished).map(createMenuItem);

export const inactiveLreMenuItems = StaticDataService.lreCharacters.filter(x => !!x.lre?.finished).map(createMenuItem);
