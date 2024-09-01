import React from 'react';
import { MenuItem } from 'src/v2/models/menu-item';
import { StaticDataService } from 'src/services';
import { CharacterImage } from 'src/shared-components/character-image';
import { LegendaryEventEnum } from 'src/models/enums';
import { IUnitData } from 'src/models/interfaces';

const createMenuItem = (character: IUnitData) =>
    new MenuItem(
        character.name,
        <CharacterImage icon={character.icon} imageSize={24} />,
        `/plan/lre?character=${LegendaryEventEnum[character.lre!.id]}`
    );

export const activeLreMenuItems = StaticDataService.lreCharacters.filter(x => !x.lre?.finished).map(createMenuItem);

export const inactiveLreMenuItems = StaticDataService.lreCharacters.filter(x => !!x.lre?.finished).map(createMenuItem);
