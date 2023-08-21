import { ICharacter, ILegendaryEvent, ILegendaryEventTrack, ITableRow } from '../static-data/interfaces';
import { cloneDeep } from 'lodash';
import { LegendaryEvents, Rank } from '../personal-data/personal-data.interfaces';

export abstract class LegendaryEventBase implements ILegendaryEvent {
    public getSelectedCharactersPoints(): Array<{
        name: string,
        points: number,
        rank: Rank
    }> {
        const legendaryEventPointsA = this.alphaTrack.unitsRestrictions.map(x => ({
            name: x.name + '(Alpha)',
            points: x.points
        }));
        const legendaryEventPointsB = this.betaTrack.unitsRestrictions.map(x => ({
            name: x.name + '(Beta)',
            points: x.points
        }));
        const legendaryEventPointsG = this.gammaTrack.unitsRestrictions.map(x => ({
            name: x.name + '(Gamma)',
            points: x.points
        }));
        
        const points = [...legendaryEventPointsA, ...legendaryEventPointsB, ...legendaryEventPointsG];

        const selectedChars = this.getAllowedUnits().filter(x => (x.leSelection & this.id) === this.id).map(char => ({
            name: char.name,
            points: 0,
            rank: char.rank
        }));

        const t = cloneDeep(this.selectedTeams).map(row => {
            const newRow = { ...row };
            for (const rowKey in newRow) {
                const value = newRow[rowKey];
                if (typeof value !== 'string') {
                    newRow[rowKey] = {
                        name: value.name,
                        points: points.find(x => x.name === rowKey)?.points ?? 0
                    } as any;
                }
            }
            return newRow;
        }) as Array<Record<string, string | { name: string, points: number }>>;

        selectedChars.forEach(char => {
            for (const row of t) {
                for (const rowKey in row) {
                    const value = row[rowKey];
                    if (typeof value !== 'string' && value.name === char.name) {
                        char.points += value.points;
                    }
                }
            }
        });
        return selectedChars;
    }


    abstract alphaTrack: ILegendaryEventTrack;
    abstract betaTrack: ILegendaryEventTrack;
    abstract gammaTrack: ILegendaryEventTrack;
    abstract id: LegendaryEvents;
    abstract selectedTeams: ITableRow[];

    abstract getAllowedUnits(): Array<ICharacter>;
}