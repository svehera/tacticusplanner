export interface IWhatsNew {
    currentVersion: string;
    releaseNotes: IVersionReleaseNotes[];
}

export interface IVersionReleaseNotes {
    version: string;
    date: string;
    type: string;
    new: IReleaseNote[];
    minor: IReleaseNote[];
    bugFixes: IReleaseNote[];
}

export interface IReleaseNote {
    text: string;
    route?: string;
    mobileRoute?: string;
    imagePath?: string;
    subPoints?: string[];
    images?: Array<{ path: string; size?: number }>;
}
