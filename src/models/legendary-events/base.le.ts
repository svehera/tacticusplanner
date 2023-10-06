import {
    ICharacter,
    ILegendaryEvent,
    ILegendaryEventTrack,
    ITableRow
} from '../interfaces';
import { sortBy, sum, uniqBy } from 'lodash';
import { LegendaryEvent } from '../enums';

export abstract class LegendaryEventBase implements ILegendaryEvent {
    alphaTrack: ILegendaryEventTrack;
    betaTrack: ILegendaryEventTrack;
    gammaTrack: ILegendaryEventTrack;
    
    suggestedTeams: ITableRow[] = [];

    readonly id: LegendaryEvent;
    readonly name: string;

    readonly regularMission: string[];
    readonly premiumMissions: string[];

    protected abstract getAlphaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack;

    protected abstract getBetaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack;

    protected abstract getGammaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack;

    protected constructor(id: LegendaryEvent, name: string, unitsData: Array<ICharacter>, regularMission?: string[], premiumMissions?: string[]) {
        this.id = id;
        this.name = name;
        
        this.regularMission = regularMission ?? [];
        this.premiumMissions = premiumMissions ?? [];

        this.alphaTrack = this.getAlphaTrack(unitsData);
        this.betaTrack = this.getBetaTrack(unitsData);
        this.gammaTrack = this.getGammaTrack(unitsData);

        this.populateLEPoints(this.allowedUnits);
    }



    get allowedUnits(): Array<ICharacter> {
        return sortBy(uniqBy([...this.alphaTrack.allowedUnits, ...this.betaTrack.allowedUnits, ...this.gammaTrack.allowedUnits], 'name'), 'name');
    }

    protected populateLEPoints(characters: ICharacter[]): void {
        characters.forEach(character => {
            const alphaPoints = this.alphaTrack.getCharacterPoints(character);
            const betaPoints = this.betaTrack.getCharacterPoints(character);
            const gammaPoints = this.gammaTrack.getCharacterPoints(character);

            const alphaSlots = this.alphaTrack.getCharacterSlots(character);
            const betaSlots = this.betaTrack.getCharacterSlots(character);
            const gammaSlots = this.gammaTrack.getCharacterSlots(character);

            character.legendaryEvents[this.id] = {
                alphaPoints,
                alphaSlots,
                betaPoints,
                betaSlots,
                gammaPoints,
                gammaSlots,
                totalPoints: sum([alphaPoints, betaPoints, gammaPoints]),
                totalSlots:  sum([alphaSlots, betaSlots, gammaSlots]),
            };
        });
    }
}