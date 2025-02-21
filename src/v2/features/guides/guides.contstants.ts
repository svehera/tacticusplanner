import { IMenuOption } from 'src/v2/models/menu-option';
import { LreCharacter } from './guides.enums';
import { KharnLegendaryEvent } from 'src/models/legendary-events/kharn.le';
import { MephistonLegendaryEvent } from 'src/models/legendary-events/mephiston.le';
import { VitruviusLegendaryEvent } from 'src/models/legendary-events/vitruvius.le';
import { GameMode } from 'src/v2/features/teams/teams.enums';
import { allModes, gameModesForGuides } from 'src/v2/features/teams/teams.constants';
import { ICharacter2, ILegendaryEvent } from 'src/models/interfaces';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { isCharacter } from 'src/v2/features/characters/units.functions';
import { capitalize, intersection } from 'lodash';
import mowsData from 'src/v2/data/mows.json';
import { DanteLegendaryEvent } from 'src/models/legendary-events/dante.le';
import { PatermineLegendaryEvent } from 'src/models/legendary-events/patermine.le';

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
        const mowName = mowsData.find(x => x.id === subModes[0])?.name ?? 'NA';
        return `Incursion - ${mowName}`;
    } else {
        const gameModeDisplay = gameModesForGuides.find(x => x.value === gameMode)?.label ?? 'NA';
        const subModeDisplay: string = allModes.find(x => x.value === subModes[0])?.label ?? 'NA';

        return `${gameModeDisplay} - ${subModeDisplay}`;
    }
};
