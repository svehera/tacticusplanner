import guildWarData from 'src/v2/data/guildWar.json';
import { IGWData, IGWDataRaw, IGWLayoutZone, IGWZone, ZoneId } from './guild-war.models';
import { Difficulty, Rarity } from 'src/models/enums';
import { groupBy, mapValues } from 'lodash';

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
        const section = this.gwData.zones.find(x => x.id === sectionId);
        if (!section) {
            return this.defaultRarityCaps;
        }

        const rarityCaps = section.rarityCaps[bfLevel];

        if (!rarityCaps) {
            return this.defaultRarityCaps;
        }

        return rarityCaps.caps;
    }

    public static getDifficultyRarityCaps(difficulty: Difficulty): Rarity[] {
        const difficultyLabel = this.gwData.difficulties[difficulty - 1];
        return this.gwData.rarityCaps[difficultyLabel].map(raw => this.shortRarityStringToEnum[raw]);
    }

    public static getTotalRarityCaps(bfLevel: number): Record<Rarity, number> {
        const totalRarity = this.gwData.zones.flatMap(section =>
            Array<Rarity[]>(section.count)
                .fill(section.rarityCaps[bfLevel].caps)
                .flatMap(x => x)
        );

        return mapValues(groupBy(totalRarity), x => x.length * 2) as Record<Rarity, number>;
    }

    public static getDifficultyRarityCapsGrouped(difficulty: Difficulty): Record<Rarity, number> {
        return mapValues(groupBy(this.getDifficultyRarityCaps(difficulty)), x => x.length) as Record<Rarity, number>;
    }

    private static convertRawDataToGWData(rawData: IGWDataRaw): IGWData {
        const sections: IGWZone[] = rawData.sections.map(rawSection => {
            const rarityCaps: Record<number, { difficulty: string; caps: Rarity[] }> = {};
            for (const bfLevel in rawSection.difficulty) {
                const difficulty = rawSection.difficulty[bfLevel];
                const caps = rawData.rarityCaps[difficulty].map(x => this.shortRarityStringToEnum[x]);
                rarityCaps[parseInt(bfLevel)] = {
                    difficulty: difficulty,
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
            difficulties: rawData.sectionDifficulty,
            rarityCaps: rawData.rarityCaps,
            zones: sections,
        };
    }

    public static getZone(zoneId: ZoneId): IGWZone {
        return this.gwData.zones.find(x => x.id === zoneId)!;
    }
}
