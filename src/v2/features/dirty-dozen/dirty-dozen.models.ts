export interface IDirtyDozenChar {
    Name: string;
    Position: number;
    GRTeam?: string;
    GRTyranid?: number;
    GRNecron?: number;
    GROrk?: number;
    GRMortarion?: number;
    GRScreamer?: number;
    GRRogalDorn?: number;
    GRAvatar?: number;
    GRMagnus?: number;
    GRCawl?: number;
    GuildRaid?: number;
    GuildWar?: number;
    Horde?: number;
    ModifiedScore?: number;
}

export interface IDirtyDozen {
    version: string;
    youtubeLink: string;
    columns: Array<string[]>;
    characters: IDirtyDozenChar[];
}
