export enum Alliance {
    Chaos = 'Chaos',
    Imperial = 'Imperial',
    Xenos = 'Xenos',
}

export function allianceFromString(value: string): Alliance | undefined {
    switch (value.toLowerCase()) {
        case 'imperial': {
            return Alliance.Imperial;
        }
        case 'xenos': {
            return Alliance.Xenos;
        }
        case 'chaos': {
            return Alliance.Chaos;
        }
        default: {
            return undefined;
        }
    }
}
