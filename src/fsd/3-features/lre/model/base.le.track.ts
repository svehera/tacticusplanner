import { intersectionBy, orderBy, sum, uniqBy } from 'lodash';

// eslint-disable-next-line import-x/no-internal-modules
import { IAutoTeamsPreferences, ICharacter2, ISelectedTeamsOrdering } from '@/models/interfaces';

import { Rank, CharacterBias } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, ILegendaryEventTrackStatic, LreTrackId } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack, ILegendaryEventTrackRequirement } from '../lre.model';

export class LETrack implements ILegendaryEventTrack {
    name: string;
    killPoints: number;
    battlesPoints: number[];
    enemies: {
        label: string;
        link: string;
    };

    constructor(
        public eventId: LegendaryEventEnum,
        public section: LreTrackId,
        public allowedUnits: ICharacter2[],
        public unitsRestrictions: Array<ILegendaryEventTrackRequirement>,
        staticData: ILegendaryEventTrackStatic
    ) {
        this.name = staticData.name;
        this.killPoints = staticData.killPoints;
        this.battlesPoints = staticData.battlesPoints;
        this.unitsRestrictions = orderBy(
            unitsRestrictions.map((r, index) => ({
                ...r,
                id: `${LegendaryEventEnum[eventId].toLowerCase()}_${section}_${index}`,
            })),
            'points'
        );
        this.enemies = staticData.enemies;
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
        settings: IAutoTeamsPreferences | ISelectedTeamsOrdering,
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

        if (!this.isAutoTeams(settings)) {
            const result2: Record<string, Array<ICharacter2 | undefined>> = {};
            const uniqChars = uniqBy(
                Object.values(result).flatMap(x => x),
                'name'
            );

            const ordered = orderBy(uniqChars, [settings.orderBy], [settings.direction]).filter(x =>
                onlyUnlocked ? x.rank > Rank.Locked : true
            );

            for (let i = 0; i < ordered.length; i++) {
                const uniqChar = ordered[i];
                this.unitsRestrictions.forEach(x => {
                    result2[x.name] ??= [];
                    result2[x.name][i] = result[x.name].find(x => x.name === uniqChar.name);
                });
            }
            return result2;
        }

        return result;
    }

    suggestTeam(
        settings: IAutoTeamsPreferences | ISelectedTeamsOrdering,
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
        const sortChars = allowedChars
            .filter(x => (onlyUnlocked ? x.rank > Rank.Locked : true))
            .map(unit => ({
                name: unit.name,
                rank: +unit.rank,
                rarity: +unit.rarity,
                requiredInCampaign: unit.requiredInCampaign,
                points: unit.legendaryEvents[this.eventId].totalPoints,
                alwaysRecommend: unit.bias === CharacterBias.recommendFirst,
                neverRecommend: unit.bias === CharacterBias.recommendLast,
            }));

        if (this.isAutoTeams(settings)) {
            const iterates: string[] = [];
            const orders: Array<'asc' | 'desc'> = [];

            if (!settings.ignoreRecommendedFirst) {
                iterates.push('alwaysRecommend');
                orders.push('desc');
            }

            if (!settings.ignoreRecommendedFirst) {
                iterates.push('neverRecommend');
                orders.push('asc');
            }

            if (settings.preferCampaign) {
                iterates.push('requiredInCampaign');
                orders.push('desc');
            }

            if (!settings.ignoreRank) {
                iterates.push('rank');
                orders.push('desc');
            }

            if (!settings.ignoreRarity) {
                iterates.push('rarity');
                orders.push('desc');
            }

            iterates.push('points');
            orders.push('desc');

            return orderBy(sortChars, iterates, orders).map(
                unit => allowedChars.find(x => x.name === unit.name) ?? ({} as ICharacter2)
            );
        } else {
            return orderBy(
                allowedChars.filter(x => (onlyUnlocked ? x.rank > Rank.Locked : true)),
                [settings.orderBy],
                [settings.direction]
            );
        }
    }

    private isAutoTeams(settings: IAutoTeamsPreferences | ISelectedTeamsOrdering): settings is IAutoTeamsPreferences {
        return Object.hasOwn(settings, 'preferCampaign');
    }
}
