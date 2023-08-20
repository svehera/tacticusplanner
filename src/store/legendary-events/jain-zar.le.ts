import { sortBy, sum, uniqBy } from 'lodash';
import { ICharacter, ILegendaryEvent, ILegendaryEventTrack, ITableRow } from '../static-data/interfaces';
import { Alliance, DamageTypes, Faction, Traits } from '../static-data/enums';
import { LegendaryEvents } from '../personal-data/personal-data.interfaces';
import { filter } from './filters';
import { LegendaryEventBase } from './base.le';


export class JainZarLegendaryEvent extends LegendaryEventBase {
    readonly id = LegendaryEvents.JainZar;
    selectedTeams: ITableRow[];

    alphaTrack: ILegendaryEventTrack;
    betaTrack: ILegendaryEventTrack;
    gammaTrack: ILegendaryEventTrack;

    constructor(unitsData: Array<ICharacter>, selectedTeams: ITableRow[]) {
        super();
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
        const xenosOnly = filter(unitsData).byAlliance(Alliance.Xenos);
        return {
            name: 'Alpha (Xenos only)',
            unitsRestrictions: [
                {
                    name: 'Physical',
                    points: 100,
                    units: filter(xenosOnly).byDamageType(DamageTypes.Physical),
                },
                {
                    name: 'Ranged',
                    points: 60,
                    units: filter(xenosOnly).byAttackType('rangeOnly'),
                },
                {
                    name: 'Max 3 hits',
                    points: 45,
                    units: filter(xenosOnly).byMaxHits(3),
                },
                {
                    name: 'Necrons only',
                    points: 110,
                    units: filter(xenosOnly).byFaction(Faction.Necrons),
                },
                {
                    name: 'No Summons',
                    points: 60,
                    units: filter(xenosOnly).byNoSummons(),
                },
            ],
            getAllowedUnits: function (): Array<ICharacter> {
                return sortBy(uniqBy(this.unitsRestrictions.flatMap(r => r.units), 'name'), 'name');
            }
        };
    }

    private getBetaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const imperialOnly = filter(unitsData).byAlliance(Alliance.Imperial);
        return {
            name: 'Beta (Imperial only)',
            unitsRestrictions: [
                {
                    name: 'Power',
                    points: 95,
                    units: filter(imperialOnly).byDamageType(DamageTypes.Power),
                },
                {
                    name: 'Bolter',
                    points: 95,
                    units: filter(imperialOnly).byDamageType(DamageTypes.Bolter),
                },
                {
                    name: 'No Blast',
                    points: 50,
                    units:  filter(imperialOnly).byDamageType(DamageTypes.Blast, true),
                },
                {
                    name: 'Max 2 hits',
                    points: 70,
                    units: filter(imperialOnly).byMaxHits(2),
                },
                {
                    name: 'No Summons',
                    points: 60,
                    units: filter(imperialOnly).byNoSummons(),
                },
            ],
            getAllowedUnits: function (): Array<ICharacter> {
                return sortBy(uniqBy(this.unitsRestrictions.flatMap(r => r.units), 'name'), 'name');
            }
        };
    }

    private getGammaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noOrks = filter(unitsData).byFaction(Faction.Orks, true);
        return {
            name: 'Gamma (No Orks)',
            unitsRestrictions: [
                {
                    name: 'No Mech',
                    points: 45,
                    units: filter(noOrks).isNotMechanical(),
                },
                {
                    name: 'Piercing',
                    points: 100,
                    units: filter(noOrks).byDamageType(DamageTypes.Piercing),
                },
                {
                    name: 'Bolter',
                    points: 95,
                    units:  filter(noOrks).byDamageType(DamageTypes.Bolter),
                },
                {
                    name: 'No Flying',
                    points: 45,
                    units: filter(noOrks).byTrait(Traits.Flying, true),
                },
                {
                    name: 'Min 4 hits',
                    points: 90,
                    units: filter(noOrks).byMinHits(4),
                },
            ],
            getAllowedUnits: function (): Array<ICharacter> {
                return sortBy(uniqBy(this.unitsRestrictions.flatMap(r => r.units), 'name'), 'name');
            }
        };
    }

}