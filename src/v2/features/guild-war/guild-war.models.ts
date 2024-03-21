export interface IGWData {
    bfLevels: number[];
    sections: IGWSection[];
}
export interface IGWSection {
    id: string;
    name: string;
    warScore: number;
    rarityCaps: Record<number, string[]>; // battlefield level to rarityCaps array
}

export interface IGWTeam {
    positionId: string;
    lineup: string[];
}
