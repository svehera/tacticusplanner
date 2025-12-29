import { capitalize, intersection } from 'lodash';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IMenuOption } from '@/models/menu-option';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ICharacter2 } from 'src/models/interfaces';

import { mows2Data } from '@/fsd/4-entities/mow';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { isCharacter } from '@/fsd/4-entities/unit/units.functions';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUnit } from '@/fsd/3-features/characters/characters.models';
// eslint-disable-next-line boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ILegendaryEvent } from '@/fsd/3-features/lre';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { VitruviusLegendaryEvent } from '@/fsd/3-features/lre/model/4-vitruvius.le';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { KharnLegendaryEvent } from '@/fsd/3-features/lre/model/5-kharn.le';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MephistonLegendaryEvent } from '@/fsd/3-features/lre/model/6-mephiston.le';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { PatermineLegendaryEvent } from '@/fsd/3-features/lre/model/7-patermine.le';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { DanteLegendaryEvent } from '@/fsd/3-features/lre/model/8-dante.le';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { allModes, gameModesForGuides } from '@/fsd/3-features/teams/teams.constants';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GameMode } from '@/fsd/3-features/teams/teams.enums';

import { LreCharacter } from './guides.enums';

export const lreCharacters: IMenuOption[] = [
    {
        value: LreCharacter.vitruvius,
        label: 'Vitruvius (3/3)',
        selected: false,
    },
    {
        value: LreCharacter.kharn,
        label: 'Kharn (2/3)',
        selected: false,
    },
    {
        value: LreCharacter.mephiston,
        label: 'Mephiston (2/3)',
        selected: false,
    },
    {
        value: LreCharacter.patermine,
        label: 'Patermine (1/3)',
        selected: false,
    },
    {
        value: LreCharacter.dante,
        label: 'Dante (1/3)',
        selected: false,
    },
];

export const getLre = (character: LreCharacter, characters: ICharacter2[] = []): ILegendaryEvent => {
    switch (character) {
        case LreCharacter.kharn:
            return new KharnLegendaryEvent(characters);
        case LreCharacter.mephiston:
            return new MephistonLegendaryEvent(characters);
        case LreCharacter.vitruvius:
            return new VitruviusLegendaryEvent(characters);
        case LreCharacter.patermine:
            return new PatermineLegendaryEvent(characters);
        case LreCharacter.dante:
            return new DanteLegendaryEvent(characters);
    }
};

export function getLreGuideData(
    subModes: string[],
    units: IUnit[]
): {
    allowedUnits: string[];
    name: string;
} {
    const character = subModes[0] as LreCharacter;
    const section = subModes[1].replace(character + '_', '') as 'alpha' | 'beta' | 'gamma';
    const restrictionIndexes = subModes
        .slice(2)
        .map(x => x.replace(character + '_' + section + '_', ''))
        .map(Number);
    const lre = getLre(character, units.filter(isCharacter));
    const selectedSections = lre[section].unitsRestrictions.filter((_, index) => restrictionIndexes.includes(index));

    const sections = selectedSections.map(x => x.name).join(' & ');
    return {
        name: `LRE ${lre.name} - ${capitalize(section)} - ${sections}`,
        allowedUnits: intersection(...selectedSections.map(x => x.units.map(c => c.id))),
    };
}

export const getDisplayName = (gameMode: GameMode, subModes: string[]): string => {
    if (gameMode === GameMode.legendaryRelease) {
        const lre = getLreGuideData(subModes, []);
        return lre.name;
    } else if (gameMode === GameMode.incursion) {
        const mowName = mows2Data.mows.find(x => x.name === subModes[0])?.name ?? 'NA';
        return `Incursion - ${mowName}`;
    } else {
        const gameModeDisplay = gameModesForGuides.find(x => x.value === gameMode)?.label ?? 'NA';
        const subModeDisplay: string = allModes.find(x => x.value === subModes[0])?.label ?? 'NA';

        return `${gameModeDisplay} - ${subModeDisplay}`;
    }
};
