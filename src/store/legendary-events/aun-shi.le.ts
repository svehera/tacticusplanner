import { sortBy, sum, uniqBy } from 'lodash';
import { ICharacter, ILegendaryEvent, ILegendaryEventTrack, ITableRow } from '../static-data/interfaces';
import { Alliance, DamageTypes, Faction, Traits } from '../static-data/enums';
import { LegendaryEvents } from '../personal-data/personal-data.interfaces';
import { filter } from './filters';

export class AunShiLegendaryEvent implements ILegendaryEvent {
    readonly id = LegendaryEvents.AunShi;
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
        const noOrks = filter(unitsData).byFaction(Faction.Orks, true);
        return {
            name: 'Alpha (No Orks)',
            unitsRestrictions: [
                {
                    name: 'Piercing',
                    points: 115,
                    units: filter(noOrks).byDamageType(DamageTypes.Piercing),
                },
                {
                    name: 'No Physical',
                    points: 40,
                    units: filter(noOrks).byDamageType(DamageTypes.Physical, true),
                },
                {
                    name: 'Max 3 hits',
                    points: 70,
                    units: filter(noOrks).byMaxHits(2),
                },
                {
                    name: 'No Range',
                    points: 80,
                    units: filter(noOrks).byAttackType('meleeOnly'),
                },
                {
                    name: 'Min 3 hits',
                    points: 70,
                    units: filter(noOrks).byMinHits(3),
                },
            ],
            getAllowedUnits: function (): Array<ICharacter> {
                return sortBy(uniqBy(this.unitsRestrictions.flatMap(r => r.units), 'name'), 'name');
            }
        };
    }

    private getBetaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noImperials = filter(unitsData).byAlliance(Alliance.Imperial, true);
        return {
            name: 'Beta (No Imperials)',
            unitsRestrictions: [
                {
                    name: 'Mechanical',
                    points: 105,
                    units: filter(noImperials).isMechanical(),
                },
                {
                    name: 'No Resiliant',
                    points: 40,
                    units: filter(noImperials).byTrait(Traits.Resilient, true),
                },
                {
                    name: 'No Range',
                    points: 85,
                    units:  filter(noImperials).byAttackType('meleeOnly'),
                },
                {
                    name: 'No Summons',
                    points: 45,
                    units: filter(noImperials).byNoSummons(),
                },
                {
                    name: 'Physical',
                    points: 100,
                    units: filter(noImperials).byDamageType(DamageTypes.Physical),
                },
            ],
            getAllowedUnits: function (): Array<ICharacter> {
                return sortBy(uniqBy(this.unitsRestrictions.flatMap(r => r.units), 'name'), 'name');
            }
        };
    }

    private getGammaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noChaos = filter(unitsData).byAlliance(Alliance.Chaos, true);
        return {
            name: 'Gamma (No Chaos)',
            unitsRestrictions: [
                {
                    name: 'Physical',
                    points: 120,
                    units: filter(noChaos).byDamageType(DamageTypes.Physical),
                },
                {
                    name: 'Max 1 hit',
                    points: 125,
                    units: filter(noChaos).byMaxHits(1),
                },
                {
                    name: 'No Flying',
                    points: 40,
                    units: filter(noChaos).byTrait(Traits.Flying, true),
                },
                {
                    name: 'No Overwatch',
                    points: 40,
                    units:  filter(noChaos).byTrait(Traits.Overwatch, true),
                },
                {
                    name: 'No Power',
                    points: 50,
                    units:  filter(noChaos).byDamageType(DamageTypes.Power, true),
                },
            ],
            getAllowedUnits: function (): Array<ICharacter> {
                return sortBy(uniqBy(this.unitsRestrictions.flatMap(r => r.units), 'name'), 'name');
            }
        };
    }

}