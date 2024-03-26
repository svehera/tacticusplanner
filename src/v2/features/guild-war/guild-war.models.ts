import { Rarity } from 'src/models/enums';
import { ICharacter2 } from 'src/models/interfaces';

export interface IGWData {
    bfLevels: number[];
    sections: IGWSection[];
}

export interface IGWDataRaw {
    sectionComplexity: string[];
    rarityCaps: Record<string, string[]>;
    bfLevels: number[];
    sections: IGWSectionRaw[];
}

export interface IGWSection {
    id: string;
    name: string;
    warScore: number;
    count: number;
    rarityCaps: Record<
        number,
        {
            complexity: string;
            caps: Rarity[];
        }
    >; // battlefield level to rarityCaps array
}

export interface IGWSectionRaw {
    id: string;
    name: string;
    warScore: number;
    count: number;
    complexity: Record<number, string>; // battlefield level to rarityCaps array
}

export interface IGWTeam {
    id: string;
    name: string;
    type: GuildWarTeamType;
    rarityCap: Rarity;
    lineup: string[];
}

export interface IGWTeamWithCharacters extends Omit<IGWTeam, 'lineup'> {
    lineup: ICharacter2[];
}

export enum GuildWarTeamType {
    Defense = 0,
    Offense = 1,
}
