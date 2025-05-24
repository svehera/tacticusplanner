import React from 'react';

import { StaticDataService } from 'src/services';
import { MenuItem } from 'src/v2/models/menu-item';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { IUnitData } from '@/fsd/4-entities/character';
import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

const createMenuItem = (character: IUnitData) =>
    new MenuItem(
        character.name,
        <UnitShardIcon icon={character.icon} height={24} />,
        `/plan/lre?character=${LegendaryEventEnum[character.lre!.id]}`
    );

export const activeLreMenuItems = StaticDataService.lreCharacters.filter(x => !x.lre?.finished).map(createMenuItem);

export const inactiveLreMenuItems = StaticDataService.lreCharacters.filter(x => !!x.lre?.finished).map(createMenuItem);
