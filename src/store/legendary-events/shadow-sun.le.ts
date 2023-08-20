import { sortBy, sum, uniqBy } from 'lodash';
import { ICharacter, ILegendaryEvent, ILegendaryEventTrack, ITableRow } from '../static-data/interfaces';
import { Alliance, DamageTypes, Faction, Traits } from '../static-data/enums';
import { LegendaryEvents } from '../personal-data/personal-data.interfaces';
import { filter } from './filters';

export class ShadowSunLegendaryEvent implements ILegendaryEvent {
    readonly id = LegendaryEvents.ShadowSun;
    selectedTeams: ITableRow[];

    alphaTrack: ILegendaryEventTrack;
    betaTrack: ILegendaryEventTrack;
    gammaTrack: ILegendaryEventTrack;

    constructor(unitsData: Array<ICharacter>, selectedTeams: ITableRow[]) {
        this.alphaTrack = this.getAlphaTrack(unitsData);
        this.betaTrack = this.getBetaTrack(unitsData);
        this.gammaTrack = this.getGammaTrack(unitsData);
        this.selectedTeams = selectedTeams;
    }


    getAllowedUnits(): Array<ICharacter> {
        const alpha = this.alphaTrack.getAllowedUnits();
        const beta = this.betaTrack.getAllowedUnits();
        const gamma = this.gammaTrack.getAllowedUnits();
        
        const allowedCharacters = sortBy(uniqBy([...alpha, ...beta, ...gamma], 'name'), 'name');
        this.populateLEPoints(allowedCharacters);
        return allowedCharacters;
    }
    
    private populateLEPoints(characters: ICharacter[]): void {
        characters.forEach(character => {
            const alphaPoints = this.alphaTrack.unitsRestrictions
                .filter(x => x.units.some(u => u.name === character.name))
                .map(x => x.points);
            
            const betaPoints = this.betaTrack.unitsRestrictions
                .filter(x => x.units.some(u => u.name === character.name))
                .map(x => x.points);

            const gammaPoints = this.gammaTrack.unitsRestrictions
                .filter(x => x.units.some(u => u.name === character.name))
                .map(x => x.points);

            character.legendaryEventPoints[this.id] = sum([...alphaPoints, ...betaPoints, ...gammaPoints]);
        });
    }

    private getAlphaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noNecrons = filter(unitsData).byFaction(Faction.Necrons, true);
        return {
            name: 'Alpha (No Necrons)',
            unitsRestrictions: [
                {
                    name: 'Big Target',
                    points: 115,
                    units: filter(noNecrons).byTrait(Traits.BigTarget),
                },
                {
                    name: 'No Psykers',
                    points: 40,
                    units: filter(noNecrons).byTrait(Traits.Psyker, true),
                },
                {
                    name: 'Min 4 hits',
                    points: 80,
                    units: filter(noNecrons).byMinHits(4),
                },
                {
                    name: 'Power',
                    points: 80,
                    units: filter(noNecrons).byDamageType(DamageTypes.Power),
                },
                {
                    name: 'No Range',
                    points: 60,
                    units: filter(noNecrons).byAttackType('meleeOnly'),
                },
            ],
            getAllowedUnits: function (): Array<ICharacter> {
                return sortBy(uniqBy(this.unitsRestrictions.flatMap(r => r.units), 'name'), 'name');
            }
        };
    }

    private getBetaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noTyranids = filter(unitsData).byFaction(Faction.Tyranids, true);
        return {
            name: 'Beta (No Tyranids)',
            unitsRestrictions: [
                {
                    name: 'Mechanical',
                    points: 90,
                    units: filter(noTyranids).isMechanical(),
                },
                {
                    name: 'ASTRA MILITARUM',
                    points: 120,
                    units: filter(noTyranids).byFaction(Faction.Astra_militarum),
                },
                {
                    name: 'No Bolter',
                    points: 50,
                    units: filter(noTyranids).byDamageType(DamageTypes.Bolter, true),
                },
                {
                    name: 'No Piercing',
                    points: 50,
                    units:  filter(noTyranids).byDamageType(DamageTypes.Piercing, true),
                },
                {
                    name: 'No Summons',
                    points: 65,
                    units: filter(noTyranids).byNoSummons(),
                },
            ],
            getAllowedUnits: function (): Array<ICharacter> {
                return sortBy(uniqBy(this.unitsRestrictions.flatMap(r => r.units), 'name'), 'name');
            }
        };
    }

    private getGammaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noImperials = filter(unitsData).byAlliance(Alliance.Imperial, true);
        return {
            name: 'Gamma (No Imperials)',
            unitsRestrictions: [
                {
                    name: 'No Piercing',
                    points: 40,
                    units: filter(noImperials).byDamageType(DamageTypes.Piercing, true),
                },
                {
                    name: 'Ranged',
                    points: 65,
                    units: filter(noImperials).byAttackType('rangeOnly'),
                },
                {
                    name: 'Min 3 hits',
                    points: 50,
                    units: filter(noImperials).byMinHits(3),
                },
                {
                    name: 'Power',
                    points: 100,
                    units:  filter(noImperials).byDamageType(DamageTypes.Power),
                },
                {
                    name: 'Black Legion',
                    points: 120,
                    units:  filter(noImperials).byFaction(Faction.Black_Legion),
                },
            ],
            getAllowedUnits: function (): Array<ICharacter> {
                return sortBy(uniqBy(this.unitsRestrictions.flatMap(r => r.units), 'name'), 'name');
            }
        };
    }

}