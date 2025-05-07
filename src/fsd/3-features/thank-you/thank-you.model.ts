export interface IContributor {
    name: string;
    type: string;
    thankYou: string;
    resourceDescription: string;
    resourceLink: string;
    avatarIcon?: string;
}

export interface IContentCreator {
    name: string;
    youtubeLink: string;
    thankYou: string;
    avatarIcon: string;
    resourceIcon: string;
    resourceLink: string;
}

export interface IYoutubeCreator {
    name: string;
    youtubeVideoId: string;
    avatarLink: string;
}
