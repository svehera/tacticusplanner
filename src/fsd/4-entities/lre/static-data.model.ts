export interface ILegendaryEventStatic {
    id: number;
    name: string;
    wikiLink: string;
    eventStage: number;
    nextEventDate: string;
    nextEventDateUtc?: string;

    regularMissions: string[];
    premiumMissions: string[];

    alpha: ILegendaryEventTrackStatic;
    beta: ILegendaryEventTrackStatic;
    gamma: ILegendaryEventTrackStatic;

    pointsMilestones: IPointsMilestone[];
    chestsMilestones: IChestMilestone[];

    shardsPerChest: number;
    battlesCount: number;
    constraintsCount: number;
    progression: ILEProgression;
}

export interface ILegendaryEventTrackStatic {
    name: string;
    killPoints: number;
    battlesPoints: number[];
    enemies: {
        label: string;
        link: string;
    };
}

export interface ILEProgression {
    unlock: number;
    fourStars: number;
    fiveStars: number;
    blueStar: number;
}

export interface IPointsMilestone {
    milestone: number;
    cumulativePoints: number;
    engramPayout: number;
}

export interface IChestMilestone {
    chestLevel: number;
    engramCost: number;
}

export type LreTrackId = 'alpha' | 'beta' | 'gamma';
