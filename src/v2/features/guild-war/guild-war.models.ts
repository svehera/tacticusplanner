export interface IGWData {
    sections: IGWSection[];
}
export interface IGWSection {
    id: string;
    name: string;
    warScore: number;
    rarityCaps: Record<number, string[]>; // battlefield level to rarityCaps array
}

export interface IGWTeam {
    battlefieldLevel: number;
    positionId: string;
    lineup: string[];
}
