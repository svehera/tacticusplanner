import guildWarData from 'src/v2/data/guildWar.json';
import { IGWData } from './guild-war.models';
import { Rarity, RarityString } from 'src/models/enums';

export class GuildWarService {
    static readonly gwData: IGWData = guildWarData;

    static readonly defaultRarityCaps = [
        Rarity.Legendary,
        Rarity.Legendary,
        Rarity.Legendary,
        Rarity.Legendary,
        Rarity.Legendary,
    ];

    static readonly shortRarityStringToEnum: Record<string, Rarity> = {
        ['C']: Rarity.Common,
        ['U']: Rarity.Uncommon,
        ['R']: Rarity.Rare,
        ['E']: Rarity.Epic,
        ['L']: Rarity.Legendary,
    };

    public static getRarityCaps(bfLevel: number, sectionId: string): Rarity[] {
        const section = this.gwData.sections.find(x => x.id === sectionId);
        if (!section) {
            return this.defaultRarityCaps;
        }

        const rarityCaps = section.rarityCaps[bfLevel];

        if (!rarityCaps) {
            return this.defaultRarityCaps;
        }

        return rarityCaps.map(x => this.shortRarityStringToEnum[x]);
    }
}
