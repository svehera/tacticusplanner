import guildWarData from 'src/v2/data/guildWar.json';
import { IGWData, IGWDataRaw, IGWSection } from './guild-war.models';
import { Rarity } from 'src/models/enums';
import { groupBy, map, mapValues } from 'lodash';

export class GuildWarService {
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

    private static readonly gwDataRaw: IGWDataRaw = guildWarData;
    static readonly gwData: IGWData = this.convertRawDataToGWData(this.gwDataRaw);

    public static getRarityCaps(bfLevel: number, sectionId: string): Rarity[] {
        const section = this.gwData.sections.find(x => x.id === sectionId);
        if (!section) {
            return this.defaultRarityCaps;
        }

        const rarityCaps = section.rarityCaps[bfLevel];

        if (!rarityCaps) {
            return this.defaultRarityCaps;
        }

        return rarityCaps.caps;
    }

    public static getTotalRarityCaps(bfLevel: number): Record<Rarity, number> {
        const totalRarity = this.gwData.sections.flatMap(section =>
            Array<Rarity[]>(section.count)
                .fill(section.rarityCaps[bfLevel].caps)
                .flatMap(x => x)
        );

        return mapValues(groupBy(totalRarity), x => x.length * 2) as Record<Rarity, number>;
    }

    private static convertRawDataToGWData(rawData: IGWDataRaw): IGWData {
        const sections: IGWSection[] = rawData.sections.map(rawSection => {
            const rarityCaps: Record<number, { complexity: string; caps: Rarity[] }> = {};
            for (const bfLevel in rawSection.complexity) {
                const complexity = rawSection.complexity[bfLevel];
                const caps = rawData.rarityCaps[complexity].map(x => this.shortRarityStringToEnum[x]);
                rarityCaps[parseInt(bfLevel)] = {
                    complexity: complexity,
                    caps: caps,
                };
            }
            return {
                id: rawSection.id,
                name: rawSection.name,
                warScore: rawSection.warScore,
                count: rawSection.count,
                rarityCaps: rarityCaps,
            };
        });

        return {
            bfLevels: rawData.bfLevels,
            sections: sections,
        };
    }
}
