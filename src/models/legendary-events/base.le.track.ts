import {
    IAutoTeamsPreferences,
    ICharacter2,
    ILegendaryEventTrack,
    ILegendaryEventTrackRequirement,
    ILegendaryEventTrackStatic,
    LegendaryEventSection,
} from '../interfaces';
import { intersectionBy, orderBy, sum, uniq } from 'lodash';
import { CharacterBias, LegendaryEventEnum } from '../enums';

export class LETrack implements ILegendaryEventTrack {
    name: string;
    killPoints: number;
    battlesPoints: number[];

    constructor(
        public eventId: LegendaryEventEnum,
        public section: LegendaryEventSection,
        public allowedUnits: ICharacter2[],
        public unitsRestrictions: Array<ILegendaryEventTrackRequirement>,
        staticData: ILegendaryEventTrackStatic
    ) {
        this.name = staticData.name;
        this.killPoints = staticData.killPoints;
        this.battlesPoints = staticData.battlesPoints;
        this.unitsRestrictions = orderBy(unitsRestrictions, 'points');
    }

    getCharacterPoints(character: ICharacter2): number {
        const isAllowedUnit = this.allowedUnits.some(u => u.name === character.name);
        if (!isAllowedUnit) {
            return 0;
        }

        return (
            this.killPoints +
            sum(this.unitsRestrictions.filter(x => x.units.some(u => u.name === character.name)).map(x => x.points))
        );
    }

    getCharacterSlots(character: ICharacter2): number {
        const isAllowedUnit = this.allowedUnits.some(u => u.name === character.name);
        if (!isAllowedUnit) {
            return 0;
        }

        return this.unitsRestrictions.filter(x => x.units.some(u => u.name === character.name)).length;
    }

    getRestrictionPoints(name: string): number {
        return this.unitsRestrictions.find(x => x.name === name)?.points ?? 0;
    }

    suggestTeams(
        settings: IAutoTeamsPreferences | null,
        onlyUnlocked: boolean,
        restrictions: string[]
    ): Record<string, Array<ICharacter2 | undefined>> {
        const coreSuggestedTeams = this.suggestTeam(settings, onlyUnlocked, restrictions);
        const result: Record<string, ICharacter2[]> = {};

        this.unitsRestrictions.forEach(x => {
            result[x.name] = restrictions.includes(x.name)
                ? [...coreSuggestedTeams]
                : this.suggestTeam(settings, onlyUnlocked, [x.name]);
        });

        if (!settings) {
            const result2: Record<string, Array<ICharacter2 | undefined>> = {};
            const uniqChars = uniq(
                Object.values(result)
                    .flatMap(x => x)
                    .map(x => x.name)
            ).sort();
            console.log(uniqChars);

            for (let i = 0; i < uniqChars.length; i++) {
                const uniqChar = uniqChars[i];
                this.unitsRestrictions.forEach(x => {
                    result2[x.name] ??= [];
                    result2[x.name][i] = result[x.name].find(x => x.name === uniqChar);
                });
            }
            return result2;
        }

        return result;
    }

    suggestTeam(
        settings: IAutoTeamsPreferences | null,
        onlyUnlocked: boolean,
        restrictions: string[]
    ): Array<ICharacter2> {
        let allowedChars: ICharacter2[] = [];
        if (!restrictions.length) {
            allowedChars = this.allowedUnits;
        } else {
            allowedChars = intersectionBy(
                ...this.unitsRestrictions.filter(x => restrictions.includes(x.name)).map(x => x.units),
                'name'
            );
        }
        allowedChars = allowedChars.filter(x => (onlyUnlocked ? x.unlocked : true));

        if (settings) {
            const sortChars = allowedChars.map(unit => ({
                name: unit.name,
                rank: +unit.rank,
                rarity: +unit.rarity,
                requiredInCampaign: unit.requiredInCampaign,
                points: unit.legendaryEvents[this.eventId].totalPoints,
                alwaysRecommend: unit.bias === CharacterBias.AlwaysRecommend,
                neverRecommend: unit.bias === CharacterBias.NeverRecommend,
            }));

            const iterates: string[] = [];
            const orders: Array<'asc' | 'desc'> = [];

            if (!settings.ignoreRecommendedFirst) {
                iterates.push('alwaysRecommend');
                orders.push('desc');
            }

            if (!settings.ignoreRecommendedLast) {
                iterates.push('neverRecommend');
                orders.push('asc');
            }

            if (settings.preferCampaign) {
                iterates.push('requiredInCampaign');
                orders.push('desc');
            }

            if (!settings.ignoreRarity) {
                iterates.push('rarity');
                orders.push('desc');
            }

            if (!settings.ignoreRank) {
                iterates.push('rank');
                orders.push('desc');
            }

            iterates.push('points');
            orders.push('desc');

            return orderBy(sortChars, iterates, orders).map(
                unit => allowedChars.find(x => x.name === unit.name) ?? ({} as ICharacter2)
            );
        } else {
            return orderBy(allowedChars, ['name'], ['asc']);
        }
    }
}
