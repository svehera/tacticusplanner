import { Rarity } from 'src/models/enums';

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
    complexity: Record<number, string>; // battlefield level to rarityCaps array
}

export interface IGWTeam {
    id: string;
    lineup: string[];
}
